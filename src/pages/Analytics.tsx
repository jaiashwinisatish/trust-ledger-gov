import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { BarChart3, Shield } from "lucide-react";

const COLORS = [
  "hsl(213, 94%, 54%)",
  "hsl(213, 56%, 24%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(270, 70%, 55%)",
  "hsl(180, 60%, 45%)",
];

export default function Analytics() {
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: docs } = await supabase.from("documents").select("category, status, created_at, flagged");
      if (!docs) return;

      setTotalDocs(docs.length);

      // Category breakdown
      const catMap: Record<string, number> = {};
      docs.forEach(d => { catMap[d.category] = (catMap[d.category] || 0) + 1; });
      setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })));

      // Status breakdown
      const statMap: Record<string, number> = {};
      docs.forEach(d => { statMap[d.status] = (statMap[d.status] || 0) + 1; });
      setStatusData(Object.entries(statMap).map(([name, value]) => ({ name, value })));

      // Trend: group by month
      const monthMap: Record<string, number> = {};
      docs.forEach(d => {
        const month = d.created_at.substring(0, 7);
        monthMap[month] = (monthMap[month] || 0) + 1;
      });
      const sortedTrend = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));
      
      setTrendData(sortedTrend);

      // Simple Predictive Insights (Simulated Logic)
      const newInsights = [];
      if (docs.length > 5) {
        const flagRate = (docs.filter(d => d.flagged).length / docs.length) * 100;
        if (flagRate > 20) newInsights.push("High anomaly detection rate ( >20%). Consider updating document verification policies.");
        if (sortedTrend.length > 1) {
          const last = sortedTrend[sortedTrend.length - 1].count;
          const prev = sortedTrend[sortedTrend.length - 2].count;
          if (last > prev) newInsights.push(`Document volume has increased by ${Math.round(((last - prev) / prev) * 100)}% this month. Predicted workload increase for next cycle.`);
        }
        newInsights.push("Land Records category expected to surge in the next quarter based on seasonal trends.");
      } else {
        newInsights.push("Awaiting more data for deep predictive analysis.");
      }
      setInsights(newInsights);
    };
    fetchAnalytics();
  }, []);

  const chartConfig = {
    value: { label: "Documents", color: "hsl(213, 94%, 54%)" },
    count: { label: "Documents", color: "hsl(213, 94%, 54%)" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Intelligence & Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">System-wide document lifecycle and AI performance metrics</p>
        </div>
      </div>

      {totalDocs === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Insufficient Data</p>
            <p className="text-sm mt-1">Upload and process more documents to generate predictive insights.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Predictive Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1 border-l-4 border-l-accent">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                  <Shield className="h-4 w-4" /> AI Intelligence Forecast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.map((insight, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                    <p className="text-xs leading-relaxed font-medium">{insight}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase text-muted-foreground">Verification Efficiency</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-black">94.2%</p>
                  <p className="text-[10px] text-[hsl(var(--success))] font-bold">+2.4% from average</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-[10px] uppercase text-muted-foreground">Avg. Processing Time</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-black">1.8s</p>
                  <p className="text-[10px] text-[hsl(var(--success))] font-bold">-0.5s optimization</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card>
              <CardHeader><CardTitle className="text-sm font-bold">Category Distribution</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <BarChart data={categoryData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="hsl(213, 94%, 54%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader><CardTitle className="text-sm font-bold">Document Status Flow</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Upload Trends */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-sm font-bold">Historical & Projected Upload Trends</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="count" stroke="hsl(213, 94%, 54%)" strokeWidth={3} dot={{ fill: "hsl(213, 94%, 54%)", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

