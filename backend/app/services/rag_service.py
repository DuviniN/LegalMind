import re
from datetime import datetime, timezone
from pathlib import Path
from typing import TypedDict

from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import END, StateGraph
from langsmith import traceable
from pymongo import DESCENDING
from pypdf import PdfReader

from app.core.config import settings
from app.db.mongodb import db

_embeddings: HuggingFaceEmbeddings | None = None
_vector_store: Chroma | None = None
_llm: ChatGroq | None = None
_graph = None
_history_indexes_ready = False
_REFINE_STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "for", "from", "how", "i",
    "in", "is", "it", "of", "on", "or", "that", "the", "to", "what", "when", "where", "which",
    "who", "why", "with", "you", "your",
}

class RAGState(TypedDict, total=False):
    user_id: str
    question: str
    company_id: str
    document_id: str | None
    top_k: int
    sub_queries: list[str]
    docs: list[Document]
    avg_score: float
    answer: str
    sources: list[dict]
    confidence: str
    timestamp: str


@traceable(name="Query Split", run_type="chain")
def split_query(query: str) -> list[str]:
    cleaned = re.sub(r"\s+", " ", query).strip()
    lowered = cleaned.lower()
    if not cleaned:
        return []

    comparison_terms = ("compare", "difference", "different", "versus", "vs", "contrast", "both")
    starts_interrogative = lowered.startswith(("what", "how", "why", "when", "where", "who", "which", "can", "is", "are"))
    contains_compare_intent = any(term in lowered for term in comparison_terms)
    has_list_pattern = "," in cleaned or ";" in cleaned or " vs " in lowered or " versus " in lowered
    and_compound_pattern = (" and " in lowered) and (not starts_interrogative) and (len(cleaned.split()) <= 14)

    if not (contains_compare_intent or has_list_pattern or and_compound_pattern):
        return [cleaned]

    candidate_parts: list[str] = []
    compare_prefix = re.sub(r"^compare\s+", "", cleaned, flags=re.IGNORECASE)
    parts = re.split(r"\band\b|\bvs\b|\bversus\b|,|;", compare_prefix, flags=re.IGNORECASE)
    for part in parts:
        part_text = re.sub(r"\s+", " ", part).strip(" .?")
        if len(part_text) >= 3:
            candidate_parts.append(part_text)

    if not candidate_parts:
        return [cleaned]

    planned_queries: list[str] = []
    for part in candidate_parts[:4]:
        if part.lower().startswith(("what", "how", "when", "why", "where")):
            planned_queries.append(f"{part}?")
        else:
            verb = "are" if part.lower().endswith("s") else "is"
            planned_queries.append(f"What {verb} {part}?")

    if len(candidate_parts) >= 2 and "compare" in lowered:
        planned_queries.append(f"Compare {candidate_parts[0]} and {candidate_parts[1]}.")

    deduped: list[str] = []
    seen = set()
    for item in planned_queries:
        key = item.lower().strip()
        if key not in seen:
            seen.add(key)
            deduped.append(item)
    return deduped or [cleaned]


def refine_query(query: str) -> str:
    tokens = re.findall(r"[a-zA-Z0-9]+", query.lower())
    keywords = [token for token in tokens if token not in _REFINE_STOP_WORDS]
    if not keywords:
        return query.strip()
    return " ".join(keywords[:14])


def _get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=settings.rag_embedding_model)
    return _embeddings


def _get_vector_store() -> Chroma:
    global _vector_store   #there is only ONE vector store in memory
    if _vector_store is None:
        persist_dir = Path(settings.chroma_persist_dir)
        persist_dir.mkdir(parents=True, exist_ok=True)
        _vector_store = Chroma(
            collection_name="legalmind_documents",
            embedding_function=_get_embeddings(),
            persist_directory=str(persist_dir),
        )
    return _vector_store


