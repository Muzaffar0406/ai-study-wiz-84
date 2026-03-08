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

// Study sessions
export interface DbStudySession {
  id: string;
  user_id: string;
  duration_minutes: number;
  session_type: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export async function startStudySession(userId: string, durationMinutes: number, sessionType: string = "focus") {
  const { data, error } = await supabase
    .from("study_sessions")
    .insert({ user_id: userId, duration_minutes: durationMinutes, session_type: sessionType })
    .select()
    .single();
  if (error) throw error;
  return data as DbStudySession;
}

export async function completeStudySession(sessionId: string) {
  const { error } = await supabase
    .from("study_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function fetchTodayStudyStats(userId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("started_at", todayStart.toISOString());
  if (error) throw error;

  const totalMinutes = (data ?? []).reduce((sum, s: any) => sum + (s.duration_minutes || 0), 0);
  return { totalMinutes, sessionCount: (data ?? []).length };
}

export async function fetchStudyStreak(userId: string): Promise<number> {
  // Fetch completed sessions grouped by date, last 60 days
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data, error } = await supabase
    .from("study_sessions")
    .select("started_at")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("started_at", sixtyDaysAgo.toISOString())
    .order("started_at", { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return 0;

  // Get unique dates
  const uniqueDates = new Set(
    data.map((s: any) => new Date(s.started_at).toISOString().split("T")[0])
  );

  // Count consecutive days from today backwards
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    if (uniqueDates.has(dateStr)) {
      streak++;
    } else if (i === 0) {
      // Today might not have a session yet, skip
      continue;
    } else {
      break;
    }
  }
  return streak;
}