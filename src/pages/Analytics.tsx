import { useState, useEffect, useCallback } from "react";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { AIChatBot } from "@/components/AIChatBot";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchProfile, fetchTodayStudyStats, fetchStudyStreak } from "@/lib/database";
import {
  fetchDailyStudyHours,
  fetchWeeklyTaskCompletion,
  fetchSubjectDistribution,
  fetchStreakHistory,
  fetchWeeklyFocusSessions,
} from "@/lib/analytics";
import type {
  DailyStudyData,
  WeeklyTaskData,
  SubjectData,
  StreakDay,
  WeeklyFocusData,
} from "@/lib/analytics";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { BarChart3, Loader2, Clock, Flame, TrendingUp, Target, BookOpen } from "lucide-react";
import { format } from "date-fns";

const CHART_COLORS = [
  "hsl(165, 60%, 48%)",
  "hsl(230, 45%, 65%)",
  "hsl(0, 72%, 60%)",
  "hsl(45, 80%, 55%)",
  "hsl(280, 50%, 60%)",
  "hsl(195, 60%, 50%)",
  "hsl(330, 55%, 55%)",
  "hsl(120, 40%, 50%)",
];

const Analytics = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { collapsed } = useSidebarState();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dailyStudy, setDailyStudy] = useState<DailyStudyData[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTaskData[]>([]);
  const [subjectDist, setSubjectDist] = useState<SubjectData[]>([]);
  const [streakHistory, setStreakHistory] = useState<StreakDay[]>([]);
  const [weeklyFocus, setWeeklyFocus] = useState<WeeklyFocusData[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [streak, setStreak] = useState(0);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [daily, weekly, subjects, streakH, focus, stats, currentStreak] = await Promise.all([
        fetchDailyStudyHours(user.id, 30),
        fetchWeeklyTaskCompletion(user.id, 8),
        fetchSubjectDistribution(user.id),
        fetchStreakHistory(user.id, 30),
        fetchWeeklyFocusSessions(user.id, 8),
        fetchTodayStudyStats(user.id),
        fetchStudyStreak(user.id),
      ]);
      setDailyStudy(daily);
      setWeeklyTasks(weekly);
      setSubjectDist(subjects);
      setStreakHistory(streakH);
      setWeeklyFocus(focus);
      setTodayMinutes(stats.totalMinutes);
      setStreak(currentStreak);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchProfile(user.id).then(setProfile).catch(console.error);
    loadData();
  }, [user, loadData]);

  const totalStudyHours = Math.round(dailyStudy.reduce((sum, d) => sum + d.minutes, 0) / 60 * 10) / 10;
  const totalTasksCompleted = weeklyTasks.reduce((sum, w) => sum + w.completed, 0);
  const avgDailyMinutes = dailyStudy.length > 0
    ? Math.round(dailyStudy.reduce((sum, d) => sum + d.minutes, 0) / dailyStudy.length)
    : 0;

  const ChartCard = ({ title, icon: Icon, children, className = "" }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`bg-card rounded-2xl p-5 shadow-[var(--shadow-soft)] border border-border/30 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-[var(--shadow-medium)]">
        <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-xs text-muted-foreground">
            <span style={{ color: entry.color }}>●</span> {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar displayName={displayName} avatarUrl={avatarUrl} onAIClick={() => setChatOpen(true)} />

      <main className={`min-h-screen transition-all duration-300 ${isMobile ? "" : collapsed ? "ml-[68px]" : "ml-[240px]"}`}>
        <header className={`sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 py-4 ${isMobile ? "px-4 pt-14" : "px-8"}`}>
          <div className="min-w-0">
            <h1 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-foreground flex items-center gap-2`}>
              <BarChart3 className="h-6 w-6 text-primary" />
              Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track your study progress and productivity
            </p>
          </div>
        </header>

        <div className={`${isMobile ? "p-4" : "p-8"} space-y-6`}>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Today</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{todayMinutes}m</p>
                  <p className="text-xs text-muted-foreground">study time</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="h-4 w-4 text-destructive" />
                    <span className="text-xs font-medium text-muted-foreground">Streak</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{streak} 🔥</p>
                  <p className="text-xs text-muted-foreground">consecutive days</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span className="text-xs font-medium text-muted-foreground">30 Days</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{totalStudyHours}h</p>
                  <p className="text-xs text-muted-foreground">total study</p>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-soft)] border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">Avg Daily</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{avgDailyMinutes}m</p>
                  <p className="text-xs text-muted-foreground">per day</p>
                </div>
              </div>

              {/* Study Hours Line Chart */}
              <ChartCard title="Study Hours Per Day (Last 30 Days)" icon={Clock}>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyStudy}>
                      <defs>
                        <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(165, 60%, 48%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(165, 60%, 48%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 90%)" strokeOpacity={0.3} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
                        tickLine={false}
                        axisLine={false}
                        interval={isMobile ? 6 : 3}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
                        tickLine={false}
                        axisLine={false}
                        unit="h"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="hours"
                        stroke="hsl(165, 60%, 48%)"
                        strokeWidth={2}
                        fill="url(#studyGradient)"
                        name="Hours"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Two column layout */}
              <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
                {/* Tasks Completed Bar Chart */}
                <ChartCard title="Tasks Completed Per Week" icon={Target}>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyTasks}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 90%)" strokeOpacity={0.3} />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="completed" name="Completed" fill="hsl(165, 60%, 48%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="created" name="Created" fill="hsl(230, 45%, 65%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                {/* Subject Distribution Pie Chart */}
                <ChartCard title="Subject Distribution" icon={BookOpen}>
                  <div className="h-[260px]">
                    {subjectDist.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">No task data yet</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={subjectDist}
                            dataKey="count"
                            nameKey="subject"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            innerRadius={45}
                            paddingAngle={3}
                            label={({ subject, percent }) =>
                              `${subject} (${(percent * 100).toFixed(0)}%)`
                            }
                            labelLine={{ stroke: "hsl(215, 15%, 55%)", strokeWidth: 1 }}
                          >
                            {subjectDist.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </ChartCard>
              </div>

              {/* Streak History */}
              <ChartCard title="Study Streak History (Last 30 Days)" icon={Flame}>
                <div className="flex flex-wrap gap-1.5">
                  {streakHistory.map((day) => (
                    <div
                      key={day.date}
                      title={`${format(new Date(day.date + "T00:00:00"), "MMM d")} — ${day.studied ? "Studied ✅" : "Missed"}`}
                      className={`h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center text-[10px] font-semibold transition-all ${
                        day.studied
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-muted/50 text-muted-foreground border border-border/30"
                      }`}
                    >
                      {format(new Date(day.date + "T00:00:00"), "d")}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-primary/20 border border-primary/30" />
                    Studied
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-muted/50 border border-border/30" />
                    Missed
                  </div>
                </div>
              </ChartCard>

              {/* Focus Sessions Per Week */}
              <ChartCard title="Focus Sessions Per Week" icon={TrendingUp}>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyFocus}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 90%)" strokeOpacity={0.3} />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
                        tickLine={false}
                        axisLine={false}
                        unit="m"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar yAxisId="left" dataKey="sessions" name="Sessions" fill="hsl(165, 60%, 48%)" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="totalMinutes" name="Total Minutes" fill="hsl(45, 80%, 55%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </>
          )}
        </div>
      </main>

      <AIChatBot open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default Analytics;
