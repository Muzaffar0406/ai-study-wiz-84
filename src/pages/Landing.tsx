import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles, Upload, MessageSquare, FileText, Globe, Youtube, CheckCircle2, ArrowRight } from "lucide-react";

const featureCards = [
  {
    icon: Upload,
    title: "Upload trusted sources",
    description: "Add PDFs, websites, YouTube videos, and text notes in one workspace.",
  },
  {
    icon: MessageSquare,
    title: "Ask grounded questions",
    description: "Get answers with source references instead of generic AI output.",
  },
  {
    icon: Sparkles,
    title: "Generate study material",
    description: "Create concise summaries, key ideas, and revision-ready notes.",
  },
];

const sourceTypes = [
  { icon: FileText, label: "PDF" },
  { icon: Globe, label: "Website" },
  { icon: Youtube, label: "YouTube" },
  { icon: FileText, label: "Text Notes" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold">StudyLM</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/auth")}>Sign in</Button>
            <Button onClick={() => navigate("/auth?mode=signup")} className="rounded-full px-5">
              Try Now
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.14),transparent_55%),radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.14),transparent_45%)]" />

          <div className="relative mx-auto max-w-5xl text-center">
            <Badge className="mb-5 bg-primary/10 text-primary hover:bg-primary/10">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI research workspace
            </Badge>

            <h1 className="text-balance text-4xl font-bold leading-tight md:text-6xl">
              Understand your notes <span className="text-primary">faster</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              A clean, minimal workspace for source-based AI chat, notebook organization, and summary generation.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="rounded-full px-7" onClick={() => navigate("/auth?mode=signup")}>
                Try Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-7" onClick={() => navigate("/auth")}>
                Go to sign in
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {sourceTypes.map((item) => (
                <div key={item.label} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
            {featureCards.map((item) => (
              <Card key={item.title} className="rounded-2xl border-border/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="mb-2 text-base font-semibold">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="mx-auto max-w-6xl rounded-3xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Ready for chat, sources, notebooks, and summaries
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-2xl border-border/70 p-5">
                <h3 className="mb-2 font-semibold">Notebook panel</h3>
                <p className="text-sm text-muted-foreground">Manage notebook cards with title, source count, and last updated metadata.</p>
              </Card>
              <Card className="rounded-2xl border-border/70 p-5">
                <h3 className="mb-2 font-semibold">AI summary panel</h3>
                <p className="text-sm text-muted-foreground">Get bullet insights and extracted key ideas from uploaded material.</p>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
