import { useState, useEffect, useRef } from "react";
import { StatCard } from "@/components/StatCard";
import { QuickActionButton } from "@/components/QuickActionButton";
import { TaskCard } from "@/components/TaskCard";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { AIChatBot } from "@/components/AIChatBot";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { fetchTasks, toggleTaskCompleted, deleteTask, fetchProfile } from "@/lib/database";
import { 
  CheckSquare, Clock, Flame, Timer, Plus, Bot, Target, TrendingUp
} from "lucide-react";
import type { DbTask } from "@/lib/database";

const Index = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const timerRef = useRef<HTMLDivElement>(null);

  const reloadTasks = () => {
    fetchTasks().then(setTasks).catch(console.error);
  };

  useEffect(() => {
    if (!user) return;
    reloadTasks();
    fetchProfile(user.id).then(setProfile).catch(console.error);
  }, [user]);

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

  const stats = {
    tasksToday: incompleteTasks,
    studyHours: "4.5h",
    streak: 12,
    completionRate: tasks.length ? `${Math.round((completedTasks / tasks.length) * 100)}%` : "0%",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <AppSidebar displayName={displayName} avatarUrl={avatarUrl} onAIClick={() => setChatOpen(true)} />

      {/* Main Content */}
      <main className="ml-[240px] min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Welcome back, {displayName} 👋
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {incompleteTasks > 0
                  ? `You have ${incompleteTasks} pending task${incompleteTasks > 1 ? 's' : ''} today`
                  : "All caught up! Great work."}
              </p>
            </div>
            <AddTaskDialog onTaskAdded={reloadTasks} open={addTaskOpen} onOpenChange={setAddTaskOpen} />
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Tasks Left" value={stats.tasksToday} icon={CheckSquare} gradient="primary" />
            <StatCard title="Study Hours" value={stats.studyHours} icon={Clock} trend="+1.2h" gradient="accent" />
            <StatCard title="Day Streak" value={`${stats.streak} 🔥`} icon={Flame} gradient="success" />
            <StatCard title="Completion" value={stats.completionRate} icon={TrendingUp} trend="+5%" gradient="primary" />
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

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tasks */}
            <div className="lg:col-span-2 space-y-4">
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
                  <div className="bg-card rounded-2xl p-10 text-center shadow-[var(--shadow-soft)]">
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
                    dueTime={task.due_time || ""}
                    completed={task.completed}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="space-y-4" ref={timerRef}>
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Focus Timer</h3>
              </div>
              <PomodoroTimer />
            </div>
          </div>
        </div>
      </main>

      {/* AI Chat */}
      <AIChatBot open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default Index;