# LegalMind Agent Server

LangGraph-powered service that handles routing, RAG over PDFs, and leave request workflows. The backend proxies all AI requests to this service.

## Prerequisites

- Python 3.13+
- MongoDB running locally (default: `mongodb://localhost:27017`)

## Setup

From the agent folder:

```bash
cd c:\Coding\LegalMindProject\LegalMind\legalmind-agent
```

Sync dependencies with `uv`:

```bash
uv sync --dev
```

Copy the environment example and fill in values:

```bash
cp .env.example .env
```

Required envs:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=LegalMindDb
GROQ_API_KEY=your_groq_api_key
CHROMA_PERSIST_DIR=c:\Coding\LegalMindProject\LegalMind\backend\app\chroma_db
```

Optional (RAG tuning):

```env
GROQ_MODEL_NAME=llama-3.1-8b-instant
RAG_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=150
RAG_TOP_K=4
```

Optional (LangSmith tracing):

```env
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_PROJECT=LegalMind
```

## Run

Start the agent server (used by the backend proxy):

```bash
uv run uvicorn simple_agent.api:app --reload --port 8101
```

Windows:

```bat
.\.venv\Scripts\uv.exe run uvicorn simple_agent.api:app --reload --port 8101
```

LangGraph dev (optional for graph-only testing):

```bash
uv run langgraph dev
```

## Tests and Lint

```bash
make test
make integration-tests
make lint
make format
```

## Reference Docs

- LangChain quickstart: https://docs.langchain.com/oss/python/langchain/quickstart
- LangChain deployment: https://docs.langchain.com/oss/python/langchain/deploy
