# Frontend Refactoring Plan — Differential Dx

## 1. Objective

Refactor the React frontend so that its data flow and API layer follow the
uploaded FastAPI backend rather than treating the frontend's local diagnosis
state as the primary application contract.

The backend exposes two related capabilities:

1. **Conversational clinical assistant**
   - `POST /chat`
   - `GET /chat/{session_id}`
   - LangChain/DeepSeek conversation history keyed by `session_id`
   - The agent invokes `run_differential_diagnosis` when appropriate.

2. **Structured differential-diagnosis pipeline**
   - `POST /diagnose/text`
   - `POST /diagnose/structured`
   - Returns the complete `DiagnosisResponse`, including probabilities,
     recommendations, extracted features, and model explanations.

The refactor makes the conversational API the primary `/chat` UI flow while
keeping typed structured-diagnosis functions available for future screens.

---

## 2. Backend/frontend contract changes

### Existing frontend behavior

The old `Chat.tsx` sent every user message directly to:

`POST /diagnose/text`

That meant the UI itself decided that every message was a diagnosis request.
It also expected every response to be a `DiagnosisResponse`.

The old frontend then stored the complete conversation and diagnosis payload
in browser `localStorage`.

### Backend behavior

The supplied backend's conversational layer instead expects:

```json
{
  "message": "35-year-old patient with fever and vomiting",
  "session_id": "case-uuid"
}
```

and returns:

```json
{
  "session_id": "case-uuid",
  "reply": "..."
}
```

Conversation history can subsequently be retrieved with:

`GET /chat/{session_id}`

The agent itself owns the decision to invoke the diagnostic tool.

### Refactoring decision

The frontend now:

- sends conversational messages to `/chat`;
- keeps the returned `session_id`;
- retrieves backend history when a case is selected;
- renders conversational assistant replies as text;
- retains `/diagnose/text` and `/diagnose/structured` in the API client;
- retains `DiagnosisResponse` and `DiagnosisCard` for structured-diagnosis
  functionality that can be exposed by a future dedicated screen.

---

## 3. Refactoring steps

### Step 1 — Rebuild the TypeScript API contract

Update `src/types.ts` to mirror the backend Pydantic schemas:

- `ChatResponse`
- `BackendChatMessage`
- `ChatHistoryResponse`
- `HealthResponse`
- `DiagnosisResponse`
- `ModelExplanation`
- `TopFactor`

Keep frontend-only view models separate from backend response models.

**Reason:** API payloads and UI state have different responsibilities. This
also prevents conversational responses from being incorrectly treated as
structured diagnosis responses.

---

### Step 2 — Replace one-off fetch logic with a typed request wrapper

Refactor `src/lib/api.ts` around a shared `request<T>()` function.

The wrapper should:

- prepend `VITE_API_BASE_URL`;
- set JSON headers only when a request has a body;
- parse FastAPI `{ "detail": "..." }` errors;
- preserve HTTP status codes;
- expose a consistent `ApiError`.

Add these functions:

- `sendChatMessage()`
- `getChatHistory()`
- `runTextDiagnosis()`
- `runStructuredDiagnosis()`
- `checkHealth()`

**Reason:** All frontend/backend communication should have one consistent
error-handling and serialization path.

---

### Step 3 — Make `/chat` the primary chat transport

Change `Chat.tsx` so `handleSend()` calls:

`sendChatMessage(text, sessionId)`

instead of:

`runTextDiagnosis(text, sessionId)`

The frontend should no longer assume that every assistant turn produces a
`DiagnosisResponse`.

**Reason:** The backend's agent is explicitly responsible for conversational
collection of information and invoking the diagnostic tool when enough data
is available.

---

### Step 4 — Hydrate cases from backend conversation history

When the active case changes, call:

`GET /chat/{session_id}`

Convert backend messages:

```text
{ role, content }
```

into the frontend's `ChatMessage` view model.

Ignore internal `tool` messages in the UI because the backend exposes them in
its serialized history but they are implementation details of the agent.

**Reason:** The backend history should be the source of truth for the
conversation while it exists.

---

### Step 5 — Clarify localStorage's role

Keep localStorage only as a cache for:

- case IDs;
- case titles;
- cached transcript;
- practitioner self-attestation.

Do not describe it as the authoritative conversation store.

The backend currently uses an in-memory dictionary:

`_store: dict[str, InMemoryChatMessageHistory]`

Therefore backend history disappears when the API process restarts.

**Reason:** This matches the actual backend architecture and prevents the
frontend from pretending that localStorage and server history are the same
persistence layer.

---

### Step 6 — Preserve structured diagnosis capability

Do not delete `DiagnosisCard` or the `DiagnosisResponse` types.

The backend's structured endpoints are still valuable because they return:

