import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { QuickActionButton } from "@/components/QuickActionButton";
import { TaskCard } from "@/components/TaskCard";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { AIChatBot } from "@/components/AIChatBot";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { useAuth } from "@/hooks/useAuth";
import { fetchTasks, toggleTaskCompleted, fetchProfile } from "@/lib/database";
import { 
  CheckSquare, Clock, Flame, Timer, Plus, Bot, BookOpen, Target, Calendar, TrendingUp, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import heroImage from "@/assets/hero-study.jpg";
import type { DbTask } from "@/lib/database";

const Index = () => {
  const { user, signOut } = useAuth();
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

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

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const incompleteTasks = tasks.filter(t => !t.completed).length;

  const stats = {
    tasksToday: incompleteTasks,
    studyHours: "4.5h",
    streak: 12,
    completionRate: tasks.length ? `${Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%` : "0%",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              StudyPlanner AI
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">View Calendar</span>
            </Button>
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-success/10" />
        <div 
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative container mx-auto px-4 py-16 text-center space-y-6">
          <h2 className="text-5xl font-bold animate-fade-in-up">
            Welcome back, {displayName}! 👋
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
            Let's make today productive. You have {stats.tasksToday} tasks to complete.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Tasks Today" value={stats.tasksToday} icon={CheckSquare} gradient="primary" />
          <StatCard title="Study Hours" value={stats.studyHours} icon={Clock} trend="+1.2h" gradient="accent" />
          <StatCard title="Study Streak" value={`${stats.streak} days`} icon={Flame} gradient="success" />
          <StatCard title="Completion Rate" value={stats.completionRate} icon={TrendingUp} trend="+5%" gradient="primary" />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickActionButton icon={Timer} label="Start Study Timer" onClick={() => {}} variant="primary" />
            <QuickActionButton icon={Plus} label="Add New Task" onClick={() => {}} variant="accent" />
            <QuickActionButton icon={Bot} label="Ask AI Assistant" onClick={() => {}} variant="success" />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Today's Focus
              </h3>
              <AddTaskDialog onTaskAdded={reloadTasks} />
            </div>
            <div className="space-y-3">
              {tasks.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No tasks yet. Add your first task!</p>
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
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Focus Timer</h3>
            <PomodoroTimer />
          </div>
        </div>

        {/* AI Tips Section */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 border border-primary/10">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 animate-pulse-glow">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">AI Study Tip of the Day</h3>
              <p className="text-muted-foreground">
                Based on your study patterns, try using the Pomodoro technique with 25-minute focus sessions. 
                Your peak productivity time is between 2-4 PM - schedule your hardest tasks then!
              </p>
              <Button variant="outline" className="mt-4">Get More AI Insights</Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Assistant */}
      <AIChatBot />
    </div>
  );
};

export default Index;
