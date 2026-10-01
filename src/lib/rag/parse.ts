import { getDocumentProxy, extractText } from "unpdf";
import mammoth from "mammoth";

export type ParsedUnit = {
  /** Page number for PDFs, synthetic section number for DOCX. */
  locatorValue: number;
  text: string;
};

export async function parsePdf(buffer: Buffer): Promise<ParsedUnit[]> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: false });

  return text
    .map((pageText, index) => ({ locatorValue: index + 1, text: pageText.trim() }))
    .filter((page) => page.text.length > 0);
}

const DOCX_SECTION_CHARS = 1800;

export async function parseDocx(buffer: Buffer): Promise<ParsedUnit[]> {
  const { value } = await mammoth.extractRawText({ buffer });
  const paragraphs = value
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const sections: ParsedUnit[] = [];
  let current = "";
  let sectionNumber = 1;

  for (const paragraph of paragraphs) {
    if (current.length > 0 && current.length + paragraph.length > DOCX_SECTION_CHARS) {
      sections.push({ locatorValue: sectionNumber++, text: current.trim() });
      current = "";
    }
    current += (current ? "\n\n" : "") + paragraph;
  }
  if (current.trim().length > 0) {
    sections.push({ locatorValue: sectionNumber, text: current.trim() });
  }

  return sections;
}
