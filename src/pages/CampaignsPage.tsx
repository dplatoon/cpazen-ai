import { useNavigate } from 'react-router-dom';
import { AppLayout } from "@/components/layout/AppLayout";
import { CampaignManager } from "@/components/campaigns/CampaignManager";
import { IPManagement } from "@/components/campaigns/IPManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const CampaignsPage = () => {
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
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="ip-control">IP Control</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns">
          <CampaignManager />
        </TabsContent>
        
        <TabsContent value="ip-control">
          <IPManagement />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default CampaignsPage;