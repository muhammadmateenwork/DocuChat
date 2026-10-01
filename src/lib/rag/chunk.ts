import { encode, decode } from "gpt-tokenizer";
import type { ParsedUnit } from "./parse";

export type Chunk = {
  locatorType: "page" | "section";
  locatorValue: number;
  content: string;
};

const CHUNK_TOKENS = 700;
const OVERLAP_TOKENS = 100;

/**
 * Splits each page/section into token-bounded chunks. Deliberately never
 * merges text across two locators, even short ones — every chunk maps to
 * exactly one page/section number, so a citation is always exactly right.
 */
export function chunkUnits(units: ParsedUnit[], locatorType: "page" | "section"): Chunk[] {
  const chunks: Chunk[] = [];

  for (const unit of units) {
    const tokens = encode(unit.text);

    if (tokens.length <= CHUNK_TOKENS) {
      chunks.push({ locatorType, locatorValue: unit.locatorValue, content: unit.text });
      continue;
    }

    let start = 0;
    while (start < tokens.length) {
      const end = Math.min(start + CHUNK_TOKENS, tokens.length);
      chunks.push({
        locatorType,
        locatorValue: unit.locatorValue,
        content: decode(tokens.slice(start, end)),
      });
      if (end === tokens.length) break;
      start = end - OVERLAP_TOKENS;
    }
  }

  return chunks;
}
