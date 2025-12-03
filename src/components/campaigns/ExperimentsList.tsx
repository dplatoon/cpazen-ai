import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { FlaskConical, Plus, Play, Pause, Trophy, Trash2 } from "lucide-react";
import { 
  Experiment, 
  ExperimentType, 
  ExperimentMetric,
  ExperimentVariant,
  useExperiments, 
  useCreateExperiment, 
  useUpdateExperiment,
  useEndExperiment,
  useDeleteExperiment 
} from "@/hooks/useExperiments";
import { cn } from "@/lib/utils";

interface ExperimentsListProps {
  campaignId: string;
}

const TYPE_LABELS: Record<ExperimentType, string> = {
  lander_ab: 'Landing Page A/B',
  creative_ab: 'Creative A/B',
  offer_rotation: 'Offer Rotation',
};

const METRIC_LABELS: Record<ExperimentMetric, string> = {
  cpa: 'CPA',
  roas: 'ROAS',
  conversion_rate: 'Conversion Rate',
  revenue: 'Revenue',
};

export function ExperimentsList({ campaignId }: ExperimentsListProps) {
  const { data: experiments = [], isLoading } = useExperiments(campaignId);
  const createExperiment = useCreateExperiment();
  const updateExperiment = useUpdateExperiment();
  const endExperiment = useEndExperiment();
  const deleteExperiment = useDeleteExperiment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newExperiment, setNewExperiment] = useState({
    name: '',
    type: 'lander_ab' as ExperimentType,
    metric: 'cpa' as ExperimentMetric,
    variants: [
      { id: 'A', label: 'Variant A', url: '', weight: 50 },
      { id: 'B', label: 'Variant B', url: '', weight: 50 },
    ] as ExperimentVariant[],
    min_data_threshold: 100,
  });

  const handleCreateExperiment = () => {
    createExperiment.mutate({
      campaign_id: campaignId,
      name: newExperiment.name,
      type: newExperiment.type,
      metric: newExperiment.metric,
      variants: newExperiment.variants,
      min_data_threshold: newExperiment.min_data_threshold,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setNewExperiment({
          name: '',
          type: 'lander_ab',
          metric: 'cpa',
          variants: [
            { id: 'A', label: 'Variant A', url: '', weight: 50 },
            { id: 'B', label: 'Variant B', url: '', weight: 50 },
          ],
          min_data_threshold: 100,
        });
      },
    });
  };

  const addVariant = () => {
    const nextId = String.fromCharCode(65 + newExperiment.variants.length); // A, B, C, ...
    setNewExperiment({
      ...newExperiment,
      variants: [
        ...newExperiment.variants,
        { id: nextId, label: `Variant ${nextId}`, url: '', weight: Math.floor(100 / (newExperiment.variants.length + 1)) },
      ],
    });
  };

  const updateVariant = (index: number, updates: Partial<ExperimentVariant>) => {
    const variants = [...newExperiment.variants];
    variants[index] = { ...variants[index], ...updates };
    setNewExperiment({ ...newExperiment, variants });
  };

  const removeVariant = (index: number) => {
    if (newExperiment.variants.length <= 2) return;
    setNewExperiment({
      ...newExperiment,
      variants: newExperiment.variants.filter((_, i) => i !== index),
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-success/10 text-success border-success/20">Running</Badge>;
      case 'paused':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Experiments</CardTitle>
            {experiments.filter(e => e.status === 'running').length > 0 && (
              <Badge variant="secondary">
                {experiments.filter(e => e.status === 'running').length} running
              </Badge>
            )}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Experiment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create A/B Test</DialogTitle>
                <DialogDescription>
                  Split traffic between variants to find the best performer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Experiment Name</Label>
                  <Input
                    value={newExperiment.name}
                    onChange={(e) => setNewExperiment({ ...newExperiment, name: e.target.value })}
                    placeholder="e.g., Landing Page Test v2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={newExperiment.type} 
                      onValueChange={(v) => setNewExperiment({ ...newExperiment, type: v as ExperimentType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(TYPE_LABELS) as [ExperimentType, string][]).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Primary Metric</Label>
                    <Select 
                      value={newExperiment.metric} 
                      onValueChange={(v) => setNewExperiment({ ...newExperiment, metric: v as ExperimentMetric })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(METRIC_LABELS) as [ExperimentMetric, string][]).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Variants</Label>
                    <Button variant="outline" size="sm" onClick={addVariant}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Variant
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {newExperiment.variants.map((variant, index) => (
                      <div key={variant.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{variant.label}</span>
                          {newExperiment.variants.length > 2 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => removeVariant(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <Input
                          placeholder="URL or identifier"
                          value={variant.url || ''}
                          onChange={(e) => updateVariant(index, { url: e.target.value })}
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className="w-20"
                            value={variant.weight}
                            onChange={(e) => updateVariant(index, { weight: Number(e.target.value) })}
                          />
                          <span className="text-sm text-muted-foreground">% traffic</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Min. Conversions per Variant</Label>
                  <Input
                    type="number"
                    value={newExperiment.min_data_threshold}
                    onChange={(e) => setNewExperiment({ ...newExperiment, min_data_threshold: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum conversions needed before declaring a winner
                  </p>
                </div>

                <Button 
                  onClick={handleCreateExperiment} 
                  className="w-full"
                  disabled={!newExperiment.name || createExperiment.isPending}
                >
                  {createExperiment.isPending ? 'Creating...' : 'Start Experiment'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Run A/B tests to optimize landing pages, creatives, and offers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground">Loading experiments...</div>
        ) : experiments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No experiments</p>
            <p className="text-sm">Create an A/B test to optimize performance</p>
          </div>
        ) : (
          experiments.map((experiment) => (
            <div key={experiment.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{experiment.name}</h4>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{TYPE_LABELS[experiment.type]}</Badge>
                    <Badge variant="outline">
                      Metric: {METRIC_LABELS[experiment.metric]}
                    </Badge>
                  </div>
                </div>
                {getStatusBadge(experiment.status)}
              </div>

              {/* Variants */}
              <div className="grid grid-cols-2 gap-2">
                {experiment.variants.map((variant) => (
                  <div 
                    key={variant.id}
                    className={cn(
                      "p-2 rounded border text-sm",
                      experiment.winner_variant_id === variant.id && "border-success bg-success/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{variant.label}</span>
                      {experiment.winner_variant_id === variant.id && (
                        <Trophy className="h-4 w-4 text-success" />
                      )}
                    </div>
                    <div className="text-muted-foreground">{variant.weight}% traffic</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {experiment.status === 'running' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateExperiment.mutate({ id: experiment.id, status: 'paused' })}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => endExperiment.mutate({ id: experiment.id })}
                    >
                      End & Apply Winner
                    </Button>
                  </>
                )}
                {experiment.status === 'paused' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateExperiment.mutate({ id: experiment.id, status: 'running' })}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Resume
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive ml-auto"
                  onClick={() => deleteExperiment.mutate(experiment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
