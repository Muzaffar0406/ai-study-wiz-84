import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { QuickActionButton } from "@/components/QuickActionButton";
import { TaskCard } from "@/components/TaskCard";
import { PomodoroTimer } from "@/components/PomodoroTimer";
import { 
  CheckSquare, 
  Clock, 
  Flame, 
  Timer, 
  Plus, 
  Bot,
  BookOpen,
  Target,
  Calendar,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIChatBot } from "@/components/AIChatBot";
import heroImage from "@/assets/hero-study.jpg";

interface Task {
  id: string;
  title: string;
  subject: string;
  priority: "high" | "medium" | "low";
  dueTime: string;
  completed: boolean;
}

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Complete Math Assignment Chapter 5",
      subject: "Mathematics",
      priority: "high",
      dueTime: "2:00 PM",
      completed: false,
    },
    {
      id: "2",
      title: "Review Biology Notes - Cell Division",
      subject: "Biology",
      priority: "medium",
      dueTime: "4:30 PM",
      completed: false,
    },
    {
      id: "3",
      title: "Prepare Physics Lab Report",
      subject: "Physics",
      priority: "high",
      dueTime: "Tomorrow",
      completed: false,
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const stats = {
    tasksToday: tasks.filter(t => !t.completed).length,
    studyHours: "4.5h",
    streak: 12,
    completionRate: "85%",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              StudyPlanner AI
            </h1>
          </div>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            View Calendar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-success/10" />
        <div 
          className="absolute inset-0 opacity-5"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative container mx-auto px-4 py-16 text-center space-y-6">
          <h2 className="text-5xl font-bold animate-fade-in-up">
            Welcome back, Student! 👋
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
            Let's make today productive. You have {stats.tasksToday} tasks to complete.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Tasks Today"
            value={stats.tasksToday}
            icon={CheckSquare}
            gradient="primary"
          />
          <StatCard
            title="Study Hours"
            value={stats.studyHours}
            icon={Clock}
            trend="+1.2h"
            gradient="accent"
          />
          <StatCard
            title="Study Streak"
            value={`${stats.streak} days`}
            icon={Flame}
            gradient="success"
          />
          <StatCard
            title="Completion Rate"
            value={stats.completionRate}
            icon={TrendingUp}
            trend="+5%"
            gradient="primary"
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickActionButton
              icon={Timer}
              label="Start Study Timer"
              onClick={() => {}}
              variant="primary"
            />
            <QuickActionButton
              icon={Plus}
              label="Add New Task"
              onClick={() => {}}
              variant="accent"
            />
            <QuickActionButton
              icon={Bot}
              label="Ask AI Assistant"
              onClick={() => {}}
              variant="success"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tasks Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Today's Focus
              </h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard key={task.id} {...task} onToggle={toggleTask} />
              ))}
            </div>
          </div>

          {/* Pomodoro Timer */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Focus Timer</h3>
            <PomodoroTimer />
          </div>
        </div>

        {/* AI Tips Section */}
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 border border-primary/10">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 animate-pulse-glow">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">AI Study Tip of the Day</h3>
              <p className="text-muted-foreground">
                Based on your study patterns, try using the Pomodoro technique with 25-minute focus sessions. 
                Your peak productivity time is between 2-4 PM - schedule your hardest tasks then!
              </p>
              <Button variant="outline" className="mt-4">
                Get More AI Insights
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Assistant Button */}
      <Button 
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-gradient-to-r from-accent to-accent-glow shadow-lg hover:shadow-xl hover:scale-110 transition-all animate-float"
        size="icon"
      >
        <Bot className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
};

export default Index;
