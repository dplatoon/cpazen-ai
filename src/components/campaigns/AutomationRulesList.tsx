import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Plus, Trash2, Zap } from "lucide-react";
import { 
  AutomationRule, 
  useAutomationRules, 
  useCreateAutomationRule, 
  useDeleteAutomationRule, 
  useToggleAutomationRule,
  ConditionMetric,
  ConditionOperator,
  ActionType
} from "@/hooks/useAutomationRules";
import { cn } from "@/lib/utils";

interface AutomationRulesListProps {
  campaignId: string;
}

const METRICS: { value: ConditionMetric; label: string }[] = [
  { value: 'cpa', label: 'CPA' },
  { value: 'roas', label: 'ROAS' },
  { value: 'conversion_rate', label: 'Conversion Rate' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'conversions', label: 'Conversions' },
];

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: '>=', label: '>=' },
  { value: '<=', label: '<=' },
];

const ACTIONS: { value: ActionType; label: string; description: string }[] = [
  { value: 'pause_campaign', label: 'Pause Campaign', description: 'Pause entire campaign' },
  { value: 'pause_source', label: 'Pause Source', description: 'Pause traffic source' },
  { value: 'lower_bid', label: 'Lower Bid', description: 'Reduce bid by %' },
  { value: 'raise_bid', label: 'Raise Bid', description: 'Increase bid by %' },
  { value: 'send_alert', label: 'Send Alert', description: 'Email notification' },
];

export function AutomationRulesList({ campaignId }: AutomationRulesListProps) {
  const { data: rules = [], isLoading } = useAutomationRules(campaignId);
  const createRule = useCreateAutomationRule();
  const deleteRule = useDeleteAutomationRule();
  const toggleRule = useToggleAutomationRule();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    metric: 'cpa' as ConditionMetric,
    operator: '>' as ConditionOperator,
    threshold: 0,
    scope: 'campaign' as const,
    timeWindow: { value: 24, unit: 'hours' as string },
    actionType: 'pause_campaign' as ActionType,
    actionValue: 10,
  });

  const handleCreateRule = () => {
    createRule.mutate({
      campaign_id: campaignId,
      name: newRule.name,
      condition_json: {
        metric: newRule.metric,
        operator: newRule.operator,
        threshold: newRule.threshold,
        scope: newRule.scope,
        timeWindow: newRule.timeWindow,
      },
      action_json: {
        type: newRule.actionType,
        value: newRule.actionType.includes('bid') ? newRule.actionValue : undefined,
      },
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setNewRule({
          name: '',
          metric: 'cpa',
          operator: '>',
          threshold: 0,
          scope: 'campaign',
          timeWindow: { value: 24, unit: 'hours' as string },
          actionType: 'pause_campaign',
          actionValue: 10,
        });
      },
    });
  };

  const formatCondition = (rule: AutomationRule) => {
    const cond = rule.condition_json;
    const metricLabel = METRICS.find(m => m.value === cond.metric)?.label || cond.metric;
    return `${metricLabel} ${cond.operator} ${cond.threshold} (${cond.timeWindow.value}${cond.timeWindow.unit.charAt(0)})`;
  };

  const formatAction = (rule: AutomationRule) => {
    const action = rule.action_json;
    const actionLabel = ACTIONS.find(a => a.value === action.type)?.label || action.type;
    if (action.value) return `${actionLabel} (${action.value}%)`;
    return actionLabel;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Automation Rules</CardTitle>
            {rules.length > 0 && (
              <Badge variant="secondary">{rules.filter(r => r.is_active).length} active</Badge>
            )}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Automation Rule</DialogTitle>
                <DialogDescription>
                  Set conditions to automatically optimize your campaign
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="e.g., Pause high CPA sources"
                  />
                </div>

                <div className="space-y-2">
                  <Label>IF Condition</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={newRule.metric} 
                      onValueChange={(v) => setNewRule({ ...newRule, metric: v as ConditionMetric })}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METRICS.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={newRule.operator} 
                      onValueChange={(v) => setNewRule({ ...newRule, operator: v as ConditionOperator })}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      className="w-[100px]"
                      value={newRule.threshold}
                      onChange={(e) => setNewRule({ ...newRule, threshold: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Time Window</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      className="w-[80px]"
                      value={newRule.timeWindow.value}
                      onChange={(e) => setNewRule({ 
                        ...newRule, 
                        timeWindow: { ...newRule.timeWindow, value: Number(e.target.value) } 
                      })}
                    />
                    <Select 
                      value={newRule.timeWindow.unit} 
                      onValueChange={(v) => setNewRule({ 
                        ...newRule, 
                        timeWindow: { ...newRule.timeWindow, unit: v as 'hours' | 'days' } 
                      })}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>THEN Action</Label>
                  <Select 
                    value={newRule.actionType} 
                    onValueChange={(v) => setNewRule({ ...newRule, actionType: v as ActionType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIONS.map(a => (
                        <SelectItem key={a.value} value={a.value}>
                          <div>
                            <div className="font-medium">{a.label}</div>
                            <div className="text-xs text-muted-foreground">{a.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(newRule.actionType === 'lower_bid' || newRule.actionType === 'raise_bid') && (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        className="w-[100px]"
                        value={newRule.actionValue}
                        onChange={(e) => setNewRule({ ...newRule, actionValue: Number(e.target.value) })}
                      />
                      <span className="text-sm text-muted-foreground">% adjustment</span>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleCreateRule} 
                  className="w-full"
                  disabled={!newRule.name || createRule.isPending}
                >
                  {createRule.isPending ? 'Creating...' : 'Create Rule'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Automate campaign optimization based on performance thresholds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground">Loading rules...</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No automation rules</p>
            <p className="text-sm">Create rules to automate campaign optimization</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div 
              key={rule.id} 
              className={cn(
                "border rounded-lg p-4 space-y-2",
                !rule.is_active && "opacity-60"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className={cn("h-4 w-4", rule.is_active ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-medium">{rule.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) => toggleRule.mutate({ id: rule.id, is_active: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteRule.mutate(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-mono">IF</span> {formatCondition(rule)}{' '}
                <span className="text-foreground font-mono">THEN</span> {formatAction(rule)}
              </div>
              {rule.last_triggered_at && (
                <div className="text-xs text-muted-foreground">
                  Last triggered: {new Date(rule.last_triggered_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
