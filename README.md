# Noko Board

A local message board simulator that generates threaded, collapsible posts using the [Pollinations API](https://gen.pollinations.ai/docs).

## Setup

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### API Key

1. Get an API key from [enter.pollinations.ai](https://enter.pollinations.ai).
2. Paste it into the **API Key** field in the sidebar.

Optionally, copy `.env.example` to `.env` and set `VITE_POLLINATIONS_API_KEY` as a dev default. Keys are stored in browser localStorage at runtime and are not committed to git.

## Usage

1. **Global Context** — Paste a story, fandom premise, or scenario. All simulated posts will relate to it.
2. **Instructions** — Edit pre-context and post-context instructions to steer tone and output format.
3. **Initialize Board** — When the board is empty, generate an initial set of topics.
4. **Generate** — Once topics exist, add more topics and replies in bulk.
5. **Human Post** — Post topics or replies under any username you choose.
6. **Simulate Reply** — On any topic or reply, request a single LLM reply using only that node plus global context.
7. **Regenerate** — On any topic or reply, request an alternative version. Use ◀ ▶ to swipe between versions.
8. **Delete** — Remove any topic or reply (nested replies are deleted with their parent).
9. **Export / Import** — Back up or restore board state as JSON.

## Build

```bash
npm run build
npm run preview
```

## Notes

- Board state auto-saves to localStorage.
- In development, API calls are proxied through Vite to avoid CORS issues.
- This app is for local simulation only; it is not hosted as a public message board.
