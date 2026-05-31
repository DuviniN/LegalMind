# LegalMind Docker Setup

This guide runs the backend, agent server, frontend, and MongoDB using Docker Compose.

## Prerequisites

- Docker Desktop (with Docker Compose v2)

## Configure Environment Files

Copy the example env files and fill in real values for keys:

```cmd
copy backend\.env.example backend\.env
copy legalmind-agent\.env.example legalmind-agent\.env
copy frontend\.env.example frontend\.env
```

Make sure `legalmind-agent/.env` includes your `GROQ_API_KEY` (and `LANGSMITH_*` if you want tracing).

## Run

From the project root:

```cmd
docker compose up --build
```

## URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Agent: http://localhost:8101

## Notes

- The compose file overrides container networking values (MongoDB and agent hostnames).
- Chroma vectors are stored in a Docker volume named `chroma_data`.
- Agent uploads are stored in a Docker volume named `agent_uploads`.
