# Threadneedle

> A block-aware AI conversation interface where every paragraph, step, and code block in an answer is independently replyable and explainable — without losing the thread.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-3776ab.svg?logo=python&logoColor=white)
![React](https://img.shields.io/badge/react-18-61DAFB.svg?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg?logo=fastapi&logoColor=white)

---

## What it does

Most AI chat interfaces treat each response as one atomic blob. You ask a follow-up, and you're hoping the model stays focused on the right part. Threadneedle solves this by splitting every assistant response into **individually addressable blocks** — paragraphs, numbered steps, bullet points, code snippets — and attaching **Reply** and **Explain** buttons to each one.

**Reply** on a specific step → your follow-up is anchored to that block, and the model is instructed to stay focused on it.  
**Explain** on a block → the model expands just that part inline, without re-explaining the rest.

The resulting conversation looks like a nested comment thread anchored to the content that prompted it — closer to annotating a document than messaging a chatbot.

---

## Demo

<!-- 
  Add a demo GIF here before publishing.
  Record 30–45 seconds: ask a question → blocks appear → click Reply on one
  → answer appears inline under that block → click Explain → inline expansion.
  
  ![Demo](./screenshots/demo.gif)
-->

> 📸 Demo GIF coming soon.

---

## Architecture

```
┌─────────────────────────────┐     POST /api/chat      ┌──────────────┐     ┌──────────────┐
│   React + Vite (frontend)   │ ──────────────────────▶ │   FastAPI    │ ──▶ │  OpenRouter  │
│                             │                         │  (backend)   │     │  / OpenAI    │
│  • Owns all conversation    │ ◀────────────────────── │              │     └──────────────┘
│    state (stateless API)    │     { reply, model }    │  Stateless:  │
│  • Splits markdown into     │                         │  assembles   │
│    reply-able blocks        │                         │  prompt from │
│  • Renders inline threads   │                         │  full history│
└─────────────────────────────┘                         └──────────────┘
```

### Design principles

**Stateless backend.** The frontend sends the full conversation history on every request. The API has no session storage, no database dependency — it assembles a prompt and calls the LLM. Trivially horizontally scalable and easy to test in isolation.

**Client-side block splitting.** Splitting markdown into replyable blocks is presentation logic. Keeping it in the browser means you can tune block boundaries without a backend deploy, and the API stays minimal — it only sees and returns text.

**One endpoint, three modes.** `POST /api/chat` accepts `mode: "normal" | "reply" | "explain"`. The backend assembles the right system+user prompt; the frontend just signals intent. Adding a new mode (summarize, translate, compare) means adding one branch in `prompts.py` — no API change.

**Anchored inline threads.** Each message carries an optional `anchor: { messageId, blockId }`. The `ChatWindow` renders anchored replies inline under the block that prompted them, not at the bottom of the conversation. This keeps context visible without context-switching.

---

## Folder structure

```
threadneedle/
├── backend/
│   ├── .env.example             # copy to .env and add your API key
│   ├── requirements.txt
│   └── app/
│       ├── main.py              # FastAPI app factory, CORS middleware
│       ├── config.py            # pydantic-settings: loads from .env
│       ├── schemas.py           # Pydantic request/response models
│       ├── prompts.py           # prompt builders per mode (normal/reply/explain)
│       ├── routers/
│       │   └── chat.py          # POST /api/chat  +  GET /api/health
│       └── services/
│           ├── openai_service.py      # OpenAI direct integration
│           └── openrouter_service.py  # OpenRouter integration (multi-model)
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js           # dev server + /api proxy → :8000
    └── src/
        ├── App.jsx              # top-level state: messages + replyContext
        ├── styles.css           # dark-mode-first, responsive
        ├── api/chat.js          # fetch wrapper (one place for auth/retry)
        ├── hooks/useChat.js     # send / loading / error / optimistic rollback
        ├── utils/splitBlocks.js # markdown → typed blocks (paragraph/numbered/bullet/code)
        └── components/
            ├── ChatWindow.jsx        # linear + inline thread rendering
            ├── Message.jsx           # single message, dispatches to AssistantBlock
            ├── AssistantBlock.jsx    # one block + Reply/Explain buttons + syntax highlighting
            ├── ReplyChip.jsx         # "Replying to: …" pill above the input
            └── InputBar.jsx          # textarea, Enter-to-send, Shift+Enter for newlines
```

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- An [OpenRouter](https://openrouter.ai) API key (free tier available) **or** an OpenAI API key

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set your OPENROUTER_API_KEY (or OPENAI_API_KEY if using OpenAI directly)
# Set AI_PROVIDER=openrouter  or  AI_PROVIDER=openai

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

The Vite dev server proxies `/api` → `http://localhost:8000`. No CORS config needed in development.

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | If using OpenRouter | — | Your OpenRouter API key |
| `OPENAI_API_KEY` | If using OpenAI | — | Your OpenAI API key |
| `AI_PROVIDER` | No | `openrouter` | `openrouter` or `openai` |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Model name (OpenAI direct) |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | Comma-separated CORS origins for production |

---

## How a reply works — end to end

1. The assistant response arrives and `splitBlocks()` parses it into typed blocks: paragraphs, numbered steps, bullets, fenced code.
2. `AssistantBlock` renders each block with hover-triggered **Reply** and **Explain** buttons (always visible on touch).
3. Clicking **Reply** on block #3 of message #2 sets `replyContext = { text, messageId: 2, blockId: 3 }` in `App.jsx`. A chip appears above the input showing the quoted text.
4. The user types a follow-up and submits. `useChat.send()` is called with `mode: "reply"`, `selectedText`, and an `anchor: { messageId: 2, blockId: 3 }`.
5. The backend's `prompts.build_messages()` wraps `selectedText` in a markdown blockquote and appends the user's question, instructing the model to stay focused on that part.
6. The assistant response is appended to state with the same `anchor`. `ChatWindow` renders it inline under block #3 of message #2, not at the bottom.

**Explain** is the same flow with `mode: "explain"` — no user text required, one click triggers an inline expansion.

---

## UX details

**Optimistic UI with rollback.** The user message is appended to the conversation immediately. If the API call fails, the message is removed and the error is surfaced — the user can retry without losing their input.

**Inline threads, not a flat list.** Anchored replies render underneath the block that prompted them. The top-level conversation and inline sub-threads coexist in a single flat `messages[]` array; `ChatWindow` separates them at render time using `anchor.messageId`.

**Auto-scroll that respects inline activity.** When a reply is anchored to a block mid-conversation, auto-scroll is suppressed. The user stays focused on the block they're working with, not bounced to the bottom.

**Dark mode.** Implemented via `prefers-color-scheme` CSS media query. No JavaScript toggle required.

**Hover-to-reveal on desktop, always-visible on touch.** Block action buttons appear on hover via CSS. On touch devices (`@media (hover: none)`), they're always shown.

---

## Roadmap

| Feature | Complexity | Notes |
|---|---|---|
| Streaming responses | Medium | Replace `await complete()` with `stream=True` SSE push. Biggest perceived-speed win. |
| Free-text selection → Reply | Low | `mouseup` listener inside assistant messages; same backend code path. |
| Conversation persistence | Medium | Postgres: `conversations` + `messages` tables. Frontend hits `/api/conversations/:id`. |
| Auth | Medium | Clerk or Auth.js; add `user_id` to requests; per-user rate limits. |
| Rate limiting | Low | `slowapi` middleware keyed on IP/user. Add before any public deployment. |
| Multi-model selector | Low | UI dropdown; pass `model` through; whitelist on the server. |
| Keyboard shortcuts | Low | `r` = reply to last block, `e` = explain, `Esc` = clear chip. |
| Token-budgeted history | Medium | Keep last N turns verbatim; summarize older turns into a system note. |
| "Show what the model saw" | Low | Info icon per turn → modal showing the exact prompt. Great for debugging. |

---

## What's intentionally not here

**Streaming** — adds SSE/WebSocket plumbing and partial-render complexity that obscures the core interaction model. Add it once the block-reply UX is right.

**Database** — the backend is stateless by design. Conversation history lives in the browser. Postgres is a one-afternoon addition behind the same API once you need it.

**Auth** — out of scope for a single-user local tool. Add it the day before you have a second user.

**Markdown rendering library on day one** — `AssistantBlock` uses `react-markdown` + `remark-gfm` for rich rendering. The block splitter operates on raw text before rendering, so the two concerns stay separate.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

MIT — see [LICENSE](./LICENSE).