def _get_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        if not settings.groq_api_key:
            raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY in backend .env")
        _llm = ChatGroq(
            api_key=settings.groq_api_key,
            model=settings.groq_model_name or "llama-3.3-70b-versatile",
            temperature=0.1,
        )
    return _llm


def _as_score_value(score: float | int | None) -> float:
    if score is None:
        return 0.0
    score_value = float(score)
    if score_value < 0:
        return 0.0
    if score_value > 1:
        return 1.0 / (1.0 + score_value)
    return score_value


def _confidence_label(avg_score: float, doc_count: int) -> str:
    if doc_count == 0:
        return "low"
    if avg_score >= 0.7:
        return "high"
    if avg_score >= 0.45:
        return "medium"
    return "low"


def _build_chroma_where(company_id: str, document_id: str | None = None) -> dict:
    company_clause = {"company_id": {"$eq": company_id}}
    if document_id:
        document_clause = {"document_id": {"$eq": document_id}}
        return {"$and": [company_clause, document_clause]}
    return company_clause


def _token_set(text: str) -> set[str]:
    return {token for token in re.findall(r"[a-zA-Z0-9]+", text.lower()) if len(token) > 2}


def _keyword_overlap_score(query: str, text: str) -> float:
    query_tokens = _token_set(query)
    text_tokens = _token_set(text)
    if not query_tokens or not text_tokens:
        return 0.0
    return len(query_tokens & text_tokens) / len(query_tokens)


@traceable(name="PDF Ingestion", run_type="chain")
def ingest_pdf_to_vector_store(
    file_path: str | Path,
    company_id: str,
    document_id: str,
    file_name: str,
) -> int:
    reader = PdfReader(str(file_path))
    page_documents: list[Document] = []

    for page_index, page in enumerate(reader.pages):
        extracted_text = page.extract_text() or ""
        if extracted_text.strip():
            page_documents.append(
                Document(
                    page_content=extracted_text,
                    metadata={
                        "company_id": company_id,
                        "document_id": document_id,
                        "file_name": file_name,
                        "page_number": page_index + 1,
                    },
                )
            )

    if not page_documents:
        return 0

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.rag_chunk_size,
        chunk_overlap=settings.rag_chunk_overlap,
    )
    chunks = splitter.split_documents(page_documents)

    for idx, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = idx

    vector_store = _get_vector_store()
    try:
        vector_store.delete(where={"$and": [{"company_id": {"$eq": company_id}}, {"document_id": {"$eq": document_id}}]})
    except Exception:
        # Deletion can fail on first insert or if metadata filter finds no records.
        pass

    ids = [f"{document_id}_{idx}" for idx in range(len(chunks))]
    vector_store.add_documents(chunks, ids=ids)
    return len(chunks)


@traceable(name="Plan Query", run_type="chain")
def _plan_node(state: RAGState) -> RAGState:
    planned = split_query(state["question"])
    return {"sub_queries": planned}


