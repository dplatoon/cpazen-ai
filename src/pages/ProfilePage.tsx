import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Copy, Eye, EyeOff, User, Key, Settings, Save, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useSecretKey, useRotateSecretKey } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';

const timezones = [
  "UTC", "America/New_York", "America/Los_Angeles", "America/Chicago", 
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", 
  "Asia/Shanghai", "Australia/Sydney"
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, refetch } = useProfile();
  const { data: secretKey, refetch: refetchSecretKey } = useSecretKey();
  const rotateSecretKey = useRotateSecretKey();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [formData, setFormData] = useState({
    email: profile?.email || "",
    company_name: profile?.company_name || "",
    timezone: profile?.timezone || "UTC"
  });

  const updateProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email: formData.email,
          company_name: formData.company_name,
          timezone: formData.timezone
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refetch();
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copySecretKey = () => {
    if (secretKey) {
      navigator.clipboard.writeText(secretKey);
      toast({
        title: "Copied!",
        description: "Secret key copied to clipboard",
      });
    }
  };

  const handleRotateSecretKey = async () => {
    setIsRotating(true);
    try {
      const newSecretKey = await rotateSecretKey();
      
      // Invalidate and refetch secret key
      queryClient.invalidateQueries({ queryKey: ['secret-key-masked'] });
      await refetchSecretKey();
      
      toast({
        title: "Secret Key Rotated",
        description: "Your secret key has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to rotate secret key",
        variant: "destructive",
      });
    } finally {
      setIsRotating(false);
    }
  };

  const resetPassword = async () => {
    if (!user?.email) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-foreground-muted mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card className="p-6 bg-gradient-card border-card-border">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-gradient-brand flex items-center justify-center">
            <User className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
            <p className="text-sm text-foreground-muted">Update your personal details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-background-secondary border-card-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Your company name"
              className="bg-background-secondary border-card-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
              <SelectTrigger className="bg-background-secondary border-card-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              value={profile?.role || "affiliate"}
              disabled
              className="bg-background-secondary/50 border-card-border"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button 
            onClick={updateProfile}
            disabled={isLoading}
            className="bg-gradient-brand hover:opacity-90"
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>

      {/* API Security */}
      <Card className="p-6 bg-gradient-card border-card-border">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
            <Key className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">API Security</h2>
            <p className="text-sm text-foreground-muted">Your secret key for postback authentication</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Secret Key</Label>
            <p className="text-sm text-foreground-muted mb-2">
              Use this key to validate postback requests from networks. Only a masked version is shown for security.
            </p>
            <div className="flex items-center space-x-2">
              <Input
                type={showSecretKey ? "text" : "password"}
                value={secretKey || "Loading..."}
                readOnly
                className="bg-background-secondary border-card-border font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="border-card-border"
              >
                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copySecretKey}
                className="border-card-border"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotateSecretKey}
                disabled={isRotating}
                className="border-card-border"
              >
                <RotateCcw className={`h-4 w-4 ${isRotating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {secretKey && (
              <p className="text-xs text-foreground-muted mt-2">
                For security, only a masked version is displayed. The full key is used server-side for validation.
                You can rotate your secret key up to 3 times per day.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6 bg-gradient-card border-card-border">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <Settings className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Security Settings</h2>
            <p className="text-sm text-foreground-muted">Manage your account security</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-foreground mb-2">Password</h3>
            <p className="text-sm text-foreground-muted mb-3">
              Reset your password to maintain account security
            </p>
            <Button
              variant="outline"
              onClick={resetPassword}
              className="border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              Send Password Reset Email
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}