import { ReactNode, useState, useEffect } from "react";
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
import LanguageToggle from "./LanguageToggle";
import { useTranslation } from "react-i18next";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, role, signOut } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  const navItems = [
    { to: "/dashboard", label: t("common.dashboard"), icon: LayoutDashboard },
    { to: "/documents", label: t("common.documents"), icon: FileText },
    { to: "/upload", label: t("common.upload"), icon: Upload },
    { to: "/analytics", label: t("common.analytics"), icon: BarChart3 },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (item.to === "/analytics" && role === "citizen") return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-3 group shrink-0">
              <div className="h-8 w-8 bg-primary flex items-center justify-center group-hover:bg-primary/90 transition-colors">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-lg leading-none tracking-tight text-foreground truncate hidden sm:block">
                  {t("sidebar.trustLedger")}
                </h1>
                <h1 className="font-serif font-bold text-lg leading-none tracking-tight text-foreground sm:hidden">
                  Ledger
                </h1>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1 ml-4 border-l-2 border-border pl-6">
              {filteredNavItems.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 font-bold text-sm transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:block w-64">
              <SmartSearch />
            </div>
            <div className="hidden md:flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            <div className="hidden md:flex items-center gap-3 pl-4 border-l-2 border-border">
              <div className="text-right">
                <p className="text-sm font-bold leading-none">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs font-mono uppercase text-muted-foreground">
                  {roleLabel}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none"
                title={t("common.signOut")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-none bg-muted focus:ring-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 bg-background border-t-2 border-border z-50 overflow-y-auto">
            <div className="p-4 space-y-4 min-h-full flex flex-col pb-20">
              <div className="w-full md:hidden">
                <SmartSearch />
              </div>
              
              <div className="flex items-center justify-between py-2 border-b-2 border-border md:hidden">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Preferences</span>
                <div className="flex items-center gap-2">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
              </div>

              <nav className="flex flex-col gap-2 flex-grow">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2 mt-4">Navigation</span>
                {filteredNavItems.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-4 font-bold rounded-none border-2 transition-colors",
                       location.pathname === to ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center justify-between p-4 bg-muted border-2 border-border mt-auto">
                <div>
                  <p className="font-bold truncate max-w-[150px]">{profile?.full_name || "User"}</p>
                  <p className="text-xs font-mono uppercase text-muted-foreground mt-1">{roleLabel}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setMobileMenuOpen(false); signOut(); }} className="text-destructive font-bold uppercase tracking-wider rounded-none hover:bg-destructive hover:text-destructive-foreground">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Chat Agent */}
      <ChatBot />
    </div>
  );
}

