import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Webhook, Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret_key: string;
  is_active: boolean;
  created_at: string;
}

const AVAILABLE_EVENTS = [
  { value: 'conversion', label: 'Conversion' },
  { value: 'click', label: 'Click' },
  { value: 'fraud_alert', label: 'Fraud Alert' },
];

export function WebhookManager() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['conversion']);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WebhookConfig[];
    },
  });

  const createWebhook = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('webhooks').insert({
        user_id: user.id,
        name,
        url,
        events: selectedEvents,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook created successfully');
      setOpen(false);
      setName('');
      setUrl('');
      setSelectedEvents(['conversion']);
    },
    onError: (error) => {
      toast.error('Failed to create webhook: ' + error.message);
    },
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhooks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete webhook: ' + error.message);
    },
  });

  const toggleWebhook = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('webhooks')
        .update({ is_active: !isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
    onError: (error) => {
      toast.error('Failed to toggle webhook: ' + error.message);
    },
  });

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret key copied to clipboard');
  };

  const toggleSecretVisibility = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Integrations
            </CardTitle>
            <CardDescription>
              Configure webhooks to receive real-time notifications for events
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>
                  Add a new webhook endpoint to receive event notifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="url">Endpoint URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://api.example.com/webhook"
                  />
                </div>
                <div>
                  <Label>Events to Subscribe</Label>
                  <div className="space-y-2 mt-2">
                    {AVAILABLE_EVENTS.map((event) => (
                      <div key={event.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={event.value}
                          checked={selectedEvents.includes(event.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEvents([...selectedEvents, event.value]);
                            } else {
                              setSelectedEvents(selectedEvents.filter(e => e !== event.value));
                            }
                          }}
                        />
                        <Label htmlFor={event.value} className="cursor-pointer">
                          {event.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createWebhook.mutate()}
                  disabled={!name || !url || selectedEvents.length === 0}
                >
                  Create Webhook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading webhooks...</div>
        ) : !webhooks || webhooks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No webhooks configured yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{webhook.name}</h4>
                      {webhook.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {webhook.url}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={() =>
                        toggleWebhook.mutate({ id: webhook.id, isActive: webhook.is_active })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWebhook.mutate(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono text-xs bg-muted p-2 rounded">
                    {showSecrets[webhook.id]
                      ? webhook.secret_key
                      : '•'.repeat(32)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSecretVisibility(webhook.id)}
                  >
                    {showSecrets[webhook.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copySecret(webhook.secret_key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}