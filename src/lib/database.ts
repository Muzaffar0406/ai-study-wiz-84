import { supabase } from "@/integrations/supabase/client";

export interface DbTask {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  priority: "high" | "medium" | "low";
  due_time: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchTasks(): Promise<DbTask[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbTask[];
}

export async function upsertTask(task: Partial<DbTask> & { title: string; user_id: string }) {
  const { data, error } = await supabase
    .from("tasks")
    .upsert(task)
    .select()
    .single();
  if (error) throw error;
  return data as DbTask;
}

export async function toggleTaskCompleted(id: string, completed: boolean) {
  const { error } = await supabase
    .from("tasks")
    .update({ completed, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// Chat messages
export interface DbChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function fetchChatMessages(): Promise<DbChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbChatMessage[];
}

export async function saveChatMessage(msg: { user_id: string; role: string; content: string }) {
  const { error } = await supabase.from("chat_messages").insert(msg);
  if (error) throw error;
}

export async function clearChatMessages() {
  const { error } = await supabase.from("chat_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
}

// Profile
export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: { display_name?: string | null; avatar_url?: string | null }) {
  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}
