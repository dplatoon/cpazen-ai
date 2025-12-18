import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dashboard } from "@/components/dashboard/Dashboard";
import { DashboardFilters, DashboardFiltersState } from "@/components/dashboard/DashboardFilters";
import { useAuth } from '@/hooks/useAuth';
import { useProfileBootstrap } from '@/hooks/useProfileBootstrap';
import { subDays } from "date-fns";

const DashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  // Bootstrap user profile if needed
  useProfileBootstrap();

  const [filters, setFilters] = useState<DashboardFiltersState>({
    dateRange: {
      from: subDays(new Date(), 29),
      to: new Date()
    },
    campaigns: [],
    status: "all",
    searchTerm: ""
  });

  const handleExportData = () => {
    console.log("Exporting data with filters:", filters);
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-foreground-muted mt-2">
          Monitor your campaign performance and analytics
        </p>
      </div>
      
      <DashboardFilters 
        filters={filters}
        onFiltersChange={setFilters}
        onExportData={handleExportData}
      />
      
      <Dashboard filters={filters} />
    </div>
  );
};

export default DashboardPage;
