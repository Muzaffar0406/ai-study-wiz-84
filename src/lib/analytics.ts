import { supabase } from "@/integrations/supabase/client";
import { subDays, format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

export interface DailyStudyData {
  date: string;
  label: string;
  minutes: number;
  hours: number;
}

export interface WeeklyTaskData {
  week: string;
  completed: number;
  created: number;
}

export interface SubjectData {
  subject: string;
  count: number;
}

export interface StreakDay {
  date: string;
  studied: boolean;
}

export interface WeeklyFocusData {
  week: string;
  sessions: number;
  totalMinutes: number;
}

export async function fetchDailyStudyHours(userId: string, days = 30): Promise<DailyStudyData[]> {
  const startDate = subDays(new Date(), days);

  const { data, error } = await supabase
    .from("study_sessions")
    .select("started_at, duration_minutes")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("started_at", startDate.toISOString())
    .order("started_at", { ascending: true });

  if (error) throw error;

  const dayMap = new Map<string, number>();
  const allDays = eachDayOfInterval({ start: startDate, end: new Date() });
  allDays.forEach((d) => dayMap.set(format(d, "yyyy-MM-dd"), 0));

  (data ?? []).forEach((s: any) => {
    const dateKey = format(new Date(s.started_at), "yyyy-MM-dd");
    dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + (s.duration_minutes || 0));
  });

  return Array.from(dayMap.entries()).map(([date, minutes]) => ({
    date,
    label: format(new Date(date + "T00:00:00"), "MMM d"),
    minutes,
    hours: Math.round((minutes / 60) * 10) / 10,
  }));
}

export async function fetchWeeklyTaskCompletion(userId: string, weeks = 8): Promise<WeeklyTaskData[]> {
  const startDate = subDays(new Date(), weeks * 7);

  const { data, error } = await supabase
    .from("tasks")
    .select("created_at, completed, updated_at")
    .eq("user_id", userId)
    .gte("created_at", startDate.toISOString());

  if (error) throw error;

  const weekMap = new Map<string, { completed: number; created: number }>();

  for (let i = 0; i < weeks; i++) {
    const weekStart = startOfWeek(subDays(new Date(), i * 7));
    const key = format(weekStart, "MMM d");
    weekMap.set(key, { completed: 0, created: 0 });
  }

  (data ?? []).forEach((t: any) => {
    const weekStart = startOfWeek(new Date(t.created_at));
    const key = format(weekStart, "MMM d");
    const entry = weekMap.get(key);
    if (entry) {
      entry.created++;
      if (t.completed) entry.completed++;
    }
  });

  return Array.from(weekMap.entries())
    .map(([week, vals]) => ({ week, ...vals }))
    .reverse();
}

export async function fetchSubjectDistribution(userId: string): Promise<SubjectData[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("subject")
    .eq("user_id", userId);

  if (error) throw error;

  const countMap = new Map<string, number>();
  (data ?? []).forEach((t: any) => {
    const subj = t.subject?.trim() || "Uncategorized";
    countMap.set(subj, (countMap.get(subj) || 0) + 1);
  });

  return Array.from(countMap.entries())
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => b.count - a.count);
}

export async function fetchStreakHistory(userId: string, days = 30): Promise<StreakDay[]> {
  const startDate = subDays(new Date(), days);

  const { data, error } = await supabase
    .from("study_sessions")
    .select("started_at")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("started_at", startDate.toISOString());

  if (error) throw error;

  const studiedDates = new Set(
    (data ?? []).map((s: any) => format(new Date(s.started_at), "yyyy-MM-dd"))
  );

  const allDays = eachDayOfInterval({ start: startDate, end: new Date() });
  return allDays.map((d) => {
    const dateStr = format(d, "yyyy-MM-dd");
    return { date: dateStr, studied: studiedDates.has(dateStr) };
  });
}

export async function fetchWeeklyFocusSessions(userId: string, weeks = 8): Promise<WeeklyFocusData[]> {
  const startDate = subDays(new Date(), weeks * 7);

  const { data, error } = await supabase
    .from("study_sessions")
    .select("started_at, duration_minutes")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("started_at", startDate.toISOString());

  if (error) throw error;

  const weekMap = new Map<string, { sessions: number; totalMinutes: number }>();

  for (let i = 0; i < weeks; i++) {
    const weekStart = startOfWeek(subDays(new Date(), i * 7));
    const key = format(weekStart, "MMM d");
    weekMap.set(key, { sessions: 0, totalMinutes: 0 });
  }

  (data ?? []).forEach((s: any) => {
    const weekStart = startOfWeek(new Date(s.started_at));
    const key = format(weekStart, "MMM d");
    const entry = weekMap.get(key);
    if (entry) {
      entry.sessions++;
      entry.totalMinutes += s.duration_minutes || 0;
    }
  });

  return Array.from(weekMap.entries())
    .map(([week, vals]) => ({ week, ...vals }))
    .reverse();
}
