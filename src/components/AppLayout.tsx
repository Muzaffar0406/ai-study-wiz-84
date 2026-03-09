import { useState, useEffect, createContext, useContext } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { AIChatBot } from "@/components/AIChatBot";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarState } from "@/hooks/useSidebarState";
import { fetchProfile } from "@/lib/database";

interface LayoutContextValue {
  user: ReturnType<typeof useAuth>["user"];
  isMobile: boolean;
  collapsed: boolean;
  displayName: string;
  avatarUrl: string | undefined;
  openChat: () => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within AppLayout");
  return ctx;
}

interface AppLayoutProps {
  children: React.ReactNode;
  /** Extra className on <main> */
  mainClassName?: string;
}

export const AppLayout = ({ children, mainClassName = "" }: AppLayoutProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { collapsed } = useSidebarState();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile(user.id).then(setProfile).catch(console.error);
    }
  }, [user]);

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || undefined;

  const marginClass = isMobile ? "" : collapsed ? "ml-[68px]" : "ml-[240px]";

  const ctx: LayoutContextValue = {
    user,
    isMobile,
    collapsed,
    displayName,
    avatarUrl,
    openChat: () => setChatOpen(true),
  };

  return (
    <LayoutContext.Provider value={ctx}>
      <div className="min-h-screen bg-background">
        <AppSidebar displayName={displayName} avatarUrl={avatarUrl} onAIClick={() => setChatOpen(true)} />

        <main className={`min-h-screen transition-all duration-300 ${marginClass} ${mainClassName}`}>
          {children}
        </main>

        <AIChatBot open={chatOpen} onOpenChange={setChatOpen} />
      </div>
    </LayoutContext.Provider>
  );
};

/** Reusable sticky page header */
export const PageHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { isMobile } = useLayout();
  return (
    <header className={`sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 py-4 ${isMobile ? "px-4 pt-14" : "px-8"} ${className}`}>
      {children}
    </header>
  );
};

/** Reusable page content area with standard padding */
export const PageContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { isMobile } = useLayout();
  return (
    <div className={`${isMobile ? "p-4" : "p-8"} ${className}`}>
      {children}
    </div>
  );
};
