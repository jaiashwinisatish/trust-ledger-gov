import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, AlertTriangle, CheckCircle, Upload, Eye, ShieldCheck, Activity, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

interface DocStats {
  total: number;
  pending: number;
  flagged: number;
  approved: number;
}

const chartData = [
  { name: "Mon", docs: 4 },
  { name: "Tue", docs: 7 },
  { name: "Wed", docs: 5 },
  { name: "Thu", docs: 12 },
  { name: "Fri", docs: 8 },
  { name: "Sat", docs: 3 },
  { name: "Sun", docs: 6 },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { user, role, profile } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<DocStats>({ total: 0, pending: 0, flagged: 0, approved: 0 });
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [blockchainStatus, setBlockchainStatus] = useState<"connecting" | "healthy" | "error">("healthy");

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: docs } = await supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(10);
      if (docs) setRecentDocs(docs);

      const [total, pending, flagged, approved] = await Promise.all([
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("documents").select("*", { count: "exact", head: true }).in("status", ["uploaded", "processing"]),
        supabase.from("documents").select("*", { count: "exact", head: true }).eq("flagged", true),
        supabase.from("documents").select("*", { count: "exact", head: true }).eq("status", "approved"),
      ]);

      setStats({
        total: total.count || 0,
        pending: pending.count || 0,
        flagged: flagged.count || 0,
        approved: approved.count || 0,
      });

      const { data: auditTrial } = await supabase.from("audit_logs").select("id, previous_hash, hash").order("created_at", { ascending: false }).limit(50) as any;
      if (auditTrial && auditTrial.length > 1) {
        let healthy = true;
        for (let i = 0; i < auditTrial.length - 1; i++) {
          if (auditTrial[i].previous_hash !== auditTrial[i+1].hash && auditTrial[i].previous_hash !== "0".repeat(64)) {
            healthy = false;
            break;
          }
        }
        setBlockchainStatus(healthy ? "healthy" : "error");
      }
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: t("dashboard.stats.totalAssets"), value: stats.total, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: t("dashboard.stats.inAnalysis"), value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: t("dashboard.stats.riskFlags"), value: stats.flagged, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: t("dashboard.stats.verifiedData"), value: stats.approved, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  const statusColor: Record<string, string> = {
    uploaded: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    processing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    reviewed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    flagged: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge className="mb-2 premium-gradient border-none text-white font-bold tracking-widest text-[10px] py-0.5 px-2">SYSTEM ACTIVE</Badge>
          <h1 className="text-3xl font-black tracking-tight">
            {t("dashboard.trustConsole")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {t("dashboard.welcome")}, <span className="text-foreground font-bold">{profile?.full_name || "Authorized Officer"}</span>. {t("dashboard.managing", { count: stats.total })}.
          </p>
        </div>
        <div className="flex items-center gap-3 p-3 glass-card rounded-2xl glow-shadow transition-transform hover:scale-[1.02]">
          <div className={cn(
            "h-3 w-3 rounded-full animate-pulse",
            blockchainStatus === "healthy" ? "bg-emerald-500" : "bg-rose-500"
          )} />
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest opacity-50 leading-none mb-1">{t("dashboard.blockchainNode")}</p>
            <p className="text-xs font-bold leading-none">{blockchainStatus === "healthy" ? t("dashboard.operational") : t("dashboard.desynchronized")}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-none glass-card overflow-hidden group hover:glow-shadow transition-all duration-300">
            <CardContent className="p-6 relative">
              <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity", bg)} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">{label}</p>
                  <p className="text-4xl font-black tracking-tighter tabular-nums">{value}</p>
                </div>
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", bg, color)}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="border-none glass-card h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">{t("dashboard.verificationTraffic")}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{t("dashboard.weeklyAnalysis")}</p>
              </div>
              <Activity className="h-5 w-5 text-primary opacity-50" />
            </CardHeader>
            <CardContent className="pt-4 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }}
                   />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="docs" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorDocs)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights panel */}
        <motion.div variants={item}>
          <Card className="border-none glass-card h-full overflow-hidden bg-slate-950 text-white border-2 border-white/5">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
                <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-400">{t("dashboard.smartInsights")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {[
                  { title: "Anomaly Detected", desc: "Hash mismatch in Document #29402", impact: "High", time: "2m ago" },
                  { title: "Bulk Verification", desc: "Verified 24 immigration records", impact: "Low", time: "15m ago" },
                  { title: "Security Alert", desc: "Multiple login attempts from new IP", impact: "Med", time: "1h ago" },
                  { title: "Node Sync", desc: "Blockchain Ledger synchronizing state", impact: "Info", time: "Running" },
                ].map((insight, idx) => (
                  <div key={idx} className="p-5 hover:bg-white/5 transition-colors group cursor-default">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-black uppercase tracking-tight">{insight.title}</p>
                      <span className="text-[10px] text-white/40 font-bold">{insight.time}</span>
                    </div>
                    <p className="text-sm text-white/70 font-medium leading-relaxed mb-3">{insight.desc}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-white/5 border-white/10 text-white/50 text-[10px] font-bold">
                        {insight.impact} Risk
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-white/5 text-center">
                <Button variant="ghost" size="sm" className="text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-transparent">
                  View Security Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item} className="flex gap-4">
        <Button size="lg" className="premium-gradient border-none h-12 px-8 rounded-2xl glow-shadow font-bold transition-all hover:scale-[1.02] active:scale-[0.98]" asChild>
          <Link to="/upload">
            <Upload className="h-5 w-5 mr-3" />
            {t("dashboard.processRecord")}
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="h-12 px-8 rounded-2xl font-bold glass-card border-none hover:bg-accent/50" asChild>
          <Link to="/documents">
            <Eye className="h-5 w-5 mr-3" />
            {t("dashboard.registry")}
          </Link>
        </Button>
      </motion.div>

      {/* Recent Documents Table-ish View */}
      <motion.div variants={item}>
        <Card className="border-none glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold">{t("dashboard.recentEntries")}</CardTitle>
            <Badge variant="outline" className="font-bold opacity-50">{recentDocs.length} Total</Badge>
          </CardHeader>
          <CardContent>
            {recentDocs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p className="font-medium">Secure registry is currently empty.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDocs.slice(0, 5).map(doc => (
                  <Link
                    key={doc.id}
                    to={`/documents/${doc.id}`}
                    className="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-primary/[0.02] transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:premium-gradient group-hover:text-white transition-colors">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm tracking-tight truncate">{doc.title}</p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mt-1">
                          {doc.category.replace(/_/g, " ")} • {format(new Date(doc.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {doc.flagged && (
                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                      )}
                      <Badge className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border-none", statusColor[doc.status] || "")}>
                        {t(`common.status.${doc.status}`)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
