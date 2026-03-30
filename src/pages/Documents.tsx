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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
    uploaded: "bg-muted text-muted-foreground",
    processing: "bg-warning/20 text-warning",
    reviewed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    approved: "bg-success/20 text-success",
    flagged: "bg-destructive/20 text-destructive",
  };

  const statusBorder: Record<string, string> = {
    uploaded: "border-muted-foreground",
    processing: "border-warning",
    reviewed: "border-blue-500",
    approved: "border-success",
    flagged: "border-destructive",
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Badge className="bg-primary text-primary-foreground border-none font-black uppercase tracking-widest text-[10px] py-1 px-3">
            RECORD REGISTRY
          </Badge>
          <h1 className="text-4xl font-serif font-bold tracking-tight">{t("docs.registry")}</h1>
          <p className="text-muted-foreground text-sm font-medium">{t("docs.explore")}</p>
        </div>
        <Button asChild size="lg" className="h-14 px-10 bg-primary text-primary-foreground rounded-none font-bold uppercase tracking-widest transition-transform hover:-translate-y-1">
          <Link to="/upload"><Upload className="h-5 w-5 mr-3" />{t("docs.initiateBlock")}</Link>
        </Button>
      </div>

      {/* Discovery Dashboard (Smart Search) */}
      <div className="bg-card border-2 border-border p-4">
        <div className="flex flex-col lg:flex-row gap-4 relative">
          <div className="relative flex-1 group">
            <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <div className="h-6 w-0.5 bg-border group-focus-within:bg-primary hidden md:block" />
            </div>
            <Input 
              placeholder={t("docs.search")} 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              className="pl-12 md:pl-20 pr-12 md:pr-16 h-14 border-2 border-border bg-background focus-visible:border-primary focus-visible:ring-0 rounded-none text-base md:text-lg font-bold tracking-tight truncate" 
            />
            <button 
              type="button"
              onClick={toggleListening}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center transition-colors",
                isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "text-muted-foreground hover:bg-muted"
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
                  className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-border z-50 shadow-2xl"
                >
                  <div className="px-4 py-2 border-b-2 border-border bg-muted/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("docs.neuralMatches")}</p>
                  </div>
                  {suggestions.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/documents/${s.id}`)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 hover:bg-muted transition-colors group/item text-left",
                        idx !== suggestions.length - 1 && "border-b-2 border-border"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-all">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="text-left leading-none">
                          <p className="text-sm font-bold tracking-tight mb-1">{s.title}</p>
                          <p className="text-[10px] lowercase font-mono text-muted-foreground opacity-80">{s.category.replace(/_/g, " ")} | {s.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/item:text-foreground transition-all" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-nowrap gap-2 w-full lg:w-auto">
            <Select value={langFilter} onValueChange={setLangFilter}>
              <SelectTrigger className="w-full lg:w-[140px] h-14 border-2 border-border rounded-none bg-background font-bold uppercase text-[10px] tracking-widest focus:ring-0">
                <Globe className="h-4 w-4 mr-2 text-primary" />
                <SelectValue placeholder={t("docs.language")} />
              </SelectTrigger>
              <SelectContent className="border-2 border-border rounded-none bg-card">
                <SelectItem value="all" className="font-bold text-[10px] uppercase rounded-none focus:bg-primary focus:text-primary-foreground">Global</SelectItem>
                <SelectItem value="en" className="font-bold text-[10px] uppercase rounded-none focus:bg-primary focus:text-primary-foreground">English</SelectItem>
                <SelectItem value="hi" className="font-bold text-[10px] uppercase rounded-none focus:bg-primary focus:text-primary-foreground">Hindi</SelectItem>
                <SelectItem value="ta" className="font-bold text-[10px] uppercase rounded-none focus:bg-primary focus:text-primary-foreground">Tamil</SelectItem>
                <SelectItem value="es" className="font-bold text-[10px] uppercase rounded-none focus:bg-primary focus:text-primary-foreground">Spanish</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[140px] h-14 border-2 border-border rounded-none bg-background font-bold uppercase text-[10px] tracking-widest focus:ring-0">
                <Filter className="h-4 w-4 mr-2 text-primary" />
                <SelectValue placeholder={t("docs.status")} />
              </SelectTrigger>
              <SelectContent className="border-2 border-border rounded-none bg-card">
                <SelectItem value="all" className="font-bold text-[10px] uppercase rounded-none focus:bg-primary focus:text-primary-foreground">Any Status</SelectItem>
                {Constants.public.Enums.document_status.map(s => (
                  <SelectItem key={s} value={s} className="font-bold text-[10px] uppercase rounded-none focus:bg-primary focus:text-primary-foreground">{t(`common.status.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-[160px] h-14 border-2 border-border rounded-none bg-background font-bold uppercase text-[10px] tracking-widest focus:ring-0">
                <Zap className="h-4 w-4 mr-2 text-primary" />
                <SelectValue placeholder={t("docs.category")} />
              </SelectTrigger>
              <SelectContent className="border-2 border-border rounded-none bg-card">
                <SelectItem value="all" className="font-bold text-[10px] uppercase rounded-none focus:bg-primary focus:text-primary-foreground">All Filing</SelectItem>
                {Constants.public.Enums.document_category.map(c => (
                  <SelectItem key={c} value={c} className="font-bold text-[10px] uppercase rounded-none focus:bg-primary focus:text-primary-foreground">{c.replace(/_/g, " ")}</SelectItem>
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
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Syncing with Ledger...</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-2 border-border border-dashed bg-muted/20 py-32 text-center rounded-none shadow-none">
            <Search className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
            <p className="font-bold uppercase text-sm text-foreground tracking-widest">Registry Search Empty</p>
          </Card>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-4"
          >
            {filtered.map(doc => (
              <motion.div key={doc.id} variants={item}>
                <Link to={`/documents/${doc.id}`} className="group block">
                  <Card className={cn("border-2 rounded-none bg-card shadow-none transition-all hover:bg-muted/30 hover:-translate-y-1 relative overflow-hidden", statusBorder[doc.status])}>
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6 min-w-0">
                          <div className="h-16 w-16 bg-muted border-2 border-border group-hover:bg-primary flex items-center justify-center text-muted-foreground group-hover:text-primary-foreground transition-colors shrink-0 relative">
                            <FileText className="h-8 w-8" />
                            {doc.flagged && <div className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-none border-2 border-background animate-pulse" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-xl tracking-tight truncate">{doc.title}</h3>
                              {doc.confidence_score > 85 && <Sparkles className="h-4 w-4 text-warning animate-pulse" />}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                               <span className="flex items-center gap-1.5"><Database className="h-3 w-3" /> {doc.category.replace(/_/g, " ")}</span>
                               <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {format(new Date(doc.created_at), "MMM d, yyyy")}</span>
                               <span className="text-primary font-bold">BLOCK::{doc.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-start gap-8">
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Confidence</p>
                            <p className="text-2xl font-black font-mono leading-none">{Math.round(doc.confidence_score || 0)}%</p>
                          </div>
                          <Badge className={cn("h-10 px-6 rounded-none font-bold uppercase tracking-widest text-[10px] border-none", statusColor[doc.status])}>
                            {doc.status}
                          </Badge>
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
