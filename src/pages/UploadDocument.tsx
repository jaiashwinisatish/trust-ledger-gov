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
        <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2 hover:bg-accent/50 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
          <ArrowLeft className="h-4 w-4 mr-2" /> Abort Mission
        </Button>
        <div className="flex items-center gap-3">
           <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black px-3 py-1">SECURE NODE: ACTIVE</Badge>
           <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px] font-black px-3 py-1 flex items-center gap-2"><Lock className="h-3 w-3" /> AES-256</Badge>
        </div>
      </div>

      <div className="space-y-4 text-center md:text-left">
        <h1 className="text-4xl font-black tracking-tight leading-none">Intake Node</h1>
        <p className="text-muted-foreground font-medium text-lg max-w-xl">Initialize an immutable record entry. Our neural engine will automatically extract and classify document contents.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Drop Zone */}
        <motion.div 
          whileHover={{ scale: 1.005 }}
          className={cn(
            "glass-card border-none transition-all duration-500 overflow-hidden relative group rounded-[40px]",
            isScanning ? "ring-2 ring-primary glow-shadow" : "hover:border-primary/20",
            dragOver ? "ring-2 ring-emerald-500 bg-emerald-500/5" : ""
          )}
        >
          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                  <Loader2 className="h-20 w-20 text-primary animate-spin opacity-20" />
                  <Brain className="h-10 w-10 text-primary absolute inset-0 m-auto animate-bounce" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-black uppercase tracking-[0.4em] text-primary">Neural Forensic Scan</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Extracting Cryptographic Signatures...</p>
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
                  <div className="h-24 w-24 rounded-[32px] premium-gradient flex items-center justify-center text-white glow-shadow">
                    <FileText className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-2xl tracking-tight uppercase leading-none">{file.name}</h3>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{(file.size / 1024 / 1024).toFixed(2)} MB • VERIFIED LOCAL SOURCE</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 py-4">
                  <div className="h-24 w-24 mx-auto rounded-[32px] bg-accent/20 flex items-center justify-center text-muted-foreground group-hover:premium-gradient group-hover:text-white transition-all duration-700">
                    <Upload className="h-10 w-10 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-black uppercase tracking-[0.3em] text-sm">Drop Asset Bundle</p>
                    <p className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-widest">Supports PDF, JPG, PNG, TIFF up to 50MB</p>
                  </div>
                </div>
              )}
              <input id="file-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp" className="hidden" onChange={handleFileChange} />
            </div>
          </CardContent>
        </motion.div>

        {/* Intelligence Form */}
        <div className={cn(
          "grid grid-cols-1 md:grid-cols-2 gap-10 transition-all duration-1000",
          !file ? "opacity-20 grayscale pointer-events-none blur-sm" : "opacity-100"
        )}>
          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-2">
               <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Cpu className="h-4 w-4" /></div>
               <h2 className="text-xl font-black uppercase tracking-tight">Core Metadata</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Logical Identifier</Label>
                <div className="relative">
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="h-14 border-none glass-card focus-visible:ring-2 focus-visible:ring-primary rounded-2xl font-bold text-lg px-6" />
                  {scanResult?.title && <Sparkles className="absolute right-4 top-4.5 h-5 w-5 text-primary animate-pulse" />}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Filing Group</Label>
                <Select value={category} onValueChange={v => setCategory(v as Enums<"document_category">)}>
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
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-3 mb-2">
               <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><ShieldCheck className="h-4 w-4" /></div>
               <h2 className="text-xl font-black uppercase tracking-tight">Access Control</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="department" className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Department Attribution</Label>
                <Input id="department" value={department} onChange={e => setDepartment(e.target.value)} className="h-14 border-none glass-card focus-visible:ring-2 focus-visible:ring-primary rounded-2xl font-bold px-6" />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Urgency Matrix</Label>
                <div className="flex gap-3 bg-accent/10 p-1.5 rounded-2xl">
                  {["low", "normal", "high"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex-1 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                        priority === p 
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

        <Button 
          type="submit" 
          className="w-full h-20 rounded-[32px] premium-gradient border-none text-white font-black uppercase tracking-[0.3em] text-lg glow-shadow transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50" 
          disabled={!file || !title || uploading || isScanning}
        >
          {uploading ? (
            <><Loader2 className="h-6 w-6 mr-4 animate-spin" /> Committing to Block...</>
          ) : (
            <><Zap className="h-7 w-7 mr-4 text-emerald-300" /> Sign & Commit to Ledger</>
          )}
        </Button>
      </form>
    </div>
  );
}
