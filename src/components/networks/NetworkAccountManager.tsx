import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Trash2, RefreshCw, Copy, Eye, EyeOff, Download } from 'lucide-react';
import { useNetworkAccounts, type CreateNetworkAccountInput } from '@/hooks/useNetworkAccounts';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { NetworkOfferImport } from '@/components/offers/NetworkOfferImport';
import type { Json } from '@/integrations/supabase/types';

const NETWORK_CONFIGS = [
  {
    id: 'maxbounty',
    name: 'MaxBounty',
    logo: '🎯',
    fields: [
      { key: 'affiliateId', label: 'Affiliate ID', required: true },
      { key: 'apiKey', label: 'API Key', required: false, secret: true },
    ],
    macros: {
      clickIdParam: 's2',
      payoutParam: 'rate',
      statusParam: 'status',
    },
  },
  {
    id: 'everflow',
    name: 'Everflow',
    logo: '🌊',
    fields: [
      { key: 'networkId', label: 'Network ID', required: true },
      { key: 'apiToken', label: 'API Token', required: false, secret: true },
    ],
    macros: {
      clickIdParam: 'transaction_id',
      payoutParam: 'payout',
      statusParam: 'status',
    },
  },
  {
    id: 'shareasale',
    name: 'ShareASale',
    logo: '🤝',
    fields: [
      { key: 'affiliateId', label: 'Affiliate ID', required: true },
      { key: 'apiToken', label: 'API Token', required: false, secret: true },
      { key: 'apiSecret', label: 'API Secret', required: false, secret: true },
    ],
    macros: {
      clickIdParam: 'afftrack',
      payoutParam: 'amount',
      statusParam: 'newStatus',
    },
  },
  {
    id: 'cj',
    name: 'CJ Affiliate',
    logo: '📊',
    fields: [
      { key: 'publisherId', label: 'Publisher ID', required: true },
      { key: 'personalAccessToken', label: 'Personal Access Token', required: false, secret: true },
    ],
    macros: {
      clickIdParam: 'SID',
      payoutParam: 'commissionAmount',
      statusParam: 'correctionReason',
    },
  },
  {
    id: 'clickbank',
    name: 'ClickBank',
    logo: '💳',
    fields: [
      { key: 'accountNickname', label: 'Account Nickname', required: true },
      { key: 'clerkApiKey', label: 'Clerk API Key', required: false, secret: true },
      { key: 'devApiKey', label: 'Developer API Key', required: false, secret: true },
    ],
    macros: {
      clickIdParam: 'tid',
      payoutParam: 'ctransreceipt',
      statusParam: 'ctransaction',
    },
  },
];

export function NetworkAccountManager() {
  const { accounts, postbackKeys, isLoading, createAccount, isCreating, deleteAccount, regeneratePostbackKey, getPostbackKeyForAccount } = useNetworkAccounts();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [importAccount, setImportAccount] = useState<typeof accounts[0] | null>(null);

  const networkConfig = NETWORK_CONFIGS.find(n => n.id === selectedNetwork);

  const handleCreate = () => {
    if (!networkConfig) return;

    // Get the API key field for this network
    const apiKeyField = networkConfig.fields.find(f => f.secret && (f.key === 'apiKey' || f.key === 'apiToken'));
    const apiKey = apiKeyField ? formData[apiKeyField.key] : undefined;

    // Store non-secret credentials in config_json
    const credentials: Record<string, string> = {};
    networkConfig.fields.forEach(field => {
      if (formData[field.key] && !field.secret) {
        credentials[field.key] = formData[field.key];
      }
    });

    const configJson: Json = {
      ...networkConfig.macros,
      credentials,
    };

    const input: CreateNetworkAccountInput = {
      network_type: networkConfig.id,
      name: formData.name || networkConfig.name,
      external_id: formData.affiliateId || formData.networkId || formData.publisherId || formData.accountNickname,
      config_json: configJson,
      api_key: apiKey,
    };

    createAccount(input, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setSelectedNetwork('');
        setFormData({});
      },
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  const getPostbackUrl = (accountId: string) => {
    const key = getPostbackKeyForAccount(accountId);
    if (!key) return '';
    return `https://rdajybqalmsdycxsruon.supabase.co/functions/v1/postback?key=${key.key}&click_id={click_id}&payout={payout}&status=approved`;
  };

  const getNetworkInfo = (networkType: string) => {
    return NETWORK_CONFIGS.find(n => n.id === networkType);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Network Accounts</CardTitle>
          <CardDescription>
            Connect your affiliate networks to sync offers and track conversions
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-brand hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Add Network
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Affiliate Network</DialogTitle>
              <DialogDescription>
                Add your network credentials to enable conversion tracking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Network</Label>
                <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a network" />
                  </SelectTrigger>
                  <SelectContent>
                    {NETWORK_CONFIGS.map(network => (
                      <SelectItem key={network.id} value={network.id}>
                        <span className="flex items-center gap-2">
                          <span>{network.logo}</span>
                          {network.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {networkConfig && (
                <>
                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input
                      value={formData.name || ''}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={`My ${networkConfig.name} Account`}
                    />
                  </div>

                  {networkConfig.fields.map(field => (
                    <div key={field.key} className="space-y-2">
                      <Label>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      <div className="relative">
                        <Input
                          type={field.secret && !showSecrets[field.key] ? 'password' : 'text'}
                          value={formData[field.key] || ''}
                          onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                        {field.secret && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setShowSecrets(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                          >
                            {showSecrets[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={handleCreate}
                    disabled={isCreating || !networkConfig.fields.filter(f => f.required).every(f => formData[f.key])}
                    className="w-full bg-gradient-brand hover:opacity-90"
                  >
                    {isCreating ? 'Connecting...' : `Connect ${networkConfig.name}`}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No network accounts connected yet.</p>
            <p className="text-sm mt-1">Add a network to start tracking conversions.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Network</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Postback Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map(account => {
                const networkInfo = getNetworkInfo(account.network_type);
                const postbackKey = getPostbackKeyForAccount(account.id);
                return (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{networkInfo?.logo || '🔗'}</span>
                        <span className="font-medium">{networkInfo?.name || account.network_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{account.name}</p>
                        {account.external_id && (
                          <p className="text-sm text-muted-foreground">ID: {account.external_id}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {postbackKey ? (
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {postbackKey.key.substring(0, 8)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(getPostbackUrl(account.id), 'Postback URL')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.is_active ? 'default' : 'secondary'}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setImportAccount(account)}>
                              <Download className="h-4 w-4 mr-2" />
                              Import Offers
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(getPostbackUrl(account.id), 'Postback URL')}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Postback URL
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => regeneratePostbackKey(account.id)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Regenerate Key
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteAccount(account.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Import Offers Dialog */}
      {importAccount && (
        <NetworkOfferImport
          account={importAccount}
          open={!!importAccount}
          onOpenChange={(open) => !open && setImportAccount(null)}
        />
      )}
    </Card>
  );
}
