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
