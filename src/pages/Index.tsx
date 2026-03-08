import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { QuickActionButton } from "@/components/QuickActionButton";
import { TaskCard } from "@/components/TaskCard";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { AIChatBot } from "@/components/AIChatBot";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarState } from "@/hooks/useSidebarState";
import { fetchTasks, toggleTaskCompleted, deleteTask, fetchProfile, fetchTodayStudyStats, fetchStudyStreak } from "@/lib/database";
import { fetchGoals, syncGoalProgress, showGoalReminders, getGoalProgress, isGoalComplete, isGoalExpired, type Goal } from "@/lib/goals";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { 
  CheckSquare, Clock, Flame, Timer, Plus, Bot, Target, TrendingUp
} from "lucide-react";
import type { DbTask } from "@/lib/database";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { collapsed } = useSidebarState();
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [studyMinutes, setStudyMinutes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const timerRef = useRef<HTMLDivElement>(null);

  const reloadTasks = () => {
    fetchTasks().then(setTasks).catch(console.error);
  };

  const reloadStats = useCallback(() => {
    if (!user) return;
    fetchTodayStudyStats(user.id).then(s => setStudyMinutes(s.totalMinutes)).catch(console.error);
    fetchStudyStreak(user.id).then(setStreak).catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    reloadTasks();
    reloadStats();
    fetchProfile(user.id).then(setProfile).catch(console.error);
    fetchGoals(user.id).then(g => syncGoalProgress(user.id, g)).then(setGoals).catch(console.error);
  }, [user, reloadStats]);

  const handleToggle = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newCompleted = !task.completed;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    try {
      await toggleTaskCompleted(id, newCompleted);
    } catch {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !newCompleted } : t));
    }
  };

  const handleDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await deleteTask(id);
    } catch {
      reloadTasks();
    }
  };

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const incompleteTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;

  const formatStudyTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const completionRate = tasks.length ? `${Math.round((completedTasks / tasks.length) * 100)}%` : "0%";

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar displayName={displayName} avatarUrl={avatarUrl} onAIClick={() => setChatOpen(true)} />

      <main className={`min-h-screen transition-all duration-300 ${isMobile ? '' : collapsed ? 'ml-[68px]' : 'ml-[240px]'}`}>
        {/* Top bar */}
        <header className={`sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 py-4 ${isMobile ? 'px-4 pt-14' : 'px-8'}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground truncate`}>
                Welcome back, {displayName} 👋
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {incompleteTasks > 0
                  ? `You have ${incompleteTasks} pending task${incompleteTasks > 1 ? 's' : ''}`
                  : "All caught up! Great work."}
              </p>
            </div>
            <div className="flex-shrink-0">
              <AddTaskDialog onTaskAdded={reloadTasks} open={addTaskOpen} onOpenChange={setAddTaskOpen} />
            </div>
          </div>
        </header>

        <div className={`space-y-6 ${isMobile ? 'p-4' : 'p-8 space-y-8'}`}>
          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <StatCard title="Tasks Left" value={incompleteTasks} icon={CheckSquare} gradient="primary" />
            <StatCard title="Study Time" value={formatStudyTime(studyMinutes)} icon={Clock} gradient="accent" />
            <StatCard title="Day Streak" value={streak > 0 ? `${streak} 🔥` : "0"} icon={Flame} gradient="success" />
            <StatCard title="Completion" value={completionRate} icon={TrendingUp} gradient="primary" />
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuickActionButton icon={Timer} label="Start Focus Timer" onClick={() => timerRef.current?.scrollIntoView({ behavior: "smooth" })} variant="primary" />
              <QuickActionButton icon={Plus} label="Add New Task" onClick={() => setAddTaskOpen(true)} variant="accent" />
              <QuickActionButton icon={Bot} label="Ask AI Assistant" onClick={() => setChatOpen(true)} variant="success" />
            </div>
          </div>

          {/* Goal Progress */}
          {goals.filter(g => !isGoalComplete(g) && !isGoalExpired(g)).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Goal Progress</h3>
                <button onClick={() => navigate("/goals")} className="text-xs text-primary hover:underline font-medium">View All</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {goals.filter(g => !isGoalComplete(g) && !isGoalExpired(g)).slice(0, 3).map(goal => {
                  const progress = getGoalProgress(goal);
                  return (
                    <div key={goal.id} className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-foreground truncate">{goal.title}</h4>
                        <span className="text-xs font-bold text-primary">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {goal.current_value} / {goal.target_value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content Grid */}
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3 gap-8'}`}>
            {/* Tasks */}
            <div className={`${isMobile ? '' : 'lg:col-span-2'} space-y-3`}>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Today's Tasks</h3>
                {incompleteTasks > 0 && (
                  <span className="text-xs font-bold text-primary-foreground bg-primary px-2 py-0.5 rounded-full">
                    {incompleteTasks}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {tasks.length === 0 && (
                  <div className="bg-card rounded-2xl p-8 sm:p-10 text-center shadow-[var(--shadow-soft)]">
                    <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Click "Add Task" to get started</p>
                  </div>
                )}
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    subject={task.subject}
                    priority={task.priority}
                    dueDate={task.due_date || undefined}
                    dueTime={task.due_time || ""}
                    completed={task.completed}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="space-y-3" ref={timerRef}>
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Focus Timer</h3>
              </div>
              <PomodoroTimer onSessionComplete={reloadStats} />
            </div>
          </div>
        </div>
      </main>

      <AIChatBot open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default Index;