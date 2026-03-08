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
}: QuickActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="bg-card rounded-xl p-4 flex items-center gap-3 shadow-[var(--shadow-soft)] card-hover cursor-pointer border-0 text-left w-full group"
    >
      <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
        <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-200" />
      </div>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </button>
  );
};