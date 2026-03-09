import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { AIChatBot } from "@/components/AIChatBot";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchProfile } from "@/lib/database";
import {
  fetchFlashcards,
  fetchDueFlashcards,
  createFlashcard,
  deleteFlashcard,
  updateFlashcardReview,
  type Flashcard,
  type ReviewQuality,
} from "@/lib/flashcards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Layers, Plus, Loader2, Trash2, Play, RotateCcw, ChevronLeft,
  CheckCircle2, XCircle, Brain, Zap, Clock,
} from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

type ViewMode = "deck" | "review";

const QUALITY_BUTTONS: { quality: ReviewQuality; label: string; description: string; color: string }[] = [
  { quality: 0, label: "Again", description: "Completely forgot", color: "bg-destructive hover:bg-destructive/90 text-destructive-foreground" },
  { quality: 3, label: "Hard", description: "Recalled with difficulty", color: "bg-accent hover:bg-accent/90 text-accent-foreground" },
  { quality: 4, label: "Good", description: "Recalled correctly", color: "bg-primary hover:bg-primary/90 text-primary-foreground" },
  { quality: 5, label: "Easy", description: "Effortless recall", color: "bg-primary hover:bg-primary/80 text-primary-foreground" },
];

const Flashcards = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { collapsed } = useSidebarState();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("deck");

  // Review state
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  // Add card dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [saving, setSaving] = useState(false);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [cards, due] = await Promise.all([
        fetchFlashcards(user.id),
        fetchDueFlashcards(user.id),
      ]);
      setAllCards(cards);
      setDueCards(due);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then(setProfile).catch(console.error);
    loadData();
  }, [user, loadData]);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim() || !user) return;
    setSaving(true);
    try {
      await createFlashcard({ user_id: user.id, front: newFront.trim(), back: newBack.trim() });
      toast({ title: "Flashcard created ✅" });
      setNewFront("");
      setNewBack("");
      setAddOpen(false);
      loadData();
    } catch {
      toast({ title: "Error", description: "Could not create flashcard.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    setAllCards((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteFlashcard(id);
      loadData();
    } catch {
      loadData();
      toast({ title: "Error", description: "Could not delete flashcard.", variant: "destructive" });
    }
  };

  const startReview = () => {
    if (dueCards.length === 0) {
      toast({ title: "No cards due!", description: "All caught up. Come back later." });
      return;
    }
    setReviewQueue([...dueCards]);
    setCurrentIndex(0);
    setFlipped(false);
    setReviewedCount(0);
    setViewMode("review");
  };

  const handleReview = async (quality: ReviewQuality) => {
    const card = reviewQueue[currentIndex];
    if (!card) return;

    try {
      await updateFlashcardReview(card.id, quality, card);
    } catch {
      console.error("Failed to update review");
    }

    setReviewedCount((prev) => prev + 1);

    if (currentIndex < reviewQueue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFlipped(false);
    } else {
      // Review complete
      toast({ title: "Review complete! 🎉", description: `Reviewed ${reviewedCount + 1} cards` });
      setViewMode("deck");
      loadData();
    }
  };

  const currentCard = reviewQueue[currentIndex];

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar displayName={displayName} avatarUrl={avatarUrl} onAIClick={() => setChatOpen(true)} />

      <main className={`min-h-screen transition-all duration-300 ${isMobile ? "" : collapsed ? "ml-[68px]" : "ml-[240px]"}`}>
        <header className={`sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 py-4 ${isMobile ? "px-4 pt-14" : "px-8"}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-foreground flex items-center gap-2`}>
                {viewMode === "review" ? (
                  <>
                    <button onClick={() => { setViewMode("deck"); loadData(); }} className="hover:text-primary transition-colors">
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <Brain className="h-6 w-6 text-primary" />
                    Study Mode
                  </>
                ) : (
                  <>
                    <Layers className="h-6 w-6 text-primary" />
                    Flashcards
                  </>
                )}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {viewMode === "review"
                  ? `Card ${currentIndex + 1} of ${reviewQueue.length}`
                  : `${allCards.length} cards · ${dueCards.length} due for review`}
              </p>
            </div>
            {viewMode === "deck" && (
              <div className="flex items-center gap-2">
                {dueCards.length > 0 && (
                  <Button onClick={startReview} className="gap-2 bg-primary">
                    <Play className="h-4 w-4" />
                    Review ({dueCards.length})
                  </Button>
                )}
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      {isMobile ? "" : "Add Card"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Flashcard</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCard} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Front (Question)</Label>
                        <Textarea
                          placeholder="What is photosynthesis?"
                          value={newFront}
                          onChange={(e) => setNewFront(e.target.value)}
                          maxLength={1000}
                          rows={3}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Back (Answer)</Label>
                        <Textarea
                          placeholder="The process by which plants convert light energy into chemical energy..."
                          value={newBack}
                          onChange={(e) => setNewBack(e.target.value)}
                          maxLength={2000}
                          rows={3}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={!newFront.trim() || !newBack.trim() || saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Create Card
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </header>

        <div className={`${isMobile ? "p-4" : "p-8"} space-y-6`}>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : viewMode === "review" && currentCard ? (
            /* ===== REVIEW MODE ===== */
            <div className="max-w-xl mx-auto space-y-6">
              {/* Progress bar */}
              <div className="bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500 rounded-full"
                  style={{ width: `${((currentIndex + 1) / reviewQueue.length) * 100}%` }}
                />
              </div>

              {/* Card */}
              <div
                onClick={() => setFlipped(!flipped)}
                className="cursor-pointer select-none"
              >
                <div className="bg-card rounded-2xl shadow-[var(--shadow-medium)] border border-border/30 p-8 sm:p-12 min-h-[300px] flex flex-col items-center justify-center text-center transition-all duration-300">
                  <div className="mb-4">
                    <Badge variant="secondary" className="text-xs">
                      {flipped ? "Answer" : "Question"}
                    </Badge>
                  </div>
                  <p className={`${isMobile ? "text-lg" : "text-xl"} font-semibold text-foreground leading-relaxed`}>
                    {flipped ? currentCard.back : currentCard.front}
                  </p>
                  {!flipped && (
                    <p className="text-xs text-muted-foreground mt-6">
                      Tap to reveal answer
                    </p>
                  )}
                </div>
              </div>

              {/* Rating buttons */}
              {flipped && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground text-center uppercase tracking-wider">
                    How well did you know this?
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {QUALITY_BUTTONS.map((btn) => (
                      <button
                        key={btn.quality}
                        onClick={() => handleReview(btn.quality)}
                        className={`${btn.color} rounded-xl px-3 py-3 text-center transition-all hover:scale-[1.02] active:scale-[0.98]`}
                      >
                        <span className="text-sm font-bold block">{btn.label}</span>
                        <span className="text-[10px] opacity-80 block mt-0.5">{btn.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : viewMode === "deck" ? (
            /* ===== DECK MODE ===== */
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] border border-border/30 text-center">
                  <Layers className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{allCards.length}</p>
                  <p className="text-xs text-muted-foreground">Total Cards</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] border border-border/30 text-center">
                  <Clock className="h-5 w-5 text-accent mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{dueCards.length}</p>
                  <p className="text-xs text-muted-foreground">Due Now</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] border border-border/30 text-center">
                  <Zap className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">
                    {allCards.length > 0
                      ? Math.round((allCards.filter(c => c.repetitions > 0).length / allCards.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Mastered</p>
                </div>
              </div>

              {/* Due cards CTA */}
              {dueCards.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">
                      {dueCards.length} card{dueCards.length > 1 ? "s" : ""} ready for review
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Keep your streak going with spaced repetition
                    </p>
                  </div>
                  <Button onClick={startReview} className="gap-2">
                    <Play className="h-4 w-4" />
                    Start
                  </Button>
                </div>
              )}

              {/* Cards list */}
              {allCards.length === 0 ? (
                <div className="bg-card rounded-2xl p-10 text-center shadow-[var(--shadow-soft)]">
                  <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium text-foreground">No flashcards yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create cards manually or generate them from your notes
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    All Cards ({allCards.length})
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {allCards.map((card) => {
                      const isDue = new Date(card.next_review) <= new Date();
                      return (
                        <div
                          key={card.id}
                          className="bg-card rounded-xl p-4 shadow-[var(--shadow-soft)] border border-border/30 group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge
                              variant={isDue ? "default" : "secondary"}
                              className="text-[10px] h-5"
                            >
                              {isDue ? "Due" : `Next: ${format(new Date(card.next_review), "MMM d")}`}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteCard(card.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <p className="text-sm font-semibold text-foreground line-clamp-2">{card.front}</p>
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{card.back}</p>
                          <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                            <span>Reps: {card.repetitions}</span>
                            <span>·</span>
                            <span>EF: {card.ease_factor}</span>
                            <span>·</span>
                            <span>Int: {card.interval_days}d</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </main>

      <AIChatBot open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default Flashcards;
