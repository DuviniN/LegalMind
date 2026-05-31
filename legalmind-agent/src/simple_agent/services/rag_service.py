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

from simple_agent.core.config import settings
from simple_agent.db.mongodb import db

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
    company_id: str
    user_id: str
    question: str
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
    if not (any(term in lowered for term in comparison_terms) or "," in cleaned or ";" in cleaned or " vs " in lowered or " versus " in lowered or (" and " in lowered and not starts_interrogative and len(cleaned.split()) <= 14)):
        return [cleaned]

    parts = re.split(r"\band\b|\bvs\b|\bversus\b|,|;", re.sub(r"^compare\s+", "", cleaned, flags=re.IGNORECASE), flags=re.IGNORECASE)
    planned: list[str] = []
    for part in parts[:4]:
        text = re.sub(r"\s+", " ", part).strip(" .?")
        if len(text) >= 3:
            if text.lower().startswith(("what", "how", "when", "why", "where")):
                planned.append(f"{text}?")
            else:
                planned.append(f"What is {text}?")
    if len(planned) >= 2 and "compare" in lowered:
        planned.append(f"Compare {planned[0].rstrip('?')} and {planned[1].rstrip('?')}.")
    deduped: list[str] = []
    seen = set()
    for item in planned:
        key = item.lower().strip()
        if key not in seen:
            seen.add(key)
            deduped.append(item)
    return deduped or [cleaned]


def refine_query(query: str) -> str:
    tokens = re.findall(r"[a-zA-Z0-9]+", query.lower())
    keywords = [token for token in tokens if token not in _REFINE_STOP_WORDS]
    return query.strip() if not keywords else " ".join(keywords[:14])


def _get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=settings.rag_embedding_model)
    return _embeddings


def _get_vector_store() -> Chroma:
    global _vector_store
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
            raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY in legalmind-agent .env")
        _llm = ChatGroq(
            api_key=settings.groq_api_key,
            model=settings.groq_model_name or "llama-3.3-70b-versatile",
            temperature=0.1,
        )
    return _llm


@traceable(name="PDF Ingestion", run_type="chain")
def ingest_pdf_to_vector_store(file_path: str | Path, company_id: str, document_id: str, file_name: str) -> int:
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

    splitter = RecursiveCharacterTextSplitter(chunk_size=settings.rag_chunk_size, chunk_overlap=settings.rag_chunk_overlap)
    chunks = splitter.split_documents(page_documents)
    for idx, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = idx

    vector_store = _get_vector_store()
    try:
        vector_store.delete(where={"$and": [{"company_id": {"$eq": company_id}}, {"document_id": {"$eq": document_id}}]})
    except Exception:
        pass

    ids = [f"{document_id}_{idx}" for idx in range(len(chunks))]
    vector_store.add_documents(chunks, ids=ids)
    return len(chunks)


def _build_chroma_where(company_id: str, document_id: str | None = None) -> dict:
    company_clause = {"company_id": {"$eq": company_id}}
    if document_id:
        return {"$and": [company_clause, {"document_id": {"$eq": document_id}}]}
    return company_clause


def _score_value(score: float | int | None) -> float:
    if score is None:
        return 0.0
    score_value = float(score)
    if score_value < 0:
        return 0.0
    return 1.0 / (1.0 + score_value) if score_value > 1 else score_value


def _keyword_overlap_score(query: str, text: str) -> float:
    query_tokens = {token for token in re.findall(r"[a-zA-Z0-9]+", query.lower()) if len(token) > 2}
    text_tokens = {token for token in re.findall(r"[a-zA-Z0-9]+", text.lower()) if len(token) > 2}
    return 0.0 if not query_tokens or not text_tokens else len(query_tokens & text_tokens) / len(query_tokens)


def _confidence_label(avg_score: float, doc_count: int) -> str:
    if doc_count == 0:
        return "low"
    if avg_score >= 0.7:
        return "high"
    if avg_score >= 0.45:
        return "medium"
    return "low"


class _RAGAnswerState(TypedDict, total=False):
    company_id: str
    user_id: str
    question: str
    document_id: str | None
    top_k: int
    sub_queries: list[str]
    docs: list[Document]
    avg_score: float
    answer: str
    sources: list[dict]
    confidence: str
    timestamp: str


def _get_question(state: dict) -> str:
    return (state.get("question") or state.get("message") or "").strip()


@traceable(name="Plan Query", run_type="chain")
def _plan_node(state: _RAGAnswerState) -> _RAGAnswerState:
    question = _get_question(state)
    return {"sub_queries": split_query(question)} if question else {"sub_queries": []}


