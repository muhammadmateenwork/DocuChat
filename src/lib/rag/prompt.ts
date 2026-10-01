import type { RetrievedSource } from "./types";

export const NO_ANSWER_MESSAGE = "I don't know based on the uploaded documents.";

export type ReplyLanguage = "auto" | "en" | "ar" | "ur-roman";

const LANGUAGE_INSTRUCTIONS: Record<ReplyLanguage, string> = {
  auto: "Always reply in the same language the user asked in (English, Arabic, or Roman Urdu), unless they explicitly ask you to switch languages.",
  en: "Always reply in English, regardless of the language of the question.",
  ar: "Always reply in Arabic, regardless of the language of the question.",
  "ur-roman":
    "Always reply in Roman Urdu (Urdu written in Latin script, e.g. 'aap kaisay hain'), regardless of the language of the question.",
};

export function buildSystemPrompt(
  sources: RetrievedSource[],
  replyLanguage: ReplyLanguage = "auto"
) {
  const context = sources
    .map(
      (s, i) =>
        `[Source ${i + 1}: ${s.filename}, ${s.locatorType === "page" ? "page" : "section"} ${s.locatorValue}]\n${s.content}`
    )
    .join("\n\n---\n\n");

  return `You are a document assistant. Answer the user's question using ONLY the context excerpts below, which come from documents they uploaded.

Rules:
- If the answer is not contained in the context, respond with exactly: "${NO_ANSWER_MESSAGE}" Do not guess or use outside knowledge.
- ${LANGUAGE_INSTRUCTIONS[replyLanguage]}
- When you use a fact from a source, refer to it naturally (e.g. "According to <document name>, ..."). The exact citations are already shown to the user separately as clickable sources, so you do not need bracketed reference numbers.
- Be concise and direct.

Context:
${context}`;
}
