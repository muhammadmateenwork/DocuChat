import { createAdminClient } from "@/lib/supabase/admin";

type Row = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  sources: { filename: string }[] | null;
  answered: boolean | null;
  created_at: string;
};

export type QA = {
  question: string;
  answer: string;
  answered: boolean;
  sources: { filename: string }[];
  askedAt: string;
};

export type QuestionLog = {
  questions: QA[];
  stats: {
    total: number;
    answeredCount: number;
    answeredRate: number;
    topDocuments: { filename: string; count: number }[];
  };
};

/** Pairs each user question with the assistant reply that followed it in the same chat session. */
export async function getQuestionLog(orgId: string): Promise<QuestionLog> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("chat_messages")
    .select("id, session_id, role, content, sources, answered, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true })
    .limit(1000);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Row[];
  const bySession = new Map<string, Row[]>();
  for (const row of rows) {
    const list = bySession.get(row.session_id) ?? [];
    list.push(row);
    bySession.set(row.session_id, list);
  }

  const qas: QA[] = [];
  for (const list of bySession.values()) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].role !== "user") continue;
      const reply = list.slice(i + 1).find((r) => r.role === "assistant");
      qas.push({
        question: list[i].content,
        answer: reply?.content ?? "",
        answered: reply?.answered ?? false,
        sources: reply?.sources ?? [],
        askedAt: list[i].created_at,
      });
    }
  }

  qas.sort((a, b) => (a.askedAt < b.askedAt ? 1 : -1));

  const total = qas.length;
  const answeredCount = qas.filter((q) => q.answered).length;

  const docCounts = new Map<string, number>();
  for (const qa of qas) {
    for (const s of qa.sources) {
      docCounts.set(s.filename, (docCounts.get(s.filename) ?? 0) + 1);
    }
  }
  const topDocuments = [...docCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([filename, count]) => ({ filename, count }));

  return {
    questions: qas.slice(0, 200),
    stats: {
      total,
      answeredCount,
      answeredRate: total > 0 ? answeredCount / total : 0,
      topDocuments,
    },
  };
}
