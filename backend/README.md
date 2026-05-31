# LegalMind Backend

FastAPI backend that handles auth, document metadata, and manager-facing APIs. All AI/RAG work is delegated to the separate agent server.

## Prerequisites

- Python 3.10+
- MongoDB running locally (default: `mongodb://localhost:27017`)

## Setup

From the backend folder:

```cmd
cd c:\Coding\LegalMindProject\LegalMind\backend
```

Create and activate the virtual environment:

```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

Install dependencies:

```cmd
pip install --upgrade pip
pip install -r requirements.txt
```

## Environment Variables

Copy the example file and update values:

```cmd
copy .env.example .env
```

Required:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=LegalMindDb
COMPANY_OWNER_SECRET_KEY=CHANGE_ME
AGENT_SERVER_URL=http://127.0.0.1:8101
```

Optional:

```env
# AGENT_SERVER_TIMEOUT_SEC=30
# INTERNAL_CHAT_NO_AUTH=false
# INTERNAL_DEFAULT_COMPANY_ID=
```

## Run

Start the backend:

```cmd
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

The backend expects the agent server to be running (see the agent README).

## Key Endpoints

- `POST /agent/query`: Proxies user messages to the agent server
- `POST /upload`: Uploads PDFs (proxy to agent server indexing)
- `GET /documents`: Lists uploaded documents
- `GET /leave/requests`: Manager dashboard feed

## Verify

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/health/db`
- `http://127.0.0.1:8000/docs`
