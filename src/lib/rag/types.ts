export type RetrievedSource = {
  chunkId: string;
  documentId: string;
  filename: string;
  locatorType: "page" | "section";
  locatorValue: number;
  content: string;
  similarity: number;
};
