import { useState, useEffect, useMemo } from "react";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { AIChatBot } from "@/components/AIChatBot";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { TaskCard } from "@/components/TaskCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchTasks, toggleTaskCompleted, deleteTask, fetchProfile } from "@/lib/database";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Loader2, ArrowUpDown, Filter, X } from "lucide-react";
import type { DbTask } from "@/lib/database";

type SortOption = "newest" | "oldest" | "priority" | "due_time" | "subject";
type FilterPriority = "all" | "high" | "medium" | "low";

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

const Tasks = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { collapsed } = useSidebarState();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then(setProfile).catch(console.error);
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

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
      loadTasks();
    }
  };

  // Unique subjects for filter
  const subjects = useMemo(() => {
    const s = new Set(tasks.map(t => t.subject).filter(Boolean));
    return Array.from(s).sort();
  }, [tasks]);

  // Filter + sort
  const processedTasks = useMemo(() => {
    let filtered = [...tasks];

    if (filterPriority !== "all") {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }
    if (filterSubject !== "all") {
      filtered = filtered.filter(t => t.subject === filterSubject);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "priority":
          return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
        case "due_time": {
          const aTime = a.due_time || "99:99";
          const bTime = b.due_time || "99:99";
          return aTime.localeCompare(bTime);
        }
        case "subject":
          return (a.subject || "").localeCompare(b.subject || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, filterPriority, filterSubject, sortBy]);

  const incompleteTasks = processedTasks.filter(t => !t.completed);
  const completedTasks = processedTasks.filter(t => t.completed);

  const hasActiveFilters = filterPriority !== "all" || filterSubject !== "all";

  const clearFilters = () => {
    setFilterPriority("all");
    setFilterSubject("all");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar displayName={displayName} avatarUrl={avatarUrl} onAIClick={() => setChatOpen(true)} />

      <main className={`min-h-screen transition-all duration-300 ${isMobile ? "" : collapsed ? "ml-[68px]" : "ml-[240px]"}`}>
        <header className={`sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 py-4 ${isMobile ? "px-4 pt-14" : "px-8"}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-foreground flex items-center gap-2`}>
                <CheckSquare className="h-6 w-6 text-primary" />
                My Tasks
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {incompleteTasks.length > 0
                  ? `${incompleteTasks.length} pending task${incompleteTasks.length > 1 ? "s" : ""}`
                  : "All caught up! Great work."}
              </p>
            </div>
            <AddTaskDialog onTaskAdded={loadTasks} open={addTaskOpen} onOpenChange={setAddTaskOpen} />
          </div>
        </header>

        <div className={`${isMobile ? "p-4" : "p-8"} space-y-6`}>
          {/* Filter & Sort Bar */}
          {tasks.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] border border-border/30">
              <div className={`flex ${isMobile ? "flex-col gap-3" : "items-center gap-4 flex-wrap"}`}>
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="w-[160px] h-9 text-xs">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="due_time">Due Time</SelectItem>
                      <SelectItem value="subject">Subject</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-6 w-px bg-border/50 hidden sm:block" />

                {/* Priority Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as FilterPriority)}>
                    <SelectTrigger className="w-[140px] h-9 text-xs">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">🔴 High</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="low">🟢 Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject Filter */}
                {subjects.length > 0 && (
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger className="w-[160px] h-9 text-xs">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Active filters indicator */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors ml-auto"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear filters
                  </button>
                )}
              </div>

              {/* Results count */}
              {hasActiveFilters && (
                <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Showing {processedTasks.length} of {tasks.length} tasks</span>
                  {filterPriority !== "all" && (
                    <Badge variant="secondary" className="text-[11px] h-5 gap-1">
                      {filterPriority} priority
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterPriority("all")} />
                    </Badge>
                  )}
                  {filterSubject !== "all" && (
                    <Badge variant="secondary" className="text-[11px] h-5 gap-1">
                      {filterSubject}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterSubject("all")} />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-card rounded-2xl p-10 text-center shadow-[var(--shadow-soft)]">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-foreground">No tasks yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Add Task" to get started</p>
            </div>
          ) : processedTasks.length === 0 ? (
            <div className="bg-card rounded-2xl p-10 text-center shadow-[var(--shadow-soft)]">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium text-foreground">No tasks match your filters</p>
              <button onClick={clearFilters} className="text-sm text-primary hover:underline mt-2">
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              {incompleteTasks.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Pending ({incompleteTasks.length})
                  </h2>
                  <div className="space-y-2">
                    {incompleteTasks.map(task => (
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
              )}

              {completedTasks.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Completed ({completedTasks.length})
                  </h2>
                  <div className="space-y-2 opacity-70">
                    {completedTasks.map(task => (
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
              )}
            </>
          )}
        </div>
      </main>

      <AIChatBot open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default Tasks;