@traceable(name="Retrieve Documents", run_type="retriever")
def _retrieve_node(state: _RAGAnswerState) -> _RAGAnswerState:
    vector_store = _get_vector_store()
    top_k = state.get("top_k", settings.rag_top_k)
    query_filter = _build_chroma_where(state["company_id"], state.get("document_id"))
    question = _get_question(state)
    sub_queries = state.get("sub_queries") or ([question] if question else [])
    docs_by_key: dict[tuple[str | None, int | None, int | None], Document] = {}
    scores_by_key: dict[tuple[str | None, int | None, int | None], float] = {}
    if not sub_queries:
        return {"docs": [], "avg_score": 0.0}

    for sub_query in sub_queries:
        current_query = sub_query
        selected: list[tuple[Document, float]] = []
        for attempt in range(3):
            try:
                pairs = vector_store.similarity_search_with_relevance_scores(current_query, k=top_k, filter=query_filter)
            except Exception:
                try:
                    pairs = [(doc, _score_value(score)) for doc, score in vector_store.similarity_search_with_score(current_query, k=top_k, filter=query_filter)]
                except Exception:
                    pairs = [(doc, 0.0) for doc in vector_store.similarity_search(current_query, k=top_k, filter=query_filter)]

            if pairs:
                selected = [(doc, min(1.0, _score_value(score) + 0.2 * _keyword_overlap_score(current_query, doc.page_content))) for doc, score in pairs]
                if sum(score for _, score in selected) / len(selected) >= 0.35:
                    break
            if attempt < 2:
                current_query = refine_query(current_query)

        for doc, score in selected:
            key = (doc.metadata.get("document_id"), doc.metadata.get("page_number"), doc.metadata.get("chunk_index"))
            if score > scores_by_key.get(key, -1.0):
                scores_by_key[key] = score
                docs_by_key[key] = doc

    ranked_keys = sorted(scores_by_key.keys(), key=lambda item: scores_by_key[item], reverse=True)
    selected_keys = ranked_keys[: max(6, top_k * 2)]
    docs = [docs_by_key[key] for key in selected_keys]
    scores = [scores_by_key[key] for key in selected_keys]
    avg_score = sum(scores) / len(scores) if scores else 0.0
    return {"docs": docs, "avg_score": avg_score}


@traceable(name="Generate Answer", run_type="llm")
def _generate_node(state: _RAGAnswerState) -> _RAGAnswerState:
    docs = state.get("docs", [])
    timestamp = datetime.now(timezone.utc).isoformat()
    question = _get_question(state)
    if not docs:
        return {"answer": "I could not find enough information. Please contact HR.", "sources": [], "confidence": "low", "timestamp": timestamp}

    context_text = "\n\n".join(
        f"Source: {doc.metadata.get('file_name', 'Unknown')} (page {doc.metadata.get('page_number', '?')})\n{doc.page_content}"
        for doc in docs
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are LegalMind Assistant. Answer ONLY from the provided retrieved context. If information is missing, reply exactly with: I could not find enough information. Please contact HR."),
            ("human", "Question: {question}\n\nRetrieved Context:\n{context}"),
        ]
    )

    response_text = ""
    try:
        response = _get_llm().invoke(prompt.format_messages(question=question, context=context_text))
        response_text = (response.content or "").strip()
    except Exception:
        response_text = ""

    if not response_text:
        snippets = []
        for doc in docs[:2]:
            text = re.sub(r"\s+", " ", doc.page_content).strip()
            if text:
                snippets.append(f"- {text[:280]}")
        response_text = "I could not reach the language model right now. Based on the retrieved document context, here are the key points:\n" + ("\n".join(snippets) if snippets else "- No context snippets available.")

    sources = []
    seen = set()
    for doc in docs:
        item = {
            "file_name": doc.metadata.get("file_name", "Unknown"),
            "page_number": doc.metadata.get("page_number"),
            "chunk_index": doc.metadata.get("chunk_index"),
            "document_id": doc.metadata.get("document_id"),
        }
        key = (item["document_id"], item["page_number"], item["chunk_index"])
        if key not in seen:
            seen.add(key)
            sources.append(item)

    return {"answer": response_text, "sources": sources, "confidence": _confidence_label(state.get("avg_score", 0.0), len(docs)), "timestamp": timestamp}


def _get_graph():
    global _graph
    if _graph is None:
        workflow = StateGraph(_RAGAnswerState)
        workflow.add_node("plan", _plan_node)
        workflow.add_node("retrieve", _retrieve_node)
        workflow.add_node("generate", _generate_node)
        workflow.set_entry_point("plan")
        workflow.add_edge("plan", "retrieve")
        workflow.add_edge("retrieve", "generate")
        workflow.add_edge("generate", END)
        _graph = workflow.compile()
    return _graph


@traceable(name="RAG Request", run_type="chain")
def _run_agentic_rag_sync(question: str, company_id: str, user_id: str, top_k: int | None = None, document_id: str | None = None) -> dict:
    clean_question = (question or "").strip()
    result = _get_graph().invoke({"user_id": user_id, "question": clean_question, "company_id": company_id, "document_id": document_id, "top_k": top_k or settings.rag_top_k})
    sources = result.get("sources", [])
    return {
        "user_id": user_id,
        "question": clean_question,
        "answer": result.get("answer", ""),
        "sources": sorted({src.get("file_name", "Unknown") for src in sources if src.get("file_name")}),
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
    await db.database["chat_history"].create_index([("company_id", DESCENDING), ("timestamp", DESCENDING)], name="company_timestamp_idx")
    await db.database["chat_history"].create_index([("user_id", DESCENDING), ("timestamp", DESCENDING)], name="user_timestamp_idx")
    _history_indexes_ready = True


async def save_chat_history(entry: dict) -> str:
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database connection is not ready")
    await _ensure_history_indexes()
    result = await db.database["chat_history"].insert_one(
        {
            "company_id": entry["company_id"],
            "user_id": entry["user_id"],
            "question": entry["question"],
            "answer": entry["answer"],
            "sources": entry.get("sources", []),
            "confidence": entry.get("confidence", "low"),
            "timestamp": datetime.now(timezone.utc),
        }
    )
    return str(result.inserted_id)


@traceable(name="RAG Request", run_type="chain")
async def ask_question_from_rag(question: str, company_id: str, user_id: str, top_k: int | None = None, document_id: str | None = None) -> dict:
    try:
        result = await run_in_threadpool(_run_agentic_rag_sync, question, company_id, user_id, top_k, document_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"RAG processing failed: {exc}") from exc

    try:
        await save_chat_history({"company_id": company_id, "user_id": result["user_id"], "question": result["question"], "answer": result["answer"], "sources": result["sources"], "confidence": result["confidence"]})
    except Exception:
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
