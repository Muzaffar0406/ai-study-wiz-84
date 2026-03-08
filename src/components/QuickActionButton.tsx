import { LucideIcon } from "lucide-react";

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "primary" | "accent" | "success";
}

export const QuickActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = "primary" 
}: QuickActionButtonProps) => {
  const styles = {
    primary: {
      bg: "bg-gradient-to-br from-primary to-primary-glow",
      glow: "hover:shadow-[0_12px_40px_hsl(var(--primary)/0.3)]",
      iconBg: "bg-primary-foreground/15",
    },
    accent: {
      bg: "bg-gradient-to-br from-accent to-accent-glow",
      glow: "hover:shadow-[0_12px_40px_hsl(var(--accent)/0.3)]",
      iconBg: "bg-accent-foreground/15",
    },
    success: {
      bg: "bg-gradient-to-br from-success to-success",
      glow: "hover:shadow-[0_12px_40px_hsl(var(--success)/0.3)]",
      iconBg: "bg-success-foreground/15",
    },
  };

  const s = styles[variant];

  return (
    <button
      onClick={onClick}
      className={`${s.bg} ${s.glow} relative overflow-hidden text-primary-foreground rounded-2xl p-6 flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group cursor-pointer border-0`}
    >
      <div className="absolute inset-0 shimmer pointer-events-none" />
      <div className={`${s.iconBg} rounded-xl p-3 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-sm font-bold tracking-wide">{label}</span>
    </button>
  );
};