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
import ChatBot from "./ChatBot";
import SmartSearch from "./SmartSearch";

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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform lg:translate-x-0 lg:static",
          "bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[hsl(var(--sidebar-primary))] flex items-center justify-center">
              <Shield className="h-5 w-5 text-[hsl(var(--sidebar-primary-foreground))]" />
            </div>
            <div>
              <h2 className="font-semibold text-sm leading-tight">GovDoc Portal</h2>
              <p className="text-xs opacity-70">Document Management</p>
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]"
                    : "hover:bg-[hsl(var(--sidebar-accent))] opacity-80 hover:opacity-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-[hsl(var(--sidebar-accent))] flex items-center justify-center text-xs font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs opacity-60">{roleLabel}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-[hsl(var(--sidebar-foreground))] opacity-70 hover:opacity-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-4 lg:px-6 bg-card sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 mr-2">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 max-w-xl">
            <SmartSearch />
          </div>
          <div className="flex items-center gap-4 ml-4">
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold">
              {roleLabel}
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
      <ChatBot />
    </div>
  );
}

