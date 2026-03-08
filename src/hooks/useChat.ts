import { useState, useRef, useEffect, useCallback } from "react";
import { streamChat, type ChatMessage } from "@/lib/streamChat";
import { fetchChatMessages, saveChatMessage, clearChatMessages } from "@/lib/database";
import { toast } from "@/hooks/use-toast";

export function useChat(userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  const loadHistory = useCallback(async () => {
    if (!userId || loaded) return;
    try {
      const msgs = await fetchChatMessages();
      setMessages(msgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      setLoaded(true);
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  }, [userId, loaded]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || !userId) return;

    const userMsg: ChatMessage = { role: "user", content: content.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    saveChatMessage({ user_id: userId, role: "user", content: userMsg.content }).catch(console.error);

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
          if (assistantContent) {
            saveChatMessage({ user_id: userId, role: "assistant", content: assistantContent }).catch(console.error);
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
  }, [isLoading, userId, messages]);

  const handleClear = useCallback(async () => {
    try {
      await clearChatMessages();
      setMessages([]);
    } catch {
      toast({ title: "Error", description: "Could not clear chat history.", variant: "destructive" });
    }
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    loaded,
    scrollRef,
    inputRef,
    loadHistory,
    sendMessage,
    handleClear,
    scrollToBottom,
  };
}
