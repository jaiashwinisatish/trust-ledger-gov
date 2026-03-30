import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Upload,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ChatBot from "./ChatBot";
import SmartSearch from "./SmartSearch";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, role, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  const filteredNavItems = navItems.filter(item => {
    if (item.to === "/analytics" && role === "citizen") return false;
    return true;
  });

  return (
    <div className="min-h-screen flex bg-[#fbfcfd] dark:bg-[#030711]">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform lg:translate-x-0 lg:static",
          "glass-card lg:bg-transparent lg:border-r border-[hsl(var(--sidebar-border))] rounded-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg premium-gradient flex items-center justify-center glow-shadow">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight tracking-tight">TrustLedger</h2>
              <p className="text-[10px] uppercase font-black tracking-widest opacity-50">Gov Service</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {filteredNavItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                  active
                    ? "premium-gradient text-white glow-shadow"
                    : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-accent/20">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black border border-primary/20">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate leading-none mb-1">{profile?.full_name || "User"}</p>
              <p className="text-[10px] font-black uppercase opacity-50 tracking-tighter">{roleLabel}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 glass-header flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 mr-2">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 max-w-xl">
            <SmartSearch />
          </div>
          <div className="flex items-center gap-4 ml-4">
            <ThemeToggle />
            <div className="h-8 w-[1px] bg-border/50 hidden sm:block" />
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {roleLabel}
            </span>
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="p-4 lg:p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ChatBot />
    </div>
  );
}

