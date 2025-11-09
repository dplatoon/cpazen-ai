import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, Mail, TrendingDown, BarChart3, Calendar } from 'lucide-react';

interface NotificationPreferences {
  email_notifications: boolean;
  conversion_alerts: boolean;
  daily_summary: boolean;
  low_performance_alerts: boolean;
  weekly_report: boolean;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    conversion_alerts: true,
    daily_summary: true,
    low_performance_alerts: true,
    weekly_report: true,
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        const prefs = data.notification_preferences as any;
        setPreferences({
          email_notifications: prefs.email_notifications ?? true,
          conversion_alerts: prefs.conversion_alerts ?? true,
          daily_summary: prefs.daily_summary ?? true,
          low_performance_alerts: prefs.low_performance_alerts ?? true,
          weekly_report: prefs.weekly_report ?? true,
        });
      }

      return data;
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (newPreferences: NotificationPreferences) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: newPreferences as any })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      toast.error('Failed to update preferences');
      console.error(error);
    },
  });

  const handleToggle = (key: keyof NotificationPreferences) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);
  };

  const handleSave = () => {
    updateMutation.mutate(preferences);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>
              Manage how and when you receive email notifications
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email_notifications" className="font-medium">
                  Enable Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Master switch for all email notifications
                </p>
              </div>
            </div>
            <Switch
              id="email_notifications"
              checked={preferences.email_notifications}
              onCheckedChange={() => handleToggle('email_notifications')}
            />
          </div>

          <Separator />

          <div className="space-y-4 opacity-100 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-green-600" />
                <div>
                  <Label htmlFor="conversion_alerts" className="font-medium">
                    Conversion Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified immediately when you get a conversion
                  </p>
                </div>
              </div>
              <Switch
                id="conversion_alerts"
                checked={preferences.conversion_alerts}
                onCheckedChange={() => handleToggle('conversion_alerts')}
                disabled={!preferences.email_notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <Label htmlFor="daily_summary" className="font-medium">
                    Daily Summary
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a daily performance summary every morning
                  </p>
                </div>
              </div>
              <Switch
                id="daily_summary"
                checked={preferences.daily_summary}
                onCheckedChange={() => handleToggle('daily_summary')}
                disabled={!preferences.email_notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-orange-600" />
                <div>
                  <Label htmlFor="low_performance_alerts" className="font-medium">
                    Low Performance Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get alerted when campaigns are underperforming
                  </p>
                </div>
              </div>
              <Switch
                id="low_performance_alerts"
                checked={preferences.low_performance_alerts}
                onCheckedChange={() => handleToggle('low_performance_alerts')}
                disabled={!preferences.email_notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <Label htmlFor="weekly_report" className="font-medium">
                    Weekly Report
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive weekly performance report every Monday
                  </p>
                </div>
              </div>
              <Switch
                id="weekly_report"
                checked={preferences.weekly_report}
                onCheckedChange={() => handleToggle('weekly_report')}
                disabled={!preferences.email_notifications}
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={updateMutation.isPending}
          className="w-full"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>

        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> You'll receive notifications at: <strong>{user?.email}</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
