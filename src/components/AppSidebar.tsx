import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, BookOpen, CheckSquare, Bot, Settings, LogOut } from "lucide-react";

interface AppSidebarProps {
  displayName: string;
  avatarUrl?: string | null;
  onAIClick: () => void;
}

export function AppSidebar({ displayName, avatarUrl, onAIClick }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const initials = displayName.charAt(0).toUpperCase();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: CheckSquare, label: "Tasks", path: "/", hash: "tasks" },
    { icon: Bot, label: "AI Assistant", action: onAIClick },
    { icon: Settings, label: "Settings", path: "/profile" },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-[hsl(var(--sidebar-bg))] flex flex-col z-40">
      {/* Logo & User */}
      <div className="p-5 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-white">StudyPlanner</span>
        </div>

        {/* User profile */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-3 w-full text-left group cursor-pointer"
        >
          <Avatar className="h-10 w-10 ring-2 ring-white/10">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
              {displayName}
            </p>
            <p className="text-xs text-[hsl(var(--sidebar-fg))]">Student</p>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.path && location.pathname === item.path && !item.hash && !item.action;
          return (
            <button
              key={item.label}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.path) {
                  navigate(item.path);
                }
              }}
              className={`sidebar-item w-full ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
            >
              <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 space-y-3 border-t border-[hsl(var(--sidebar-accent))]">
        <ThemeToggle />
        <button
          onClick={signOut}
          className="sidebar-item sidebar-item-inactive w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}