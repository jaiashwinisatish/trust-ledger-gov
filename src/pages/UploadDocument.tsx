import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ArrowLeft, Brain, Database, Shield, Sparkles, 
  Loader2, FileText, Upload, Zap, ShieldCheck,
  Cpu, Lock
} from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import type { Enums } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function UploadDocument() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      const tempPath = `pre-scan/${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(tempPath, selectedFile);
      if (uploadError) throw uploadError;

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
        if (aiTitle) setTitle(aiTitle);
        if (aiCategory) setCategory(aiCategory as Enums<"document_category">);
        if (aiDept) setDepartment(aiDept);
        if (aiPriority) setPriority(aiPriority);
        setScanResult(data.metadata);
        toast.info("Neural Engine: Auto-populated record metadata.");
      }
    } catch (err: any) {
      console.error("Pre-scan failed:", err);
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
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) throw uploadError;

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

      await supabase.functions.invoke("audit-event", {
        body: { 
          documentId: doc.id, 
          action: "upload", 
          details: { file_name: file.name, category, department, ai_assisted: !!scanResult },
          userId: user.id
        }
      });

      supabase.functions.invoke("process-document", {
        body: { documentId: doc.id },
      }).catch(console.error);

      toast.success("Hashed & Committed! Neural lifecycle active.");
      navigate(`/documents/${doc.id}`);
    } catch (err: any) {
      toast.error(err.message || "Entry failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2 hover:bg-muted text-muted-foreground font-bold text-[10px] uppercase tracking-widest rounded-none">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("common.back")}
        </Button>
        <div className="flex items-center gap-3">
           <Badge className="bg-primary text-primary-foreground border-none text-[10px] font-bold px-3 py-1 rounded-none">SECURE NODE: ACTIVE</Badge>
           <Badge className="bg-success text-success-foreground border-none text-[10px] font-bold px-3 py-1 flex items-center gap-2 rounded-none"><Lock className="h-3 w-3" /> AES-256</Badge>
        </div>
      </div>

      <div className="space-y-4 text-center md:text-left border-l-4 border-primary pl-6">
        <h1 className="text-4xl font-serif font-bold tracking-tight leading-none">{t("upload.intakeNode")}</h1>
        <p className="text-muted-foreground font-mono uppercase text-sm max-w-xl">{t("upload.intakeDesc")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Drop Zone */}
        <motion.div 
          whileHover={{ scale: 1.005 }}
          className={cn(
            "border-4 transition-all duration-500 overflow-hidden relative group rounded-none bg-card",
            isScanning ? "border-primary shadow-lg" : "border-border border-dashed hover:border-primary",
            dragOver ? "border-success bg-success/10" : ""
          )}
        >
          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/90 z-50 flex flex-col items-center justify-center space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-none blur-xl animate-pulse" />
                  <Loader2 className="h-20 w-20 text-primary animate-spin opacity-20" />
                  <Brain className="h-10 w-10 text-primary absolute inset-0 m-auto animate-bounce" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{t("upload.scanning")}</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase opacity-80">{t("upload.preScan")}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <CardContent className="p-0">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="p-20 text-center cursor-pointer transition-colors"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              {file ? (
                <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-500">
                  <div className="h-24 w-24 bg-primary flex items-center justify-center text-primary-foreground">
                    <FileText className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-2xl font-serif tracking-tight leading-none">{file.name}</h3>
                    <p className="text-[10px] font-mono font-bold text-primary uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB | VERIFIED LOCAL SOURCE</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 py-4">
                  <div className="h-24 w-24 mx-auto bg-muted border-2 border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                    <Upload className="h-10 w-10 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold font-serif text-2xl">{t("upload.dropZone")}</p>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t("upload.dropDesc")}</p>
                  </div>
                </div>
              )}
              <input id="file-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp" className="hidden" onChange={handleFileChange} />
            </div>
          </CardContent>
        </motion.div>

        {/* Intelligence Form */}
        <div className={cn(
          "grid grid-cols-1 md:grid-cols-2 gap-10 transition-all duration-500",
          !file ? "opacity-30 grayscale pointer-events-none" : "opacity-100"
        )}>
          <div className="space-y-8 bg-card border-2 border-border p-8">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-border pb-4">
               <div className="h-10 w-10 bg-primary/10 flex items-center justify-center text-primary"><Cpu className="h-5 w-5" /></div>
               <h2 className="text-xl font-bold font-serif">{t("upload.coreMetadata")}</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider">Logical Identifier</Label>
                <div className="relative">
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="h-14 border-2 border-border bg-background focus-visible:ring-0 focus-visible:border-primary rounded-none font-bold text-lg px-6" />
                  {scanResult?.title && <Sparkles className="absolute right-4 top-4.5 h-5 w-5 text-primary animate-pulse" />}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider">{t("docs.category")}</Label>
                <Select value={category} onValueChange={v => setCategory(v as Enums<"document_category">)}>
                  <SelectTrigger className="h-14 border-2 border-border bg-background focus:ring-0 rounded-none font-bold uppercase tracking-widest text-xs px-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-border rounded-none bg-card">
                    {Constants.public.Enums.document_category.map(c => (
                      <SelectItem key={c} value={c} className="font-bold text-xs uppercase rounded-none focus:bg-primary focus:text-primary-foreground">{c.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-8 bg-card border-2 border-border p-8">
            <div className="flex items-center gap-3 mb-6 border-b-2 border-border pb-4">
               <div className="h-10 w-10 bg-success/10 flex items-center justify-center text-success"><ShieldCheck className="h-5 w-5" /></div>
               <h2 className="text-xl font-bold font-serif">{t("upload.accessControl")}</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="department" className="text-xs font-bold uppercase tracking-wider">Department Attribution</Label>
                <Input id="department" value={department} onChange={e => setDepartment(e.target.value)} className="h-14 border-2 border-border bg-background focus-visible:ring-0 focus-visible:border-primary rounded-none font-bold px-6" />
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider">Urgency Matrix</Label>
                <div className="flex gap-2">
                  {["low", "normal", "high"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex-1 h-14 border-2 font-bold uppercase text-[10px] tracking-widest transition-all",
                        priority === p 
                          ? (p === "high" ? "bg-destructive border-destructive text-destructive-foreground" : "bg-primary border-primary text-primary-foreground")
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {t(`common.priority.${p}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-20 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-[0.2em] text-lg transition-transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0" 
          disabled={!file || !title || uploading || isScanning}
        >
          {uploading ? (
            <><Loader2 className="h-6 w-6 mr-4 animate-spin" /> {t("upload.committing")}</>
          ) : (
            <><Zap className="h-7 w-7 mr-4" /> {t("upload.commit")}</>
          )}
        </Button>
      </form>
    </div>
  );
}
