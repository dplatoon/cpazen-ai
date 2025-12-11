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
import { Webhook, Plus, Trash2, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret_key_masked: string; // Only masked version available client-side
  is_active: boolean;
  created_at: string;
}

const AVAILABLE_EVENTS = [
  { value: 'conversion', label: 'Conversion' },
  { value: 'click', label: 'Click' },
  { value: 'fraud_alert', label: 'Fraud Alert' },
];

// Security: Validate webhook URLs to prevent SSRF attacks
function validateWebhookUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }
    
    const hostname = url.hostname.toLowerCase();
    
    // Block localhost and loopback addresses
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { valid: false, error: 'Localhost URLs are not allowed' };
    }
    
    // Block private IP ranges
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Pattern);
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number);
      
      // 10.0.0.0/8
      if (a === 10) {
        return { valid: false, error: 'Private IP addresses are not allowed' };
      }
      
      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) {
        return { valid: false, error: 'Private IP addresses are not allowed' };
      }
      
      // 192.168.0.0/16
      if (a === 192 && b === 168) {
        return { valid: false, error: 'Private IP addresses are not allowed' };
      }
      
      // 169.254.0.0/16 - Cloud metadata
      if (a === 169 && b === 254) {
        return { valid: false, error: 'Cloud metadata endpoints are not allowed' };
      }
      
      // 127.0.0.0/8
      if (a === 127) {
        return { valid: false, error: 'Loopback addresses are not allowed' };
      }
      
      // 0.0.0.0/8
      if (a === 0) {
        return { valid: false, error: 'Invalid IP address' };
      }
    }
    
    // Block common internal hostnames
    const blockedHostnames = ['metadata.google.internal', 'metadata.google', 'metadata', 'internal', 'local'];
    if (blockedHostnames.some(blocked => hostname === blocked || hostname.endsWith('.' + blocked))) {
      return { valid: false, error: 'Internal hostnames are not allowed' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function WebhookManager() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['conversion']);
  const queryClient = useQueryClient();

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      // Use RPC function that returns masked secret keys only
      const { data, error } = await supabase.rpc('get_user_webhooks');

      if (error) throw error;
      return data as WebhookConfig[];
    },
  });

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value) {
      const validation = validateWebhookUrl(value);
      setUrlError(validation.valid ? null : validation.error || 'Invalid URL');
    } else {
      setUrlError(null);
    }
  };

  const createWebhook = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Server-side validation (client-side is just UX)
      const validation = validateWebhookUrl(url);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid webhook URL');
      }

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
      setUrlError(null);
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

  const copySecret = (maskedSecret: string) => {
    navigator.clipboard.writeText(maskedSecret);
    toast.info('Masked secret key copied. Full secret is only available server-side for security.');
  };

  const isFormValid = name && url && selectedEvents.length > 0 && !urlError;

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
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://api.example.com/webhook"
                    className={urlError ? 'border-destructive' : ''}
                  />
                  {urlError && (
                    <p className="text-sm text-destructive mt-1">{urlError}</p>
                  )}
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
                  disabled={!isFormValid}
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
                    {webhook.secret_key_masked}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copySecret(webhook.secret_key_masked)}
                    title="Copy masked secret"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Full secret key is available only in webhook signature headers for security.
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
