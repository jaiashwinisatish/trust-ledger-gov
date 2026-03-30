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
  Globe
} from "lucide-react";
import { format } from "date-fns";
import { Constants } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Web Speech API type declaration
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

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
    uploaded: "bg-secondary text-secondary-foreground",
    processing: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
    reviewed: "bg-primary/15 text-primary",
    approved: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
    flagged: "bg-destructive/15 text-destructive",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-primary">Trust Ledger Registry</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Secure Government Document Intelligence Dashboard</p>
        </div>
        <Button asChild className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20">
          <Link to="/upload"><Upload className="h-5 w-5 mr-3" />Initiate Upload</Link>
        </Button>
      </div>

      {/* Discovery Dashboard (Smart Search) */}
      <Card className="border-2 border-primary/10 shadow-2xl overflow-visible bg-background/50 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 relative">
            <div className="relative flex-1 group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <div className="h-4 w-[1px] bg-muted group-focus-within:bg-primary/30" />
              </div>
              <Input 
                placeholder="Search by ID, Category, or Neural Content..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                className="pl-14 pr-12 h-14 border-2 focus-visible:ring-primary/20 text-lg font-bold tracking-tight shadow-inner" 
              />
              <button 
                type="button"
                onClick={toggleListening}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                  isListening ? "bg-destructive text-white animate-pulse" : "bg-primary/5 text-primary hover:bg-primary/10"
                )}
              >
                {isListening ? <Volume2 className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-background/95 border-2 border-primary/20 shadow-2xl rounded-2xl z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-3 py-2 border-b border-muted">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60">Neural Match Suggestions</p>
                  </div>
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/documents/${s.id}`)}
                      className="w-full flex items-center justify-between p-3 hover:bg-primary/5 rounded-xl transition-all group/item"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black tracking-tight">{s.title}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{s.category.replace(/_/g, " ")} • ID: {s.id.split("-")[0]}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              <Select value={langFilter} onValueChange={setLangFilter}>
                <SelectTrigger className="w-[160px] h-14 border-2 font-black uppercase text-[10px] tracking-widest">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="border-2 shadow-2xl">
                  <SelectItem value="all" className="font-black uppercase text-[10px]">All Tongues</SelectItem>
                  <SelectItem value="en" className="font-black uppercase text-[10px]">English</SelectItem>
                  <SelectItem value="hi" className="font-black uppercase text-[10px]">Hindi (हिन्दी)</SelectItem>
                  <SelectItem value="ta" className="font-black uppercase text-[10px]">Tamil (தமிழ்)</SelectItem>
                  <SelectItem value="es" className="font-black uppercase text-[10px]">Spanish (Español)</SelectItem>
                  <SelectItem value="fr" className="font-black uppercase text-[10px]">French (Français)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-14 border-2 font-black uppercase text-[10px] tracking-widest"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="border-2 shadow-2xl">
                  <SelectItem value="all" className="font-black uppercase text-[10px]">Registry All</SelectItem>
                  {Constants.public.Enums.document_status.map(s => (
                    <SelectItem key={s} value={s} className="font-black uppercase text-[10px]">{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] h-14 border-2 font-black uppercase text-[10px] tracking-widest"><SelectValue placeholder="Filing Group" /></SelectTrigger>
                <SelectContent className="border-2 shadow-2xl">
                  <SelectItem value="all" className="font-black uppercase text-[10px]">All Filings</SelectItem>
                  {Constants.public.Enums.document_category.map(c => (
                    <SelectItem key={c} value={c} className="font-black uppercase text-[10px]">{c.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registry Ledger List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/5 py-24 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="font-black uppercase text-sm text-muted-foreground tracking-widest">Registry Search Empty</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map(doc => (
              <Link key={doc.id} to={`/documents/${doc.id}`} className="group">
                <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-[0_20px_50px_rgba(var(--primary),0.1)] group-hover:-translate-y-1 bg-background/80 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-stretch h-24">
                      {/* Status Strip */}
                      <div className={cn("w-1.5", statusColor[doc.status]?.split(" ")[0])} />
                      
                      <div className="flex-1 flex items-center justify-between p-6">
                        <div className="flex items-center gap-6 min-w-0">
                          <div className="h-14 w-14 rounded-2xl bg-muted group-hover:bg-primary/10 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all duration-500 relative">
                            <FileText className="h-7 w-7" />
                            {doc.flagged && <div className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full border-2 border-background animate-pulse" />}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-lg tracking-tight uppercase group-hover:text-primary transition-colors truncate">{doc.title}</h3>
                              {doc.confidence_score > 80 && <Sparkles className="h-4 w-4 text-primary" />}
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                               <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-primary opacity-40" /> {doc.category.replace(/_/g, " ")}</span>
                               <span>•</span>
                               <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary opacity-40" /> {format(new Date(doc.created_at), "MMM d, yyyy")}</span>
                               <span>•</span>
                               <span className="text-primary font-black">HASH: {doc.id.split("-")[0]}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-40">Intelligence Match</p>
                            <p className="text-lg font-black text-primary">{Math.round(doc.confidence_score || 0)}%</p>
                          </div>
                          <Badge className={cn("h-8 px-6 rounded-lg font-black uppercase tracking-tighter text-[9px] border-2 shadow-sm", statusColor[doc.status])}>
                            {doc.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
