import Link from "next/link";
import { Languages, Ban, ArrowRight, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { HeroPreview } from "@/components/HeroPreview";
import { Reveal } from "@/components/Reveal";
import {
  MiniUploadSnippet,
  MiniChatSnippet,
  MiniCitationSnippet,
  MiniSourcedAnswerSnippet,
  MiniAdminSnippet,
  MiniMultilingualSnippet,
} from "@/components/marketing/Snippets";
import { cn } from "@/lib/utils";

const DIFFERENTIATORS = [
  { icon: Languages, label: "3 languages, 1 assistant" },
  { icon: CircleCheck, label: "Every answer cited" },
  { icon: Ban, label: "Zero tolerance for guessing" },
];

const WORKFLOW = [
  {
    eyebrow: "Step 1",
    title: "Drop in your documents",
    body: "PDFs or Word files, one or a hundred. DocuChat parses, chunks, and indexes them in seconds — no formatting cleanup needed.",
    visual: <MiniUploadSnippet />,
  },
  {
    eyebrow: "Step 2",
    title: "Ask like you would a colleague",
    body: "Plain language, in English, Arabic, or Roman Urdu. No search syntax, no keyword guessing, no hoping you typed it the way the document did.",
    visual: <MiniChatSnippet />,
  },
  {
    eyebrow: "Step 3",
    title: "Get the receipts",
    body: "Every answer points back to the exact file and page it came from. Click it, see the exact text — no re-reading the whole document to double-check.",
    visual: <MiniCitationSnippet />,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="px-2 py-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Button href="/signup" variant="accent" size="sm" className="h-9">
              Sign up free
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-hero-glow bg-grain relative overflow-hidden px-6 pt-20 pb-24">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-14 lg:flex-row lg:items-center lg:gap-16">
            <div className="max-w-xl text-center lg:text-left">
              <span className="animate-fade-in border-accent/20 bg-accent-soft text-accent mb-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm">
                Now with Arabic &amp; Roman Urdu support
              </span>
              <h1 className="animate-fade-up text-5xl leading-[1.05] font-semibold tracking-tighter text-balance sm:text-6xl xl:text-7xl">
                Chat with your documents.
                <br />
                <span className="text-accent">Get answers, not guesses.</span>
              </h1>
              <p className="animate-fade-up mt-6 text-lg text-muted-foreground text-balance">
                Upload PDFs and Word documents, ask questions in the language you think in, and
                get answers with the exact source — file, page, and text — every single time.
              </p>
              <div className="animate-fade-up mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button href="/demo" size="lg" variant="accent" className="w-full sm:w-auto">
                  Try the live demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/signup" size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign up free
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                No credit card required · Free workspace to start
              </p>

              <div className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-border/60 pt-6 lg:justify-start">
                {DIFFERENTIATORS.map((d) => (
                  <div key={d.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <d.icon className="h-4 w-4 text-accent" />
                    {d.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-fade-up flex w-full justify-center lg:justify-end">
              <HeroPreview />
            </div>
          </div>
        </section>

        <section className="border-t border-border px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <Reveal className="mb-16 max-w-lg">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                From raw files to trustworthy answers
              </h2>
              <p className="mt-3 text-muted-foreground">
                No configuration, no prompt engineering. Just the three steps that matter.
              </p>
            </Reveal>

            <div className="space-y-20">
              {WORKFLOW.map((step, i) => (
                <Reveal
                  key={step.title}
                  className={cn(
                    "flex flex-col items-center gap-10 md:flex-row md:gap-16",
                    i % 2 === 1 && "md:flex-row-reverse"
                  )}
                >
                  <div className="flex-1 text-center md:text-left">
                    <p className="mb-2 text-sm font-semibold text-accent">{step.eyebrow}</p>
                    <h3 className="mb-3 text-2xl font-semibold tracking-tight">{step.title}</h3>
                    <p className="text-muted-foreground">{step.body}</p>
                  </div>
                  <div className="w-full flex-1">
                    <div className="rounded-xl border border-border bg-card p-5 shadow-xl shadow-black/20">
                      {step.visual}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mb-14 max-w-xl">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Built to be trusted, not just tried once
              </h2>
              <p className="mt-3 text-muted-foreground">
                The details that matter once this becomes part of how a team actually works.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Reveal className="lg:col-span-2">
                <Card className="flex h-full flex-col justify-between gap-6 p-6">
                  <div>
                    <h3 className="mb-1.5 text-lg font-medium">Multilingual, natively</h3>
                    <p className="text-sm text-muted-foreground">
                      English, Arabic, and Roman Urdu in the same conversation. Ask in whichever
                      one is natural, or lock the reply language from the chat controls.
                    </p>
                  </div>
                  <MiniMultilingualSnippet />
                </Card>
              </Reveal>

              <Reveal delay={80} className="lg:col-span-2">
                <Card className="flex h-full flex-col justify-between gap-6 p-6">
                  <div>
                    <h3 className="mb-1.5 text-lg font-medium">Every answer comes with receipts</h3>
                    <p className="text-sm text-muted-foreground">
                      Not a vague &ldquo;based on your documents&rdquo; — the exact file and page,
                      every time, one click from the exact text.
                    </p>
                  </div>
                  <MiniSourcedAnswerSnippet />
                </Card>
              </Reveal>

              <Reveal delay={0}>
                <Card className="flex h-full flex-col gap-3 p-6">
                  <h3 className="text-lg font-medium">Never fabricates</h3>
                  <p className="text-sm text-muted-foreground">
                    &ldquo;I don&apos;t know based on the uploaded documents.&rdquo; The exact
                    reply when the answer isn&apos;t there — no hedging, no guessing.
                  </p>
                </Card>
              </Reveal>

              <Reveal delay={80}>
                <Card className="flex h-full flex-col gap-3 p-6">
                  <h3 className="mb-1 text-lg font-medium">Full visibility</h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Every question logged, answered or not.
                  </p>
                  <MiniAdminSnippet />
                </Card>
              </Reveal>

              <Reveal delay={160}>
                <Card className="flex h-full flex-col gap-3 p-6">
                  <h3 className="text-lg font-medium">Private by default</h3>
                  <p className="text-sm text-muted-foreground">
                    Every workspace is isolated. Documents, embeddings, and chat history never
                    cross over.
                  </p>
                </Card>
              </Reveal>

              <Reveal delay={240}>
                <Card className="flex h-full flex-col gap-3 p-6">
                  <h3 className="text-lg font-medium">PDF &amp; DOCX, any size</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload one file or a hundred. No formatting cleanup, no manual tagging.
                  </p>
                </Card>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="border-t border-border px-6 py-20">
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Try it on your own documents
            </h2>
            <p className="max-w-md text-muted-foreground">
              Set up a free workspace in under a minute, or try the public demo first — no
              account needed.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/signup" size="lg" variant="accent">
                Sign up free
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/demo" size="lg" variant="outline">
                Try the demo
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo className="text-sm" />
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} DocuChat. Chat with your documents.
          </p>
        </div>
      </footer>
    </div>
  );
}
