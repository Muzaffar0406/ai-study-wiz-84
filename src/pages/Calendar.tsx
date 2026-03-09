import { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import { AppLayout, PageHeader, PageContent, useLayout } from "@/components/AppLayout";
import { AddTaskDialog } from "@/components/AddTaskDialog";
import { fetchTasks, toggleTaskCompleted, deleteTask } from "@/lib/database";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import type { DbTask } from "@/lib/database";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const DnDCalendar = withDragAndDrop(BigCalendar);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: "task" | "study";
    task?: DbTask;
    priority?: string;
    completed?: boolean;
  };
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "hsl(0 72% 60%)",
  medium: "hsl(230 45% 65%)",
  low: "hsl(165 60% 48%)",
};

const CalendarContent = () => {
  const { user, isMobile } = useLayout();
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [studySessions, setStudySessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<(typeof Views)[keyof typeof Views]>(isMobile ? Views.WEEK : Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [taskData, sessionData] = await Promise.all([
        fetchTasks(),
        supabase
          .from("study_sessions")
          .select("*")
          .eq("user_id", user.id)
          .not("completed_at", "is", null)
          .then(({ data }) => data ?? []),
      ]);
      setTasks(taskData);
      setStudySessions(sessionData);
    } catch (err) {
      console.error("Failed to load calendar data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const events: CalendarEvent[] = useMemo(() => {
    const taskEvents: CalendarEvent[] = tasks
      .filter((t) => t.due_date)
      .map((t) => {
        const dateStr = t.due_date!;
        let startDate: Date;
        if (t.due_time) {
          startDate = new Date(`${dateStr}T${t.due_time}`);
        } else {
          startDate = new Date(`${dateStr}T09:00:00`);
        }
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        return {
          id: t.id,
          title: t.title,
          start: startDate,
          end: endDate,
          resource: { type: "task" as const, task: t, priority: t.priority, completed: t.completed },
        };
      });

    const sessionEvents: CalendarEvent[] = studySessions.map((s) => {
      const start = new Date(s.started_at);
      const end = s.completed_at
        ? new Date(s.completed_at)
        : new Date(start.getTime() + s.duration_minutes * 60 * 1000);
      return {
        id: s.id,
        title: `📚 ${s.duration_minutes}min ${s.session_type}`,
        start,
        end,
        resource: { type: "study" as const },
      };
    });

    return [...taskEvents, ...sessionEvents];
  }, [tasks, studySessions]);

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setSelectedDate(start);
    setAddTaskOpen(true);
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleEventDrop = useCallback(
    async ({ event, start }: { event: CalendarEvent; start: Date; end: Date }) => {
      if (event.resource.type !== "task") return;
      const newDate = format(start, "yyyy-MM-dd");
      const newTime = format(start, "HH:mm");

      setTasks((prev) =>
        prev.map((t) => (t.id === event.id ? { ...t, due_date: newDate, due_time: newTime } : t))
      );

      try {
        const { error } = await supabase
          .from("tasks")
          .update({ due_date: newDate, due_time: newTime, updated_at: new Date().toISOString() })
          .eq("id", event.id);
        if (error) throw error;
        toast({ title: "Task moved ✅", description: `Moved to ${format(start, "PPP")}` });
      } catch {
        loadData();
        toast({ title: "Error", description: "Failed to move task.", variant: "destructive" });
      }
    },
    [loadData]
  );

  const handleToggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const newCompleted = !task.completed;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t)));
    try {
      await toggleTaskCompleted(id, newCompleted);
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !newCompleted } : t)));
    }
    setSelectedEvent(null);
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedEvent(null);
    try {
      await deleteTask(id);
    } catch {
      loadData();
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    if (event.resource.type === "study") {
      return {
        style: {
          backgroundColor: "hsl(165 60% 48% / 0.2)",
          color: "hsl(165 60% 30%)",
          border: "1px solid hsl(165 60% 48% / 0.4)",
          borderRadius: "6px",
          fontSize: "12px",
        },
      };
    }

    const priority = event.resource.priority || "medium";
    const completed = event.resource.completed;

    return {
      style: {
        backgroundColor: completed
          ? "hsl(220 18% 93% / 0.6)"
          : `${PRIORITY_COLORS[priority]}20`,
        color: completed ? "hsl(215 15% 55%)" : PRIORITY_COLORS[priority],
        border: `1px solid ${completed ? "hsl(220 20% 90%)" : `${PRIORITY_COLORS[priority]}60`}`,
        borderRadius: "6px",
        fontSize: "12px",
        textDecoration: completed ? "line-through" : "none",
        opacity: completed ? 0.6 : 1,
      },
    };
  };

  return (
    <>
      <PageHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-foreground flex items-center gap-2`}>
              <CalendarDays className="h-6 w-6 text-primary" />
              Calendar
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              View tasks and study sessions on your schedule
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AddTaskDialog
              onTaskAdded={loadData}
              open={addTaskOpen}
              onOpenChange={(open) => {
                setAddTaskOpen(open);
                if (!open) setSelectedDate(null);
              }}
              defaultDate={selectedDate ?? undefined}
            />
          </div>
        </div>
      </PageHeader>

        <div className={`${isMobile ? "p-4" : "p-8"}`}>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-4 sm:p-6 shadow-[var(--shadow-soft)] border border-border/30 calendar-wrapper">
              {/* Legend */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="text-xs text-muted-foreground">High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-accent" />
                  <span className="text-xs text-muted-foreground">Medium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Low</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-primary/30" />
                  <span className="text-xs text-muted-foreground">Study Session</span>
                </div>
              </div>

              <DnDCalendar
                localizer={localizer}
                events={events}
                view={view}
                onView={(v) => setView(v)}
                date={currentDate}
                onNavigate={setCurrentDate}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={(event) => handleSelectEvent(event as CalendarEvent)}
                onEventDrop={(args) => handleEventDrop(args as any)}
                selectable
                resizable={false}
                style={{ height: isMobile ? 500 : 650 }}
                eventPropGetter={(event) => eventStyleGetter(event as CalendarEvent)}
                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                popup
                step={30}
                timeslots={2}
              />
            </div>
          )}
        </div>
      </main>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent?.resource.type === "task" ? "Task Details" : "Study Session"}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent?.resource.type === "task" && selectedEvent.resource.task && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedEvent.resource.task.completed}
                  onCheckedChange={() => handleToggleTask(selectedEvent.id)}
                  className="h-5 w-5"
                />
                <span
                  className={`font-semibold ${
                    selectedEvent.resource.task.completed ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {selectedEvent.resource.task.title}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedEvent.resource.task.subject && (
                  <Badge variant="secondary">{selectedEvent.resource.task.subject}</Badge>
                )}
                <Badge
                  variant="outline"
                  className={
                    selectedEvent.resource.task.priority === "high"
                      ? "text-destructive border-destructive/30"
                      : selectedEvent.resource.task.priority === "medium"
                      ? "text-accent border-accent/30"
                      : "text-primary border-primary/30"
                  }
                >
                  {selectedEvent.resource.task.priority} priority
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {selectedEvent.resource.task.due_date && (
                  <p>📅 {format(new Date(selectedEvent.resource.task.due_date + "T00:00:00"), "PPP")}</p>
                )}
                {selectedEvent.resource.task.due_time && <p>🕐 {selectedEvent.resource.task.due_time}</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleTask(selectedEvent.id)}
                >
                  {selectedEvent.resource.task.completed ? "Mark Incomplete" : "Mark Complete"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteTask(selectedEvent.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
          {selectedEvent?.resource.type === "study" && (
            <div className="pt-2">
              <p className="text-foreground font-medium">{selectedEvent.title}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {format(selectedEvent.start, "PPP p")} – {format(selectedEvent.end, "p")}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AIChatBot open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default CalendarPage;
