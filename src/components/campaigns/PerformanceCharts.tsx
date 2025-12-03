import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useCampaignTimeSeries } from "@/hooks/useCampaignAnalytics";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceChartsProps {
  campaignId: string;
}

const METRICS = [
  { value: 'clicks', label: 'Clicks', color: 'hsl(var(--primary))' },
  { value: 'conversions', label: 'Conversions', color: 'hsl(var(--success))' },
  { value: 'revenue', label: 'Revenue', color: 'hsl(var(--warning))' },
  { value: 'cpa', label: 'CPA', color: 'hsl(var(--destructive))' },
  { value: 'roas', label: 'ROAS', color: 'hsl(var(--accent-foreground))' },
];

export function PerformanceCharts({ campaignId }: PerformanceChartsProps) {
  const [metric, setMetric] = useState('clicks');
  const [days, setDays] = useState(7);
  const { data: timeSeriesData, isLoading } = useCampaignTimeSeries(campaignId, metric, days);

  const selectedMetric = METRICS.find(m => m.value === metric);

  const formatValue = (value: number) => {
    if (metric === 'revenue' || metric === 'cpa') {
      return `$${value.toFixed(2)}`;
    }
    if (metric === 'roas') {
      return `${value.toFixed(2)}x`;
    }
    return value.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card border-card-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle>Performance Over Time</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METRICS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!timeSeriesData || timeSeriesData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={selectedMetric?.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={selectedMetric?.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  className="text-xs fill-muted-foreground"
                />
                <YAxis 
                  tickFormatter={formatValue}
                  className="text-xs fill-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatValue(value), selectedMetric?.label]}
                  labelFormatter={formatDate}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke={selectedMetric?.color}
                  fillOpacity={1}
                  fill="url(#colorMetric)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
