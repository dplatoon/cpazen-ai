import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';

interface TwoFactorVerifyProps {
  email: string;
  password: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function TwoFactorVerify({ email, password, onSuccess, onBack }: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length < 6) {
      setError('Please enter a valid code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify the 2FA code
      const response = await supabase.functions.invoke('totp-2fa', {
        body: { action: 'verify-login', email, code: code.replace('-', '') },
      });

      if (response.error) throw response.error;
      if (response.data.error) throw new Error(response.data.error);

      // Code is valid, now complete the sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      onSuccess();
    } catch (err: any) {
      console.error('2FA verification error:', err);
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-card border-card-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl text-foreground">Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription className="text-foreground-muted">
          Enter the 6-digit code from your authenticator app or a backup code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="totp-code">Authentication Code</Label>
            <Input
              id="totp-code"
              type="text"
              placeholder="000000 or XXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9A-Za-z-]/g, '').toUpperCase())}
              maxLength={9}
              className="text-center text-2xl tracking-widest font-mono"
              autoComplete="one-time-code"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Enter your 6-digit code or backup code (XXXX-XXXX format)
            </p>
          </div>

          {error && (
            <Alert className="border-destructive/20 bg-destructive/10">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={loading}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-brand hover:opacity-90 text-white"
              disabled={loading || code.length < 6}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
