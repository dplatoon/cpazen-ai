import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, ShieldAlert, Trash2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface IPManagementProps {
  campaignId?: string;
}

export function IPManagement({ campaignId }: IPManagementProps) {
  const queryClient = useQueryClient();
  const [newBlacklistIP, setNewBlacklistIP] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistCampaign, setBlacklistCampaign] = useState(campaignId || 'all');
  const [newWhitelistIP, setNewWhitelistIP] = useState('');
  const [whitelistNote, setWhitelistNote] = useState('');
  const [whitelistCampaign, setWhitelistCampaign] = useState(campaignId || 'all');

  // Fetch campaigns for dropdown
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch blacklist
  const { data: blacklist = [], isLoading: loadingBlacklist } = useQuery({
    queryKey: ['ip-blacklist', campaignId],
    queryFn: async () => {
      let query = supabase
        .from('ip_blacklist')
        .select('*, campaigns(name)')
        .order('created_at', { ascending: false });
      
      if (campaignId) {
        query = query.or(`campaign_id.eq.${campaignId},campaign_id.is.null`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch whitelist
  const { data: whitelist = [], isLoading: loadingWhitelist } = useQuery({
    queryKey: ['ip-whitelist', campaignId],
    queryFn: async () => {
      let query = supabase
        .from('ip_whitelist')
        .select('*, campaigns(name)')
        .order('created_at', { ascending: false });
      
      if (campaignId) {
        query = query.or(`campaign_id.eq.${campaignId},campaign_id.is.null`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Add to blacklist
  const addBlacklistMutation = useMutation({
    mutationFn: async (data: { ip_address: string; reason: string; campaign_id: string | null }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase.from('ip_blacklist').insert({
        user_id: user.user.id,
        ip_address: data.ip_address,
        reason: data.reason,
        campaign_id: data.campaign_id === 'all' ? null : data.campaign_id,
        auto_detected: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-blacklist'] });
      setNewBlacklistIP('');
      setBlacklistReason('');
      toast.success('IP address added to blacklist');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add IP: ${error.message}`);
    },
  });

  // Add to whitelist
  const addWhitelistMutation = useMutation({
    mutationFn: async (data: { ip_address: string; note: string; campaign_id: string | null }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase.from('ip_whitelist').insert({
        user_id: user.user.id,
        ip_address: data.ip_address,
        note: data.note,
        campaign_id: data.campaign_id === 'all' ? null : data.campaign_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      setNewWhitelistIP('');
      setWhitelistNote('');
      toast.success('IP address added to whitelist');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add IP: ${error.message}`);
    },
  });

  // Remove from blacklist
  const removeBlacklistMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ip_blacklist').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-blacklist'] });
      toast.success('IP address removed from blacklist');
    },
  });

  // Remove from whitelist
  const removeWhitelistMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ip_whitelist').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-whitelist'] });
      toast.success('IP address removed from whitelist');
    },
  });

  const handleAddBlacklist = () => {
    if (!newBlacklistIP.trim()) {
      toast.error('Please enter an IP address');
      return;
    }
    addBlacklistMutation.mutate({
      ip_address: newBlacklistIP.trim(),
      reason: blacklistReason.trim(),
      campaign_id: blacklistCampaign,
    });
  };

  const handleAddWhitelist = () => {
    if (!newWhitelistIP.trim()) {
      toast.error('Please enter an IP address');
      return;
    }
    addWhitelistMutation.mutate({
      ip_address: newWhitelistIP.trim(),
      note: whitelistNote.trim(),
      campaign_id: whitelistCampaign,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          IP Access Control
        </CardTitle>
        <CardDescription>
          Manage IP blacklist and whitelist to control traffic sources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="blacklist">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blacklist">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Blacklist
            </TabsTrigger>
            <TabsTrigger value="whitelist">
              <Shield className="h-4 w-4 mr-2" />
              Whitelist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blacklist" className="space-y-4">
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>IP Address</Label>
                <Input
                  placeholder="e.g., 192.168.1.1"
                  value={newBlacklistIP}
                  onChange={(e) => setNewBlacklistIP(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Textarea
                  placeholder="Why is this IP being blocked?"
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  rows={2}
                />
              </div>
              {!campaignId && (
                <div className="space-y-2">
                  <Label>Apply To</Label>
                  <Select value={blacklistCampaign} onValueChange={setBlacklistCampaign}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Campaigns</SelectItem>
                      {campaigns?.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                onClick={handleAddBlacklist}
                disabled={addBlacklistMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Blacklist
              </Button>
            </div>

            <div className="border rounded-lg">
              {loadingBlacklist ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : blacklist.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No blocked IP addresses
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blacklist.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.ip_address}</TableCell>
                        <TableCell>
                          {item.campaigns?.name || <Badge variant="secondary">All</Badge>}
                        </TableCell>
                        <TableCell>{item.reason || '-'}</TableCell>
                        <TableCell>
                          {item.auto_detected ? (
                            <Badge variant="destructive">Auto-detected</Badge>
                          ) : (
                            <Badge variant="outline">Manual</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBlacklistMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="whitelist" className="space-y-4">
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>IP Address</Label>
                <Input
                  placeholder="e.g., 192.168.1.1"
                  value={newWhitelistIP}
                  onChange={(e) => setNewWhitelistIP(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Note (Optional)</Label>
                <Textarea
                  placeholder="Note about this IP address"
                  value={whitelistNote}
                  onChange={(e) => setWhitelistNote(e.target.value)}
                  rows={2}
                />
              </div>
              {!campaignId && (
                <div className="space-y-2">
                  <Label>Apply To</Label>
                  <Select value={whitelistCampaign} onValueChange={setWhitelistCampaign}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Campaigns</SelectItem>
                      {campaigns?.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                onClick={handleAddWhitelist}
                disabled={addWhitelistMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Whitelist
              </Button>
            </div>

            <div className="border rounded-lg">
              {loadingWhitelist ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : whitelist.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No whitelisted IP addresses
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whitelist.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.ip_address}</TableCell>
                        <TableCell>
                          {item.campaigns?.name || <Badge variant="secondary">All</Badge>}
                        </TableCell>
                        <TableCell>{item.note || '-'}</TableCell>
                        <TableCell>
                          {new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWhitelistMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}