import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { 
  FileText, Search, Upload, Filter, Mic, Volume2, 
  Sparkles, Database, Clock, ChevronRight, Loader2,
  Globe, Zap
} from "lucide-react";
import { format } from "date-fns";
import { Constants } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Web Speech API type declaration
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

export default function Documents() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  
  // Intelligence Discovery States
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase.from("documents").select("*").order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      if (categoryFilter !== "all") query = query.eq("category", categoryFilter as any);
      const { data } = await query;
      setDocs(data || []);
      setLoading(false);
    };
    fetch();
  }, [statusFilter, categoryFilter]);

  // Real-time Autocomplete Logic
  useEffect(() => {
    if (search.length > 1) {
      const filtered = docs
        .filter(d => 
          d.title.toLowerCase().includes(search.toLowerCase()) || 
          d.id.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [search, docs]);

  // Voice Search (Mic Feature)
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      setIsListening(false);
      toast.success(`Voice Recognized: "${transcript}"`);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const filtered = docs.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase()) ||
      (d.ocr_text && d.ocr_text.toLowerCase().includes(search.toLowerCase()));
    
    const matchesLang = langFilter === "all" || d.ai_classification?.source_lang === langFilter;
    
    return matchesSearch && matchesLang;
  });

  const statusColor: Record<string, string> = {
    uploaded: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    processing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    reviewed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    flagged: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="premium-gradient border-none text-white font-black tracking-[0.2em] text-[10px] py-1 px-3">RECORD REGISTRY</Badge>
          <h1 className="text-4xl font-black tracking-tight">Cryptography Ledger</h1>
          <p className="text-muted-foreground text-sm font-medium">Explore and verify the global immutable document repository.</p>
        </div>
        <Button asChild size="lg" className="h-14 px-10 premium-gradient border-none text-white font-black uppercase tracking-widest rounded-2xl glow-shadow transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <Link to="/upload"><Upload className="h-5 w-5 mr-3" />Initiate Block</Link>
        </Button>
      </div>

      {/* Discovery Dashboard (Smart Search) */}
      <div className="glass-card border-none rounded-[32px] p-2">
        <div className="flex flex-col lg:flex-row gap-2 relative">
          <div className="relative flex-1 group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <div className="h-6 w-[1px] bg-border group-focus-within:bg-primary/30" />
            </div>
            <Input 
              placeholder="Search ID, Category, or Neural Content..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              className="pl-16 pr-14 h-16 border-none bg-transparent focus-visible:ring-0 text-lg font-bold tracking-tight" 
            />
            <button 
              type="button"
              onClick={toggleListening}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                isListening ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/20" : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              {isListening ? <Volume2 className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Autocomplete Suggestions */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-4 p-3 glass-card border-none rounded-[24px] z-50 glow-shadow"
                >
                  <div className="px-4 py-2 mb-2 border-b border-border/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-50">Neural matches detected</p>
                  </div>
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/documents/${s.id}`)}
                      className="w-full flex items-center justify-between p-4 hover:bg-primary/5 rounded-[20px] transition-all group/item"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/item:premium-gradient group-hover/item:text-white transition-all">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="text-left leading-none">
                          <p className="text-sm font-black tracking-tight mb-1">{s.title}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{s.category.replace(/_/g, " ")} • {s.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2 p-2 shrink-0 bg-accent/10 rounded-[28px]">
            <Select value={langFilter} onValueChange={setLangFilter}>
              <SelectTrigger className="w-[140px] h-12 border-none bg-transparent font-black uppercase text-[10px] tracking-widest focus:ring-0">
                <Globe className="h-3.5 w-3.5 mr-2 text-primary" />
                <SelectValue placeholder="Lang" />
              </SelectTrigger>
              <SelectContent className="glass-card border-none rounded-2xl">
                <SelectItem value="all" className="font-bold text-[10px] uppercase rounded-xl">Global</SelectItem>
                <SelectItem value="en" className="font-bold text-[10px] uppercase rounded-xl">English</SelectItem>
                <SelectItem value="hi" className="font-bold text-[10px] uppercase rounded-xl">Hindi</SelectItem>
                <SelectItem value="ta" className="font-bold text-[10px] uppercase rounded-xl">Tamil</SelectItem>
                <SelectItem value="es" className="font-bold text-[10px] uppercase rounded-xl">Spanish</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-12 border-none bg-transparent font-black uppercase text-[10px] tracking-widest focus:ring-0">
                <Filter className="h-3.5 w-3.5 mr-2 text-primary" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="glass-card border-none rounded-2xl">
                <SelectItem value="all" className="font-bold text-[10px] uppercase rounded-xl">Any Status</SelectItem>
                {Constants.public.Enums.document_status.map(s => (
                  <SelectItem key={s} value={s} className="font-bold text-[10px] uppercase rounded-xl">{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] h-12 border-none bg-transparent font-black uppercase text-[10px] tracking-widest focus:ring-0">
                <Zap className="h-3.5 w-3.5 mr-2 text-primary" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="glass-card border-none rounded-2xl">
                <SelectItem value="all" className="font-bold text-[10px] uppercase rounded-xl">All Filing</SelectItem>
                {Constants.public.Enums.document_category.map(c => (
                  <SelectItem key={c} value={c} className="font-bold text-[10px] uppercase rounded-xl">{c.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Registry Ledger List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Syncing with Ledger...</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-2 border-primary/10 bg-accent/5 py-32 text-center rounded-[32px]">
            <Search className="h-16 w-16 mx-auto mb-6 text-primary opacity-10" />
            <p className="font-black uppercase text-xs text-muted-foreground tracking-widest">Registry Search Empty</p>
          </Card>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4"
          >
            {filtered.map(doc => (
              <motion.div key={doc.id} variants={item}>
                <Link to={`/documents/${doc.id}`} className="group block">
                  <Card className="border-none glass-card hover:glow-shadow transition-all duration-500 rounded-[28px] overflow-hidden group-hover:-translate-y-1">
                    <CardContent className="p-0">
                      <div className="flex items-stretch min-h-[100px]">
                        <div className={cn("w-2", statusColor[doc.status]?.split(" ")[0])} />
                        
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 gap-6">
                          <div className="flex items-center gap-6 min-w-0">
                            <div className="h-16 w-16 rounded-[22px] bg-accent/20 group-hover:premium-gradient flex items-center justify-center text-muted-foreground group-hover:text-white transition-all duration-500 shrink-0 relative">
                              <FileText className="h-8 w-8" />
                              {doc.flagged && <div className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full border-4 border-background animate-pulse" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-black text-xl tracking-tight leading-none group-hover:text-primary transition-colors truncate">{doc.title}</h3>
                                {doc.confidence_score > 85 && <Sparkles className="h-4 w-4 text-primary animate-pulse" />}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">
                                 <span className="flex items-center gap-2"><Database className="h-3.5 w-3.5 text-primary" /> {doc.category.replace(/_/g, " ")}</span>
                                 <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-primary" /> {format(new Date(doc.created_at), "MMM d, yyyy")}</span>
                                 <span className="text-primary/60 font-black">BLOCK::{doc.id.slice(0, 8)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-start gap-8">
                            <div className="text-right">
                              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] opacity-40 mb-1">Neural Trust</p>
                              <p className="text-2xl font-black text-primary leading-none">{Math.round(doc.confidence_score || 0)}%</p>
                            </div>
                            <Badge className={cn("h-10 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] border-none shadow-md", statusColor[doc.status])}>
                              {doc.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
