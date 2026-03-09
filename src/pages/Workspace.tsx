import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Plus, FileText, Globe, Youtube, Upload, Send, Sparkles,
  Loader2, Trash2, LogOut, X, Menu, ChevronRight, Search, Settings,
  Home, MessageSquare, BarChart3, Layers, AlignLeft, Video, ArrowDown,
  PanelLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth as useAuthHook } from "@/hooks/useAuth";
import { fetchProfile } from "@/lib/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ── Mock notebooks for the dashboard ──
const MOCK_NOTEBOOKS = [
  { id: "1", title: "Machine Learning Basics", sources: 4, updated: "2 hours ago", color: "bg-blue-500" },
  { id: "2", title: "History of Philosophy", sources: 7, updated: "Yesterday", color: "bg-green-500" },
  { id: "3", title: "Organic Chemistry", sources: 3, updated: "3 days ago", color: "bg-orange-500" },
  { id: "4", title: "World Literature", sources: 5, updated: "1 week ago", color: "bg-purple-500" },
  { id: "5", title: "Economics 101", sources: 2, updated: "2 weeks ago", color: "bg-rose-500" },
];

const SOURCE_TYPES = [
  { icon: FileText, label: "PDF", color: "text-red-500", bg: "bg-red-50" },
  { icon: Globe, label: "Website", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Youtube, label: "YouTube", color: "text-red-600", bg: "bg-red-50" },
  { icon: AlignLeft, label: "Text", color: "text-green-600", bg: "bg-green-50" },
];

