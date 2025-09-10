import { useNavigate } from 'react-router-dom';
import { AppLayout } from "@/components/layout/AppLayout";
import { IntegrationDocs } from "@/components/integration/IntegrationDocs";
import { FeatureAudit } from "@/components/audit/FeatureAudit";
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
    return null; // Will redirect to auth
  }

  return (
    <AppLayout>
      <Tabs defaultValue="integration" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="integration">Integration Guide</TabsTrigger>
          <TabsTrigger value="audit">Feature Audit</TabsTrigger>
        </TabsList>
        
        <TabsContent value="integration" className="space-y-6">
          <IntegrationDocs />
        </TabsContent>
        
        <TabsContent value="audit" className="space-y-6">
          <FeatureAudit />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default IntegrationPage;