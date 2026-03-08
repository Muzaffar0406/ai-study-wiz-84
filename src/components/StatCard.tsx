import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  gradient?: "primary" | "accent" | "success";
}

export const StatCard = ({ title, value, icon: Icon, trend, gradient = "primary" }: StatCardProps) => {
  const gradientClasses = {
    primary: "from-primary to-primary-glow",
    accent: "from-accent to-accent-glow",
    success: "from-success to-success",
  };

  const glowClasses = {
    primary: "group-hover:shadow-[0_8px_30px_hsl(var(--primary)/0.15)]",
    accent: "group-hover:shadow-[0_8px_30px_hsl(var(--accent)/0.15)]",
    success: "group-hover:shadow-[0_8px_30px_hsl(var(--success)/0.15)]",
  };

  return (
    <div className={`glass rounded-2xl overflow-hidden group card-hover ${glowClasses[gradient]} animate-fade-in`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses[gradient]} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500`} />
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-extrabold tracking-tight">{value}</h3>
              {trend && (
                <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">{trend}</span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradientClasses[gradient]} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
};