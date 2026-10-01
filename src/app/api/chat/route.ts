import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthError,
  enforceDemoRateLimit,
  getCurrentUser,
  getSessionOrgId,
  requireOrgMembership,
} from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";
import { retrieveSources, hasRelevantContext } from "@/lib/rag/retrieve";
import { buildSystemPrompt, NO_ANSWER_MESSAGE, type ReplyLanguage } from "@/lib/rag/prompt";
import { streamOpenRouterCompletion, type ChatCompletionMessage } from "@/lib/rag/openrouter";
import { getClientIp, hashIp } from "@/lib/utils";

export const maxDuration = 60;

const requestSchema = z.object({
  question: z.string().min(1).max(2000),
  sessionId: z.string().uuid(),
  documentIds: z.array(z.string().uuid()).optional(),
  orgId: z.string().uuid().optional(),
  demo: z.boolean().optional(),
  replyLanguage: z.enum(["auto", "en", "ar", "ur-roman"]).optional(),
});

export async function POST(request: NextRequest) {
  let orgId: string;

  try {
    const body = requestSchema.parse(await request.json());

    if (body.demo) {
      const demoOrgId = process.env.DEMO_ORG_ID;
      if (!demoOrgId) throw new Error("Demo workspace is not configured");
      await enforceDemoRateLimit(hashIp(getClientIp(request)));
      orgId = demoOrgId;
    } else {
      if (!body.orgId) throw new AuthError(401, "Missing orgId");

      const user = await getCurrentUser();
      if (user) {
        // Real signed-in user: normal membership check, no rate limit.
        await requireOrgMembership(body.orgId);
        orgId = body.orgId;
      } else {
        // Anonymous /demo visitor chatting against their own uploaded
        // documents: same abuse protection as the shared curated demo.
        const sessionOrgId = await getSessionOrgId();
        if (!sessionOrgId || sessionOrgId !== body.orgId) {
          throw new AuthError(401, "Not authorized for this organization");
        }
        await enforceDemoRateLimit(hashIp(getClientIp(request)));
        orgId = body.orgId;
      }
    }

    const admin = createAdminClient();
    const question = body.question.trim();

    await admin.from("chat_messages").insert({
      org_id: orgId,
      session_id: body.sessionId,
      role: "user",
      content: question,
    });

    const sources = await retrieveSources(orgId, question, body.documentIds);

    if (!hasRelevantContext(sources)) {
      await admin.from("chat_messages").insert({
        org_id: orgId,
        session_id: body.sessionId,
        role: "assistant",
        content: NO_ANSWER_MESSAGE,
        sources: [],
        answered: false,
      });

      return NextResponse.json({ answer: NO_ANSWER_MESSAGE, sources: [], answered: false });
    }

    const messages: ChatCompletionMessage[] = [
      {
        role: "system",
        content: buildSystemPrompt(sources, (body.replyLanguage as ReplyLanguage) ?? "auto"),
      },
      { role: "user", content: question },
    ];

    const encoder = new TextEncoder();
    let fullText = "";

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(
          encoder.encode(`event: sources\ndata: ${JSON.stringify(sources)}\n\n`)
        );

        try {
          for await (const delta of streamOpenRouterCompletion(messages)) {
            fullText += delta;
            controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify(delta)}\n\n`));
          }
          controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`)
          );
        } finally {
          controller.close();
          await admin.from("chat_messages").insert({
            org_id: orgId,
            session_id: body.sessionId,
            role: "assistant",
            content: fullText || NO_ANSWER_MESSAGE,
            sources,
            answered: fullText.length > 0,
          });
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
