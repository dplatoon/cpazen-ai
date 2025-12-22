import { useNavigate } from 'react-router-dom';
import { AppLayout } from "@/components/layout/AppLayout";
import { IntegrationDocs } from "@/components/integration/IntegrationDocs";
import { WebhookManager } from "@/components/integration/WebhookManager";
import { WebhookTester } from "@/components/integration/WebhookTester";
import { WebhookDeliveryDashboard } from "@/components/integration/WebhookDeliveryDashboard";
import { FeatureAudit } from "@/components/audit/FeatureAudit";
import { NetworkAccountManager } from "@/components/networks/NetworkAccountManager";
import { LinkBuilderWizard } from "@/components/networks/LinkBuilderWizard";
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const IntegrationPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <Tabs defaultValue="networks" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="networks">Networks</TabsTrigger>
          <TabsTrigger value="links">Link Builder</TabsTrigger>
          <TabsTrigger value="integration">Docs</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="testing">Test</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        
        <TabsContent value="networks" className="space-y-6">
          <NetworkAccountManager />
        </TabsContent>

        <TabsContent value="links" className="space-y-6">
          <LinkBuilderWizard />
        </TabsContent>
        
        <TabsContent value="integration" className="space-y-6">
          <IntegrationDocs />
        </TabsContent>
        
        <TabsContent value="webhooks" className="space-y-6">
          <WebhookManager />
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-6">
          <WebhookDeliveryDashboard />
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <WebhookTester />
        </TabsContent>
        
        <TabsContent value="audit" className="space-y-6">
          <FeatureAudit />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default IntegrationPage;