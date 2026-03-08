import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, X, Sparkles, Loader2, Trash2, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

const SUGGESTIONS = [
  "What should I study today?",
  "How am I doing on my goals?",
  "Help me plan my study schedule",
  "Quiz me on my notes",
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
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages, input, setInput, isLoading, loaded,
    inputRef, loadHistory, sendMessage, handleClear,
  } = useChat(user?.id);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !loaded) loadHistory();
  }, [isOpen, loaded, loadHistory]);

  useEffect(() => {
    if (isOpen && inputRef.current) (inputRef.current as HTMLInputElement).focus();
  }, [isOpen, inputRef]);

  // Esc key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Track scroll position for "scroll to bottom" button
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollDown(!isNearBottom);
  }, []);

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
          <div className="flex-1 min-h-0 max-h-[380px] overflow-y-auto relative" ref={scrollContainerRef} onScroll={handleScroll}>
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
                      <ChatMarkdown content={msg.content} />
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
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollDown && (
              <button
                onClick={scrollToBottom}
                className="sticky bottom-2 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all z-10"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border">
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
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
