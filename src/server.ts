import dotenv from 'dotenv';
import express, { Request, Response } from 'express';

dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

const nvidiaApiUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
const defaultModel = process.env.NVIDIA_MODEL ?? 'moonshotai/kimi-k2.5';

type ChatRequestBody = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
};

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

app.post('/api/kimi/chat', async (req: Request, res: Response) => {
  const body = req.body as Partial<ChatRequestBody>;
  console.log(body)
  const { systemPrompt, userPrompt, temperature = 1, top_p = 1, max_tokens = 16384, stream = false } = body;

  if (!systemPrompt || !userPrompt) {
    return res.status(400).json({
      error: 'Both systemPrompt and userPrompt are required.'
    });
  }

  if (stream) {
    return res.status(400).json({
      error: 'Streaming is not enabled in this endpoint. Use stream=false.'
    });
  }

  const incomingAuthHeader = req.header('authorization');
  const envApiKey = process.env.NVIDIA_API_KEY;
  const bearerToken = incomingAuthHeader?.startsWith('Bearer ')
    ? incomingAuthHeader.slice('Bearer '.length).trim()
    : envApiKey;

  if (!bearerToken) {
    return res.status(500).json({
      error: 'Missing NVIDIA API key. Set NVIDIA_API_KEY or pass Authorization: Bearer <token> header.'
    });
  }

  try {
    const upstreamResponse = await fetch(nvidiaApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        top_p,
        max_tokens,
        stream,
         chat_template_kwargs: {
            thinking:true
        },
      })
    });

    const responseText = await upstreamResponse.text();
    const responseData = safeJsonParse(responseText);

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        error: 'NVIDIA API request failed',
        details: responseData ?? responseText
      });
    }
    console.log((responseData as any)?.choices?.[0]?.message?.content ?? responseText)

    return res.status(200).json({
      provider: 'nvidia',
      model: defaultModel,
      result: responseData ?? responseText,
      simplfiedResult: (responseData as any)?.choices?.[0]?.message?.content ?? responseText
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Unexpected error while calling NVIDIA API',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

function safeJsonParse(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Kimi backend listening on http://localhost:${port}`);
});
