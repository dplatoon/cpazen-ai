import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ComposedChart,
  Area,
  AreaChart
} from "recharts";
import { Globe, Users, MousePointer, CreditCard } from "lucide-react";

// Traffic source data
const trafficSourceData = [
  { name: 'Facebook Ads', value: 35, color: 'hsl(var(--brand-teal))' },
  { name: 'Google Ads', value: 28, color: 'hsl(var(--brand-purple))' },
  { name: 'Native Ads', value: 20, color: 'hsl(var(--success))' },
  { name: 'Email Marketing', value: 12, color: 'hsl(var(--warning))' },
  { name: 'Direct Traffic', value: 5, color: 'hsl(var(--destructive))' }
];

// Geographic performance data
const geoData = [
  { country: 'United States', revenue: 15678, clicks: 45623, cr: 2.34, flag: '🇺🇸' },
  { country: 'Canada', revenue: 8934, clicks: 28901, cr: 1.98, flag: '🇨🇦' },
  { country: 'United Kingdom', revenue: 7456, clicks: 23456, cr: 2.12, flag: '🇬🇧' },
  { country: 'Australia', revenue: 5234, clicks: 18234, cr: 1.87, flag: '🇦🇺' },
  { country: 'Germany', revenue: 3456, clicks: 15678, cr: 1.45, flag: '🇩🇪' },
];

// Conversion funnel data
const funnelData = [
  { stage: 'Impressions', value: 125000, percentage: 100, color: 'hsl(var(--foreground-muted))' },
  { stage: 'Clicks', value: 15620, percentage: 12.5, color: 'hsl(var(--brand-teal))' },
  { stage: 'Landing Views', value: 12890, percentage: 82.5, color: 'hsl(var(--brand-purple))' },
  { stage: 'Leads', value: 3456, percentage: 26.8, color: 'hsl(var(--success))' },
  { stage: 'Conversions', value: 567, percentage: 16.4, color: 'hsl(var(--warning))' }
];

// Hourly performance data
const hourlyData = [
  { hour: '00:00', clicks: 234, conversions: 12, revenue: 580 },
  { hour: '02:00', clicks: 189, conversions: 8, revenue: 420 },
  { hour: '04:00', clicks: 156, conversions: 6, revenue: 320 },
  { hour: '06:00', clicks: 298, conversions: 15, revenue: 750 },
  { hour: '08:00', clicks: 456, conversions: 28, revenue: 1240 },
  { hour: '10:00', clicks: 678, conversions: 42, revenue: 1890 },
  { hour: '12:00', clicks: 789, conversions: 48, revenue: 2340 },
  { hour: '14:00', clicks: 892, conversions: 54, revenue: 2680 },
  { hour: '16:00', clicks: 934, conversions: 58, revenue: 2890 },
  { hour: '18:00', clicks: 812, conversions: 51, revenue: 2456 },
  { hour: '20:00', clicks: 698, conversions: 45, revenue: 2130 },
  { hour: '22:00', clicks: 567, conversions: 35, revenue: 1680 }
];

export const InteractiveCharts = () => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-card-border rounded-lg p-3 shadow-lg backdrop-blur-sm">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {
                entry.dataKey === 'revenue' ? `$${entry.value.toLocaleString()}` :
                entry.dataKey === 'percentage' ? `${entry.value}%` :
                entry.value.toLocaleString()
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Traffic Sources Pie Chart */}
      <Card className="p-6 bg-gradient-card border-card-border backdrop-blur-sm bg-card/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-brand-teal/20">
            <MousePointer className="h-5 w-5 text-brand-teal" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Traffic Sources</h3>
            <p className="text-sm text-foreground-muted">Distribution by channel</p>
          </div>
        </div>

        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={trafficSourceData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
              >
                {trafficSourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 space-y-2">
          {trafficSourceData.map((source, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: source.color }}
                />
                <span className="text-foreground">{source.name}</span>
              </div>
              <span className="text-foreground-muted font-mono">{source.value}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Geographic Performance */}
      <Card className="p-6 bg-gradient-card border-card-border backdrop-blur-sm bg-card/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-brand-purple/20">
            <Globe className="h-5 w-5 text-brand-purple" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Geographic Performance</h3>
            <p className="text-sm text-foreground-muted">Top performing countries</p>
          </div>
        </div>

        <div className="space-y-4">
          {geoData.map((country, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card-hover/30 hover:bg-card-hover/50 transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{country.flag}</span>
                <div>
                  <div className="font-medium text-foreground">{country.country}</div>
                  <div className="text-sm text-foreground-muted">
                    {country.clicks.toLocaleString()} clicks
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-medium text-success">
                  ${country.revenue.toLocaleString()}
                </div>
                <div className="text-sm text-foreground-muted">
                  {country.cr}% CR
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Conversion Funnel */}
      <Card className="p-6 bg-gradient-card border-card-border backdrop-blur-sm bg-card/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-success/20">
            <Users className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Conversion Funnel</h3>
            <p className="text-sm text-foreground-muted">User journey analysis</p>
          </div>
        </div>

        <div className="space-y-3">
          {funnelData.map((stage, index) => (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{stage.stage}</span>
                <div className="text-right">
                  <span className="text-sm font-mono text-foreground">
                    {stage.value.toLocaleString()}
                  </span>
                  {index > 0 && (
                    <span className="text-xs text-foreground-muted ml-2">
                      ({stage.percentage}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <div className="w-full bg-card-hover/30 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${stage.percentage}%`,
                      backgroundColor: stage.color
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Hourly Performance */}
      <Card className="p-6 bg-gradient-card border-card-border backdrop-blur-sm bg-card/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-warning/20">
            <CreditCard className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Hourly Performance</h3>
            <p className="text-sm text-foreground-muted">Today's activity breakdown</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--card-border))" />
              <XAxis 
                dataKey="hour" 
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
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="clicks"
                fill="hsl(var(--brand-teal) / 0.2)"
                stroke="hsl(var(--brand-teal))"
                strokeWidth={2}
              />
              <Bar
                yAxisId="right"
                dataKey="revenue"
                fill="hsl(var(--success))"
                radius={[2, 2, 0, 0]}
                opacity={0.8}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-card-border">
          <div className="text-center">
            <div className="text-lg font-semibold text-brand-teal">7.8K</div>
            <div className="text-xs text-foreground-muted">Total Clicks</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-success">$18.4K</div>
            <div className="text-xs text-foreground-muted">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-warning">2.8%</div>
            <div className="text-xs text-foreground-muted">Avg Conv Rate</div>
          </div>
        </div>
      </Card>
    </div>
  );
};