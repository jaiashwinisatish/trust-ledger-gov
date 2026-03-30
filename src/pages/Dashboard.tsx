import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, AlertTriangle, CheckCircle, Upload, Eye, ShieldCheck, Activity, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format, subDays, isSameDay } from "date-fns";
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
  const [trendData, setTrendData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch stats
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

      // Fetch recent docs
      const { data: docs } = await supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(20);
      if (docs) {
        setRecentDocs(docs.slice(0, 5));
        
        // Calculate Trend Data (last 7 days from docs)
        const tzOffset = (new Date()).getTimezoneOffset() * 60000;
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d;
        });

        const newTrendData = last7Days.map(date => {
           const count = docs.filter(doc => isSameDay(new Date(doc.created_at), date)).length;
           return { name: format(date, "EEE"), docs: count };
        });
        setTrendData(newTrendData);

        // Generate Insights based on real data
        const newInsights = [];
        if ((flagged.count || 0) > 0) {
          newInsights.push({ title: "Risk Alert", desc: `${flagged.count} records flagged by security scan.`, impact: "High", time: "Action Req." });
        }
        if ((pending.count || 0) > 0) {
          newInsights.push({ title: "Queue State", desc: `${pending.count} records awaiting validation.`, impact: "Med", time: "Pending" });
        }
        if (docs.length > 0) {
           const latest = docs[0];
           newInsights.push({ title: "Last Ingestion", desc: `Processed '${latest.title}'`, impact: "Info", time: "Recent" });
        }
        setInsights(newInsights);
      }

      // Chain Health (gracefully handles environments without blockchain columns)
      const { data: auditTrail, error: auditTrailError } = await supabase
        .from("audit_logs")
        .select("id, previous_hash, hash")
        .order("created_at", { ascending: false })
        .limit(50) as any;

      if (auditTrailError) {
        setBlockchainStatus("connecting");
      } else if (auditTrail && auditTrail.length > 1) {
        let healthy = true;
        for (let i = 0; i < auditTrail.length - 1; i++) {
          if (auditTrail[i].previous_hash !== auditTrail[i + 1].hash && auditTrail[i].previous_hash !== "0".repeat(64)) {
            healthy = false;
            break;
          }
        }

        setBlockchainStatus(healthy ? "healthy" : "error");
        if (healthy && insights.length < 4) {
          setInsights(prev => [...prev, { title: "Node Sync", desc: "Blockchain Ledger synchronizing state.", impact: "Low", time: "Running" }]);
        }
      }
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: t("dashboard.stats.totalAssets"), value: stats.total, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: t("dashboard.stats.inAnalysis"), value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { label: t("dashboard.stats.riskFlags"), value: stats.flagged, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
    { label: t("dashboard.stats.verifiedData"), value: stats.approved, icon: ShieldCheck, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
  ];

  const statusColor: Record<string, string> = {
    uploaded: "bg-muted text-muted-foreground",
    processing: "bg-warning/20 text-warning",
    reviewed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    approved: "bg-success/20 text-success",
    flagged: "bg-destructive/20 text-destructive",
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
          <Badge className="mb-2 bg-primary text-primary-foreground border-none font-black uppercase tracking-widest text-[10px] py-1 px-3">
            System Online
          </Badge>
          <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground">
            {t("dashboard.trustConsole")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {t("dashboard.welcome")}, <span className="text-foreground font-bold">{profile?.full_name || "Authorized Officer"}</span>. {t("dashboard.managing", { count: stats.total })}.
          </p>
        </div>
        <div className="flex items-center gap-4 p-4 border-2 border-border bg-card">
          <div className={cn(
            "h-4 w-4 rounded-full animate-pulse",
            blockchainStatus === "healthy" ? "bg-success" : "bg-destructive"
          )} />
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">{t("dashboard.blockchainNode")}</p>
            <p className="text-sm font-bold leading-none">{blockchainStatus === "healthy" ? t("dashboard.operational") : t("dashboard.desynchronized")}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <Card key={label} className={cn("border-2 rounded-none bg-card shadow-none transition-transform hover:-translate-y-1", border)}>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">{label}</p>
                  <p className="text-4xl font-black tracking-tighter tabular-nums">{value}</p>
                </div>
                <div className={cn("h-14 w-14 flex items-center justify-center rounded-none", bg, color)}>
                  <Icon className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="border-2 border-border rounded-none shadow-none h-full bg-card">
            <CardHeader className="flex flex-row items-center justify-between border-b-2 border-border pb-4">
              <div>
                <CardTitle className="text-lg font-bold font-serif">{t("dashboard.verificationTraffic")}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{t("dashboard.weeklyAnalysis")}</p>
              </div>
              <Activity className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="pt-6 h-[300px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '0', border: '2px solid hsl(var(--border))', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="docs" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorDocs)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights panel */}
        <motion.div variants={item}>
          <Card className="border-2 border-border rounded-none shadow-none h-full bg-foreground text-background">
            <CardHeader className="border-b-2 border-background/20 pb-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-warning fill-warning" />
                <CardTitle className="text-sm font-bold uppercase tracking-widest">{t("dashboard.smartInsights")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y-2 divide-background/10">
                {insights.length > 0 ? insights.map((insight, idx) => (
                  <div key={idx} className="p-5 hover:bg-background/5 transition-colors group cursor-default">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider">{insight.title}</p>
                      <span className="text-[10px] font-mono text-muted-foreground border border-background/20 px-1 py-0.5">{insight.time}</span>
                    </div>
                    <p className="text-sm opacity-90 leading-relaxed mb-4">{insight.desc}</p>
                    <Badge variant="outline" className={cn(
                      "rounded-none border-none text-[10px] font-bold uppercase tracking-wider",
                      insight.impact === "High" ? "bg-destructive text-destructive-foreground" : 
                      insight.impact === "Med" ? "bg-warning text-warning-foreground" : "bg-primary text-primary-foreground"
                    )}>
                      {insight.impact} Priority
                    </Badge>
                  </div>
                )) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">No insights available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" className="rounded-none h-14 px-8 font-bold uppercase tracking-widest transition-transform hover:-translate-y-1" asChild>
          <Link to="/upload">
            <Upload className="h-5 w-5 mr-3" />
            {t("dashboard.processRecord")}
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="rounded-none h-14 px-8 border-2 border-border font-bold uppercase tracking-widest hover:bg-muted transition-transform hover:-translate-y-1" asChild>
          <Link to="/documents">
            <Eye className="h-5 w-5 mr-3" />
            {t("dashboard.registry")}
          </Link>
        </Button>
      </motion.div>

      {/* Recent Documents Table-ish View */}
      <motion.div variants={item}>
        <Card className="border-2 border-border rounded-none shadow-none bg-card">
          <CardHeader className="flex flex-row items-center justify-between border-b-2 border-border pb-4">
            <CardTitle className="text-lg font-bold font-serif">{t("dashboard.recentEntries")}</CardTitle>
            <Badge variant="outline" className="rounded-none font-bold uppercase tracking-wider">{recentDocs.length} ENTRIES</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {recentDocs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-bold">Secure registry is currently empty.</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-border">
                {recentDocs.map(doc => (
                  <Link
                    key={doc.id}
                    to={`/documents/${doc.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0 mb-4 sm:mb-0">
                      <div className="h-12 w-12 bg-muted border-2 border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-base truncate">{doc.title}</p>
                        <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground mt-1">
                          {doc.category.replace(/_/g, " ")} | {format(new Date(doc.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {doc.flagged && (
                        <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
                      )}
                      <Badge className={cn("rounded-none text-[10px] font-bold uppercase tracking-wider px-3 py-1 border-none", statusColor[doc.status])}>
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
