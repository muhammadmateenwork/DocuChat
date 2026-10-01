import { MessageSquareText, CheckCircle2, FileText, Inbox } from "lucide-react";
import { requireCurrentUserOrg } from "@/lib/authz";
import { getQuestionLog } from "@/lib/admin";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function AdminPage() {
  const { orgId } = await requireCurrentUserOrg();
  const { questions, stats } = await getQuestionLog(orgId);

  return (
    <div>
      <PageHeader
        title="Admin"
        subtitle="Everything people have asked, and whether it was answered from your documents."
      />

      <div className="p-6 sm:p-8">
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="flex items-center gap-3.5 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <MessageSquareText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Questions asked</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3.5 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold">{Math.round(stats.answeredRate * 100)}%</p>
              <p className="text-xs text-muted-foreground">Answered from documents</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3.5 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {stats.topDocuments[0]?.filename ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">Most referenced document</p>
            </div>
          </Card>
        </div>

        {questions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p className="text-sm">No questions asked yet.</p>
          </div>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Question</th>
                  <th className="px-4 py-2.5 font-medium">Answer</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {questions.map((qa, i) => (
                  <tr key={i} className="align-top">
                    <td className="max-w-xs px-4 py-3">{qa.question}</td>
                    <td className="max-w-sm px-4 py-3 text-muted-foreground">
                      {qa.answer.length > 140 ? `${qa.answer.slice(0, 140)}…` : qa.answer}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={qa.answered ? "success" : "default"}>
                        {qa.answered ? "Answered" : "I don't know"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">
                      {new Date(qa.askedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
