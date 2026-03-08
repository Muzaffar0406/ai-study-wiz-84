import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Flag, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TaskCardProps {
  id: string;
  title: string;
  subject: string;
  priority: "high" | "medium" | "low";
  dueTime: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TaskCard = ({ 
  id, title, subject, priority, dueTime, completed, onToggle, onDelete
}: TaskCardProps) => {
  const priorityColors = {
    high: "bg-destructive text-destructive-foreground",
    medium: "bg-accent text-accent-foreground",
    low: "bg-success text-success-foreground",
  };

  return (
    <Card className={`p-4 hover:shadow-md transition-all duration-300 group ${completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={completed} 
          onCheckedChange={() => onToggle(id)}
          className="mt-1"
        />
        <div className="flex-1 space-y-2">
          <h4 className={`font-semibold ${completed ? 'line-through' : ''}`}>
            {title}
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">{subject}</Badge>
            <Badge className={`${priorityColors[priority]} text-xs`}>
              <Flag className="h-3 w-3 mr-1" />{priority}
            </Badge>
            {dueTime && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /><span>{dueTime}</span>
              </div>
            )}
          </div>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};
