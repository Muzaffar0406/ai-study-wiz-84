import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { upsertTask } from "@/lib/database";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface AddTaskDialogProps {
  onTaskAdded: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddTaskDialog({ onTaskAdded, open: controlledOpen, onOpenChange }: AddTaskDialogProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [dueTime, setDueTime] = useState("");

  const reset = () => {
    setTitle("");
    setSubject("");
    setPriority("medium");
    setDueTime("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setLoading(true);
    try {
      await upsertTask({
        user_id: user.id,
        title: title.trim(),
        subject: subject.trim(),
        priority,
        due_time: dueTime.trim() || null,
      });
      toast({ title: "Task added ✅", description: title.trim() });
      reset();
      setOpen(false);
      onTaskAdded();
    } catch {
      toast({ title: "Error", description: "Could not add task.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary">
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="e.g. Complete Math Assignment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-subject">Subject</Label>
            <Input
              id="task-subject"
              placeholder="e.g. Mathematics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as "high" | "medium" | "low")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due Time</Label>
              <Input
                id="task-due"
                placeholder="e.g. 2:00 PM"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                maxLength={50}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={!title.trim() || loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Task
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
