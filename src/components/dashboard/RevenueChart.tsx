import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { mockChartData } from "@/lib/mockData";

export const RevenueChart = () => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-card-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Revenue' ? `$${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 bg-gradient-card border-card-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Performance Overview</h3>
          <p className="text-sm text-foreground-muted">Last 7 days</p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--card-border))" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="hsl(var(--foreground-muted))"
              fontSize={12}
            />
            <YAxis 
              yAxisId="left"
              stroke="hsl(var(--foreground-muted))"
              fontSize={12}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="hsl(var(--foreground-muted))"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="clicks"
              stroke="hsl(var(--brand-teal))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--brand-teal))", strokeWidth: 2, r: 4 }}
              name="Clicks"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="conversions"
              stroke="hsl(var(--brand-purple))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--brand-purple))", strokeWidth: 2, r: 4 }}
              name="Conversions"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--success))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--success))", strokeWidth: 2, r: 4 }}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};