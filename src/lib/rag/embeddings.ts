const MODEL = "gemini-embedding-001";
const OUTPUT_DIMENSIONALITY = 768;
const BATCH_SIZE = 50;

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY env var");
  return key;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function batchEmbed(texts: string[], taskType: EmbeddingTaskType): Promise<number[][]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents?key=${apiKey()}`;

  const body = {
    requests: texts.map((text) => ({
      model: `models/${MODEL}`,
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: OUTPUT_DIMENSIONALITY,
    })),
  };

  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const json = (await res.json()) as { embeddings: { values: number[] }[] };
      return json.embeddings.map((e) => e.values);
    }

    if ((res.status === 429 || res.status >= 500) && attempt < maxAttempts) {
      await sleep(2 ** attempt * 500);
      continue;
    }

    const errText = await res.text();
    throw new Error(`Gemini embeddings request failed (${res.status}): ${errText}`);
  }

  throw new Error("Unreachable");
}

/** Embeds a list of texts, chunked into API-friendly batches. Order is preserved. */
export async function embedTexts(
  texts: string[],
  taskType: EmbeddingTaskType
): Promise<number[][]> {
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await batchEmbed(batch, taskType);
    results.push(...embeddings);
  }
  return results;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text], "RETRIEVAL_QUERY");
  return embedding;
}
