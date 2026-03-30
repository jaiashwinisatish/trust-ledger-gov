import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ArrowLeft, Brain, Database, Shield, Sparkles, CheckCircle, 
  Lightbulb, ArrowRight, Check, X, Eye, Search, AlertTriangle, 
  Clock, History, Edit3, Loader2, FileText, Copy, Upload
} from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import type { Enums } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

export default function UploadDocument() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Enums<"document_category">>("other");
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState("normal");
  const [uploading, setUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleFilePreScan = async (selectedFile: File) => {
    if (!user) return;
    setIsScanning(true);
    setScanResult(null);
    
    try {
      // 1. Temporary upload for pre-scan
      const tempPath = `pre-scan/${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(tempPath, selectedFile);
      if (uploadError) throw uploadError;

      // 2. Call AI Preview Engine
      const { data, error } = await supabase.functions.invoke("process-document", {
        body: { 
          filePath: tempPath, 
          userId: user.id, 
          preview: true 
        }
      });

      if (error) throw error;

      if (data?.metadata) {
        const { title: aiTitle, category: aiCategory, department: aiDept, priority: aiPriority } = data.metadata;
        
        // 3. Auto-populate fields with sparkle effect
        if (aiTitle) setTitle(aiTitle);
        if (aiCategory) setCategory(aiCategory as Enums<"document_category">);
        if (aiDept) setDepartment(aiDept);
        if (aiPriority) setPriority(aiPriority);
        
        setScanResult(data.metadata);
        toast.success("Intelligence Pulse: AI has auto-populated the record details.");
      }
    } catch (err: any) {
      console.error("Pre-scan failed:", err);
      // Fallback: use filename as title
      if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    } finally {
      setIsScanning(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      handleFilePreScan(droppedFile);
    }
  }, [user, title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      handleFilePreScan(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setUploading(true);
    try {
      // Final upload location
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) throw uploadError;

      // Create document record
      const { data: doc, error: dbError } = await supabase.from("documents").insert({
        title,
        category,
        department: department || null,
        priority,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
        status: "processing",
        confidence_score: scanResult?.confidence || 50,
      }).select().single();

      if (dbError) throw dbError;

      // Log initial audit
      await supabase.functions.invoke("audit-event", {
        body: { 
          documentId: doc.id, 
          action: "upload", 
          details: { file_name: file.name, category, department, ai_assisted: !!scanResult },
          userId: user.id
        }
      });

      // Trigger full AI processing (OCR + Forensic Chain)
      supabase.functions.invoke("process-document", {
        body: { documentId: doc.id },
      }).catch(console.error);

      toast.success("Record committed! 5-Step Intelligence Lifecycle initiated.");
      navigate(`/documents/${doc.id}`);
    } catch (err: any) {
      toast.error(err.message || "Finalization failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic text-primary">Neural Document Intake</h1>
        <p className="text-muted-foreground font-medium text-lg">Secure Ledger Integration & AI Autonomy Phase</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Drop Zone */}
        <Card className={cn(
          "border-4 border-dashed transition-all duration-500 overflow-hidden relative group",
          isScanning ? "border-primary shadow-[0_0_50px_rgba(var(--primary),0.2)]" : "border-border",
          dragOver ? "border-emerald-500 bg-emerald-500/5" : ""
        )}>
          {isScanning && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
              <div className="relative">
                <Loader2 className="h-16 w-16 text-primary animate-spin opacity-20" />
                <Brain className="h-8 w-8 text-primary absolute inset-0 m-auto animate-bounce" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-primary animate-pulse">Neural Pre-Scan in Progress...</p>
            </div>
          )}
          <CardContent className="p-0">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="p-16 text-center cursor-pointer"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              {file ? (
                <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <FileText className="h-10 w-10" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-lg uppercase tracking-tight">{file.name}</p>
                    <p className="text-xs font-bold text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB • READY FOR COMMIT</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-24 w-24 mx-auto rounded-full bg-muted flex items-center justify-center text-muted-foreground/30 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-500">
                    <Upload className="h-10 w-10 group-hover:scale-125 transition-transform" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black uppercase tracking-[0.2em] text-sm">Drop Record Package</p>
                    <p className="text-xs font-bold text-muted-foreground opacity-60 italic">AI will automatically pre-scan and populate fields</p>
                  </div>
                </div>
              )}
              <input id="file-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp" className="hidden" onChange={handleFileChange} />
            </div>
          </CardContent>
        </Card>

        {/* Metadata AI Form */}
        <div className={cn(
          "grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-700",
          !file ? "opacity-30 grayscale pointer-events-none" : "opacity-100"
        )}>
          <Card className="border-2 border-primary/10 shadow-xl">
            <CardHeader className="bg-muted/50 border-b py-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" /> Primary Registry Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest opacity-60">Record Designation</Label>
                <div className="relative">
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="h-12 font-bold border-2 focus:border-primary pr-10" />
                  {scanResult?.title && <Sparkles className="absolute right-3 top-3.5 h-5 w-5 text-primary animate-pulse" />}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Filing Category</Label>
                <Select value={category} onValueChange={v => setCategory(v as Enums<"document_category">)}>
                  <SelectTrigger className="h-12 font-bold border-2 uppercase text-xs tracking-widest"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Constants.public.Enums.document_category.map(c => (
                      <SelectItem key={c} value={c} className="font-bold text-xs uppercase tracking-tight">{c.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/10 shadow-xl">
            <CardHeader className="bg-muted/50 border-b py-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Administrative Context
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-[10px] font-black uppercase tracking-widest opacity-60">Assign Department</Label>
                <Input id="department" value={department} onChange={e => setDepartment(e.target.value)} className="h-12 font-bold border-2 focus:border-primary" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Intelligence Priority</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["low", "normal", "high"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "h-12 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all border-2",
                        priority === p 
                          ? (p === "high" ? "bg-destructive border-destructive text-destructive-foreground shadow-lg shadow-destructive/20" : "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20")
                          : "bg-muted/50 border-muted-foreground/10 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button 
          type="submit" 
          className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 border-b-8 border-primary-foreground/10 active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50" 
          disabled={!file || !title || uploading || isScanning}
        >
          {uploading ? (
            <><Loader2 className="h-6 w-6 mr-3 animate-spin" /> Committing to Ledger...</>
          ) : (
            <><Upload className="h-6 w-6 mr-3" /> Commit & Finalize Record</>
          )}
        </Button>
      </form>
    </div>
  );
}
