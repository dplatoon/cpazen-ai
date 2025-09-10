import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { EnhancedHeader } from "./EnhancedHeader";
import { Footer } from "./Footer";
import { useAuth } from "@/hooks/useAuth";
import { useProfileBootstrap } from "@/hooks/useProfileBootstrap";
import { Navigate } from "react-router-dom";

interface ModernLayoutProps {
  children: React.ReactNode;
}

export function ModernLayout({ children }: ModernLayoutProps) {
  const { user, loading } = useAuth();
  useProfileBootstrap();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <EnhancedHeader />

          {/* Main content */}
          <main className="flex-1 overflow-auto flex flex-col">
            <div className="flex-1 p-6">
              {children}
            </div>
            <div className="mt-auto">
              <Footer />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}