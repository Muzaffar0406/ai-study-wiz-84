import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { AIChatBot } from "@/components/AIChatBot";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfile } from "@/lib/database";
import ReactMarkdown from "react-markdown";
import {
  Plus, FileText, Sparkles, Trash2, Upload, Loader2, BookOpen, ChevronDown, ChevronUp, X
} from "lucide-react";

interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  summary: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  updated_at: string;
}

const Notes = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  // Add note form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);

  // Summarizing state
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

  // Expanded notes
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // View summary
  const [viewSummaryId, setViewSummaryId] = useState<string | null>(null);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then(setProfile).catch(console.error);
    loadNotes();
  }, [user]);

  const loadNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load notes:", error);
      toast({ title: "Error", description: "Failed to load notes.", variant: "destructive" });
    }
    setNotes((data as Note[]) ?? []);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Only text-like files
    const allowedTypes = [
      "text/plain", "text/markdown", "application/pdf",
      "text/csv", "application/json",
    ];
    const allowedExts = [".txt", ".md", ".csv", ".json", ".tex", ".log"];
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    if (!allowedTypes.includes(f.type) && !allowedExts.includes(ext)) {
      toast({ title: "Unsupported file", description: "Please upload a text-based file (.txt, .md, .csv, etc.)", variant: "destructive" });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setFile(f);
    // Read file content
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        setContent(text);
      }
    };
    reader.readAsText(f);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user) return;
    setSaving(true);

    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (file) {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("notes").upload(filePath, file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("notes").getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }

      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        file_url: fileUrl,
        file_name: fileName,
      });
      if (error) throw error;

      toast({ title: "Note saved ✅", description: title.trim() });
      setTitle("");
      setContent("");
      setFile(null);
      setAddOpen(false);
      loadNotes();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not save note.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSummarize = async (note: Note) => {
    setSummarizingId(note.id);
    try {
      const { data, error } = await supabase.functions.invoke("summarize-note", {
        body: { content: note.content, title: note.title },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "AI Error", description: data.error, variant: "destructive" });
        return;
      }
      // Save summary to DB
      await supabase.from("notes").update({ summary: data.summary, updated_at: new Date().toISOString() }).eq("id", note.id);
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, summary: data.summary } : n));
      setViewSummaryId(note.id);
      toast({ title: "Summary generated! ✨" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to summarize note.", variant: "destructive" });
    } finally {
      setSummarizingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      loadNotes();
      toast({ title: "Error", description: "Could not delete note.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar displayName={displayName} avatarUrl={avatarUrl} onAIClick={() => setChatOpen(true)} />

      <main className={`min-h-screen ${isMobile ? "" : "ml-[240px]"}`}>
        <header className={`sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 py-4 ${isMobile ? "px-4 pt-14" : "px-8"}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-foreground flex items-center gap-2`}>
                <BookOpen className="h-6 w-6 text-primary" />
                Notes & Summarizer
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Upload or write notes, then let AI summarize them for you
              </p>
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary">
                  <Plus className="h-4 w-4" />
                  {isMobile ? "Add" : "Add Note"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Note</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddNote} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="note-title">Title</Label>
                    <Input
                      id="note-title"
                      placeholder="e.g. Biology Chapter 3 Notes"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={200}
                      required
                    />
                  </div>

                  {/* File upload */}
                  <div className="space-y-2">
                    <Label>Upload a file (optional)</Label>
                    <div className="relative">
                      <label className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          {file ? (
                            <span className="text-sm font-medium text-foreground truncate">{file.name}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Click to upload .txt, .md, .csv, etc.</span>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".txt,.md,.csv,.json,.tex,.log"
                          onChange={handleFileChange}
                        />
                      </label>
                      {file && (
                        <button
                          type="button"
                          onClick={() => { setFile(null); setContent(""); }}
                          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note-content">Content</Label>
                    <Textarea
                      id="note-content"
                      placeholder="Paste or type your notes here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={10}
                      className="resize-y min-h-[120px]"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={!title.trim() || !content.trim() || saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Note
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className={`${isMobile ? "p-4" : "p-8"} space-y-4`}>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notes.length === 0 ? (
            <div className="bg-card rounded-2xl p-10 text-center shadow-[var(--shadow-soft)]">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-muted-foreground">No notes yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first note to get started with AI summaries</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map(note => {
                const isExpanded = expandedId === note.id;
                const showSummary = viewSummaryId === note.id;
                return (
                  <div
                    key={note.id}
                    className="bg-card rounded-2xl shadow-[var(--shadow-soft)] border border-border/30 overflow-hidden flex flex-col"
                  >
                    {/* Header */}
                    <div className="p-4 pb-2 flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate">{note.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {note.file_name && (
                            <span className="ml-2 inline-flex items-center gap-1 text-primary">
                              <Upload className="h-3 w-3" />{note.file_name}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Content preview */}
                    <div className="px-4 pb-2 flex-1">
                      <p className={`text-xs text-muted-foreground whitespace-pre-wrap ${isExpanded ? "" : "line-clamp-4"}`}>
                        {note.content}
                      </p>
                      {note.content.length > 200 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : note.id)}
                          className="text-xs text-primary font-medium flex items-center gap-1 mt-1 hover:underline"
                        >
                          {isExpanded ? <><ChevronUp className="h-3 w-3" />Less</> : <><ChevronDown className="h-3 w-3" />More</>}
                        </button>
                      )}
                    </div>

                    {/* Summary */}
                    {note.summary && showSummary && (
                      <div className="mx-4 mb-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-primary flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> AI Summary
                          </span>
                          <button onClick={() => setViewSummaryId(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-foreground prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{note.summary}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="p-3 pt-0 flex items-center gap-2 border-t border-border/20 mt-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 gap-1.5 text-xs h-8"
                        disabled={summarizingId === note.id}
                        onClick={() => {
                          if (note.summary) {
                            setViewSummaryId(showSummary ? null : note.id);
                          } else {
                            handleSummarize(note);
                          }
                        }}
                      >
                        {summarizingId === note.id ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" />Summarizing...</>
                        ) : note.summary ? (
                          <><Sparkles className="h-3.5 w-3.5" />{showSummary ? "Hide Summary" : "View Summary"}</>
                        ) : (
                          <><Sparkles className="h-3.5 w-3.5" />Summarize</>
                        )}
                      </Button>
                      {note.summary && !showSummary && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-xs h-8"
                          onClick={() => handleSummarize(note)}
                          disabled={summarizingId === note.id}
                        >
                          {summarizingId === note.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Re-summarize"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <AIChatBot open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default Notes;
