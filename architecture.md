# LegalMind Architecture

## Components

- Frontend (Vite + React): UI for chat, documents, and admin workflows.
- Backend (FastAPI): Auth, company context, document metadata, and proxy to agent server.
- Agent Server (FastAPI + LangGraph): Intent routing, RAG retrieval, leave workflow, and vector indexing.
- MongoDB: Stores users, companies, documents metadata, leave requests, and chat history (shared by backend and agent).
- Chroma (persisted): Vector store for document chunks.
- LangSmith (optional): Tracing for agent RAG and workflow runs.

## High-Level Diagram

```mermaid
flowchart LR
    UI[Frontend] -->|HTTP| BE[Backend API]
    BE -->|Reads/Writes| MDB[(MongoDB)]
    BE -->|HTTP proxy| AG[Agent Server]
    AG -->|Reads/Writes| MDB[(MongoDB)]
    AG -->|Vector index/query| CH[(Chroma DB)]
    AG -->|Tracing| LS[LangSmith]
```

## LangGraph Agent Details

```mermaid
flowchart TD
    IN[User Message] --> CL[Intent Classifier]
    CL -->|policy_query| RAG[RAG Workflow]
    CL -->|leave_request| LV[Leave Workflow]
    RAG --> OUT[Assistant Response]
    LV --> OUT
```

```mermaid
flowchart TD
    Q[Question] --> PLAN[Plan Node: split_query]
    PLAN --> RETR[Retrieve Node: Chroma top-k]
    RETR --> GEN[Generate Node: LLM answer]
    GEN --> RESP[Response + sources]
```

- Intent classifier uses Groq LLM with a heuristic fallback.
- RAG workflow nodes: plan (split query), retrieve (Chroma similarity), generate (Groq answer).
- RAG stores chat history and source metadata in MongoDB.
- Leave workflow: extract required fields, validate, store requests in MongoDB, return next question or confirmation.
- Tools and services:
  - `rag_service`: ingestion and retrieval (Chroma + HuggingFace embeddings)
  - `leave_service`: leave request validation and storage

## Main Flows

### 1) Document Upload and Indexing

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant BE as Backend API
    participant AG as Agent Server
    participant MDB as MongoDB
    participant CH as Chroma

    UI->>BE: POST /upload (PDF)
    BE->>AG: POST /upload (proxy)
    AG->>MDB: Insert document metadata
    AG->>CH: Chunk + embed + upsert vectors
    AG-->>BE: Upload result
    BE-->>UI: Upload response
```

1. User uploads PDF from the UI.
2. Backend receives `/upload` and proxies to agent server `/upload`.
3. Agent server stores the PDF in `legalmind-agent/uploads/<company_id>`.
4. Agent server saves document metadata in MongoDB.
5. Agent server extracts text, chunks it, embeds with HuggingFace, and writes vectors to Chroma.

### 2) Policy Q&A (RAG)

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant BE as Backend API
    participant AG as Agent Server
    participant CH as Chroma
    participant LS as LangSmith

    UI->>BE: POST /agent/query
    BE->>AG: POST /agent/query (proxy)
    AG->>CH: Retrieve top-k chunks
    AG-->>LS: Trace run (optional)
    AG-->>BE: assistant_message + sources
    BE-->>UI: Response
```

1. User asks a policy question in the UI.
2. Backend forwards `/agent/query` to the agent server.
3. Agent server classifies intent and routes to RAG.
4. RAG pulls top-k chunks from Chroma, generates an answer via Groq.
5. Agent server returns `assistant_message` and source metadata to backend.
6. Backend returns the response to the UI.

### 3) Leave Request Workflow

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant BE as Backend API
    participant AG as Agent Server
    participant MDB as MongoDB

    UI->>BE: POST /agent/query (leave)
    BE->>AG: POST /agent/query (proxy)
    AG->>MDB: Validate + store leave request
    AG-->>BE: Next question or confirmation
    BE-->>UI: Response
```

1. User submits a leave request via chat.
2. Backend forwards `/agent/query` to the agent server.
3. Agent server classifies intent and routes to leave workflow.
4. Leave workflow validates required fields and stores the request in MongoDB.
5. Agent server returns next question or submission confirmation.

## Configuration Notes

- Backend talks to the agent server via `AGENT_SERVER_URL`.
- Agent server owns RAG and vector storage via `CHROMA_PERSIST_DIR`.
- LangSmith tracing is configured in the agent server env.
