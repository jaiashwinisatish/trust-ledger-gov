import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, AlertTriangle, CheckCircle, Upload, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DocStats {
  total: number;
  pending: number;
  flagged: number;
  approved: number;
}

export default function Dashboard() {
  const { user, role, profile } = useAuth();
  const [stats, setStats] = useState<DocStats>({ total: 0, pending: 0, flagged: 0, approved: 0 });
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [blockchainStatus, setBlockchainStatus] = useState<"connecting" | "healthy" | "error">("healthy");

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch recent docs
      const { data: docs } = await supabase.from("documents").select("*").order("created_at", { ascending: false }).limit(10);
      if (docs) setRecentDocs(docs);

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

      // Verify Chain Health (Simulated check)
      const { data: auditTrial } = await supabase.from("audit_logs").select("id, previous_hash, hash").order("created_at", { ascending: false }).limit(50) as any;
      if (auditTrial && auditTrial.length > 1) {
        // Simple check: does each entry's previous_hash match the one before it?
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
    { label: "Total Documents", value: stats.total, icon: FileText, color: "text-primary" },
    { label: "Pending Analysis", value: stats.pending, icon: Clock, color: "text-[hsl(var(--warning))]" },
    { label: "Detected Anomalies", value: stats.flagged, icon: AlertTriangle, color: "text-destructive" },
    { label: "Verified Records", value: stats.approved, icon: CheckCircle, color: "text-[hsl(var(--success))]" },
  ];

  const statusColor: Record<string, string> = {
    uploaded: "bg-secondary text-secondary-foreground",
    processing: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    reviewed: "bg-primary/15 text-primary",
    approved: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
    flagged: "bg-destructive/15 text-destructive",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile?.full_name || "Authorized Officer"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Government Intelligent Document Management System (IDMS) • v1.0.4
          </p>
        </div>
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border">
          <div className={cn(
            "h-2 w-2 rounded-full animate-pulse",
            blockchainStatus === "healthy" ? "bg-[hsl(var(--success))]" : "bg-destructive"
          )} />
          <span className="text-[10px] uppercase font-bold tracking-wider">
            Blockchain Node: {blockchainStatus === "healthy" ? "Operational" : "Desynchronized"}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-accent/10 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter opacity-70">{label}</p>
                  <p className="text-3xl font-black mt-1 tabular-nums">{value}</p>
                </div>
                <div className={`h-11 w-11 rounded-lg bg-muted flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/documents">
            <Eye className="h-4 w-4 mr-2" />
            View All Documents
          </Link>
        </Button>
      </div>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDocs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No documents yet. Upload your first document to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDocs.slice(0, 5).map(doc => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.category.replace(/_/g, " ")} • {format(new Date(doc.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.flagged && <Badge variant="destructive" className="text-xs">Flagged</Badge>}
                    <Badge className={`text-xs ${statusColor[doc.status] || ""}`}>{doc.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
