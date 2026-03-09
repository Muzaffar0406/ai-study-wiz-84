import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { fetchProfile } from "@/lib/database";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Home,
  Files,
  Upload,
  Bot,
  Settings,
  Menu,
  X,
  Plus,
  Send,
  Loader2,
  ArrowDown,
  FileText,
  Globe,
  Youtube,
  Type,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "notebooks", label: "Notebooks", icon: BookOpen },
  { id: "sources", label: "Sources", icon: Files },
  { id: "chat", label: "Chat", icon: Bot },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type WorkspaceView = (typeof NAV_ITEMS)[number]["id"];

const notebookCards = [
  { title: "Neural Networks", sources: 4, updated: "2h ago" },
  { title: "World History", sources: 7, updated: "1d ago" },
  { title: "Organic Chemistry", sources: 3, updated: "3d ago" },
  { title: "Macroeconomics", sources: 5, updated: "5d ago" },
];

const sourceRows = [
  { label: "Lecture_03.pdf", type: "PDF", icon: FileText },
  { label: "https://example.com/article", type: "Website", icon: Globe },
  { label: "https://youtube.com/watch?v=123", type: "YouTube", icon: Youtube },
  { label: "Week 5 text notes", type: "Text", icon: Type },
];

const quickPrompts = [
  "Summarize my notes in bullet points",
  "What are the key exam topics?",
  "Create 5 flashcards from these sources",
  "Explain this like I’m a beginner",
];

export default function Workspace() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [view, setView] = useState<WorkspaceView>("home");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

  const { messages, input, setInput, isLoading, loaded, inputRef, loadHistory, sendMessage } = useChat(user?.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  useEffect(() => {
    if (user) fetchProfile(user.id).then(setProfile).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!loaded) loadHistory();
  }, [loaded, loadHistory]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
  }, []);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || undefined;
  const initials = displayName.charAt(0).toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={`flex items-center border-b border-border/70 p-4 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">StudyLM</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </div>

      <div className="p-3">
        {!collapsed && (
          <Button className="w-full gap-2 rounded-xl" onClick={() => setView("notebooks")}>
            <Plus className="h-4 w-4" /> Create Notebook
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                setMobileSidebarOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border/70 p-3">
        {!collapsed && (
          <button onClick={() => navigate("/profile")} className="mb-2 flex w-full items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </button>
        )}

        <div className={`flex ${collapsed ? "flex-col" : "items-center"} gap-2`}>
          <ThemeToggle />
          <Button variant="ghost" onClick={() => signOut()} className={collapsed ? "px-0" : "w-full justify-start"}>Sign out</Button>
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="space-y-5 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {displayName.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Your productivity-focused AI research workspace.</p>
      </div>
      <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setView("sources")}>Upload Source</Button>
          <Button variant="outline" onClick={() => setView("chat")}>Generate Summary</Button>
          <Button variant="outline" onClick={() => setView("notebooks")}>Create Notebook</Button>
        </div>
      </Card>
    </div>
  );

  const renderNotebooks = () => (
    <div className="p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notebooks</h1>
        <Button className="gap-2"><Plus className="h-4 w-4" /> New</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {notebookCards.map((nb) => (
          <Card key={nb.title} className="rounded-2xl border-border/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <h3 className="text-base font-semibold">{nb.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{nb.sources} sources · updated {nb.updated}</p>
            <Button className="mt-4 w-full" variant="outline" onClick={() => setView("chat")}>Open</Button>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSources = () => (
    <div className="space-y-5 p-6 md:p-8">
      <h1 className="text-2xl font-semibold">Sources</h1>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card className="rounded-2xl border-border/70 p-6 shadow-sm">
            <div
              className="rounded-2xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-primary/40"
              onClick={() => toast({ title: "Upload UI ready", description: "Connect this to file storage next." })}
            >
              <Upload className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
              <p className="text-sm">Drag & drop files (PDF, DOCX, TXT)</p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="url">
          <Card className="rounded-2xl border-border/70 p-6 shadow-sm">
            <div className="flex gap-2">
              <Input placeholder="Paste website or YouTube URL" />
              <Button>Add</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="text">
          <Card className="rounded-2xl border-border/70 p-6 shadow-sm">
            <textarea className="min-h-40 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary/50" placeholder="Paste text notes..." />
            <Button className="mt-3">Save Note</Button>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="rounded-2xl border-border/70 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Current sources</h2>
        <div className="space-y-2">
          {sourceRows.map((row) => (
            <div key={row.label} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-3 py-2.5">
              <row.icon className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{row.label}</p>
              </div>
              <Badge variant="outline">{row.type}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderChat = () => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border/70 bg-card px-5 py-3">
        <h1 className="text-base font-semibold">AI Assistant</h1>
        <p className="text-xs text-muted-foreground">Ask questions about your notes...</p>
      </div>

      <div ref={scrollContainerRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto bg-background/60">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-5">
          {messages.length === 0 && (
            <Card className="rounded-2xl border-border/70 p-5">
              <p className="mb-3 text-sm text-muted-foreground">Try one of these:</p>
              <div className="grid gap-2 md:grid-cols-2">
                {quickPrompts.map((prompt) => (
                  <button key={prompt} onClick={() => sendMessage(prompt)} className="rounded-xl border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-muted">
                    {prompt}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-border bg-card text-foreground"}`}>
                {msg.role === "assistant" ? <ChatMarkdown content={msg.content} /> : msg.content}

                {msg.role === "assistant" && (
                  <div className="mt-3 border-t border-border/70 pt-2">
                    <p className="mb-1 text-[11px] font-medium text-muted-foreground">Sources</p>
                    <div className="rounded-md bg-accent/40 px-2 py-1 text-[11px] text-accent-foreground">
                      Lecture_03.pdf · highlighted citation on page 12
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {showScrollDown && (
          <button onClick={scrollToBottom} className="sticky bottom-3 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <ArrowDown className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="border-t border-border/70 bg-card p-4">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="mx-auto flex max-w-3xl items-center gap-2">
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask questions about your notes..."
            disabled={isLoading}
            className="h-11"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-11 w-11">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4 p-6 md:p-8">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card className="rounded-2xl border-border/70 p-5">
        <p className="text-sm text-muted-foreground">Profile and workspace settings can be managed here.</p>
      </Card>
    </div>
  );

  const renderPanel = () => {
    if (view === "home") return renderHome();
    if (view === "notebooks") return renderNotebooks();
    if (view === "sources") return renderSources();
    if (view === "chat") return renderChat();
    return renderSettings();
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className={`fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity md:hidden ${mobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setMobileSidebarOpen(false)} />

      <aside className={`fixed bottom-0 left-0 top-0 z-50 border-r border-border/70 bg-card transition-transform md:relative md:translate-x-0 ${collapsed ? "w-[72px]" : "w-[244px]"} ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-border/70 px-4 md:hidden">
          <button onClick={() => setMobileSidebarOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <Menu className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">Workspace</span>
        </div>

        <main className={`min-h-0 flex-1 overflow-auto ${view === "chat" ? "flex flex-col" : ""}`}>{renderPanel()}</main>
      </div>
    </div>
  );
}
