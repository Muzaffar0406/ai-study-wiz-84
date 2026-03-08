import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "@/components/StatCard";
import { QuickActionButton } from "@/components/QuickActionButton";
import { TaskCard } from "@/components/TaskCard";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { AIChatBot } from "@/components/AIChatBot";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { useAuth } from "@/hooks/useAuth";
import { fetchTasks, toggleTaskCompleted, deleteTask, fetchProfile } from "@/lib/database";
import { 
  CheckSquare, Clock, Flame, Timer, Plus, Bot, BookOpen, Target, TrendingUp, LogOut, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { DbTask } from "@/lib/database";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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
      {/* Ambient background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-success/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 border-b">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-extrabold text-gradient">
              StudyPlanner AI
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground hidden sm:inline">{displayName}</span>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="container mx-auto px-6 py-14 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-muted-foreground mb-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            AI-Powered Study Planning
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold animate-fade-in-up leading-tight">
            Welcome back, <span className="text-gradient-animated">{displayName}</span>! 👋
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto animate-fade-in">
            {incompleteTasks > 0 
              ? `You have ${incompleteTasks} task${incompleteTasks > 1 ? 's' : ''} to crush today. Let's go!`
              : "All caught up! Add new tasks or start a focus session."
            }
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8 space-y-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Tasks Left" value={stats.tasksToday} icon={CheckSquare} gradient="primary" />
          <StatCard title="Study Hours" value={stats.studyHours} icon={Clock} trend="+1.2h" gradient="accent" />
          <StatCard title="Day Streak" value={`${stats.streak} 🔥`} icon={Flame} gradient="success" />
          <StatCard title="Completion" value={stats.completionRate} icon={TrendingUp} trend="+5%" gradient="primary" />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickActionButton icon={Timer} label="Start Focus Timer" onClick={() => timerRef.current?.scrollIntoView({ behavior: "smooth" })} variant="primary" />
            <QuickActionButton icon={Plus} label="Add New Task" onClick={() => setAddTaskOpen(true)} variant="accent" />
            <QuickActionButton icon={Bot} label="Ask AI Assistant" onClick={() => setChatOpen(true)} variant="success" />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tasks Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                Today's Focus
                {incompleteTasks > 0 && (
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-1">
                    {incompleteTasks}
                  </span>
                )}
              </h3>
              <AddTaskDialog onTaskAdded={reloadTasks} open={addTaskOpen} onOpenChange={setAddTaskOpen} />
            </div>
            <div className="space-y-2">
              {tasks.length === 0 && (
                <div className="glass rounded-2xl p-12 text-center space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                    <CheckSquare className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
                  <p className="text-xs text-muted-foreground">Click "Add Task" to get started</p>
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

          {/* Timer Column */}
          <div className="space-y-4" ref={timerRef}>
            <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Timer className="h-4 w-4 text-accent" />
              </div>
              Focus Timer
            </h3>
            <PomodoroTimer />
          </div>
        </div>

        {/* AI Tips Section */}
        <div className="glass rounded-2xl p-6 border-primary/10 relative overflow-hidden">
          <div className="absolute inset-0 shimmer pointer-events-none" />
          <div className="relative flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 animate-pulse-glow">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-base font-bold text-foreground">AI Study Tip</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Based on your study patterns, try the Pomodoro technique with 25-minute focus sessions. 
                Your peak productivity is between 2–4 PM — schedule your hardest tasks then!
              </p>
              <Button variant="outline" size="sm" className="mt-2 rounded-lg" onClick={() => setChatOpen(true)}>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Get More Insights
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Assistant */}
      <AIChatBot open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default Index;