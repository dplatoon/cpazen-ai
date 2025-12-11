import { ModernLayout } from '@/components/layout/ModernLayout';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { TwoFactorSettings } from '@/components/settings/TwoFactorSettings';
import { AnalyticsExport } from '@/components/analytics/AnalyticsExport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Download, User, Key, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <ModernLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-foreground-muted mt-2">
            Manage your account preferences and data exports
          </p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="security">
            <TwoFactorSettings />
          </TabsContent>

          <TabsContent value="export">
            <AnalyticsExport />
          </TabsContent>

          <TabsContent value="profile">
            <div className="text-muted-foreground">Profile settings coming soon...</div>
          </TabsContent>

          <TabsContent value="api">
            <div className="text-muted-foreground">API keys management coming soon...</div>
          </TabsContent>
        </Tabs>
      </div>
    </ModernLayout>
  );
}
