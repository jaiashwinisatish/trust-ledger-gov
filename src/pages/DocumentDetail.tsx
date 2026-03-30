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
import BlockchainLedger from "@/components/BlockchainLedger";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Constants } from "@/integrations/supabase/types";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";


export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
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
    const { data: logs } = await supabase.from("audit_logs").select("*").eq("document_id", id).order("created_at", { ascending: true });
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
      setAuditLogs([...auditLogs, auditData]);
      toast.success(`Document ${status} and verified on ledger.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!doc) return <div className="text-center py-10 font-bold uppercase tracking-widest text-muted-foreground opacity-50">Document not found</div>;

  const classification = doc.ai_classification as any;
  const authenticity = classification?.authenticity_check;
  const extractedData = classification?.extracted_data || {};

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Navigation & Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2 hover:bg-accent/50 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("dashboard.registry")}
        </Button>
        <div className="flex items-center gap-3">
          {doc.status === "reviewed" && !isReviewing && (
            <Button onClick={() => setIsReviewing(true)} className="premium-gradient border-none text-white font-black h-10 px-8 rounded-xl glow-shadow animate-pulse">
              <Edit3 className="h-4 w-4 mr-2" /> Authenticate Record
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => copyToClipboard(doc.id, "Registry ID")}
            className="h-10 text-[10px] rounded-xl font-black uppercase tracking-tighter glass-card border-none"
          >
            <Copy className="h-3.5 w-3.5 mr-2" /> Block ID: {doc.id.slice(0, 8)}
          </Button>
          
          {classification?.needs_translation && (
            <div className="flex bg-accent/20 rounded-xl p-1 gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewLang("original")}
                className={cn("h-8 px-4 rounded-lg text-[10px] font-black uppercase transition-all", viewLang === "original" ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
              >
                {classification.detected_language_name || "Original"}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewLang("translated")}
                className={cn("h-8 px-4 rounded-lg text-[10px] font-black uppercase transition-all", viewLang === "translated" ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}
              >
                <Languages className="h-3.5 w-3.5 mr-2" /> English
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Processing State */}
      {doc.status === "processing" && (
        <Card className="border-none glass-card bg-primary/5 animate-pulse overflow-hidden">
          <div className="h-1 w-full bg-primary/20 overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="h-full w-1/3 bg-primary"
            />
          </div>
          <CardContent className="p-12 text-center space-y-6">
            <Brain className="h-16 w-16 text-primary animate-bounce mx-auto opacity-50" />
            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-primary">{t("upload.scanning")}</h2>
            <p className="text-muted-foreground text-sm font-medium">{t("upload.preScan")}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata Header */}
      <div className={cn(
        "glass-card border-none p-10 transition-all duration-500 rounded-[32px]",
        isReviewing ? "ring-2 ring-primary glow-shadow" : "hover:border-primary/20"
      )}>
        {isReviewing ? (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tight text-primary flex items-center gap-4">
                  <ShieldCheck className="h-8 w-8" /> {t("details.finalizeValidation")}
                </h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{t("details.humanInLoop")}</p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => setIsReviewing(false)} className="h-12 px-6 font-black text-[10px] uppercase tracking-widest rounded-2xl">
                  {t("details.abortReview")}
                </Button>
                <Button 
                  onClick={handleFinalizeReview} 
                  disabled={isFinalizing}
                  className="h-12 px-10 premium-gradient border-none text-white font-black uppercase tracking-widest rounded-2xl glow-shadow"
                >
                  {isFinalizing ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle className="h-5 w-5 mr-3" /> {t("details.commitToLedger")}</>}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.1em] opacity-40 ml-1">Asset Title</Label>
                  <div className="relative">
                    <Input value={editedTitle} onChange={e => setEditedTitle(e.target.value)} className="h-14 border-none glass-card focus-visible:ring-2 focus-visible:ring-primary rounded-2xl font-bold text-xl px-6" />
                    {classification?.suggested_title && (
                      <Badge className="absolute -top-3 right-4 premium-gradient border-none text-[9px] font-black tracking-widest">
                        AI SUGGESTED
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.1em] opacity-40 ml-1">Logical Category</Label>
                  <Select value={editedCategory} onValueChange={setEditedCategory}>
                    <SelectTrigger className="h-14 border-none glass-card rounded-2xl font-black uppercase tracking-widest text-xs px-6">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-none rounded-2xl">
                      {Constants.public.Enums.document_category.map(c => (
                        <SelectItem key={c} value={c} className="font-bold text-xs uppercase rounded-xl m-1">{c.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.1em] opacity-40 ml-1">Department Attribution</Label>
                  <Input value={editedDepartment} onChange={e => setEditedDepartment(e.target.value)} className="h-14 border-none glass-card focus-visible:ring-2 focus-visible:ring-primary rounded-2xl font-bold px-6" />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.1em] opacity-40 ml-1">Relative Urgency</Label>
                  <div className="flex gap-3 bg-accent/20 p-1.5 rounded-2xl">
                    {["low", "normal", "high"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setEditedPriority(p)}
                        className={cn(
                          "flex-1 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                          editedPriority === p 
                            ? (p === "high" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-primary text-white shadow-lg shadow-primary/20")
                            : "text-muted-foreground hover:bg-accent/50"
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-14 w-1 flex bg-primary rounded-full" />
                <div>
                  <h1 className="text-4xl font-black tracking-tight leading-none mb-3">{doc.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <span className="flex items-center gap-2 px-3 py-1 bg-accent/30 rounded-full"><FileText className="h-3.5 w-3.5 text-primary" />{doc.category.replace(/_/g, " ")}</span>
                    <span className="flex items-center gap-2 px-3 py-1 bg-accent/30 rounded-full"><Database className="h-3.5 w-3.5 text-primary" />{doc.department || "GEN_ADMIN"}</span>
                    <span className="flex items-center gap-2 px-3 py-1 bg-accent/30 rounded-full"><Clock className="h-3.5 w-3.5 text-primary" />{format(new Date(doc.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-4 hidden md:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t("docs.status")}</p>
                <p className="text-xs font-black uppercase text-primary tracking-tighter">{t(`common.status.${doc.status}`)}</p>
              </div>
              <div className={cn(
                "h-12 px-6 flex items-center rounded-2xl border-none glass-card font-black uppercase text-[10px] tracking-widest",
                doc.priority === "high" ? "text-rose-500" : "text-primary"
              )}>
                {t(`common.priority.${doc.priority}`)} {t("dashboard.stats.riskFlags").split(' ')[1] || "PRIORITY"}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Intelligence Tabbed UI */}
          <Tabs defaultValue="forensic" className="w-full">
            <TabsList className="bg-accent/20 p-1.5 rounded-2xl mb-6 gap-2">
              <TabsTrigger value="forensic" className="px-8 h-10 rounded-xl text-[10px] font-black uppercase transition-all data-[state=active]:premium-gradient data-[state=active]:text-white">
                <Eye className="h-3.5 w-3.5 mr-2" /> {t("details.forensicVision")}
              </TabsTrigger>
              <TabsTrigger value="ocr" className="px-8 h-10 rounded-xl text-[10px] font-black uppercase transition-all data-[state=active]:premium-gradient data-[state=active]:text-white">
                <Search className="h-3.5 w-3.5 mr-2" /> {t("details.ocrBuffer")}
              </TabsTrigger>
              <TabsTrigger value="ledger" className="px-8 h-10 rounded-xl text-[10px] font-black uppercase transition-all data-[state=active]:premium-gradient data-[state=active]:text-white">
                <History className="h-3.5 w-3.5 mr-2" /> {t("details.ledgerTrace")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="forensic" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Intelligence Summary */}
              <Card className="border-none glass-card overflow-hidden">
                <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg premium-gradient flex items-center justify-center text-white"><Brain className="h-4 w-4" /></div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">{t("details.executiveIntelligence")}</CardTitle>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black px-3 py-1">
                    {t("details.aiConfidence")}: {Math.round(doc.confidence_score || 0)}%
                  </Badge>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="relative">
                    <p className="text-lg font-medium leading-relaxed italic pr-12">
                      "{viewLang === "translated" && classification?.translated_metadata?.summary 
                        ? classification.translated_metadata.summary 
                        : (classification?.summary || "Neural engine is processing document semantic structure...")}"
                    </p>
                    <Quote className="absolute top-0 right-0 h-10 w-10 text-primary opacity-10" />
                  </div>
                </CardContent>
              </Card>

              {/* Forensic Heatmap */}
              <Card className="overflow-hidden border-none glass-card">
                <div className="p-4 bg-accent/20 border-b border-border/50 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{t("details.anomalyMatrix")}</span>
                  {authenticity && (
                     <Badge variant={authenticity.is_authentic ? "outline" : "destructive"} className="text-[9px] font-black border-none uppercase tracking-widest">
                       {t("details.riskScore")}: {authenticity.risk_score}
                     </Badge>
                  )}
                </div>
                <CardContent className="p-8">
                  {doc.file_path ? (
                    <TamperHeatmap 
                      imageUrl={supabase.storage.from("documents").getPublicUrl(doc.file_path).data.publicUrl}
                      zones={classification?.authenticity_check?.tamper_heatmap || []} 
                    />
                  ) : <div className="py-32 text-center text-muted-foreground font-black uppercase text-[10px] tracking-[0.3em] opacity-20">{t("details.noVisualSource")}</div>}
                </CardContent>
              </Card>

              {/* Extracted Fields */}
              {Object.keys(extractedData).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(viewLang === "translated" && classification?.translated_metadata?.fields 
                    ? classification.translated_metadata.fields 
                    : extractedData).map(([key, value]) => (
                    <div key={key} className="glass-card border-none p-5 rounded-2xl group hover:glow-shadow transition-all">
                      <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-1 opacity-50">{key}</p>
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="ocr" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="overflow-hidden border-none glass-card">
                <CardContent className="p-0">
                  <div className="bg-[#030711] text-emerald-500 p-10 max-h-[600px] overflow-auto text-[11px] font-mono leading-relaxed selection:bg-emerald-500/20">
                    <div className="flex gap-4 mb-8 border-b border-emerald-500/10 pb-4">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{t("details.secureBuffer")}</span>
                    </div>
                    {doc.ocr_text || "// SYSERR: No OCR data available for current buffer."}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ledger" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="py-4">
                <BlockchainLedger entries={auditLogs} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          {/* Authenticity Summary Card */}
          {authenticity && (
            <Card className={cn(
              "border-none glass-card relative overflow-hidden group",
              authenticity.is_authentic ? "ring-1 ring-emerald-500/20" : "ring-1 ring-rose-500/20"
            )}>
              <div className={cn("h-1 w-full", authenticity.is_authentic ? "bg-emerald-500" : "bg-rose-500")} />
              <CardContent className="p-8">
                <div className="flex items-center gap-5 mb-6">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 glow-shadow",
                    authenticity.is_authentic ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                  )}>
                    {authenticity.is_authentic ? <ShieldCheck className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">{authenticity.is_authentic ? "Verified" : "Compromised"}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Cryptographic Integrity</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {classification?.classification_tips?.map((tip: string, i: number) => (
                    <div key={i} className="flex gap-3 items-start p-3 bg-accent/10 rounded-xl">
                      <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed font-bold italic opacity-70">{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Desk */}
          {(role === "admin" || role === "officer") && doc.status !== "approved" && (
            <Card className="glass-card border-none overflow-hidden sticky top-[100px]">
              <CardHeader className="pb-3 border-b border-border/50 bg-[#030711] text-white">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                  <Zap className="h-4 w-4 text-amber-400" /> Control Deck
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Button 
                  className="w-full h-14 rounded-2xl premium-gradient border-none text-white font-black uppercase text-[11px] tracking-[0.1em] glow-shadow transition-transform hover:scale-[1.02] active:scale-[0.98]" 
                  onClick={() => setIsReviewing(true)}
                >
                  <CheckCircle className="h-5 w-5 mr-3" /> Authenticate Record
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="ghost" className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-accent/20 hover:bg-accent/40" onClick={() => updateStatus("reviewed")}>
                    Pass
                  </Button>
                  <Button variant="ghost" className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 hover:bg-rose-500/20" onClick={() => updateStatus("flagged")}>
                    Block
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registry Data Details */}
          <Card className="glass-card border-none bg-accent/5">
            <CardHeader className="pb-2 px-6 pt-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Secure Ledger Data</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-4">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase opacity-30">Mime Type</p>
                <div className="font-mono text-[10px] font-bold p-2 bg-accent/20 rounded-lg truncate">{doc.mime_type}</div>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[9px] font-black uppercase opacity-30">Storage Pointer</p>
                <div className="font-mono text-[10px] font-bold p-2 bg-accent/20 rounded-lg truncate">{doc.file_path.split("/").pop()}</div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                <span className="text-[9px] font-black uppercase opacity-30">Byte Size</span>
                <span className="text-xs font-black tabular-nums">{doc.file_size ? (doc.file_size / 1024 / 1024).toFixed(2) : "0.00"} MB</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const Quote = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L20.017 3C21.1216 3 22.017 3.89543 22.017 5V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM3.017 21L3.017 18C3.017 16.8954 3.91243 16 5.017 16H8.017C8.56928 16 9.017 15.5523 9.017 15V9C9.017 8.44772 8.56928 8 8.017 8H5.017C3.91243 8 3.017 7.10457 3.017 6V3L9.017 3C10.1216 3 11.017 3.89543 11.017 5V15C11.017 18.3137 8.33072 21 5.017 21H3.017Z" />
  </svg>
);