@traceable(name="Retrieve Documents", run_type="retriever")
def _retrieve_node(state: RAGState) -> RAGState:
    vector_store = _get_vector_store()
    docs_by_key: dict[tuple[str | None, int | None, int | None], Document] = {}
    score_by_key: dict[tuple[str | None, int | None, int | None], float] = {}
    top_k = state.get("top_k", settings.rag_top_k)
    sub_queries = state.get("sub_queries") or [state["question"]]

    query_filter = _build_chroma_where(state["company_id"], state.get("document_id"))

    for sub_query in sub_queries:
        current_query = sub_query
        selected_pairs: list[tuple[Document, float]] = []

        for attempt in range(3):
            pairs: list[tuple[Document, float]] = []
            try:
                pairs = vector_store.similarity_search_with_relevance_scores(
                    current_query,
                    k=top_k,
                    filter=query_filter,
                )
            except Exception:
                try:
                    score_pairs = vector_store.similarity_search_with_score(
                        current_query,
                        k=top_k,
                        filter=query_filter,
                    )
                    pairs = [(doc, _as_score_value(score)) for doc, score in score_pairs]
                except Exception:
                    docs = vector_store.similarity_search(
                        current_query,
                        k=top_k,
                        filter=query_filter,
                    )
                    pairs = [(doc, 0.0) for doc in docs]

            if pairs:
                ranked_pairs: list[tuple[Document, float]] = []
                for doc, raw_score in pairs:
                    semantic_score = _as_score_value(raw_score)
                    lexical_boost = 0.2 * _keyword_overlap_score(current_query, doc.page_content)
                    ranked_pairs.append((doc, min(1.0, semantic_score + lexical_boost)))

                avg_local_score = sum(score for _, score in ranked_pairs) / len(ranked_pairs)
                selected_pairs = ranked_pairs

                if avg_local_score >= 0.35:
                    break

            if attempt < 2:
                current_query = refine_query(current_query)

        for doc, score in selected_pairs:
            key = (
                doc.metadata.get("document_id"),
                doc.metadata.get("page_number"),
                doc.metadata.get("chunk_index"),
            )
            existing_score = score_by_key.get(key, -1.0)
            if score > existing_score:
                score_by_key[key] = score
                docs_by_key[key] = doc

    ranked_keys = sorted(score_by_key.keys(), key=lambda item: score_by_key[item], reverse=True)
    max_docs = max(6, top_k * 2)
    selected_keys = ranked_keys[:max_docs]

    deduped_docs = [docs_by_key[key] for key in selected_keys]
    scored_values = [score_by_key[key] for key in selected_keys]

    avg_score = (sum(scored_values) / len(scored_values)) if scored_values else 0.0
    return {"docs": deduped_docs, "avg_score": avg_score}


@traceable(name="Generate Answer", run_type="llm")
def _generate_node(state: RAGState) -> RAGState:
    docs = state.get("docs", [])
    timestamp = datetime.now(timezone.utc).isoformat()
    confidence = _confidence_label(state.get("avg_score", 0.0), len(docs))

    if not docs:
        return {
            "answer": "I could not find enough information. Please contact HR.",
            "sources": [],
            "confidence": "low",
            "timestamp": timestamp,
        }

    context_text = "\n\n".join(
        [
            f"Source: {doc.metadata.get('file_name', 'Unknown')} (page {doc.metadata.get('page_number', '?')})\n{doc.page_content}"
            for doc in docs
        ]
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are LegalMind Assistant. Answer ONLY from the provided retrieved context. "
                "Use clear and professional language. "
                "If information is missing, reply exactly with: I could not find enough information. Please contact HR.",
            ),
            (
                "human",
                "Question: {question}\n\nRetrieved Context:\n{context}",
            ),
        ]
    )

    llm_failed = False
    response_text = ""
    try:
        llm = _get_llm()
        response = llm.invoke(prompt.format_messages(question=state["question"], context=context_text))
        response_text = (response.content or "").strip()
    except Exception:
        llm_failed = True

    if llm_failed or not response_text:
        # Fallback keeps response flow alive if Groq is rate-limited/unavailable.
        snippet_lines: list[str] = []
        for doc in docs[:2]:
            text = re.sub(r"\s+", " ", doc.page_content).strip()
            if text:
                snippet_lines.append(f"- {text[:280]}")

        response_text = (
            "I could not reach the language model right now. "
            "Based on the retrieved document context, here are the key points:\n"
            + ("\n".join(snippet_lines) if snippet_lines else "- No context snippets available.")
        )

    source_items = [
        {
            "file_name": doc.metadata.get("file_name", "Unknown"),
            "page_number": doc.metadata.get("page_number"),
            "chunk_index": doc.metadata.get("chunk_index"),
            "document_id": doc.metadata.get("document_id"),
        }
        for doc in docs
    ]

    unique_sources: list[dict] = []
    seen = set()
    for src in source_items:
        source_key = (src["document_id"], src["page_number"], src["chunk_index"])
        if source_key not in seen:
            seen.add(source_key)
            unique_sources.append(src)

    return {
        "answer": response_text,
        "sources": unique_sources,
        "confidence": confidence,
        "timestamp": timestamp,
    }


