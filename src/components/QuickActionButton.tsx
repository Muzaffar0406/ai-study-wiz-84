import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const variantClasses = {
    primary: "bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg hover:shadow-primary/25",
    accent: "bg-gradient-to-r from-accent to-accent-glow hover:shadow-lg hover:shadow-accent/25",
    success: "bg-gradient-to-r from-success to-success hover:shadow-lg hover:shadow-success/25",
  };

  return (
    <Button
      onClick={onClick}
      className={`${variantClasses[variant]} text-white border-0 h-auto py-4 px-6 flex-col gap-2 hover:scale-105 transition-all duration-300 group`}
    >
      <Icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-semibold">{label}</span>
    </Button>
  );
};