const SIDEBAR_ITEMS = [
  { icon: Home, label: "Home", id: "home" },
  { icon: BookOpen, label: "Notebooks", id: "notebooks" },
  { icon: Upload, label: "Sources", id: "sources" },
  { icon: MessageSquare, label: "AI Chat", id: "chat" },
  { icon: Layers, label: "Flashcards", id: "flashcards" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
];

const SUGGESTIONS = [
  "Summarize my notes into key concepts",
  "Create 10 flashcards from my sources",
  "What are the most important topics to study?",
  "Generate a practice quiz",
];

type View = "home" | "notebooks" | "sources" | "chat" | "flashcards" | "analytics";

export default function Workspace() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [sourceInput, setSourceInput] = useState("");
  const [addSourceType, setAddSourceType] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const { messages, input, setInput, isLoading, loaded, inputRef, loadHistory, sendMessage, handleClear } = useChat(user?.id);

  useEffect(() => {
    if (user) fetchProfile(user.id).then(setProfile).catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!loaded) loadHistory();
  }, [loaded, loadHistory]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }));
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
  }, []);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || undefined;
  const initials = displayName.charAt(0).toUpperCase();

  const NavItem = ({ item }: { item: typeof SIDEBAR_ITEMS[0] }) => {
    const active = view === item.id;
    return (
      <button
        onClick={() => { setView(item.id as View); setSidebarOpen(false); }}
        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
          ${active
            ? "bg-[#E8F0FE] text-[#4285F4]"
            : "text-[#5F6368] hover:bg-gray-100 hover:text-[#202124]"
          }
          ${sidebarCollapsed ? "justify-center px-2" : ""}
        `}
        title={sidebarCollapsed ? item.label : undefined}
      >
        <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "text-[#4285F4]" : "text-[#9AA0A6] group-hover:text-[#5F6368]"}`} />
        {!sidebarCollapsed && <span>{item.label}</span>}
        {!sidebarCollapsed && active && <ChevronRight className="h-3.5 w-3.5 ml-auto text-[#4285F4]" />}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`p-4 flex items-center gap-2.5 border-b border-gray-100 ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#4285F4] flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold text-[#202124] tracking-tight">StudyLM</span>
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-[#9AA0A6] hover:text-[#5F6368] transition-colors flex-shrink-0"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>

      {/* New notebook btn */}
      {!sidebarCollapsed && (
        <div className="p-3">
          <Button
            size="sm"
            className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl gap-2 h-9 text-sm shadow-sm"
            onClick={() => setView("notebooks")}
          >
            <Plus className="h-4 w-4" />
            New Notebook
          </Button>
        </div>
      )}

      {/* Nav */}
      <nav className={`flex-1 ${sidebarCollapsed ? "px-2" : "px-3"} py-2 space-y-0.5`}>
        {SIDEBAR_ITEMS.map((item) => <NavItem key={item.id} item={item} />)}
      </nav>

      {/* User */}
      <div className={`p-3 border-t border-gray-100 space-y-1`}>
        {!sidebarCollapsed && (
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-100 text-left transition-colors group"
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-[#4285F4] text-white text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#202124] truncate">{displayName}</p>
              <p className="text-xs text-[#9AA0A6] truncate">{user?.email}</p>
            </div>
          </button>
        )}
        <div className={`flex ${sidebarCollapsed ? "flex-col items-center" : "flex-row"} gap-1`}>
          <ThemeToggle />
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#9AA0A6] hover:text-red-500 hover:bg-red-50 transition-colors w-full"
            title={sidebarCollapsed ? "Sign out" : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render panels ──
  const renderHome = () => (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#202124] mb-1">Good morning, {displayName.split(" ")[0]} 👋</h1>
        <p className="text-[#5F6368]">What would you like to study today?</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {[
          { icon: Upload, label: "Upload Source", color: "bg-blue-500", action: () => setView("sources") },
          { icon: MessageSquare, label: "Start Chatting", color: "bg-green-500", action: () => setView("chat") },
          { icon: BookOpen, label: "My Notebooks", color: "bg-purple-500", action: () => setView("notebooks") },
          { icon: Layers, label: "Flashcards", color: "bg-orange-500", action: () => setView("flashcards") },
        ].map((a) => (
          <button
            key={a.label}
            onClick={a.action}
            className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer text-center"
          >
            <div className={`h-11 w-11 rounded-xl ${a.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
              <a.icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-[#202124]">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Recent notebooks */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#202124]">Recent Notebooks</h2>
        <button onClick={() => setView("notebooks")} className="text-sm text-[#4285F4] hover:underline font-medium flex items-center gap-1">
          View all <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_NOTEBOOKS.slice(0, 3).map((nb) => (
          <div
            key={nb.id}
            className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
          >
            <div className={`h-10 w-10 rounded-xl ${nb.color} flex items-center justify-center mb-4 shadow-sm`}>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-[#202124] mb-1 group-hover:text-[#4285F4] transition-colors">{nb.title}</h3>
            <p className="text-xs text-[#9AA0A6] mb-3">{nb.sources} sources · Updated {nb.updated}</p>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs border-gray-200 text-[#5F6368] hover:bg-[#E8F0FE] hover:text-[#4285F4] hover:border-[#C5D9FB] rounded-lg"
              onClick={() => setView("chat")}
            >
              Open <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotebooks = () => (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#202124]">My Notebooks</h1>
          <p className="text-sm text-[#5F6368] mt-1">{MOCK_NOTEBOOKS.length} notebooks</p>
        </div>
        <Button className="bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> New Notebook
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9AA0A6]" />
        <Input placeholder="Search notebooks..." className="pl-9 border-gray-200 bg-white rounded-xl h-10 text-sm focus-visible:ring-[#4285F4]/30 focus-visible:border-[#4285F4]" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_NOTEBOOKS.map((nb) => (
          <div key={nb.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
            <div className={`h-10 w-10 rounded-xl ${nb.color} flex items-center justify-center mb-4 shadow-sm`}>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-[#202124] mb-1 group-hover:text-[#4285F4] transition-colors">{nb.title}</h3>
            <p className="text-xs text-[#9AA0A6] mb-4">{nb.sources} sources · Updated {nb.updated}</p>
            <Button
              size="sm"
              className="w-full h-9 text-xs bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-lg"
              onClick={() => setView("chat")}
            >
              Open Notebook
            </Button>
          </div>
        ))}

        {/* Add new */}
        <button
          className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 hover:border-[#4285F4]/40 transition-all group min-h-[180px]"
          onClick={() => {}}
        >
          <div className="h-11 w-11 rounded-xl bg-gray-200 group-hover:bg-[#E8F0FE] flex items-center justify-center transition-colors">
            <Plus className="h-5 w-5 text-gray-400 group-hover:text-[#4285F4] transition-colors" />
          </div>
          <span className="text-sm font-medium text-gray-400 group-hover:text-[#4285F4] transition-colors">Create Notebook</span>
        </button>
      </div>
    </div>
  );

  const renderSources = () => (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#202124]">Sources</h1>
        <p className="text-sm text-[#5F6368] mt-1">Add sources for the AI to analyze</p>
      </div>

      {/* Source type selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {SOURCE_TYPES.map((s) => (
          <button
            key={s.label}
            onClick={() => setAddSourceType(s.label)}
            className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all ${addSourceType === s.label ? "border-[#4285F4] bg-[#E8F0FE]" : "border-gray-100 bg-white hover:border-[#4285F4]/40 hover:bg-gray-50"}`}
          >
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <span className="text-sm font-medium text-[#202124]">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Input area */}
      {addSourceType && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm animate-fade-in">
          <p className="text-sm font-medium text-[#202124] mb-3">
            {addSourceType === "PDF" ? "Upload a PDF file" :
             addSourceType === "Website" ? "Enter a website URL" :
             addSourceType === "YouTube" ? "Enter a YouTube video URL" :
             "Paste your text"}
          </p>
          {addSourceType === "PDF" ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#4285F4]/50 transition-colors">
              <Upload className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-[#5F6368] mb-1">Drag & drop your PDF here</p>
              <p className="text-xs text-[#9AA0A6]">or click to browse — max 50MB</p>
            </div>
          ) : addSourceType === "Text" ? (
            <textarea
              rows={6}
              placeholder="Paste your text notes here..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#202124] placeholder-[#9AA0A6] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4] resize-none"
            />
          ) : (
            <div className="flex gap-3">
              <Input
                value={sourceInput}
                onChange={(e) => setSourceInput(e.target.value)}
                placeholder={addSourceType === "YouTube" ? "https://youtube.com/watch?v=..." : "https://example.com"}
                className="flex-1 border-gray-200 rounded-xl h-10 text-sm focus-visible:ring-[#4285F4]/30 focus-visible:border-[#4285F4]"
              />
              <Button className="bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl h-10 px-5 text-sm shadow-sm" onClick={() => setView("chat")}>
                Analyze
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Source list */}
      <h2 className="text-base font-semibold text-[#202124] mb-4">Added Sources</h2>
      <div className="space-y-2">
        {[
          { icon: FileText, name: "Lecture Notes Chapter 3.pdf", type: "PDF", size: "2.4 MB", color: "text-red-500", bg: "bg-red-50" },
          { icon: Globe, name: "Khan Academy — Neural Networks", type: "Website", size: "12 min read", color: "text-blue-500", bg: "bg-blue-50" },
          { icon: Youtube, name: "3Blue1Brown: Backpropagation", type: "YouTube", size: "21 min", color: "text-red-600", bg: "bg-red-50" },
        ].map((src) => (
          <div key={src.name} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-all">
            <div className={`h-9 w-9 rounded-lg ${src.bg} flex items-center justify-center flex-shrink-0`}>
              <src.icon className={`h-4 w-4 ${src.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#202124] truncate">{src.name}</p>
              <p className="text-xs text-[#9AA0A6]">{src.type} · {src.size}</p>
            </div>
            <Badge variant="outline" className="text-xs border-gray-200 text-[#5F6368] bg-gray-50 rounded-full px-2.5">
              {src.type}
            </Badge>
            <button className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-[#9AA0A6] transition-colors ml-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-[#202124]">Machine Learning Basics</h1>
          <p className="text-xs text-[#9AA0A6]">4 sources · AI assistant ready</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9AA0A6] hover:text-red-500 hover:bg-red-50 rounded-lg" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-1.5 bg-green-50 text-green-600 rounded-full px-3 py-1 text-xs font-medium">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            AI Ready
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#F8F9FA] relative" ref={scrollContainerRef} onScroll={handleScroll}>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <div className="h-16 w-16 rounded-2xl bg-[#4285F4] flex items-center justify-center mx-auto mb-5 shadow-md">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-[#202124] mb-2">Ask anything about your sources</h2>
              <p className="text-sm text-[#5F6368] mb-8 max-w-md mx-auto">
                I've analyzed your sources and I'm ready to help you understand the content, create summaries, or generate study materials.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-sm px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-[#E8F0FE] hover:border-[#4285F4]/40 hover:text-[#4285F4] transition-all text-[#5F6368] shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-3`}>
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-[#4285F4] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-[#4285F4] text-white rounded-br-sm"
                    : "bg-white text-[#202124] rounded-bl-sm border border-gray-100"
                }`}
              >
                {msg.role === "assistant" ? (
                  <ChatMarkdown content={msg.content} />
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-[#34A853] text-white text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start gap-3">
              <div className="h-8 w-8 rounded-full bg-[#4285F4] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[#4285F4]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showScrollDown && (
          <button
            onClick={scrollToBottom}
            className="sticky bottom-4 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-[#4285F4] text-white shadow-lg flex items-center justify-center hover:bg-[#3367D6] transition-all z-10"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex items-end gap-3 bg-[#F8F9FA] border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-[#4285F4] focus-within:ring-2 focus-within:ring-[#4285F4]/20 transition-all"
          >
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }}}
              placeholder="Ask questions about your sources..."
              className="flex-1 bg-transparent text-sm text-[#202124] placeholder-[#9AA0A6] resize-none outline-none max-h-32 min-h-[24px]"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#9AA0A6] hover:text-[#4285F4] hover:bg-[#E8F0FE] rounded-xl"
                onClick={() => setView("sources")}
                title="Add source"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-9 w-9 bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl shadow-sm disabled:opacity-40"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
          <p className="text-xs text-[#9AA0A6] mt-2 text-center">
            AI responses are grounded in your uploaded sources
          </p>
        </div>
      </div>
    </div>
  );

  const renderFlashcards = () => (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#202124]">Flashcards</h1>
        <p className="text-sm text-[#5F6368] mt-1">AI-generated from your sources</p>
      </div>
      <div className="grid gap-4">
        {[
          { q: "What is backpropagation?", a: "An algorithm for training neural networks by computing the gradient of a loss function with respect to each weight." },
          { q: "Define gradient descent", a: "An optimization algorithm that iteratively moves toward the minimum of a function by taking steps proportional to the negative gradient." },
          { q: "What is a convolutional layer?", a: "A layer in a CNN that applies a set of learnable filters to detect local patterns in the input data." },
        ].map((fc, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all">
            <div className="p-5 border-b border-gray-50">
              <p className="text-xs font-semibold text-[#4285F4] uppercase tracking-wider mb-2">Question</p>
              <p className="text-base font-medium text-[#202124]">{fc.q}</p>
            </div>
            <div className="p-5 bg-[#F8F9FA]">
              <p className="text-xs font-semibold text-[#34A853] uppercase tracking-wider mb-2">Answer</p>
              <p className="text-sm text-[#5F6368] leading-relaxed">{fc.a}</p>
            </div>
          </div>
        ))}
      </div>
      <Button className="w-full mt-6 bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl gap-2 shadow-sm" onClick={() => navigate("/video-summarizer")}>
        <Sparkles className="h-4 w-4" /> Generate More from Video
      </Button>
    </div>
  );

  const renderAnalytics = () => (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#202124]">Analytics</h1>
        <p className="text-sm text-[#5F6368] mt-1">Your study insights</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Sources Added", value: "12", icon: Upload, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "AI Chats", value: "48", icon: MessageSquare, color: "text-green-500", bg: "bg-green-50" },
          { label: "Flashcards", value: "87", icon: Layers, color: "text-purple-500", bg: "bg-purple-50" },
          { label: "Study Hours", value: "34", icon: BarChart3, color: "text-orange-500", bg: "bg-orange-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-all">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-[#202124]">{s.value}</p>
            <p className="text-xs text-[#9AA0A6] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <Button className="bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-xl gap-2 shadow-sm" onClick={() => navigate("/analytics")}>
        <BarChart3 className="h-4 w-4" /> View Detailed Analytics
      </Button>
    </div>
  );

  const renderContent = () => {
    if (view === "home") return renderHome();
    if (view === "notebooks") return renderNotebooks();
    if (view === "sources") return renderSources();
    if (view === "chat") return renderChat();
    if (view === "flashcards") return renderFlashcards();
    if (view === "analytics") return renderAnalytics();
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex" style={{ fontFamily: "'Inter', 'Google Sans', system-ui, sans-serif" }}>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 md:hidden ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-gray-100 shadow-sm transition-all duration-300 flex flex-col
          md:relative md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${sidebarCollapsed ? "w-[72px]" : "w-[240px]"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-[#5F6368] transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[#4285F4] flex items-center justify-center">
              <BookOpen className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-base font-semibold text-[#202124]">StudyLM</span>
          </div>
        </div>

        {/* Content */}
        <main className={`flex-1 overflow-y-auto ${view === "chat" ? "flex flex-col" : ""}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
