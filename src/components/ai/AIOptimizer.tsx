import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, Zap, AlertCircle, CheckCircle, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";

// Mock AI recommendations data
const aiRecommendations = [
  {
    id: 1,
    type: "budget",
    title: "Increase Budget for Dating Campaign",
    description: "Campaign showing 340% ROI. Recommend +$500 daily budget.",
    impact: "high",
    confidence: 94,
    estimated_revenue: "+$1,250/day"
  },
  {
    id: 2,
    type: "targeting",
    title: "Adjust Geo-Targeting",
    description: "Remove low-performing regions: IN, PH. Focus on US, CA, UK.",
    impact: "medium",
    confidence: 87,
    estimated_revenue: "+$380/day"
  },
  {
    id: 3,
    type: "bidding",
    title: "Smart Bidding Optimization",
    description: "Switch to performance-based bidding for 23% better ROI.",
    impact: "high",
    confidence: 91,
    estimated_revenue: "+$920/day"
  }
];

// Performance prediction data
const predictionData = [
  { day: 'Today', actual: 2450, predicted: 2450 },
  { day: 'Day 2', actual: null, predicted: 2680 },
  { day: 'Day 3', actual: null, predicted: 2890 },
  { day: 'Day 4', actual: null, predicted: 3120 },
  { day: 'Day 5', actual: null, predicted: 3350 },
  { day: 'Day 6', actual: null, predicted: 3480 },
  { day: 'Day 7', actual: null, predicted: 3650 }
];

// AI Health Score data
const healthScoreData = [
  { name: 'Optimized', value: 75, color: 'hsl(var(--success))' },
  { name: 'Needs Attention', value: 25, color: 'hsl(var(--warning))' }
];

interface AIOptimizerProps {
  className?: string;
}

export const AIOptimizer = ({ className }: AIOptimizerProps) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI Health Score */}
      <Card className="p-6 bg-gradient-card border-card-border backdrop-blur-sm bg-card/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-brand-teal/20">
              <Brain className="h-5 w-5 text-brand-teal" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">AI Health Score</h3>
              <p className="text-sm text-foreground-muted">Overall campaign optimization status</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
            Excellent
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Health Score</span>
              <span className="text-2xl font-bold text-success">87%</span>
            </div>
            <Progress value={87} className="h-3" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-success">12</div>
                <div className="text-xs text-foreground-muted">Optimized</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-warning">4</div>
                <div className="text-xs text-foreground-muted">Need Attention</div>
              </div>
            </div>
          </div>
          
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthScoreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {healthScoreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Smart Recommendations */}
      <Card className="p-6 bg-gradient-card border-card-border backdrop-blur-sm bg-card/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-brand-purple/20">
              <Zap className="h-5 w-5 text-brand-purple" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Smart Recommendations</h3>
              <p className="text-sm text-foreground-muted">AI-powered optimization suggestions</p>
            </div>
          </div>
          <Button size="sm" variant="outline">
            Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {aiRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-lg bg-card-hover/50 border border-card-border hover:bg-card-hover/70 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded ${
                    rec.impact === 'high' ? 'bg-success/20' : 'bg-warning/20'
                  }`}>
                    {rec.impact === 'high' ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{rec.title}</h4>
                    <p className="text-sm text-foreground-muted">{rec.description}</p>
                  </div>
                </div>
                <Badge variant={rec.impact === 'high' ? 'default' : 'secondary'}>
                  {rec.confidence}% confident
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-success">
                  {rec.estimated_revenue}
                </span>
                <div className="space-x-2">
                  <Button size="sm" variant="outline">
                    Dismiss
                  </Button>
                  <Button size="sm">
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Auto-Optimization Controls */}
      <Card className="p-6 bg-gradient-card border-card-border backdrop-blur-sm bg-card/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-success/20">
            <Target className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Auto-Optimization</h3>
            <p className="text-sm text-foreground-muted">Let AI optimize your campaigns automatically</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Smart Budget</h4>
                <p className="text-xs text-foreground-muted">Auto-adjust spend based on performance</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Geo-Targeting</h4>
                <p className="text-xs text-foreground-muted">Optimize traffic sources automatically</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Bid Management</h4>
                <p className="text-xs text-foreground-muted">AI-powered bidding optimization</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>
      </Card>

      {/* Performance Prediction */}
      <Card className="p-6 bg-gradient-card border-card-border backdrop-blur-sm bg-card/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-brand-teal/20">
            <TrendingUp className="h-5 w-5 text-brand-teal" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">7-Day Revenue Prediction</h3>
            <p className="text-sm text-foreground-muted">AI forecast based on current performance</p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={predictionData}>
              <XAxis dataKey="day" stroke="hsl(var(--foreground-muted))" fontSize={12} />
              <YAxis stroke="hsl(var(--foreground-muted))" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--card-border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--brand-teal))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--brand-teal))", strokeWidth: 2, r: 5 }}
                name="Actual Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="hsl(var(--brand-purple))" 
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ fill: "hsl(var(--brand-purple))", strokeWidth: 2, r: 5 }}
                name="Predicted Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-card-border">
          <div className="text-center">
            <div className="text-lg font-semibold text-success">+31%</div>
            <div className="text-xs text-foreground-muted">Predicted Growth</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-brand-teal">$24.8K</div>
            <div className="text-xs text-foreground-muted">7-Day Forecast</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-brand-purple">92%</div>
            <div className="text-xs text-foreground-muted">Accuracy</div>
          </div>
        </div>
      </Card>
    </div>
  );
};