export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  apiKey: string;
  model: string;
}

export class PollinationsError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PollinationsError";
    this.status = status;
  }
}

const SYSTEM_PROMPT =
  "You are a message board simulation engine. Follow instructions precisely and return only the requested JSON.";

function getEndpoint(): string {
  return import.meta.env.DEV
    ? "/api/pollinations/v1/chat/completions"
    : "https://gen.pollinations.ai/v1/chat/completions";
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions,
): Promise<string> {
  if (!options.apiKey.trim()) {
    throw new PollinationsError(
      "API key is required. Add it in Settings or set VITE_POLLINATIONS_API_KEY.",
      401,
    );
  }

  const response = await fetch(getEndpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      response_format: { type: "json_object" },
      temperature: 1,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ??
      payload?.message ??
      `Request failed with status ${response.status}`;
    throw new PollinationsError(message, response.status);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new PollinationsError("Empty response from LLM.", 500);
  }

  return content;
}
