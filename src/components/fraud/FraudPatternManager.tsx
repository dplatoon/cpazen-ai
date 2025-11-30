import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Brain, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function FraudPatternManager() {
  const queryClient = useQueryClient();

  const { data: patterns = [], isLoading } = useQuery({
    queryKey: ['fraud-patterns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fraud_patterns')
        .select('*')
        .order('confidence_score', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updatePatternFeedback = useMutation({
    mutationFn: async ({ id, isTruePositive }: { id: string; isTruePositive: boolean }) => {
      const pattern = patterns.find((p: any) => p.id === id);
      if (!pattern) throw new Error('Pattern not found');

      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (isTruePositive) {
        updates.true_positive_count = pattern.true_positive_count + 1;
      } else {
        updates.false_positive_count = pattern.false_positive_count + 1;
      }

      // Update confidence score based on feedback
      const totalFeedback = updates.true_positive_count || pattern.true_positive_count + 
                           updates.false_positive_count || pattern.false_positive_count;
      const truePositiveRate = (updates.true_positive_count || pattern.true_positive_count) / totalFeedback;
      updates.confidence_score = Math.round(truePositiveRate * 100);

      const { error } = await supabase
        .from('fraud_patterns')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-patterns'] });
      toast.success('Pattern feedback recorded');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update pattern: ${error.message}`);
    },
  });

  const deletePattern = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fraud_patterns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-patterns'] });
      toast.success('Pattern deleted');
    },
  });

  const getPatternTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      click_velocity: 'Click Velocity',
      conversion_time: 'Conversion Speed',
      geo_anomaly: 'Geographic Anomaly',
      device_fingerprint: 'Device Pattern',
    };
    return labels[type] || type;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          ML Fraud Patterns
        </CardTitle>
        <CardDescription>
          Machine learning patterns that detect fraudulent behavior. Provide feedback to improve accuracy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading patterns...</div>
        ) : patterns.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No fraud patterns detected yet</p>
            <p className="text-sm mt-2">Patterns will be automatically learned from your traffic data</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {patterns.map((pattern: any) => (
                <div key={pattern.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getPatternTypeLabel(pattern.pattern_type)}</Badge>
                        <span className={`text-sm font-medium ${getConfidenceColor(pattern.confidence_score)}`}>
                          {pattern.confidence_score}% confidence
                        </span>
                      </div>
                      <Progress value={pattern.confidence_score} className="h-2 w-full max-w-xs" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePattern.mutate(pattern.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                      <strong>Pattern Details:</strong>{' '}
                      {JSON.stringify(pattern.pattern_data, null, 2)}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        True Positives: {pattern.true_positive_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        False Positives: {pattern.false_positive_count}
                      </span>
                      {pattern.last_triggered_at && (
                        <span>
                          Last triggered: {new Date(pattern.last_triggered_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updatePatternFeedback.mutate({ id: pattern.id, isTruePositive: true })}
                      disabled={updatePatternFeedback.isPending}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Accurate Detection
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updatePatternFeedback.mutate({ id: pattern.id, isTruePositive: false })}
                      disabled={updatePatternFeedback.isPending}
                    >
                      <TrendingDown className="h-4 w-4 mr-1" />
                      False Positive
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}