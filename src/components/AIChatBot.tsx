import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Sparkles, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { streamChat, type ChatMessage } from "@/lib/streamChat";
import { fetchChatMessages, saveChatMessage, clearChatMessages } from "@/lib/database";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const SUGGESTIONS = [
  "How do I study more effectively?",
  "Explain the Pomodoro technique",
  "Help me plan my study schedule",
  "Quiz me on a topic",
];

interface AIChatBotProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AIChatBot({ open: controlledOpen, onOpenChange }: AIChatBotProps = {}) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history when opened
  useEffect(() => {
    if (isOpen && !loaded && user) {
      fetchChatMessages()
        .then((msgs) => {
          setMessages(msgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
          setLoaded(true);
        })
        .catch(console.error);
    }
  }, [isOpen, loaded, user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || !user) return;

    const userMsg: ChatMessage = { role: "user", content: content.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    // Save user message
    saveChatMessage({ user_id: user.id, role: "user", content: userMsg.content }).catch(console.error);

    let assistantContent = "";

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamChat({
        messages: updatedMessages,
        onDelta: upsertAssistant,
        onDone: () => {
          setIsLoading(false);
          // Save assistant message
          if (assistantContent) {
            saveChatMessage({ user_id: user.id, role: "assistant", content: assistantContent }).catch(console.error);
          }
        },
        onError: (error) => {
          setIsLoading(false);
          toast({ title: "AI Error", description: error, variant: "destructive" });
        },
      });
    } catch {
      setIsLoading(false);
      toast({ title: "Connection Error", description: "Could not reach the AI assistant.", variant: "destructive" });
    }
  };

  const handleClear = async () => {
    try {
      await clearChatMessages();
      setMessages([]);
    } catch {
      toast({ title: "Error", description: "Could not clear chat history.", variant: "destructive" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary shadow-lg hover:shadow-xl hover:scale-110 transition-all animate-float z-50"
        size="icon"
      >
        {isOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" /> : <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />}
      </Button>

      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:bottom-28 sm:right-8 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[70vh] sm:max-h-[560px] bg-card border border-border rounded-2xl shadow-xl flex flex-col z-50 animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Study Assistant</h3>
                <p className="text-xs text-muted-foreground">Powered by AI</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClear} title="Clear chat">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 min-h-0 max-h-[380px]" ref={scrollRef}>
            <div className="p-4 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center py-2">
                    👋 Hi! I'm your AI study assistant. How can I help?
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about studying..."
              className="flex-1 text-sm border-0 bg-muted focus-visible:ring-1"
              maxLength={500}
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