- Malaria probability;
- COVID-19 probability;
- confidence;
- primary diagnosis;
- recommendations;
- model predictions;
- SHAP/explanation factors;
- extracted NLP features;
- COVID model status.

The current conversational agent consumes that structured result internally
and turns it into its `reply`.

**Future option:** expose a dedicated "Structured analysis" action/screen that
calls `/diagnose/text` directly when the product needs exact probability
visualization.

---

### Step 7 — Make assistant messages generic

The old message renderer assumed an assistant message was either an error or a
diagnosis card.

Refactor it to support:

- user text;
- assistant conversational text;
- structured diagnosis cards;
- API errors.

This prevents the UI from breaking when the agent asks a follow-up question
instead of producing a diagnosis.

---

### Step 8 — Handle backend-generated session IDs

The backend allows `session_id` to be omitted and generates a UUID.

The frontend currently creates a UUID before sending the first message so that
a case can exist in the sidebar immediately.

The response's `session_id` is still treated as authoritative. If the backend
returns a different ID, the frontend updates the active case.

---

### Step 9 — Improve case hydration behavior

Selecting an existing local case attempts to load its server history.

If the backend responds with `404`, the frontend leaves the cached case
visible because this can happen after the backend's in-memory store has
restarted.

For other errors, an explicit error message is displayed.

This is intentionally different from silently replacing cached content with
an empty conversation.

---

### Step 10 — Update documentation

Update the frontend README so that it documents:

- `/chat`;
- `/chat/{session_id}`;
- `/diagnose/text`;
- `/diagnose/structured`;
- `/health`;
- backend-owned conversational history;
- localStorage's cache role;
- self-attested verification limitation.

---

## 4. Resulting architecture

```text
                    ┌─────────────────────────┐
                    │       React Frontend    │
                    │                         │
                    │ Chat.tsx                │
                    │    │                    │
                    │    ▼                    │
                    │ lib/api.ts              │
                    └───────────┬─────────────┘
                                │
                    POST /chat  │  GET /chat/{id}
                                ▼
                    ┌─────────────────────────┐
                    │       FastAPI API       │
                    │      app/api/routes.py  │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │ LangChain Agent         │
                    │ DeepSeek                │
                    │ RunnableWithMessageHist │
                    └───────────┬─────────────┘
                                │
                     invokes tool when ready
                                │
                    ┌───────────▼─────────────┐
                    │ DifferentialDiagnosis  │
                    │                         │
                    │ NLP → models → SHAP     │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │ Malaria + COVID models  │
                    └─────────────────────────┘

Local browser storage
        │
        ├── case metadata/cache
        └── practitioner self-attestation

Backend memory
        │
        └── authoritative live conversation history
```

---

## 5. Important limitations retained from the backend

This refactor does not attempt to solve backend limitations that are outside
the frontend's responsibility:

- conversational history is in-memory;
- practitioner verification is not implemented server-side;
- the backend marks the COVID-19 model as provisional;
- diagnosis output is decision support and not a clinically validated
  diagnosis.

The frontend therefore preserves the existing warning that the system is not
a substitute for professional clinical judgement.

---

## 6. Files changed

### Modified

- `src/lib/api.ts`
- `src/types.ts`
- `src/lib/storage.ts`
- `src/components/MessageBubble.tsx`
- `src/routes/Chat.tsx`
- `README.md`

### Intentionally retained

- `src/components/DiagnosisCard.tsx`
- `src/routes/Verify.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/Sidebar.tsx`
- `src/components/ChatInput.tsx`

The retained components remain compatible with the frontend and/or provide
functionality backed by existing backend contracts.

---

## 7. Validation checklist

Before deployment:

1. Start FastAPI with `uvicorn api:app --reload --port 8000`.
2. Confirm `/health` reports both models loaded.
3. Confirm the conversational agent is configured with `DEEPSEEK_API_KEY`.
4. Start the frontend with `npm run dev`.
5. Send a first patient message.
6. Confirm `/chat` returns a `session_id` and `reply`.
7. Send a follow-up message using the same session.
8. Switch cases and confirm `GET /chat/{session_id}` hydrates history.
9. Restart the backend and verify the UI handles missing in-memory sessions
   without crashing.
10. Run `npm run build`.

---

## 8. Future refactoring recommended

The next backend/frontend iteration should consider:

1. Persisting chat history in a database instead of process memory.
2. Adding authentication and server-side practitioner verification.
3. Returning structured tool/diagnosis events from `/chat` alongside the natural
   language reply so the frontend can render the probability/explanation card
   without parsing LLM text.
4. Adding a dedicated session-list endpoint so the sidebar is server-backed.
5. Adding a feedback/correction endpoint for the backend's existing
   `doctor_correction` logging field.
6. Adding a shared generated OpenAPI TypeScript client so `types.ts` cannot drift
   from Pydantic schemas manually.
