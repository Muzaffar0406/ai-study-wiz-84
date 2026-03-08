import { useState, useEffect } from "react";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { AIChatBot } from "@/components/AIChatBot";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfile } from "@/lib/database";
import { createFlashcardsBatch } from "@/lib/flashcards";
import ReactMarkdown from "react-markdown";
import {
  Plus, FileText, Sparkles, Trash2, Upload, Loader2, BookOpen,
  Download, X, Eye, EyeOff, File, Image as ImageIcon, Layers
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

function getFileIcon(fileName: string | null) {
  if (!fileName) return <FileText className="h-5 w-5 text-primary" />;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext || ""))
    return <ImageIcon className="h-5 w-5 text-primary" />;
  if (ext === "pdf") return <File className="h-5 w-5 text-red-500" />;
  if (["doc", "docx"].includes(ext || "")) return <File className="h-5 w-5 text-blue-500" />;
  return <FileText className="h-5 w-5 text-primary" />;
}

const Notes = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { collapsed } = useSidebarState();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  // Add note form
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Summarizing / viewing
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [viewSummaryId, setViewSummaryId] = useState<string | null>(null);
  const [viewContentId, setViewContentId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [generatingCardsId, setGeneratingCardsId] = useState<string | null>(null);

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

  const handleUploadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);

    try {
      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("notes").upload(filePath, file);
      if (uploadErr) throw uploadErr;

      // Extract text content for summarization
      let extractedContent = "";
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

      if (file.type === "text/plain" || ext === ".txt") {
        extractedContent = await file.text();
      } else {
        // Use AI to extract text from PDF/DOCX/image
        const { data: signedData, error: signedErr } = await supabase.storage
          .from("notes")
          .createSignedUrl(filePath, 300);
        if (signedErr || !signedData?.signedUrl) throw signedErr || new Error("Failed to get signed URL");

        const { data, error } = await supabase.functions.invoke("extract-text", {
          body: { fileUrl: signedData.signedUrl, fileName: file.name, mimeType: file.type },
        });
        if (error) throw error;
        if (data?.error) {
          toast({ title: "Extraction warning", description: data.error, variant: "destructive" });
        }
        extractedContent = data?.text || "(Could not extract text)";
      }

      // Save note record with file path (not public URL)
      const { error: insertErr } = await supabase.from("notes").insert({
        user_id: user.id,
        title: title.trim(),
        content: extractedContent,
        file_url: filePath,
        file_name: file.name,
      });
      if (insertErr) throw insertErr;

      toast({ title: "Note uploaded ✅", description: file.name });
      setTitle("");
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

  const handleDownload = async (note: Note) => {
    if (!note.file_url) return;
    setDownloadingId(note.id);
    try {
      const { data, error } = await supabase.storage
        .from("notes")
        .createSignedUrl(note.file_url, 60);
      if (error || !data?.signedUrl) throw error || new Error("Could not get download link");
      window.open(data.signedUrl, "_blank");
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not download file.", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSummarize = async (note: Note) => {
    if (!note.content || note.content === "(Could not extract text)") {
      toast({ title: "No content", description: "Cannot summarize — no text was extracted from this file.", variant: "destructive" });
      return;
    }
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
    const note = notes.find(n => n.id === id);
    setNotes(prev => prev.filter(n => n.id !== id));

    // Delete file from storage if exists
    if (note?.file_url) {
      await supabase.storage.from("notes").remove([note.file_url]);
    }
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      loadNotes();
      toast({ title: "Error", description: "Could not delete note.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar displayName={displayName} avatarUrl={avatarUrl} onAIClick={() => setChatOpen(true)} />

      <main className={`min-h-screen transition-all duration-300 ${isMobile ? "" : collapsed ? "ml-[68px]" : "ml-[240px]"}`}>
        <header className={`sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 py-4 ${isMobile ? "px-4 pt-14" : "px-8"}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-foreground flex items-center gap-2`}>
                <BookOpen className="h-6 w-6 text-primary" />
                My Notes
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Upload your notes (PDF, DOCX, TXT, Image) and summarize them with AI
              </p>
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary">
                  <Plus className="h-4 w-4" />
                  {isMobile ? "Upload" : "Upload Note"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Note</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUploadNote} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="note-title">Title</Label>
                    <Input
                      id="note-title"
                      placeholder="e.g. Biology Chapter 3"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={200}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    <label className="flex items-center gap-3 p-5 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        {file ? (
                          <span className="text-sm font-medium text-foreground truncate block">{file.name}</span>
                        ) : (
                          <>
                            <span className="text-sm font-medium text-foreground">Choose a file</span>
                            <span className="text-xs text-muted-foreground block mt-0.5">PDF, DOCX, TXT, PNG, JPG, WEBP</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          if (f.size > 10 * 1024 * 1024) {
                            toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
                            return;
                          }
                          setFile(f);
                          if (!title.trim()) {
                            setTitle(f.name.replace(/\.[^.]+$/, ""));
                          }
                        }}
                      />
                    </label>
                    {file && (
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <X className="h-3 w-3" /> Remove file
                      </button>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={!file || !title.trim() || saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {saving ? "Uploading & Processing..." : "Upload Note"}
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
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-foreground">No notes uploaded yet</p>
              <p className="text-sm text-muted-foreground mt-1">Upload your first PDF, DOCX, TXT, or image file</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map(note => {
                const showSummary = viewSummaryId === note.id;
                const showContent = viewContentId === note.id;
                return (
                  <div
                    key={note.id}
                    className="bg-card rounded-2xl shadow-[var(--shadow-soft)] border border-border/30 overflow-hidden flex flex-col"
                  >
                    {/* Header */}
                    <div className="p-4 pb-2 flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {getFileIcon(note.file_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate">{note.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        {note.file_name && (
                          <span className="text-xs text-primary font-medium mt-0.5 block truncate">
                            📎 {note.file_name}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Extracted content toggle */}
                    {showContent && (
                      <div className="mx-4 mb-2 p-3 rounded-xl bg-muted/50 border border-border/30 max-h-48 overflow-y-auto">
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                      </div>
                    )}

                    {/* Summary */}
                    {note.summary && showSummary && (
                      <div className="mx-4 mb-2 p-3 rounded-xl bg-primary/5 border border-primary/10 max-h-64 overflow-y-auto">
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
                    <div className="p-3 pt-1 flex flex-wrap items-center gap-1.5 border-t border-border/20 mt-auto">
                      {/* Download original file */}
                      {note.file_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs h-7"
                          disabled={downloadingId === note.id}
                          onClick={() => handleDownload(note)}
                        >
                          {downloadingId === note.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                          Download
                        </Button>
                      )}

                      {/* View extracted text */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs h-7"
                        onClick={() => setViewContentId(showContent ? null : note.id)}
                      >
                        {showContent ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showContent ? "Hide Text" : "View Text"}
                      </Button>

                      {/* Summarize */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs h-7"
                        disabled={summarizingId === note.id}
                        onClick={() => {
                          if (note.summary && !showSummary) {
                            setViewSummaryId(note.id);
                          } else if (showSummary) {
                            setViewSummaryId(null);
                          } else {
                            handleSummarize(note);
                          }
                        }}
                      >
                        {summarizingId === note.id ? (
                          <><Loader2 className="h-3 w-3 animate-spin" />Summarizing...</>
                        ) : note.summary ? (
                          <><Sparkles className="h-3 w-3" />{showSummary ? "Hide" : "Summary"}</>
                        ) : (
                          <><Sparkles className="h-3 w-3" />Summarize</>
                        )}
                      </Button>

                      {/* Re-summarize */}
                      {note.summary && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-xs h-7"
                          disabled={summarizingId === note.id}
                          onClick={() => handleSummarize(note)}
                        >
                          Re-summarize
                        </Button>
                      )}
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
