# LegalMind Frontend

Vite + React frontend for the LegalMind app.

## Prerequisites

- Node.js 18+

## Setup

From the frontend folder:

```bash
cd c:\Coding\LegalMindProject\LegalMind\frontend
```

Install dependencies:

```bash
npm install
```

Copy the environment example and update the API base URL:

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Run

```bash
npm run dev
```

Vite defaults to `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```
