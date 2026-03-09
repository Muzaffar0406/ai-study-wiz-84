import { useState } from "react";
import { AppLayout, PageHeader, PageContent, useLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { supabase } from "@/integrations/supabase/client";
import { Video, Loader2, LinkIcon, Sparkles, AlertCircle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createFlashcardsBatch } from "@/lib/flashcards";

interface SummaryResult {
  summary: string;
  title: string;
  description: string;
  url: string;
}

const VideoSummarizerContent = () => {
  const { isMobile } = useLayout();
  const { toast } = useToast();
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingFlashcards, setIsSavingFlashcards] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseFlashcards = (summary: string): Array<{ front: string; back: string }> => {
    const flashcards: Array<{ front: string; back: string }> = [];
    
    // Find the flashcards section
    const flashcardsMatch = summary.match(/## 🧩 Flashcards([\s\S]*?)(?=##|$)/);
    if (!flashcardsMatch) return flashcards;
    
    const flashcardsSection = flashcardsMatch[1];
    
    // Match Q: ... A: ... patterns
    const regex = /(?:\*\*)?Q(?:uestion)?(?:\*\*)?:\s*(.+?)(?:\n|\r\n)(?:\*\*)?A(?:nswer)?(?:\*\*)?:\s*(.+?)(?=(?:\n|\r\n)(?:\*\*)?Q|$)/gis;
    let match;
    
    while ((match = regex.exec(flashcardsSection)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim();
      if (question && answer) {
        flashcards.push({ front: question, back: answer });
      }
    }
    
    return flashcards;
  };

  const handleSaveFlashcards = async () => {
    if (!result || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save flashcards",
        variant: "destructive",
      });
      return;
    }

    setIsSavingFlashcards(true);

    try {
      const flashcards = parseFlashcards(result.summary);
      
      if (flashcards.length === 0) {
        toast({
          title: "No flashcards found",
          description: "Could not extract flashcards from the summary",
          variant: "destructive",
        });
        return;
      }

      const cardsToSave = flashcards.map(card => ({
        user_id: user.id,
        front: card.front,
        back: card.back,
        note_id: null,
      }));

      await createFlashcardsBatch(cardsToSave);

      toast({
        title: "Flashcards saved!",
        description: `Successfully saved ${flashcards.length} flashcard${flashcards.length === 1 ? '' : 's'} to your collection`,
      });
    } catch (err: any) {
      console.error("Error saving flashcards:", err);
      toast({
        title: "Failed to save flashcards",
        description: err?.message || "An error occurred while saving flashcards",
        variant: "destructive",
      });
    } finally {
      setIsSavingFlashcards(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    // Basic URL validation
    try {
      new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid video URL.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("summarize-video", {
        body: { url: trimmed.startsWith("http") ? trimmed : `https://${trimmed}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setResult(data);
    } catch (err: any) {
      const msg = err?.message || "Failed to summarize video";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Video className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-foreground`}>
              Video Summarizer
            </h1>
            <p className="text-sm text-muted-foreground">Paste a video URL to get an AI summary</p>
          </div>
        </div>
      </PageHeader>

      <PageContent>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* URL Input */}
          <Card className="p-6 border-border bg-card shadow-[var(--shadow-soft)]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <LinkIcon className="h-4 w-4 text-primary" />
                <span>Video URL</span>
              </div>
              <div className="flex gap-3">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 bg-background border-border"
                  disabled={isLoading}
                  required
                />
                <Button type="submit" disabled={isLoading || !url.trim()} className="gap-2 min-w-[120px]">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Summarizing</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Summarize
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports YouTube, Vimeo, and other video platform URLs
              </p>
            </form>
          </Card>

          {/* Error */}
          {error && (
            <Card className="p-4 border-destructive/50 bg-destructive/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Could not summarize</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <Card className="p-8 border-border bg-card shadow-[var(--shadow-soft)]">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Analyzing video content...</p>
                  <p className="text-xs text-muted-foreground mt-1">This may take a few seconds</p>
                </div>
              </div>
            </Card>
          )}

          {/* Result */}
          {result && !isLoading && (
            <Card className="border-border bg-card shadow-[var(--shadow-soft)] overflow-hidden animate-fade-in">
              <div className="p-4 bg-muted/30 border-b border-border">
                <h2 className="font-semibold text-foreground truncate">{result.title}</h2>
                {result.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
                )}
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  {result.url}
                </a>
              </div>
              <div className="p-6">
                <ChatMarkdown content={result.summary} />
              </div>
            </Card>
          )}

          {/* Empty State */}
          {!result && !isLoading && !error && (
            <div className="text-center py-12 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto">
                <Video className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">No summary yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Paste a video URL above to generate an AI-powered summary
                </p>
              </div>
            </div>
          )}
        </div>
      </PageContent>
    </>
  );
};

const VideoSummarizer = () => (
  <AppLayout>
    <VideoSummarizerContent />
  </AppLayout>
);

export default VideoSummarizer;
