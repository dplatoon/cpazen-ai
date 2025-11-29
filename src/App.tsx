import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./hooks/useAuth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ModernLayout } from "./components/layout/ModernLayout";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const CampaignsPage = lazy(() => import("./pages/CampaignsPage"));
const OffersPage = lazy(() => import("./pages/OffersPage"));
const AIToolsPage = lazy(() => import("./pages/AIToolsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const IntegrationPage = lazy(() => import("./pages/IntegrationPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const TestingPage = lazy(() => import("./pages/TestingPage"));
const MonitoringPage = lazy(() => import("./pages/MonitoringPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const FraudMonitoringPage = lazy(() => import("./pages/FraudMonitoringPage"));
const AuditPage = lazy(() => import("./pages/AuditPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal"></div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/" element={<ModernLayout><Index /></ModernLayout>} />
              <Route path="/campaigns" element={<ModernLayout><CampaignsPage /></ModernLayout>} />
              <Route path="/offers" element={<ModernLayout><OffersPage /></ModernLayout>} />
              <Route path="/ai-tools" element={<ModernLayout><AIToolsPage /></ModernLayout>} />
              <Route path="/analytics" element={<ModernLayout><AnalyticsPage /></ModernLayout>} />
              <Route path="/integration" element={<ModernLayout><IntegrationPage /></ModernLayout>} />
              <Route path="/profile" element={<ModernLayout><ProfilePage /></ModernLayout>} />
              <Route path="/demo" element={<ModernLayout><DemoPage /></ModernLayout>} />
              <Route path="/testing" element={<ModernLayout><TestingPage /></ModernLayout>} />
              <Route path="/monitoring" element={<ModernLayout><MonitoringPage /></ModernLayout>} />
              <Route path="/settings" element={<ModernLayout><SettingsPage /></ModernLayout>} />
              <Route path="/admin" element={<ModernLayout><AdminPage /></ModernLayout>} />
              <Route path="/fraud" element={<ModernLayout><FraudMonitoringPage /></ModernLayout>} />
              <Route path="/audit" element={<ModernLayout><AuditPage /></ModernLayout>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
