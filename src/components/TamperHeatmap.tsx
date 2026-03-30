import { useState } from "react";
import { 
  ShieldAlert, 
  Info, 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeatmapZone {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  reason: string;
}

interface TamperHeatmapProps {
  imageUrl: string;
  zones: HeatmapZone[];
}

export default function TamperHeatmap({ imageUrl, zones }: TamperHeatmapProps) {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [zoom, setZoom] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Forensic Tamper Heatmap
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase bg-muted px-2 py-1 rounded hover:bg-muted/80 transition-colors"
          >
            {showHeatmap ? (
              <><EyeOff className="h-3 w-3" /> Hide Heatmap</>
            ) : (
              <><Eye className="h-3 w-3" /> Show Heatmap</>
            )}
          </button>
          <button
            onClick={() => setZoom(!zoom)}
            className="p-1 bg-muted rounded hover:bg-muted/80 transition-colors"
          >
            {zoom ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
        </div>
      </div>

      <div className={cn(
        "relative rounded-xl border-2 border-dashed border-muted overflow-hidden bg-black/5 flex items-center justify-center transition-all duration-500",
        zoom ? "aspect-auto h-full" : "aspect-[4/3] h-[400px]"
      )}>
        {/* Original Document Image */}
        <img 
          src={imageUrl} 
          alt="Forensic Audit"
          className="max-w-full max-h-full object-contain select-none"
        />

        {/* Heatmap Overlay Layer */}
        {showHeatmap && zones.length > 0 && (
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <radialGradient id="heatGradient">
                <stop offset="0%" stopColor="rgba(239, 68, 68, 0.6)" />
                <stop offset="70%" stopColor="rgba(239, 68, 68, 0.2)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
              </radialGradient>
            </defs>
            {zones.map((zone, i) => (
              <rect
                key={i}
                x={zone.x}
                y={zone.y}
                width={zone.w}
                height={zone.h}
                fill="url(#heatGradient)"
                className="animate-in fade-in duration-1000"
                style={{ pointerEvents: 'auto' }}
              />
            ))}
          </svg>
        )}

        {/* Interactive Tooltips (Separate layer for better event handling) */}
        {showHeatmap && (
          <div className="absolute inset-0 pointer-events-none">
            <TooltipProvider>
              {zones.map((zone, i) => (
                <div
                  key={i}
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: `${zone.w}%`,
                    height: `${zone.h}%`,
                    position: 'absolute',
                    pointerEvents: 'auto'
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full h-full cursor-help group">
                        <div className="absolute top-0 right-0 -m-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <ShieldAlert className="h-2.5 w-2.5" />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px] bg-destructive text-destructive-foreground border-none">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase">{zone.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs leading-tight">{zone.reason}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </TooltipProvider>
          </div>
        )}

        {/* Legend */}
        {showHeatmap && (
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-[10px] space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="font-bold">SUSPECTED TAMPER ZONE</span>
            </div>
          </div>
        )}
      </div>

      {/* Forensic Findings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {zones.map((zone, i) => (
          <div key={i} className="p-3 bg-muted/30 border border-muted rounded-lg flex gap-3 items-start">
            <div className="h-6 w-6 bg-destructive/10 rounded flex items-center justify-center shrink-0">
              <Info className="h-3 w-3 text-destructive" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase text-destructive tracking-tight leading-none mb-1">
                Forensic Mark #{i + 1}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {zone.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
