import { useEffect } from "react";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChat } from "@/hooks/useChat";
import { fetchProfile } from "@/lib/database";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, Send, Loader2, Trash2, Bot, Brain,
  BookOpen, Target, Clock, Lightbulb,
} from "lucide-react";

const SUGGESTIONS = [
  { icon: Target, label: "What should I study today?", description: "Get prioritized recommendations" },
  { icon: Brain, label: "How am I doing on my goals?", description: "Review your progress" },
  { icon: Clock, label: "Help me plan my study schedule", description: "Create an optimized plan" },
  { icon: BookOpen, label: "Quiz me on my notes", description: "Test your knowledge" },
  { icon: Lightbulb, label: "Give me study tips for my subjects", description: "Subject-specific advice" },
  { icon: Sparkles, label: "Summarize my week's progress", description: "Weekly recap & insights" },
];

const Assistant = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { collapsed } = useSidebarState();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

  const {
    messages, input, setInput, isLoading, loaded,
    scrollRef, inputRef, loadHistory, sendMessage, handleClear,
  } = useChat(user?.id);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  useEffect(() => {
    if (user) {
      fetchProfile(user.id).then(setProfile).catch(console.error);
      loadHistory();
    }
  }, [user, loadHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar displayName={displayName} avatarUrl={avatarUrl} onAIClick={() => {}} />

      <main className={`min-h-screen transition-all duration-300 flex flex-col ${isMobile ? "" : collapsed ? "ml-[68px]" : "ml-[240px]"}`}>
        {/* Header */}
        <header className={`sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 py-4 ${isMobile ? "px-4 pt-14" : "px-8"}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-foreground`}>AI Study Assistant</h1>
                <p className="text-sm text-muted-foreground">Your personalized study companion</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClear} className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" /> Clear Chat
              </Button>
            )}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className={`max-w-3xl mx-auto ${isMobile ? "px-4 py-4" : "px-8 py-6"} space-y-6`}>
              {/* Empty state with suggestions */}
              {messages.length === 0 && !isLoading && (
                <div className="space-y-8 py-8">
                  <div className="text-center space-y-3">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto shadow-lg">
                      <Bot className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">How can I help you study?</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      I know your tasks, deadlines, study sessions, notes, and goals. Ask me anything!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => sendMessage(s.label)}
                        className="flex items-start gap-3 text-left p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all shadow-[var(--shadow-soft)] group"
                      >
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <s.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{s.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-5 py-3 text-sm max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border shadow-[var(--shadow-soft)] rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_ul]:space-y-1 [&_ol]:space-y-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-5 py-4 shadow-[var(--shadow-soft)]">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className={`border-t border-border bg-background/80 backdrop-blur-lg ${isMobile ? "p-3" : "p-4"}`}>
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-end gap-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your studies..."
                  className="min-h-[48px] max-h-[160px] resize-none text-sm bg-card border-border focus-visible:ring-primary pr-4"
                  rows={1}
                  maxLength={1000}
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 flex-shrink-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-2 max-w-3xl mx-auto">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Assistant;
