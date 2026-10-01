export type ChatCompletionMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function apiKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Missing OPENROUTER_API_KEY env var");
  return key;
}

/**
 * Model to try, then fallbacks to try in order if the request itself fails
 * (e.g. a free-tier model is temporarily unavailable or rate-limited).
 * Configurable via env so the free-model lineup can be updated without a
 * code change as OpenRouter's free offerings shift.
 */
function candidateModels(preferred?: string): string[] {
  const fallbacks = (process.env.OPENROUTER_FALLBACK_MODELS || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const models = [preferred || process.env.OPENROUTER_MODEL, ...fallbacks].filter(
    (m): m is string => Boolean(m)
  );

  return [...new Set(models)];
}

async function openCompletionStream(model: string, messages: ChatCompletionMessage[]) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenRouter request failed for ${model} (${res.status}): ${errText}`);
  }

  return res.body;
}

/** Streams text deltas from an OpenRouter chat completion (SSE, OpenAI-compatible). */
export async function* streamOpenRouterCompletion(
  messages: ChatCompletionMessage[],
  preferredModel?: string
): AsyncGenerator<string> {
  const models = candidateModels(preferredModel);
  if (models.length === 0) throw new Error("No OpenRouter model configured");

  let body: ReadableStream<Uint8Array> | null = null;
  let lastError: unknown;

  for (const model of models) {
    try {
      body = await openCompletionStream(model, messages);
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!body) {
    throw lastError instanceof Error ? lastError : new Error("All OpenRouter models failed");
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;

      try {
        const json = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
        };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // ignore malformed/keep-alive lines
      }
    }
  }
}
