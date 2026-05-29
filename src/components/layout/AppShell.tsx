import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Users, FileBarChart, Settings, LogOut, Upload, Sparkles, UtensilsCrossed, Image, MessageCircle, Target, ClipboardList, ChevronDown, Receipt, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { CLIENTS } from "../../lib/mock/data";

interface MenuItem {
  to: string;
  search?: string;
  label: string;
  icon: LucideIcon;
  section?: string;
}

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const navBack = useNavigate();
  const { userRole, userEmail, userName: authUserName, restaurantId, signOut } = useAuth();
  
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored === "dark" || stored === "light") return stored;
      return "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Find active restaurant ID:
  // 1. From URL path (e.g. /clients/c2 or /sessions/c2/dashboard)
  // 2. From user context (if restaurant role, it's their own restaurant)
  // 3. From sessionStorage (fallback)
  // 4. Default to "c1"
  const urlMatch = loc.pathname.match(/\/(clients|sessions)\/([^/]+)/);
  const urlId = urlMatch && urlMatch[2] !== "dashboard" ? urlMatch[2] : null;
  const activeRestaurantId = urlId 
    || (userRole === "restaurant" ? restaurantId : null) 
    || (typeof window !== "undefined" ? sessionStorage.getItem("activeRestaurantId") : null) 
    || "c1";

  // Save selected client ID for persistence
  useEffect(() => {
    if (typeof window !== "undefined" && activeRestaurantId) {
      sessionStorage.setItem("activeRestaurantId", activeRestaurantId);
    }
  }, [activeRestaurantId]);

  const activeRestaurant = CLIENTS.find(c => c.id === activeRestaurantId) || CLIENTS[0];

  const handleRestaurantChange = (id: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("activeRestaurantId", id);
    }
    // Navigate appropriately
    if (loc.pathname.startsWith("/clients/")) {
      navBack({ to: "/clients/$id" as any, params: { id } as any });
    } else if (loc.pathname.startsWith("/sessions/")) {
      const currentSearch = typeof window !== "undefined" ? window.location.search : "";
      navBack({ 
        to: "/sessions/$id/dashboard" as any, 
        params: { id } as any,
        search: (currentSearch ? Object.fromEntries(new URLSearchParams(currentSearch)) : undefined) as any,
      });
    } else {
      // Go to dashboard
      navBack({ to: "/sessions/$id/dashboard" as any, params: { id } as any });
    }
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await signOut();
    navBack({ to: "/" });
  };

  const menuItems: MenuItem[] = [];
  
  if (userRole === "admin") {
    menuItems.push(
      { to: "/clients", label: "Clients Dashboard", icon: Users, section: "Management" },
      { to: "/reports", label: "Reports Library", icon: ClipboardList, section: "Management" },
      { to: "/assistant", label: "AI Assistant", icon: Sparkles, section: "Management" },
      { to: "/settings", label: "Global Settings", icon: Settings, section: "System" }
    );
  } else {
    menuItems.push(
      { to: `/sessions/${activeRestaurantId}/dashboard`, label: "Pulse Dashboard", icon: FileBarChart, section: "Operations" },
      { to: `/sessions/${activeRestaurantId}/dashboard`, search: "?tab=Register", label: "Register (POS)", icon: Receipt, section: "Operations" },
      { to: `/sessions/${activeRestaurantId}/dashboard`, search: "?tab=Stock", label: "Stock Room", icon: ClipboardList, section: "Operations" },
      { to: `/sessions/${activeRestaurantId}/dashboard`, search: "?tab=Voice", label: "Guest Voice", icon: MessageCircle, section: "Operations" },
      { to: `/sessions/${activeRestaurantId}/dashboard`, search: "?tab=Menu", label: "Menu & Combos", icon: UtensilsCrossed, section: "Operations" },
      { to: `/sessions/${activeRestaurantId}/dashboard`, search: "?tab=Poster", label: "AI Poster Creator", icon: Image, section: "Marketing" },
      { to: `/clients/${activeRestaurantId}`, label: "Upload Data", icon: Upload, section: "Workspace" },
      { to: "/assistant", label: "AI Assistant", icon: Sparkles, section: "Workspace" },
      { to: `/sessions/${activeRestaurantId}/dashboard`, search: "?tab=Contact", label: "Contact Support", icon: MessageCircle, section: "Workspace" },
      { to: "/settings", label: "Settings", icon: Settings, section: "Workspace" }
    );
  }

  const userInitials = authUserName 
    ? authUserName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() 
    : (userRole === "admin" ? "AD" : "RL");
  const userName = authUserName || (userRole === "admin" ? "System Admin" : activeRestaurant.name);
  const userSub = userEmail || (userRole === "admin" ? "admin@gmail.com" : "demo@rasoi.in");


  // Group items by section
  const sections = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const sec = item.section || "General";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(item);
    return acc;
  }, {});

  const isActive = (item: MenuItem) => {
    if (item.search) {
      // Tab-based items: match path AND query param
      const pathMatch = loc.pathname.startsWith("/sessions/") && loc.pathname.includes("/dashboard");
      if (!pathMatch) return false;
      const currentSearch = typeof window !== "undefined" ? window.location.search : "";
      return currentSearch === item.search;
    }
    if (item.to.includes("/dashboard")) {
      // Overview tab: match path but no tab query param
      const pathMatch = loc.pathname.startsWith("/sessions/") && loc.pathname.includes("/dashboard");
      const currentSearch = typeof window !== "undefined" ? window.location.search : "";
      return pathMatch && (!currentSearch || currentSearch === "?tab=Overview" || currentSearch === "?tab=Pulse" || currentSearch === "");
    }
    if (item.to === "/clients") {
      return loc.pathname === "/clients";
    }
    if (item.to.includes("/clients/")) {
      return loc.pathname.startsWith("/clients/") && loc.pathname !== "/clients";
    }
    return loc.pathname === item.to;
  };

  const getLinkProps = (item: MenuItem) => {
    const isClientPath = item.to.includes("/clients/") && item.to !== "/clients";
    const isDashboardPath = item.to.startsWith("/sessions/") && item.to.includes("/dashboard");
    
    if (isClientPath) {
      const match = item.to.match(/\/clients\/([^/]+)/);
      const id = match ? match[1] : activeRestaurantId;
      return { to: "/clients/$id" as any, params: { id } as any };
    }
    if (isDashboardPath) {
      const match = item.to.match(/\/sessions\/([^/]+)\/dashboard/);
      const id = match ? match[1] : activeRestaurantId;
      return { 
        to: "/sessions/$id/dashboard" as any, 
        params: { id } as any,
        search: (item.search ? Object.fromEntries(new URLSearchParams(item.search)) : undefined) as any,
      };
    }
    return { to: item.to };
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 flex-col border-r border-border/60 bg-sidebar shrink-0">
        <Link to="/" className="flex items-center gap-2 px-6 h-16 border-b border-border/60">
          <div className="h-8 w-8 rounded-lg bg-gold-gradient grid place-items-center text-primary-foreground text-sm font-bold">र</div>
          <span className="font-display text-lg">Rasoi</span>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-none">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">{section}</div>
              <div className="space-y-0.5">
                {items.map((n) => {
                  const active = isActive(n);
                  const linkProps = getLinkProps(n);
                  const key = n.to + (n.search || "");
                  return (
                    <Link
                      key={key}
                      {...linkProps}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                        active ? "bg-surface-2 text-foreground font-semibold text-gold" : "text-muted-foreground hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      <n.icon className={`h-4 w-4 ${active ? "text-gold" : ""}`} />
                      {n.label}
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface">
            <div className="h-8 w-8 rounded-full bg-gold-gradient grid place-items-center text-primary-foreground text-xs font-medium">{userInitials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{userName}</div>
              <div className="text-xs text-muted-foreground truncate">{userSub}</div>
            </div>
             <button onClick={toggleTheme} aria-label="Toggle theme" className="text-muted-foreground hover:text-foreground mr-1.5 p-1 rounded hover:bg-surface-2 transition">
               {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
             </button>
             <button onClick={handleLogout} aria-label="Sign out" className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-surface-2 transition">
               <LogOut className="h-4 w-4" />
             </button>
          </div>
        </div>
      </aside>


      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between border-b border-border/60 px-4 h-14 bg-background/80 backdrop-blur">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gold-gradient grid place-items-center text-primary-foreground text-sm font-bold">र</div>
            <span className="font-display">Rasoi</span>
          </Link>
          <nav className="flex items-center gap-1">
            {menuItems.map((n) => {
              const linkProps = getLinkProps(n);
              const key = n.to + (n.search || "");
              return (
                <Link key={key} {...linkProps} className="p-2 text-muted-foreground hover:text-foreground" aria-label={n.label}>
                  <n.icon className="h-4 w-4" />
                </Link>
              );
            })}
             <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Toggle theme">
               {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
             </button>
             <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-foreground" aria-label="Sign out">
               <LogOut className="h-4 w-4" />
             </button>
          </nav>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}