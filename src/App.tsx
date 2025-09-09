import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CampaignsPage from "./pages/CampaignsPage";
import OffersPage from "./pages/OffersPage";
import IntegrationPage from "./pages/IntegrationPage";
import ProfilePage from "./pages/ProfilePage";
import { ModernLayout } from "./components/layout/ModernLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ModernLayout><Index /></ModernLayout>} />
            <Route path="/campaigns" element={<ModernLayout><CampaignsPage /></ModernLayout>} />
            <Route path="/offers" element={<ModernLayout><OffersPage /></ModernLayout>} />
            <Route path="/integration" element={<ModernLayout><IntegrationPage /></ModernLayout>} />
            <Route path="/profile" element={<ModernLayout><ProfilePage /></ModernLayout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
