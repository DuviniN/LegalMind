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
```

## Run with Uvicorn

From backend folder:

```cmd
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

## Verify Backend

Open in browser:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/health/db`

## Common Commands

Run on another port (if 8000 is busy):

```cmd
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8003
```

Deactivate venv (if activated):

```cmd
deactivate
```
