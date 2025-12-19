import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Footer } from '@/components/layout/Footer';
import { TwoFactorVerify } from '@/components/auth/TwoFactorVerify';
import { ArrowLeft, Mail, AlertTriangle, Clock } from 'lucide-react';

type ViewMode = 'auth' | 'forgot-password' | 'email-sent';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('auth');
  const [rateLimitInfo, setRateLimitInfo] = useState<{ attemptsRemaining?: number; lockedUntil?: string } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const check2FAStatus = async (userEmail: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_2fa_status', { p_email: userEmail });
      if (error) {
        console.error('Error checking 2FA status:', error);
        return false;
      }
      return data === true;
    } catch (err) {
      console.error('Error checking 2FA status:', err);
      return false;
    }
  };

  const checkRateLimit = async (): Promise<{ allowed: boolean; message?: string; attemptsRemaining?: number; lockedUntil?: string }> => {
    try {
      // Get client IP (will be captured server-side, use placeholder for now)
      const clientIp = 'client-ip'; // Placeholder - rate limit will use actual IP from request
      
      const { data, error } = await supabase.rpc('check_login_rate_limit', { p_ip_address: clientIp });
      
      if (error) {
        console.error('Rate limit check error:', error);
        // Allow login if rate limit check fails (fail-open for better UX)
        return { allowed: true };
      }
      
      return data as { allowed: boolean; message?: string; attemptsRemaining?: number; lockedUntil?: string };
    } catch (err) {
      console.error('Rate limit check error:', err);
      return { allowed: true };
    }
  };

  const resetRateLimit = async () => {
    try {
      const clientIp = 'client-ip';
      await supabase.rpc('reset_login_rate_limit', { p_ip_address: clientIp });
    } catch (err) {
      console.error('Rate limit reset error:', err);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check rate limit before attempting login
      const rateLimit = await checkRateLimit();
      
      if (!rateLimit.allowed) {
        setError(rateLimit.message || 'Too many failed attempts. Please try again later.');
        if (rateLimit.lockedUntil) {
          setRateLimitInfo({ lockedUntil: rateLimit.lockedUntil });
        }
        setLoading(false);
        return;
      }

      // Update rate limit info for UI
      if (rateLimit.attemptsRemaining !== undefined && rateLimit.attemptsRemaining < 3) {
        setRateLimitInfo({ attemptsRemaining: rateLimit.attemptsRemaining });
      }

      // First check if user has 2FA enabled
      const has2FA = await check2FAStatus(email);
      
      if (has2FA) {
        // Show 2FA verification screen
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      // No 2FA, proceed with normal sign in
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Reset rate limit on successful login
        await resetRateLimit();
        setRateLimitInfo(null);
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to Cpazen.",
        });
        navigate('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Enhanced password validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      setLoading(false);
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      setLoading(false);
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      setLoading(false);
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain at least one special character');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (error) {
        setError(error.message);
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check your email!",
          description: "We sent you a confirmation link to complete your registration.",
        });
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      // Email enumeration protection: Always show success message regardless of result
      // This prevents attackers from discovering valid email addresses
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // Always show success - don't reveal if email exists or not
      setViewMode('email-sent');
      toast({
        title: "Check your email",
        description: "If an account exists with this email, you'll receive a reset link.",
      });
    } catch (err) {
      // Even on error, show the same message to prevent enumeration
      setViewMode('email-sent');
      toast({
        title: "Check your email",
        description: "If an account exists with this email, you'll receive a reset link.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = () => {
    resetRateLimit();
    toast({
      title: "Welcome back!",
      description: "Successfully signed in to Cpazen.",
    });
    navigate('/');
  };

  const handle2FABack = () => {
    setRequires2FA(false);
    setPassword('');
  };

  // Show 2FA verification screen
  if (requires2FA) {
    return (
      <div className="min-h-screen bg-gradient-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                AI CPA Tracker That Turns Clicks into Profit
              </h1>
              <p className="text-foreground-muted">
                Welcome to <span className="bg-gradient-brand bg-clip-text text-transparent">Cpazen</span>
              </p>
            </div>
            <TwoFactorVerify
              email={email}
              password={password}
              onSuccess={handle2FASuccess}
              onBack={handle2FABack}
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show email sent confirmation
  if (viewMode === 'email-sent') {
    return (
      <div className="min-h-screen bg-gradient-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Card className="bg-gradient-card border-card-border">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Mail className="w-16 h-16 text-brand-teal" />
                </div>
                <CardTitle className="text-xl text-center text-foreground">Check Your Email</CardTitle>
                <CardDescription className="text-center text-foreground-muted">
                  We've sent a password reset link to <strong>{email}</strong>. 
                  Click the link in the email to reset your password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-muted bg-muted/50">
                  <AlertDescription className="text-sm text-foreground-muted">
                    Didn't receive the email? Check your spam folder or try again in a few minutes.
                  </AlertDescription>
                </Alert>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => setViewMode('forgot-password')}
                >
                  Try Again
                </Button>
                <Button 
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setViewMode('auth');
                    setEmail('');
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show forgot password form
  if (viewMode === 'forgot-password') {
    return (
      <div className="min-h-screen bg-gradient-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Reset Your Password</h1>
              <p className="text-foreground-muted">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <Card className="bg-gradient-card border-card-border">
              <CardHeader>
                <CardTitle className="text-xl text-center text-foreground">Forgot Password</CardTitle>
                <CardDescription className="text-center text-foreground-muted">
                  We'll send you a secure link to reset your password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <Alert className="border-destructive/20 bg-destructive/10">
                      <AlertDescription className="text-destructive">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-brand hover:opacity-90 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>

                  <Button 
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setViewMode('auth');
                      setError('');
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              AI CPA Tracker That Turns Clicks into Profit
            </h1>
            <p className="text-foreground-muted">
              Welcome to <span className="bg-gradient-brand bg-clip-text text-transparent">Cpazen</span> - AI-Powered CPA Tracking Platform
            </p>
          </div>

          <Card className="bg-gradient-card border-card-border">
            <CardHeader>
              <CardTitle className="text-xl text-center text-foreground">Get Started</CardTitle>
              <CardDescription className="text-center text-foreground-muted">
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => {
                            setViewMode('forgot-password');
                            setError('');
                          }}
                          className="text-sm text-brand-teal hover:text-brand-teal/80 transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    {/* Rate limit warning */}
                    {rateLimitInfo?.attemptsRemaining !== undefined && rateLimitInfo.attemptsRemaining < 3 && (
                      <Alert className="border-yellow-500/20 bg-yellow-500/10">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                          {rateLimitInfo.attemptsRemaining} login attempts remaining before temporary lockout.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Lockout message */}
                    {rateLimitInfo?.lockedUntil && (
                      <Alert className="border-destructive/20 bg-destructive/10">
                        <Clock className="h-4 w-4 text-destructive" />
                        <AlertDescription className="text-destructive">
                          Too many failed attempts. Please try again later.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {error && (
                      <Alert className="border-destructive/20 bg-destructive/10">
                        <AlertDescription className="text-destructive">{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-brand hover:opacity-90 text-white"
                      disabled={loading || !!rateLimitInfo?.lockedUntil}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    {error && (
                      <Alert className="border-destructive/20 bg-destructive/10">
                        <AlertDescription className="text-destructive">{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-brand hover:opacity-90 text-white"
                      disabled={loading}
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
