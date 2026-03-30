import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowLeft, 
  Brain, 
  Shield, 
  Loader2, 
  Copy, 
  Database, 
  Search, 
  Eye, 
  Sparkles,
  ArrowRight,
  Lightbulb,
  Edit3,
  Check,
  X,
  History,
  Languages,
  Globe
} from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import TamperHeatmap from "@/components/TamperHeatmap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Constants } from "@/integrations/supabase/types";


export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review Mode States
  const [isReviewing, setIsReviewing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [editedPriority, setEditedPriority] = useState("");
  const [editedDepartment, setEditedDepartment] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [viewLang, setViewLang] = useState<"original" | "translated">("original");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const fetchDocument = async () => {
    if (!id) return;
    const { data } = await supabase.from("documents").select("*").eq("id", id).single();
    if (data) {
      setDoc(data);
      setEditedTitle(data.title);
      setEditedCategory(data.category);
      setEditedPriority(data.priority);
      setEditedDepartment(data.department || "");
    }
    const { data: logs } = await supabase.from("audit_logs").select("*").eq("document_id", id).order("created_at", { ascending: false });
    setAuditLogs(logs || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  // Polling for processing status
  useEffect(() => {
    if (!doc || doc.status !== "processing") return;
    
    const interval = setInterval(() => {
      fetchDocument();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [doc?.status]);

  const handleFinalizeReview = async () => {
    if (!doc || !user) return;
    setIsFinalizing(true);
    try {
      const { error: updateError } = await supabase.from("documents").update({ 
        title: editedTitle,
        category: editedCategory as any,
        priority: editedPriority,
        department: editedDepartment || null,
        status: "approved" 
      }).eq("id", doc.id);

      if (updateError) throw updateError;

      // Secure Blockchain Audit
      await supabase.functions.invoke("audit-event", {
        body: { 
          documentId: doc.id, 
          action: "human_verification_complete", 
          details: { 
            final_title: editedTitle, 
            final_category: editedCategory,
            final_priority: editedPriority
          },
          userId: user.id
        }
      });

      toast.success("Document finalized and signed to ledger!");
      setIsReviewing(false);
      fetchDocument();
    } catch (err: any) {
      toast.error(err.message || "Finalization failed");
    } finally {
      setIsFinalizing(false);
    }
  };

  const updateStatus = async (status: string) => {

    if (!doc || !user) return;
    setLoading(true);
    try {
      const { error: updateError } = await supabase.from("documents").update({ status: status as any }).eq("id", doc.id);
      if (updateError) throw updateError;

      // Use Edge Function for Secure Hashed Audit
      const { data: auditData, error: auditError } = await supabase.functions.invoke("audit-event", {
        body: { 
          documentId: doc.id, 
          action: `status_change_to_${status}`, 
          details: { from: doc.status, to: status },
          userId: user.id
        }
      });
      if (auditError) throw auditError;

      setDoc({ ...doc, status });
      setAuditLogs([auditData, ...auditLogs]);
      toast.success(`Document ${status} and verified on ledger.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!doc) return <div className="text-center py-10">Document not found</div>;

  const classification = doc.ai_classification as any;
  const authenticity = classification?.authenticity_check;
  const extractedData = classification?.extracted_data || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8">
      {/* Navigation & Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2 hover:bg-muted font-bold text-xs uppercase tracking-widest">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Ledger
        </Button>
        <div className="flex items-center gap-3">
          {doc.status === "reviewed" && !isReviewing && (
            <Button onClick={() => setIsReviewing(true)} className="bg-primary hover:bg-primary/90 text-white font-bold h-9 px-6 animate-pulse">
              <Edit3 className="h-4 w-4 mr-2" /> Start Review
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-9 text-[10px] font-black uppercase tracking-tighter">
            <Copy className="h-3.5 w-3.5 mr-2" /> Audit Hash
          </Button>
          
          {classification?.needs_translation && (
            <div className="flex bg-muted rounded-lg p-1 border-2 border-primary/20">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewLang("original")}
                className={cn("h-7 px-3 text-[9px] font-black uppercase", viewLang === "original" ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
              >
                {classification.detected_language_name || "Original"}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewLang("translated")}
                className={cn("h-7 px-3 text-[9px] font-black uppercase", viewLang === "translated" ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
              >
                <Languages className="h-3 w-3 mr-1.5" /> English
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Processing State */}
      {doc.status === "processing" && (
        <Card className="border-2 border-primary/30 bg-primary/5 shadow-2xl animate-pulse">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-black uppercase tracking-widest text-primary">Neural Analysis in Progress</h2>
          </CardContent>
        </Card>
      )}

      {/* Metadata Display / Review Editor */}
      <div className={cn(
        "bg-background rounded-2xl border-2 p-8 transition-all duration-500",
        isReviewing ? "border-primary shadow-2xl ring-4 ring-primary/5" : "border-muted"
      )}>
        {isReviewing ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-widest text-primary flex items-center gap-3">
                  <Brain className="h-6 w-6" /> Review Neural Metadata
                </h2>
                <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">Step 5: Final Human-in-the-Loop Verification</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setIsReviewing(false)} className="h-10 px-4 font-bold text-xs uppercase">
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button 
                  onClick={handleFinalizeReview} 
                  disabled={isFinalizing}
                  className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                >
                  {isFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Finalize Record</>}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Professional Title</Label>
                  <div className="relative">
                    <Input value={editedTitle} onChange={e => setEditedTitle(e.target.value)} className="h-12 border-2 focus:border-primary font-bold text-lg" />
                    {classification?.suggested_title && classification.suggested_title !== classification.original_user_title && (
                      <Badge variant="outline" className="absolute -top-3 right-3 bg-primary/10 text-primary border-primary/20 text-[9px] font-bold">
                        AI SUGGESTED IMPROVEMENT
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Classification Category</Label>
                  <Select value={editedCategory} onValueChange={setEditedCategory}>
                    <SelectTrigger className="h-12 border-2 font-bold uppercase tracking-widest text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Constants.public.Enums.document_category.map(c => (
                        <SelectItem key={c} value={c} className="font-bold text-xs uppercase">{c.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Assigned Department</Label>
                  <Input value={editedDepartment} onChange={e => setEditedDepartment(e.target.value)} className="h-12 border-2 font-bold" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Urgency Level</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["low", "normal", "high"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setEditedPriority(p)}
                        className={cn(
                          "h-12 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all border-2",
                          editedPriority === p 
                            ? (p === "high" ? "bg-destructive border-destructive text-white" : "bg-primary border-primary text-white")
                            : "bg-muted/50 border-muted-foreground/10 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight">{doc.title}</h1>
                {classification?.suggested_title && (
                  <Badge variant="outline" className="h-6 gap-1 bg-primary/5 text-primary border-primary/30 text-[10px] font-black uppercase px-3 rounded-full">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" /> AI Optimized
                  </Badge>
                )}
                {classification?.detected_language_name && (
                  <Badge variant="secondary" className="h-6 gap-1 bg-muted text-muted-foreground border-none text-[10px] font-bold uppercase px-3 rounded-full">
                    <Globe className="h-3.5 w-3.5" /> Source: {classification.detected_language_name}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-primary/60" />{doc.category.replace(/_/g, " ")}</span>
                <span>/</span>
                <span className="flex items-center gap-1.5"><Database className="h-4 w-4 text-primary/60" />{doc.department || "General Administration"}</span>
                <span>/</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary/60" />{format(new Date(doc.created_at), "MMM d, yyyy")}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={cn(
                  "h-8 px-4 rounded-md font-black uppercase text-[10px] tracking-tighter border-2 shadow-sm",
                  doc.priority === "high" ? "bg-destructive/5 border-destructive text-destructive" : 
                  doc.priority === "normal" ? "bg-primary/5 border-primary text-primary" : "bg-muted border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {doc.priority} Priority
              </Badge>
              <Badge variant="outline" className="h-8 px-4 rounded-md font-black uppercase text-[10px] tracking-tighter border-2 bg-muted/50">
                {doc.status}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Intelligence Columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Intelligence Executive Summary */}
          <Card className="border-2 border-primary/20 bg-primary/[0.03] shadow-xl overflow-hidden relative group">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b bg-primary/5">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                <Brain className="h-4 w-4" /> Intelligence Executive Summary
              </CardTitle>
              <Badge variant="outline" className="bg-background text-[10px] font-black px-2 py-0.5 border-primary/20">
                AI CONFIDENCE {Math.round(doc.confidence_score || 0)}%
              </Badge>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="text-sm font-medium leading-relaxed text-foreground antialiased italic">
                "{viewLang === "translated" && classification?.translated_metadata?.summary 
                  ? classification.translated_metadata.summary 
                  : (classification?.summary || "Analyzing document structure...")}"
              </p>
            </CardContent>
          </Card>

          {/* Forensic Authenticity Shield */}
          {authenticity && (
            <Card className={cn("border-2 shadow-xl overflow-hidden", authenticity.is_authentic ? "border-emerald-500/30" : "border-destructive/30")}>
              <CardHeader className={cn("pb-3 border-b", authenticity.is_authentic ? "bg-emerald-500/5" : "bg-destructive/5")}>
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.15em] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className={cn("h-4 w-4", authenticity.is_authentic ? "text-emerald-600" : "text-destructive")} /> Forensic Security Audit
                  </div>
                  <Badge variant={authenticity.is_authentic ? "outline" : "destructive"} className="text-[10px] font-black">RISK SCORE: {authenticity.risk_score}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border-2", authenticity.is_authentic ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-destructive/5 border-destructive/20 text-destructive")}>
                    {authenticity.is_authentic ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className={cn("text-xs font-black uppercase", authenticity.is_authentic ? "text-emerald-700" : "text-destructive")}>{authenticity.is_authentic ? "Trust Verified" : "Integrity Compromised"}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">Neural Forensic Engine • {format(new Date(), "HH:mm")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visual Heatmap / OCR Extraction */}
          <Tabs defaultValue="forensic" className="w-full">
            <TabsList className="bg-muted/80 p-1 mb-2">
              <TabsTrigger value="forensic" className="px-6 text-[10px] font-black uppercase"><Eye className="h-3 w-3 mr-2" /> Forensic Heatmap</TabsTrigger>
              <TabsTrigger value="ocr" className="px-6 text-[10px] font-black uppercase"><Search className="h-3 w-3 mr-2" /> Digital Extraction</TabsTrigger>
            </TabsList>
            <TabsContent value="forensic">
              <Card className="overflow-hidden border-2 border-primary/10 shadow-2xl">
                <CardContent className="p-0">
                  {doc.file_path ? (
                    <div className="p-4 bg-muted/20">
                      <TamperHeatmap 
                        imageUrl={supabase.storage.from("documents").getPublicUrl(doc.file_path).data.publicUrl}
                        zones={classification?.authenticity_check?.tamper_heatmap || []} 
                      />
                    </div>
                  ) : <div className="py-24 text-center text-muted-foreground font-bold uppercase text-xs">File Unavailable</div>}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="ocr">
              <Card className="overflow-hidden border-2 border-primary/10 shadow-2xl">
                <CardContent className="p-0">
                  <div className="bg-slate-900 text-emerald-400 p-8 max-h-[500px] overflow-auto text-[12px] font-mono whitespace-pre-wrap">
                    {doc.ocr_text || "Extracting text..."}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Neural Extracted Table */}
          {Object.keys(extractedData).length > 0 && (
            <Card className="shadow-2xl border-2 overflow-hidden border-primary/10">
              <CardHeader className="bg-muted/50 py-4 px-6 border-b">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-3">
                  <Database className="h-4 w-4 text-primary" /> Neural-Extracted Record Data
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y">
                  {Object.entries(viewLang === "translated" && classification?.translated_metadata?.fields 
                    ? classification.translated_metadata.fields 
                    : extractedData).map(([key, value]) => (
                    <div key={key} className="p-4 px-6 hover:bg-primary/[0.03] transition-all bg-background">
                      <p className="text-[9px] uppercase font-black text-muted-foreground tracking-tighter mb-1">{key}</p>
                      <p className="text-sm font-bold truncate text-foreground">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Intelligence Insights */}
          {classification?.classification_tips?.length > 0 && (
            <Card className="border-2 border-primary/20 bg-primary/5 shadow-2xl relative overflow-hidden group">
              <CardHeader className="pb-3 border-b bg-primary/10">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                  <Lightbulb className="h-4 w-4" /> Intelligence Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {classification.classification_tips.map((tip: string, i: number) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center shrink-0 mt-0.5"><ArrowRight className="h-3 w-3" /></div>
                    <p className="text-[11px] leading-relaxed font-bold text-muted-foreground italic">{tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Authorization Desk */}
          {(role === "admin" || role === "officer") && doc.status !== "approved" && (
            <Card className="shadow-2xl border-primary/30 overflow-hidden sticky top-24">
              <CardHeader className="pb-3 border-b bg-slate-950 text-white">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                  <Shield className="h-4 w-4 text-primary" /> Authorization Desk
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <Button 
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20" 
                  onClick={() => setIsReviewing(true)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Verify & Finalize
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-10 border-2 text-[9px] font-black uppercase tracking-widest" onClick={() => updateStatus("reviewed")}>
                    Reviewed
                  </Button>
                  <Button variant="outline" className="h-10 border-2 border-destructive/20 text-destructive text-[9px] font-black" onClick={() => updateStatus("flagged")}>
                    Flag Fraud
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Blockchain Ledger Trace */}
          <Card className="border-dashed shadow-none bg-muted/5">
            <CardHeader className="pb-2 px-4"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ledger History</CardTitle></CardHeader>
            <CardContent className="p-4 pt-4">
              <div className="flex justify-between font-mono bg-muted/30 p-2 rounded"><span className="text-muted-foreground uppercase opacity-60">FP</span><span className="truncate ml-4 font-bold">{doc.file_path.split("/").pop()?.substring(0, 15)}...</span></div>
              <div className="flex justify-between border-b border-muted py-1"><span className="text-muted-foreground uppercase opacity-60">Size</span><span className="font-black">{doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : "—"}</span></div>
              <div className="flex justify-between border-b border-muted py-1"><span className="text-muted-foreground uppercase opacity-60">MIME</span><span className="font-black truncate ml-4">{doc.mime_type}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



