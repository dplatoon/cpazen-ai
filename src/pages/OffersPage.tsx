import { useNavigate } from 'react-router-dom';
import { AppLayout } from "@/components/layout/AppLayout";
import { OfferManager } from "@/components/offers/OfferManager";
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const OffersPage = () => {
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
      <OfferManager />
    </AppLayout>
  );
};

export default OffersPage;