def _get_graph():
    global _graph
    if _graph is None:
        workflow = StateGraph(RAGState)
        workflow.add_node("plan", _plan_node)
        workflow.add_node("retrieve", _retrieve_node)
        workflow.add_node("generate", _generate_node)
        workflow.set_entry_point("plan")
        workflow.add_edge("plan", "retrieve")
        workflow.add_edge("retrieve", "generate")
        workflow.add_edge("generate", END)
        _graph = workflow.compile()
    return _graph


@traceable(name="RAG Pipeline", run_type="chain")
def _run_agentic_rag_sync(
    question: str,
    company_id: str,
    user_id: str,
    top_k: int | None = None,
    document_id: str | None = None,
) -> dict:
    graph = _get_graph()
    result = graph.invoke(
        {
            "user_id": user_id,
            "question": question,
            "company_id": company_id,
            "document_id": document_id,
            "top_k": top_k or settings.rag_top_k,
        }
    )

    sources = result.get("sources", [])
    source_files = sorted({src.get("file_name", "Unknown") for src in sources if src.get("file_name")})

    return {
        "user_id": user_id,
        "question": question,
        "answer": result.get("answer", ""),
        "sources": source_files,
        "source_details": sources,
        "confidence": result.get("confidence", "low"),
        "timestamp": result.get("timestamp", datetime.now(timezone.utc).isoformat()),
    }


async def _ensure_history_indexes() -> None:
    global _history_indexes_ready
    if _history_indexes_ready:
        return
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database connection is not ready")

    await db.database["chat_history"].create_index(
        [("company_id", DESCENDING), ("timestamp", DESCENDING)],
        name="company_timestamp_idx",
    )
    await db.database["chat_history"].create_index(
        [("user_id", DESCENDING), ("timestamp", DESCENDING)],
        name="user_timestamp_idx",
    )
    _history_indexes_ready = True


async def save_chat_history(entry: dict) -> str:
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database connection is not ready")

    await _ensure_history_indexes()
    now = datetime.now(timezone.utc)
    record = {
        "company_id": entry["company_id"],
        "user_id": entry["user_id"],
        "question": entry["question"],
        "answer": entry["answer"],
        "sources": entry.get("sources", []),
        "confidence": entry.get("confidence", "low"),
        "timestamp": now,
    }
    result = await db.database["chat_history"].insert_one(record)
    return str(result.inserted_id)


@traceable(name="RAG Request", run_type="chain")
async def ask_question_from_rag(
    question: str,
    company_id: str,
    user_id: str,
    top_k: int | None = None,
    document_id: str | None = None,
) -> dict:
    try:
        result = await run_in_threadpool(
            _run_agentic_rag_sync,
            question,
            company_id,
            user_id,
            top_k,
            document_id,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RAG processing failed: {exc}") from exc

    try:
        await save_chat_history(
            {
                "company_id": company_id,
                "user_id": result["user_id"],
                "question": result["question"],
                "answer": result["answer"],
                "sources": result["sources"],
                "confidence": result["confidence"],
            }
        )
    except Exception:
        # Do not fail the chat response when persistence has a transient issue.
        pass

    return result


async def get_chat_history(company_id: str, user_id: str | None = None) -> list[dict]:
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database connection is not ready")

    query: dict = {"company_id": company_id}
    if user_id:
        query["user_id"] = user_id

    cursor = db.database["chat_history"].find(query).sort("timestamp", DESCENDING)
    items: list[dict] = []
    async for row in cursor:
        ts = row.get("timestamp")
        items.append(
            {
                "id": str(row.get("_id")),
                "user_id": row.get("user_id", ""),
                "question": row.get("question", ""),
                "answer": row.get("answer", ""),
                "sources": row.get("sources", []),
                "confidence": row.get("confidence", "low"),
                "timestamp": ts.isoformat() if ts else None,
            }
        )
    return items