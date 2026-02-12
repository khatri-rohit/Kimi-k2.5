# Kimi K2.5 Backend Endpoint (Node + TypeScript)

This project exposes a backend endpoint that sends `systemPrompt` and `userPrompt` to NVIDIA NIM Kimi K2.5:

- NVIDIA endpoint: `POST https://integrate.api.nvidia.com/v1/chat/completions`
- Model: `moonshotai/kimi-k2.5`

## Setup

1. Copy `.env.example` to `.env`
2. Set your key in `.env`:

```env
NVIDIA_API_KEY=your_nvidia_api_key
PORT=3000
NVIDIA_MODEL=moonshotai/kimi-k2.5
```

## Run

```bash
npm install
npm run dev
```

Server starts at `http://localhost:3000`.

## Endpoint

### `POST /api/kimi/chat`

Request body:

```json
{
  "systemPrompt": "You are a helpful assistant.",
  "userPrompt": "Explain event loop in Node.js",
  "temperature": 0.7,
  "top_p": 1,
  "max_tokens": 1024,
  "stream": false,
  "chat_template_kwargs": {
    "thinking": true
  }
}
```

### Auth header behavior

The endpoint uses token in this order:

1. Incoming request header: `Authorization: Bearer <token>`
2. Fallback: `.env` value `NVIDIA_API_KEY`

## Example cURL

```bash
curl --request POST \
  --url http://localhost:3000/api/kimi/chat \
  --header 'content-type: application/json' \
  --header 'authorization: Bearer YOUR_NVAPI_KEY' \
  --data '{
    "systemPrompt": "You are a concise assistant.",
    "userPrompt": "Write 5 bullet points about TypeScript benefits.",
    "temperature": 0.7,
    "stream": false
  }'
```

## Health check

- `GET /health` -> `{ "ok": true }`

# Kimi-k2.5
