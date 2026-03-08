import { supabase } from "@/integrations/supabase/client";

export interface Goal {
  id: string;
  user_id: string;
  type: string;
  title: string;
  target_value: number;
  current_value: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export const GOAL_TYPES = [
  { value: "weekly_study", label: "Weekly Study Hours", unit: "hours", icon: "Clock" },
  { value: "daily_tasks", label: "Daily Task Completion", unit: "tasks", icon: "CheckSquare" },
  { value: "exam_prep", label: "Exam Preparation", unit: "sessions", icon: "GraduationCap" },
] as const;

export async function fetchGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Goal[];
}

export async function createGoal(goal: {
  user_id: string;
  type: string;
  title: string;
  target_value: number;
  deadline?: string | null;
}): Promise<Goal> {
  const { data, error } = await supabase
    .from("goals")
    .insert(goal)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Goal;
}

export async function updateGoalProgress(id: string, current_value: number): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .update({ current_value, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export function getGoalProgress(goal: Goal): number {
  if (goal.target_value <= 0) return 0;
  return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
}

export function isGoalExpired(goal: Goal): boolean {
  if (!goal.deadline) return false;
  return new Date(goal.deadline) < new Date();
}

export function isGoalComplete(goal: Goal): boolean {
  return goal.current_value >= goal.target_value;
}

// ── Auto-calculation helpers ──

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getTodayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Fetch this week's total completed study hours */
async function fetchWeeklyStudyHours(userId: string): Promise<number> {
  const weekStart = getWeekStart();
  const { data, error } = await supabase
    .from("study_sessions")
    .select("duration_minutes")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("started_at", weekStart.toISOString());
  if (error) throw error;
  const totalMinutes = (data ?? []).reduce((sum, s: any) => sum + (s.duration_minutes || 0), 0);
  return Math.round((totalMinutes / 60) * 100) / 100; // hours with 2 decimals
}

/** Fetch today's completed task count */
async function fetchTodayCompletedTasks(userId: string): Promise<number> {
  const todayStart = getTodayStart();
  const { data, error } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", userId)
    .eq("completed", true)
    .gte("updated_at", todayStart.toISOString());
  if (error) throw error;
  return (data ?? []).length;
}

/** Fetch this week's completed focus session count (for exam_prep) */
async function fetchWeeklyFocusSessions(userId: string): Promise<number> {
  const weekStart = getWeekStart();
  const { data, error } = await supabase
    .from("study_sessions")
    .select("id")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("started_at", weekStart.toISOString());
  if (error) throw error;
  return (data ?? []).length;
}

/**
 * Auto-sync goal current_value from real data.
 * Mutates and returns the goals array with updated values.
 */
export async function syncGoalProgress(userId: string, goals: Goal[]): Promise<Goal[]> {
  // Fetch all stats in parallel
  const [weeklyHours, todayTasks, weeklySessions] = await Promise.all([
    fetchWeeklyStudyHours(userId),
    fetchTodayCompletedTasks(userId),
    fetchWeeklyFocusSessions(userId),
  ]);

  const updates: Promise<void>[] = [];

  const synced = goals.map(goal => {
    let autoValue: number | null = null;

    if (goal.type === "weekly_study") {
      autoValue = weeklyHours;
    } else if (goal.type === "daily_tasks") {
      autoValue = todayTasks;
    } else if (goal.type === "exam_prep") {
      autoValue = weeklySessions;
    }

    if (autoValue !== null && autoValue !== goal.current_value) {
      updates.push(updateGoalProgress(goal.id, autoValue));
      return { ...goal, current_value: autoValue };
    }
    return goal;
  });

  // Fire DB updates in parallel (non-blocking)
  if (updates.length > 0) {
    Promise.all(updates).catch(console.error);
  }

  return synced;
}

export interface GoalReminder {
  goal: Goal;
  urgency: "overdue" | "today" | "tomorrow" | "this_week";
  message: string;
}

/**
 * Check goals for approaching deadlines and return reminders.
 * Uses sessionStorage to avoid showing the same reminders repeatedly in one session.
 */
export function checkGoalReminders(goals: Goal[]): GoalReminder[] {
  const now = new Date();
  const reminders: GoalReminder[] = [];

  for (const goal of goals) {
    if (!goal.deadline || isGoalComplete(goal)) continue;

    const deadline = new Date(goal.deadline);
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffMs < 0) {
      reminders.push({
        goal,
        urgency: "overdue",
        message: `"${goal.title}" is overdue! Deadline has passed.`,
      });
    } else if (diffHours <= 24) {
      reminders.push({
        goal,
        urgency: "today",
        message: `"${goal.title}" is due today! ${getGoalProgress(goal)}% complete.`,
      });
    } else if (diffDays <= 2) {
      reminders.push({
        goal,
        urgency: "tomorrow",
        message: `"${goal.title}" is due tomorrow. ${getGoalProgress(goal)}% complete.`,
      });
    } else if (diffDays <= 7) {
      reminders.push({
        goal,
        urgency: "this_week",
        message: `"${goal.title}" is due in ${Math.ceil(diffDays)} days. ${getGoalProgress(goal)}% complete.`,
      });
    }
  }

  return reminders;
}

/** Show reminders as toasts, deduplicated per session */
export function showGoalReminders(
  goals: Goal[],
  toastFn: (opts: { title: string; description: string; variant?: "default" | "destructive" }) => void
) {
  const reminders = checkGoalReminders(goals);
  const shownKey = "goal_reminders_shown";
  const shownRaw = sessionStorage.getItem(shownKey);
  const shown: Set<string> = shownRaw ? new Set(JSON.parse(shownRaw)) : new Set();

  const newShown: string[] = [];

  for (const r of reminders) {
    if (shown.has(r.goal.id)) continue;
    newShown.push(r.goal.id);

    const title =
      r.urgency === "overdue" ? "⚠️ Goal Overdue" :
      r.urgency === "today" ? "🔔 Due Today" :
      r.urgency === "tomorrow" ? "📅 Due Tomorrow" :
      "📋 Due This Week";

    toastFn({
      title,
      description: r.message,
      variant: r.urgency === "overdue" ? "destructive" : "default",
    });
  }

  if (newShown.length > 0) {
    const all = [...shown, ...newShown];
    sessionStorage.setItem(shownKey, JSON.stringify(all));
  }
}
