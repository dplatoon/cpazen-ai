import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_SEO: Record<string, { title: string; description: string }> = {
  '/': { title: 'Dashboard', description: 'Real-time CPA campaign dashboard with clicks, conversions, and revenue analytics.' },
  '/dashboard': { title: 'Dashboard', description: 'Real-time CPA campaign dashboard with clicks, conversions, and revenue analytics.' },
  '/campaigns': { title: 'Campaigns', description: 'Manage your CPA marketing campaigns. Create, track, and optimize.' },
  '/offers': { title: 'Offers', description: 'Browse and manage CPA offers from top networks.' },
  '/analytics': { title: 'Analytics', description: 'Deep campaign analytics with conversion rates, EPC, and geo breakdown.' },
  '/smartlink': { title: 'Smartlink', description: 'One link for all traffic. AI auto-routes visitors to the highest-paying offer.' },
  '/affiliate-dashboard': { title: 'Affiliate Hub', description: 'Manage your affiliate offers, earnings, withdrawals, and payment methods.' },
  '/admin': { title: 'Admin Dashboard', description: 'Network administration — users, offers, payments, and fraud monitoring.' },
  '/fraud': { title: 'Fraud Monitoring', description: 'Real-time fraud detection with bot scoring and pattern matching.' },
  '/ai-tools': { title: 'AI Tools', description: 'AI-powered campaign optimizer, copilot, and insights.' },
  '/integration': { title: 'Integration', description: 'Webhooks, API docs, and network integration settings.' },
  '/profile': { title: 'Profile', description: 'Manage your CPAZen account and settings.' },
  '/settings': { title: 'Settings', description: 'Configure your CPAZen preferences and notifications.' },
  '/security-events': { title: 'Security Events', description: 'Monitor security events, login attempts, and suspicious activity.' },
  '/audit': { title: 'Project Audit', description: 'System audit logs and compliance tracking.' },
  '/landing': { title: 'AI-Powered CPA Tracking Platform', description: 'Track clicks, conversions, and optimize your CPA campaigns with AI-powered insights.' },
  '/auth': { title: 'Sign In', description: 'Sign in or create your CPAZen account.' },
  '/terms': { title: 'Terms of Service', description: 'CPAZen terms of service and user agreement.' },
  '/privacy': { title: 'Privacy Policy', description: 'CPAZen privacy policy and data handling practices.' },
  '/demo': { title: 'Demo', description: 'Try CPAZen CPA tracking platform demo.' },
  '/monitoring': { title: 'Monitoring', description: 'System health monitoring and alerts.' },
};

export function usePageSEO() {
  const location = useLocation();

  useEffect(() => {
    const seo = ROUTE_SEO[location.pathname];
    if (seo) {
      document.title = `${seo.title} | CPAZen`;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', seo.description);
      }
    }
  }, [location.pathname]);
}
