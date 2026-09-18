# Differential Dx — Frontend

React/TypeScript chat interface for the Malaria / COVID-19 differential-diagnosis backend.

## Backend contract

The frontend now follows the FastAPI application in `app/api/routes.py` and its
Pydantic schemas in `app/schemas.py`.

### Conversational flow

- `POST /chat` — sends a message to the DeepSeek/LangChain conversational agent.
- `GET /chat/{session_id}` — hydrates a case from the backend's in-memory
  conversation history.
- `GET /health` — exposes model/agent service health.

The chat UI uses `/chat` as its primary path. The agent decides when to invoke
the backend's `run_differential_diagnosis` tool, rather than the frontend
directly deciding when to run a diagnosis.

### Structured diagnosis

The frontend still exposes typed helpers for:

- `POST /diagnose/text`
- `POST /diagnose/structured`

These are useful for future structured-data screens and preserve the existing
`DiagnosisResponse` / `DiagnosisCard` capability.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Run the backend separately:

```bash
uvicorn api:app --reload --port 8000
```

Set `VITE_API_BASE_URL` when the backend is hosted somewhere else.

## Persistence model

The backend conversation history is currently **in-memory**. The frontend
therefore treats `localStorage` as a UI cache rather than the source of truth:

- case IDs, titles, and cached messages are kept locally so the sidebar remains
  useful after a page reload;
- when a case is selected, the frontend attempts to hydrate its transcript from
  `GET /chat/{session_id}`;
- if the backend has restarted, its in-memory history may no longer exist, so a
  locally cached case can remain visible without claiming that the backend still
  has the transcript.

Practitioner verification is still a self-attested, browser-local placeholder
because the supplied backend has no verification endpoint.

## Project structure

```text
src/
├── routes/
│   ├── Verify.tsx
│   └── Chat.tsx
├── components/
│   ├── Sidebar.tsx
│   ├── MessageBubble.tsx
│   ├── DiagnosisCard.tsx
│   ├── ChatInput.tsx
│   └── ProtectedRoute.tsx
├── lib/
│   ├── api.ts       typed backend API client
│   └── storage.ts   local UI cache + verification placeholder
└── types.ts         backend contracts + frontend view models
```

## Build

```bash
npm run build
```
