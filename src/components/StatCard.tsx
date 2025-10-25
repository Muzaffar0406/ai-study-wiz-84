import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

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

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 animate-fade-in">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses[gradient]} opacity-5 group-hover:opacity-10 transition-opacity`} />
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
              {trend && (
                <span className="text-sm font-medium text-success">{trend}</span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientClasses[gradient]} group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </Card>
  );
};
