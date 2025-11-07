import { useNavigate } from 'react-router-dom';
import { ModernLayout } from "@/components/layout/ModernLayout";
import { AICampaignOptimizer } from "@/components/ai/AICampaignOptimizer";
import { AISupportChat } from "@/components/ai/AISupportChat";
import { AIOfferDescriptionGenerator } from "@/components/ai/AIOfferDescriptionGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const AIToolsPage = () => {
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
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Tools</h1>
          <p className="text-foreground-muted mt-2">
            Leverage artificial intelligence to optimize your campaigns and maximize ROI
          </p>
        </div>
        
        <Tabs defaultValue="optimizer" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="optimizer">Campaign Optimizer</TabsTrigger>
            <TabsTrigger value="chat">Support Chat</TabsTrigger>
            <TabsTrigger value="generator">Offer Generator</TabsTrigger>
          </TabsList>
          <TabsContent value="optimizer" className="mt-6">
            <AICampaignOptimizer />
          </TabsContent>
          <TabsContent value="chat" className="mt-6">
            <AISupportChat />
          </TabsContent>
          <TabsContent value="generator" className="mt-6">
            <AIOfferDescriptionGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </ModernLayout>
  );
};

export default AIToolsPage;