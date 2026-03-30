import { motion } from "framer-motion";
import { Link2, Shield, Fingerprint, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LedgerEntry {
  id: string;
  action: string;
  hash: string;
  previous_hash: string;
  created_at: string;
}

interface BlockchainLedgerProps {
  entries: LedgerEntry[];
}

export default function BlockchainLedger({ entries }: BlockchainLedgerProps) {
  if (!entries || entries.length === 0) return null;

  return (
    <div className="space-y-6 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-primary/20 before:to-transparent">
      {entries.map((entry, idx) => {
        const isGenesis = entry.previous_hash === "0".repeat(64);
        
        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative pl-12 group"
          >
            {/* The Dot/Node */}
            <div className={cn(
              "absolute left-[18px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background z-10 transition-transform group-hover:scale-125 group-hover:bg-primary group-hover:shadow-[0_0_10px_hsl(var(--primary))]",
              isGenesis && "border-amber-500 group-hover:bg-amber-500 group-hover:shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            )} />

            <div className="glass-card border-none p-5 rounded-2xl group-hover:glow-shadow transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    isGenesis ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                  )}>
                    {isGenesis ? <Shield className="h-5 w-5" /> : <Fingerprint className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">
                      {isGenesis ? "Genesis Entry" : entry.action}
                    </p>
                    <p className="text-sm font-bold">{format(new Date(entry.created_at), "MMM d, yyyy • HH:mm:ss")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-accent/30 rounded-full">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">Immutable Block #{entry.id.slice(0, 8)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Link2 className="h-3 w-3 rotate-45" /> Previous Hash
                  </p>
                  <code className="text-[10px] block p-2 bg-muted/50 rounded-lg border border-border/50 truncate font-mono opacity-60">
                    {entry.previous_hash}
                  </code>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Current Hash
                  </p>
                  <code className="text-[10px] block p-2 bg-primary/5 rounded-lg border border-primary/20 truncate font-mono text-primary font-bold">
                    {entry.hash}
                  </code>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
