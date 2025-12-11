import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield, ShieldCheck, ShieldOff, Copy, RefreshCw, Key, Loader2 } from 'lucide-react';

interface TwoFAStatus {
  is_enabled: boolean;
  has_backup_codes: boolean;
}

export function TwoFactorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<TwoFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<'qr' | 'verify'>('qr');
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string; backupCodes: string[] } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const fetchStatus = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_my_2fa_status');
      if (error) throw error;
      setStatus(data?.[0] || { is_enabled: false, has_backup_codes: false });
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
      setStatus({ is_enabled: false, has_backup_codes: false });
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'setup' },
      });

      if (response.error) throw response.error;
      
      setSetupData(response.data);
      setBackupCodes(response.data.backupCodes);
      setSetupStep('qr');
      setSetupDialogOpen(true);
    } catch (err: any) {
      toast({
        title: 'Setup Failed',
        description: err.message || 'Failed to start 2FA setup',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast({ title: 'Invalid Code', description: 'Please enter a 6-digit code', variant: 'destructive' });
      return;
    }

    setActionLoading(true);
    try {
      const response = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'verify-setup', code: verifyCode },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      toast({ title: '2FA Enabled', description: 'Two-factor authentication is now active' });
      setSetupDialogOpen(false);
      setVerifyCode('');
      fetchStatus();
    } catch (err: any) {
      toast({
        title: 'Verification Failed',
        description: err.message || 'Invalid code',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!disableCode || disableCode.length !== 6) {
      toast({ title: 'Invalid Code', description: 'Please enter your 6-digit code', variant: 'destructive' });
      return;
    }

    setActionLoading(true);
    try {
      const response = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'disable', code: disableCode },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      toast({ title: '2FA Disabled', description: 'Two-factor authentication has been removed' });
      setDisableDialogOpen(false);
      setDisableCode('');
      fetchStatus();
    } catch (err: any) {
      toast({
        title: 'Disable Failed',
        description: err.message || 'Invalid code',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    if (!disableCode || disableCode.length !== 6) {
      toast({ title: 'Invalid Code', description: 'Enter your current 2FA code', variant: 'destructive' });
      return;
    }

    setActionLoading(true);
    try {
      const response = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'regenerate-backup', code: disableCode },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      setBackupCodes(response.data.backupCodes);
      setBackupDialogOpen(true);
      setDisableCode('');
      toast({ title: 'Backup Codes Regenerated', description: 'Save your new backup codes' });
    } catch (err: any) {
      toast({
        title: 'Regeneration Failed',
        description: err.message || 'Invalid code',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Copied to clipboard' });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Two-Factor Authentication</CardTitle>
            </div>
            {status?.is_enabled ? (
              <Badge variant="default" className="bg-green-600">
                <ShieldCheck className="h-3 w-3 mr-1" /> Enabled
              </Badge>
            ) : (
              <Badge variant="secondary">
                <ShieldOff className="h-3 w-3 mr-1" /> Disabled
              </Badge>
            )}
          </div>
          <CardDescription>
            Add an extra layer of security to your account using a time-based one-time password (TOTP).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.is_enabled ? (
            <div className="space-y-4">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  Your account is protected with two-factor authentication. You'll need your authenticator app to sign in.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="regen-code">Current 2FA Code</Label>
                  <Input
                    id="regen-code"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={regenerateBackupCodes}
                  disabled={actionLoading || disableCode.length !== 6}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Backup Codes
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDisableDialogOpen(true)}
                  disabled={actionLoading || disableCode.length !== 6}
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Disable 2FA
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enable two-factor authentication to add an extra layer of security. You'll need an authenticator app like Google Authenticator, Authy, or 1Password.
              </p>
              <Button onClick={startSetup} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                Enable 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {setupStep === 'qr' 
                ? 'Scan the QR code or enter the secret key in your authenticator app'
                : 'Enter the 6-digit code from your authenticator app'
              }
            </DialogDescription>
          </DialogHeader>
          
          {setupStep === 'qr' && setupData && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.otpauthUrl)}`}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Secret Key (if you can't scan)</Label>
                <div className="flex gap-2">
                  <Input value={setupData.secret} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(setupData.secret)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  <strong>Backup Codes:</strong> Save these codes securely. Each can be used once if you lose access to your authenticator.
                  <div className="grid grid-cols-2 gap-1 mt-2 font-mono text-xs">
                    {backupCodes.map((code, i) => (
                      <span key={i} className="bg-muted px-2 py-1 rounded">{code}</span>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy All
                  </Button>
                </AlertDescription>
              </Alert>
              
              <Button onClick={() => setSetupStep('verify')} className="w-full">
                Continue to Verification
              </Button>
            </div>
          )}
          
          {setupStep === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verify-code">Enter 6-Digit Code</Label>
                <Input
                  id="verify-code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSetupStep('qr')} className="flex-1">
                  Back
                </Button>
                <Button onClick={verifySetup} disabled={actionLoading || verifyCode.length !== 6} className="flex-1">
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Enable'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable 2FA? Your account will be less secure.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDisableDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="destructive" onClick={disable2FA} disabled={actionLoading} className="flex-1">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable 2FA'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Backup Codes</DialogTitle>
            <DialogDescription>
              Save these codes securely. Your old backup codes are no longer valid.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 font-mono">
            {backupCodes.map((code, i) => (
              <span key={i} className="bg-muted px-3 py-2 rounded text-center">{code}</span>
            ))}
          </div>
          <Button onClick={() => copyToClipboard(backupCodes.join('\n'))}>
            <Copy className="h-4 w-4 mr-2" /> Copy All Codes
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
