# LegalMind

LegalMind is split into three components:

- backend: FastAPI API server and auth, proxies AI requests to the agent server
- legalmind-agent: LangGraph agent server for routing, RAG, and leave workflows
- frontend: Vite + React UI

## Prerequisites

- Python 3.10+ for backend
- Python 3.13+ for legalmind-agent
- Node.js 18+ for frontend
- MongoDB running locally

## Quickstart

1) Configure environment files

```cmd
copy backend\.env.example backend\.env
copy legalmind-agent\.env.example legalmind-agent\.env
copy frontend\.env.example frontend\.env
```

2) Start the agent server

```cmd
cd legalmind-agent
uv sync --dev
.\.venv\Scripts\uv.exe run uvicorn simple_agent.api:app --reload --port 8101
```

3) Start the backend

```cmd
cd ..\backend
python -m venv .venv
.\.venv\Scripts\activate.bat
pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

4) Start the frontend

```cmd
cd ..\frontend
npm install
npm run dev
```

## Default URLs

- Backend: http://127.0.0.1:8000
- Agent: http://127.0.0.1:8101
- Frontend: http://localhost:5173

## Notes

- The backend proxies AI endpoints to the agent server.
- LangSmith tracing is configured in legalmind-agent\.env.
- VITE_API_BASE_URL in frontend\.env should point to the backend URL.
