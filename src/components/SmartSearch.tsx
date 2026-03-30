import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Mic, 
  MicOff, 
  Loader2, 
  FileText, 
  Command as CommandIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Type definition for document suggestions
interface DocSuggestion {
  id: string;
  title: string;
  category: string;
  status: string;
}

export default function SmartSearch() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<DocSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Ctrl + K search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("smart-search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced search logic
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      let q = supabase
        .from("documents")
        .select("id, title, category, status")
        .limit(6);

      // Role-based security filter
      if (role === "citizen") {
        q = q.eq("uploaded_by", user?.id);
      }

      // Multi-field search (ID, Title, Category, OCR)
      const { data, error } = await q.or(`title.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,ocr_text.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`);

      if (error) throw error;
      setSuggestions(data || []);
      setShowDropdown(true);
    } catch (err) {
      console.error("Search Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) performSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Voice Search (Speech Recognition)
  const toggleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Browser voice recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      console.error("Speech Error:", e);
      setIsListening(false);
      toast.error("Voice recognition failed. Please try again.");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      toast.success(`" ${transcript} " converted to search.`);
    };

    recognition.start();
  };

  return (
    <div className="relative w-full max-w-md ml-auto" ref={dropdownRef}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          id="smart-search-input"
          placeholder="Search by ID, Category, or Keywords..."
          className="pl-10 pr-16 bg-muted/20 border-border/50 focus-visible:ring-primary h-10 text-sm rounded-full transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <button
            onClick={toggleVoiceSearch}
            className={cn(
              "p-1.5 rounded-full transition-all hover:bg-muted",
              isListening ? "text-red-500 animate-pulse bg-red-50" : "text-muted-foreground"
            )}
            title="Search by Voice"
          >
            {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4 opacity-50 hover:opacity-100" />}
          </button>
          <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] text-muted-foreground uppercase font-bold tracking-tight select-none">
            <CommandIcon className="h-2.5 w-2.5" /> K
          </div>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && (suggestions.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground px-3 py-2">Document Results</p>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="divide-y divide-border/10">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    className="w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-center gap-3 group"
                    onClick={() => {
                      navigate(`/documents/${s.id}`);
                      setShowDropdown(false);
                      setQuery("");
                    }}
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-2">
                        {s.category.replace(/_/g, " ")} • ID: {s.id.split("-")[0]}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="bg-muted/30 p-2 border-t border-border flex justify-between items-center px-4">
            <p className="text-[10px] text-muted-foreground">Found {suggestions.length} matches</p>
            <p className="text-[10px] text-muted-foreground italic">Press / to focus anywhere</p>
          </div>
        </div>
      )}
    </div>
  );
}
