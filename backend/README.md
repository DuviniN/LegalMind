# LegalMind Backend

FastAPI backend for LegalMind.

## Prerequisites

- Python 3.10+
- MongoDB running locally (default: `mongodb://localhost:27017`)

## Setup (using `venv`)

From the backend folder:

```cmd
cd c:\Coding\LegalMindProject\LegalMind\backend
```

Create virtual environment:

```cmd
python -m venv .venv
```

Activate virtual environment (cmd):

```cmd
.venv\Scripts\activate.bat
```

If activation is blocked by policy, you can still run commands directly with `python.exe` path:

```cmd
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

If activation works, install dependencies with:

```cmd
pip install --upgrade pip
pip install -r requirements.txt
```

## Environment Variables

Create `.env` in backend root (or copy from `.env.example`) with:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=LegalMindDb
COMPANY_OWNER_SECRET_KEY=CHANGE_ME
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL_NAME=llama-3.3-70b-versatile
RAG_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=150
RAG_TOP_K=4

# Internal company mode (optional)
# true: allow chat and document list access without login
INTERNAL_CHAT_NO_AUTH=false
# Optional fixed company id for internal mode
# INTERNAL_DEFAULT_COMPANY_ID=64f0c2f4e1382db14e9f1234

# LangSmith (optional, for tracing/observability)
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_PROJECT=LegalMind
# LANGSMITH_ENDPOINT=https://api.smith.langchain.com
```

When `INTERNAL_CHAT_NO_AUTH=true`, users can open `/chat` and use RAG without login.
Backend will use `INTERNAL_DEFAULT_COMPANY_ID` if provided, otherwise it uses the first company record in MongoDB.

## LangSmith Setup (RAG Tracing)

LegalMind already uses LangChain + LangGraph, so LangSmith tracing works by enabling env vars.

1. Create a LangSmith account and API key.
2. Add the LangSmith variables above to backend `.env`.
3. Reinstall deps and restart backend:

```cmd
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

4. Use chat normally (`POST /rag/query`).
5. Open LangSmith dashboard and filter by project `LegalMind`.

What you will see:

- Retrieval and generation traces for each chat question.
- Inputs/outputs for model calls and latency/cost telemetry.
- End-to-end run timeline for debugging poor answers.

## LangSmith Monitoring

Use the `LegalMind` project in LangSmith to watch live requests:

- Track request volume, latency, and failed runs.
- Inspect each trace to see query split, retrieval, and answer generation.
- Use tags and metadata in code to separate chat, upload, and retrieval behavior.

## LangSmith Evaluation

For evaluation, create a LangSmith dataset with real or synthetic questions, then compare answers against expected outputs.

- Add question/answer pairs from your legal documents.
- Run batch evals after changing prompts, chunk sizes, embedding models, or retrieval settings.
- Review scoring in LangSmith to see which questions fail retrieval or generation.

Recommended eval loop:

1. Collect 10 to 20 representative questions.
2. Store them in a LangSmith dataset.
3. Run them against `/rag/query` or a traced Python wrapper.
4. Compare answer quality, sources, and confidence labels.
5. Adjust retrieval or prompt logic, then rerun the dataset.

## Run with Uvicorn

From backend folder:

```cmd
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

## Verify Backend

Open in browser:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/health/db`
- `http://127.0.0.1:8000/docs`

## RAG Endpoints (Swagger)

After login, pass `Authorization: Bearer <token>` header.

- `POST /upload`: Uploads PDF and automatically indexes chunks into Chroma vector DB.
- `POST /rag/query`: Agentic RAG workflow (query planning, multi-step retrieval, refinement retry, answer generation).
- `GET /history`: Returns chat history logs, optional `user_id` filter, sorted latest first.

## Leave Request Tool

Employees can submit leave or short leave requests through the AI assistant.

- `POST /leave/request`: Extracts leave details from a natural-language message, validates required fields, and saves the request for managers.
- `GET /leave/requests`: Returns saved leave requests for the manager dashboard.

Required details are checked by the AI service before saving, so incomplete requests are returned with missing fields instead of being sent to managers.

`POST /rag/query` response includes:

- `user_id`
- `question`
- `answer`
- `sources` (file names)
- `source_details` (chunk-level metadata)
- `confidence` (`high | medium | low`)
- `timestamp`

## Common Commands

Run on another port (if 8000 is busy):

```cmd
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8003
```

Deactivate venv (if activated):

```cmd
deactivate
```
