import { useEffect } from 'react';

interface PageSEOProps {
  title: string;
  description?: string;
}

const BASE_TITLE = 'CPAZen';

export function PageSEO({ title, description }: PageSEOProps) {
  useEffect(() => {
    document.title = `${title} | ${BASE_TITLE}`;
    
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', description);
      }
    }

    return () => {
      document.title = `${BASE_TITLE} - AI-Powered CPA Tracking Platform`;
    };
  }, [title, description]);

  return null;
}

// SEO configs for each page
export const PAGE_SEO = {
  dashboard: { title: 'Dashboard', description: 'Real-time CPA campaign dashboard with clicks, conversions, and revenue analytics.' },
  campaigns: { title: 'Campaigns', description: 'Manage your CPA marketing campaigns. Create, track, and optimize.' },
  offers: { title: 'Offers', description: 'Browse and manage CPA offers from top networks.' },
  analytics: { title: 'Analytics', description: 'Deep campaign analytics with conversion rates, EPC, and geo breakdown.' },
  smartlink: { title: 'Smartlink', description: 'One link for all traffic. AI auto-routes visitors to the highest-paying offer.' },
  affiliate: { title: 'Affiliate Hub', description: 'Manage your affiliate offers, earnings, withdrawals, and payment methods.' },
  admin: { title: 'Admin Dashboard', description: 'Network administration — users, offers, payments, and fraud monitoring.' },
  fraud: { title: 'Fraud Monitoring', description: 'Real-time fraud detection with bot scoring and pattern matching.' },
  aiTools: { title: 'AI Tools', description: 'AI-powered campaign optimizer, copilot, and insights.' },
  integration: { title: 'Integration', description: 'Webhooks, API docs, and network integration settings.' },
  profile: { title: 'Profile', description: 'Manage your CPAZen account and settings.' },
  landing: { title: 'AI-Powered CPA Tracking Platform', description: 'Track clicks, conversions, and optimize your CPA campaigns with AI-powered insights. Real-time analytics, fraud detection, and automated optimization.' },
  auth: { title: 'Sign In', description: 'Sign in or create your CPAZen account.' },
  terms: { title: 'Terms of Service', description: 'CPAZen terms of service and user agreement.' },
  privacy: { title: 'Privacy Policy', description: 'CPAZen privacy policy and data handling practices.' },
  demo: { title: 'Demo', description: 'Try CPAZen CPA tracking platform demo.' },
  settings: { title: 'Settings', description: 'Configure your CPAZen preferences and notifications.' },
  securityEvents: { title: 'Security Events', description: 'Monitor security events, login attempts, and suspicious activity.' },
  audit: { title: 'Project Audit', description: 'System audit logs and compliance tracking.' },
};
