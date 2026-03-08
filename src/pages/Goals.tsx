import { useState, useEffect, useCallback } from "react";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { AIChatBot } from "@/components/AIChatBot";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchProfile } from "@/lib/database";
import {
  fetchGoals, createGoal, updateGoalProgress, deleteGoal,
  getGoalProgress, isGoalExpired, isGoalComplete, syncGoalProgress,
  showGoalReminders, GOAL_TYPES, type Goal,
} from "@/lib/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Target, Plus, Loader2, Trash2, Clock, CheckSquare,
  GraduationCap, Trophy, AlertCircle, TrendingUp, Pencil,
} from "lucide-react";

const typeIcons: Record<string, React.ElementType> = {
  weekly_study: Clock,
  daily_tasks: CheckSquare,
  exam_prep: GraduationCap,
};

const Goals = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { collapsed } = useSidebarState();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newType, setNewType] = useState("weekly_study");
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  // Update dialog
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editValue, setEditValue] = useState("");

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchGoals(user.id);
      const synced = await syncGoalProgress(user.id, data);
      setGoals(synced);
      showGoalReminders(synced, toast);
    } catch (err) {
      console.error("Failed to load goals:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadData();
    fetchProfile(user.id).then(setProfile).catch(console.error);
  }, [user, loadData]);

  const handleCreate = async () => {
    if (!user || !newTitle.trim() || !newTarget) return;
    setSaving(true);
    try {
      await createGoal({
        user_id: user.id,
        type: newType,
        title: newTitle.trim(),
        target_value: parseFloat(newTarget),
        deadline: newDeadline ? new Date(newDeadline).toISOString() : null,
      });
      toast({ title: "Goal created!", description: "Track your progress towards this goal." });
      setAddOpen(false);
      setNewTitle("");
      setNewTarget("");
      setNewDeadline("");
      loadData();
    } catch (err) {
      toast({ title: "Error", description: "Failed to create goal.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!editGoal || !editValue) return;
    try {
      await updateGoalProgress(editGoal.id, parseFloat(editValue));
      toast({ title: "Progress updated!" });
      setEditGoal(null);
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      toast({ title: "Goal deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    }
  };

  const activeGoals = goals.filter(g => !isGoalComplete(g) && !isGoalExpired(g));
  const completedGoals = goals.filter(g => isGoalComplete(g));
  const expiredGoals = goals.filter(g => isGoalExpired(g) && !isGoalComplete(g));
  const overallProgress = goals.length
    ? Math.round(goals.reduce((sum, g) => sum + getGoalProgress(g), 0) / goals.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar displayName={displayName} avatarUrl={avatarUrl} onAIClick={() => setChatOpen(true)} />

      <main className={`min-h-screen transition-all duration-300 ${isMobile ? "" : collapsed ? "ml-[68px]" : "ml-[240px]"}`}>
        <header className={`sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 py-4 ${isMobile ? "px-4 pt-14" : "px-8"}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-foreground flex items-center gap-2`}>
                <Target className="h-6 w-6 text-primary" /> Goals
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {goals.length} goal{goals.length !== 1 ? "s" : ""} · {overallProgress}% overall progress
              </p>
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Goal</DialogTitle>
                  <DialogDescription>Set a target and track your progress.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Goal Type</Label>
                    <Select value={newType} onValueChange={setNewType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GOAL_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input placeholder="e.g. Study 20 hours this week" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label>Target Value ({GOAL_TYPES.find(t => t.value === newType)?.unit})</Label>
                    <Input type="number" min="1" placeholder="e.g. 20" value={newTarget} onChange={e => setNewTarget(e.target.value)} />
                  </div>
                  <div>
                    <Label>Deadline (optional)</Label>
                    <Input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} />
                  </div>
                  <Button onClick={handleCreate} disabled={saving || !newTitle.trim() || !newTarget} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className={`${isMobile ? "p-4" : "p-8"} space-y-8`}>
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : goals.length === 0 ? (
            <div className="bg-card rounded-2xl p-10 text-center shadow-[var(--shadow-soft)]">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">No goals yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first goal to start tracking progress.</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={Target} label="Total Goals" value={goals.length} color="primary" />
                <SummaryCard icon={TrendingUp} label="Active" value={activeGoals.length} color="accent" />
                <SummaryCard icon={Trophy} label="Completed" value={completedGoals.length} color="success" />
                <SummaryCard icon={AlertCircle} label="Expired" value={expiredGoals.length} color="destructive" />
              </div>

              {/* Active Goals */}
              {activeGoals.length > 0 && (
                <GoalSection title="Active Goals" goals={activeGoals} onEdit={g => { setEditGoal(g); setEditValue(String(g.current_value)); }} onDelete={handleDelete} />
              )}

              {/* Completed Goals */}
              {completedGoals.length > 0 && (
                <GoalSection title="Completed 🎉" goals={completedGoals} onEdit={g => { setEditGoal(g); setEditValue(String(g.current_value)); }} onDelete={handleDelete} />
              )}

              {/* Expired Goals */}
              {expiredGoals.length > 0 && (
                <GoalSection title="Expired" goals={expiredGoals} onEdit={g => { setEditGoal(g); setEditValue(String(g.current_value)); }} onDelete={handleDelete} />
              )}
            </>
          )}
        </div>
      </main>

      {/* Edit Progress Dialog */}
      <Dialog open={!!editGoal} onOpenChange={open => { if (!open) setEditGoal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>{editGoal?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Current Value (target: {editGoal?.target_value})</Label>
              <Input type="number" min="0" value={editValue} onChange={e => setEditValue(e.target.value)} />
            </div>
            <Button onClick={handleUpdateProgress} className="w-full">Save Progress</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AIChatBot open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] border border-border/50">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl bg-${color}/10 flex items-center justify-center`}>
          <Icon className={`h-5 w-5 text-${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function GoalSection({ title, goals, onEdit, onDelete }: { title: string; goals: Goal[]; onEdit: (g: Goal) => void; onDelete: (id: string) => void }) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
      <div className="grid gap-3">
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} onEdit={() => onEdit(goal)} onDelete={() => onDelete(goal.id)} />
        ))}
      </div>
    </div>
  );
}

function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: () => void; onDelete: () => void }) {
  const progress = getGoalProgress(goal);
  const complete = isGoalComplete(goal);
  const expired = isGoalExpired(goal);
  const Icon = typeIcons[goal.type] || Target;
  const typeInfo = GOAL_TYPES.find(t => t.value === goal.type);

  return (
    <div className={`bg-card rounded-2xl p-5 shadow-[var(--shadow-soft)] border transition-all ${
      complete ? "border-primary/30 bg-primary/5" : expired ? "border-destructive/30" : "border-border/50"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            complete ? "bg-primary/10" : expired ? "bg-destructive/10" : "bg-accent/10"
          }`}>
            <Icon className={`h-5 w-5 ${complete ? "text-primary" : expired ? "text-destructive" : "text-accent"}`} />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-foreground truncate">{goal.title}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-xs">{typeInfo?.label}</Badge>
              {goal.deadline && (
                <span className="text-xs text-muted-foreground">Due {format(new Date(goal.deadline), "MMM d, yyyy")}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {goal.current_value} / {goal.target_value} {typeInfo?.unit}
          </span>
          <span className={`font-bold ${complete ? "text-primary" : expired ? "text-destructive" : "text-foreground"}`}>
            {progress}%
          </span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      {complete && (
        <div className="mt-3 flex items-center gap-1.5 text-sm text-primary font-medium">
          <Trophy className="h-4 w-4" /> Goal achieved!
        </div>
      )}
      {expired && !complete && (
        <div className="mt-3 flex items-center gap-1.5 text-sm text-destructive font-medium">
          <AlertCircle className="h-4 w-4" /> Deadline passed
        </div>
      )}
    </div>
  );
}

export default Goals;
