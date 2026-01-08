import { useNavigate } from 'react-router-dom';
import { AppLayout } from "@/components/layout/AppLayout";
import { OfferManager } from "@/components/offers/OfferManager";
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const OffersPage = () => {
  const { user, loading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Redirect non-admin users to affiliate dashboard
  useEffect(() => {
    if (!roleLoading && userRole && userRole !== 'admin') {
      navigate('/affiliate-dashboard');
    }
  }, [userRole, roleLoading, navigate]);

  if (loading || roleLoading) {
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

  // Only admins can access this page
  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  return (
    <AppLayout>
      <OfferManager />
    </AppLayout>
  );
};

export default OffersPage;
