import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface TaskCardProps {
  id: string;
  title: string;
  subject: string;
  priority: "high" | "medium" | "low";
  dueDate?: string;
  dueTime: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TaskCard = ({ 
  id, title, subject, priority, dueDate, dueTime, completed, onToggle, onDelete
}: TaskCardProps) => {
  const priorityConfig = {
    high: { color: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive" },
    medium: { color: "bg-accent/10 text-accent border-accent/20", dot: "bg-accent" },
    low: { color: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" },
  };

  const p = priorityConfig[priority];

  return (
    <div className={`bg-card rounded-xl p-4 shadow-[var(--shadow-soft)] card-hover group ${completed ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-4">
        <Checkbox 
          checked={completed} 
          onCheckedChange={() => onToggle(id)}
          className="h-5 w-5 rounded-md border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {title}
          </h4>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {subject && (
              <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0 h-5 rounded-md">
                {subject}
              </Badge>
            )}
            <Badge variant="outline" className={`${p.color} text-[11px] font-medium px-2 py-0 h-5 rounded-md border`}>
              <span className={`${p.dot} h-1.5 w-1.5 rounded-full mr-1 inline-block`} />
              {priority}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {dueDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium whitespace-nowrap">
              <Calendar className="h-3 w-3" />{format(new Date(dueDate + "T00:00:00"), "MMM d")}
            </span>
          )}
          {dueTime && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium whitespace-nowrap">
              <Clock className="h-3 w-3" />{dueTime}
            </span>
          )}
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};