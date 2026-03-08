import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSidebarState } from "@/hooks/useSidebarState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Home, BookOpen, CheckSquare, Bot, Settings, LogOut, Menu, X, FileText, CalendarDays, BarChart3, Layers } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppSidebarProps {
  displayName: string;
  avatarUrl?: string | null;
  onAIClick: () => void;
}

export function AppSidebar({ displayName, avatarUrl, onAIClick }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle } = useSidebarState();

  const initials = displayName.charAt(0).toUpperCase();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: CheckSquare, label: "Tasks", path: "/tasks" },
    { icon: CalendarDays, label: "Calendar", path: "/calendar" },
    { icon: FileText, label: "Notes", path: "/notes" },
    { icon: Layers, label: "Flashcards", path: "/flashcards" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Bot, label: "AI Assistant", action: onAIClick },
    { icon: Settings, label: "Settings", path: "/profile" },
  ];

  const handleNav = (item: typeof navItems[0]) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
    if (isMobile) setMobileOpen(false);
  };

  const NavButton = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = item.path && location.pathname === item.path && !item.action;
    const btn = (
      <button
        onClick={() => handleNav(item)}
        className={`sidebar-item w-full ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'} ${collapsed && !isMobile ? 'justify-center px-2' : ''}`}
      >
        <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
        {(!collapsed || isMobile) && <span>{item.label}</span>}
      </button>
    );

    if (collapsed && !isMobile) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return btn;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo & User */}
      <div className={`${collapsed && !isMobile ? 'p-3' : 'p-5'} space-y-4`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 ${collapsed && !isMobile ? 'justify-center w-full' : ''}`}>
            <button
              onClick={!isMobile ? toggle : undefined}
              className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              title="Toggle sidebar"
            >
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </button>
            {(!collapsed || isMobile) && <span className="text-lg font-bold text-white">StudyPlanner</span>}
          </div>
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white p-1">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={() => { navigate("/profile"); if (isMobile) setMobileOpen(false); }}
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
        )}

        {collapsed && !isMobile && (
          <div className="flex justify-center">
            <Avatar className="h-9 w-9 ring-2 ring-white/10 cursor-pointer" onClick={() => navigate("/profile")}>
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed && !isMobile ? 'px-2' : 'px-3'} space-y-1`}>
        {navItems.map((item) => (
          <NavButton key={item.label} item={item} />
        ))}
      </nav>

      {/* Bottom */}
      <div className={`p-4 space-y-3 border-t border-[hsl(var(--sidebar-accent))]`}>
        {!collapsed && <ThemeToggle />}


        <button
          onClick={() => { signOut(); if (isMobile) setMobileOpen(false); }}
          className={`sidebar-item sidebar-item-inactive w-full text-destructive hover:bg-destructive/10 ${collapsed && !isMobile ? 'justify-center px-2' : ''}`}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {(!collapsed || isMobile) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 p-2 rounded-xl bg-card shadow-[var(--shadow-medium)] border border-border/50"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="w-[260px] bg-[hsl(var(--sidebar-bg))] h-full">
              {sidebarContent}
            </div>
            <div className="flex-1 bg-foreground/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          </div>
        )}
      </>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={`fixed left-0 top-0 bottom-0 bg-[hsl(var(--sidebar-bg))] flex flex-col z-40 transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-[240px]"
        }`}
      >
        {sidebarContent}
      </aside>
    </TooltipProvider>
  );
}
