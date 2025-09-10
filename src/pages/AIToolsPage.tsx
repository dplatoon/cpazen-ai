import { useNavigate } from 'react-router-dom';
import { ModernLayout } from "@/components/layout/ModernLayout";
import { AIOptimizer } from "@/components/ai/AIOptimizer";
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
        
        <AIOptimizer />
      </div>
    </ModernLayout>
  );
};

export default AIToolsPage;