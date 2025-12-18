import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  BarChart3, 
  Shield, 
  Zap, 
  Globe, 
  Target, 
  TrendingUp,
  MousePointerClick,
  Bot,
  Lock,
  Webhook,
  Brain,
  CheckCircle2,
  Star
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-card-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/cpazen-logo.png" alt="CPAzen" className="h-8" />
            <span className="text-xl font-bold bg-gradient-to-r from-brand-teal to-brand-purple bg-clip-text text-transparent">
              CPAzen
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="text-foreground-muted hover:text-foreground">
                Log In
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-gradient-brand hover:opacity-90 text-primary-foreground font-semibold">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8">
            <Badge variant="outline" className="border-brand-teal/30 text-brand-teal px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              Enterprise-Grade CPA Tracking
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-foreground">Track Every Click.</span>
              <br />
              <span className="bg-gradient-to-r from-brand-teal to-brand-purple bg-clip-text text-transparent">
                Maximize Every Conversion.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground-muted max-w-3xl mx-auto leading-relaxed">
              The most powerful CPA tracking platform built for performance marketers. 
              Real-time analytics, AI-powered optimization, and bulletproof fraud detection.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-brand hover:opacity-90 text-primary-foreground font-semibold px-8 py-6 text-lg group">
                  Start Tracking Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="border-card-border hover:bg-card px-8 py-6 text-lg">
                  View Live Demo
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-center gap-8 pt-8 text-foreground-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span>Setup in 5 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-card-border bg-background-secondary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10M+', label: 'Clicks Tracked Monthly' },
              { value: '99.9%', label: 'Uptime Guarantee' },
              { value: '<50ms', label: 'Redirect Speed' },
              { value: '500+', label: 'Active Affiliates' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-teal to-brand-purple bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-foreground-muted mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="border-brand-purple/30 text-brand-purple mb-4">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
              Built by affiliates, for affiliates. Every feature designed to maximize your ROI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MousePointerClick,
                title: 'Real-Time Click Tracking',
                description: 'Track every click with sub-50ms redirects. Full geo, device, and browser data captured instantly.',
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description: 'Deep-dive into performance with customizable dashboards, breakdowns by any dimension.',
              },
              {
                icon: Bot,
                title: 'AI-Powered Fraud Detection',
                description: 'Machine learning identifies bots, click fraud, and suspicious patterns automatically.',
              },
              {
                icon: Target,
                title: 'Smart Campaign Optimization',
                description: 'AI recommendations to pause underperformers and scale winners. A/B testing built-in.',
              },
              {
                icon: Webhook,
                title: 'Universal Postbacks',
                description: 'Works with every CPA network. S2S postbacks with security tokens and retry logic.',
              },
              {
                icon: Globe,
                title: 'Custom Tracking Domains',
                description: 'Use your own domains for tracking links. Full SSL included, instant setup.',
              },
              {
                icon: Lock,
                title: 'Enterprise Security',
                description: 'SOC2-ready with 2FA, audit logs, session management, and role-based access.',
              },
              {
                icon: Brain,
                title: 'AI Campaign Copilot',
                description: 'Chat with AI to get insights, generate reports, and optimize campaigns automatically.',
              },
              {
                icon: TrendingUp,
                title: 'Automation Rules',
                description: 'Set rules to auto-pause, adjust budgets, or alert you based on performance thresholds.',
              },
            ].map((feature, idx) => (
              <Card 
                key={idx} 
                className="bg-card border-card-border hover:border-brand-teal/30 transition-all duration-300 hover-lift group"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-brand flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-foreground-muted">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-background-secondary">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="border-brand-teal/30 text-brand-teal mb-4">
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Start Tracking in 3 Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Campaign',
                description: 'Add your offer URL, set targeting, and get your unique tracking link in seconds.',
              },
              {
                step: '02',
                title: 'Configure Postback',
                description: 'Paste our postback URL into your network. We handle security tokens automatically.',
              },
              {
                step: '03',
                title: 'Scale with Data',
                description: 'Watch conversions flow in real-time. Use AI insights to optimize and scale profitably.',
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-8xl font-bold text-brand-teal/10 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative z-10 pt-12">
                  <h3 className="text-2xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-foreground-muted text-lg">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="border-brand-purple/30 text-brand-purple mb-4">
              Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <Card className="bg-card border-card-border">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">Starter</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">Free</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {['Up to 10K clicks/month', '3 campaigns', 'Basic analytics', 'Email support'].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-foreground-muted">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button variant="outline" className="w-full border-card-border hover:bg-card">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro - Featured */}
            <Card className="bg-card border-brand-teal relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-brand" />
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-foreground">Pro</h3>
                  <Badge className="bg-brand-teal text-primary-foreground">Popular</Badge>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">$49</span>
                  <span className="text-foreground-muted">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    'Up to 500K clicks/month',
                    'Unlimited campaigns',
                    'AI fraud detection',
                    'Custom domains',
                    'Priority support',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-foreground-muted">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button className="w-full bg-gradient-brand hover:opacity-90 text-primary-foreground">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="bg-card border-card-border">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">Enterprise</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">Custom</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    'Unlimited clicks',
                    'Dedicated infrastructure',
                    'SLA guarantee',
                    'SSO & SAML',
                    'Dedicated success manager',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-foreground-muted">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full border-card-border hover:bg-card">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-background-secondary">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="border-brand-teal/30 text-brand-teal mb-4">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Trusted by Top Affiliates
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "CPAzen's fraud detection saved us $15K in the first month alone. The AI actually works.",
                author: 'Mike R.',
                role: 'Media Buyer, 7-Figure Affiliate',
                stars: 5,
              },
              {
                quote: "Finally, a tracker that doesn't slow down my redirects. Sub-50ms is a game changer for mobile traffic.",
                author: 'Sarah L.',
                role: 'Performance Marketer',
                stars: 5,
              },
              {
                quote: "The postback setup took 2 minutes. Every other tracker I've used was a nightmare to configure.",
                author: 'James K.',
                role: 'Affiliate Manager',
                stars: 5,
              },
            ].map((testimonial, idx) => (
              <Card key={idx} className="bg-card border-card-border">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.stars }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 text-lg leading-relaxed">"{testimonial.quote}"</p>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    <div className="text-foreground-muted text-sm">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-teal/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to Scale Your Campaigns?
          </h2>
          <p className="text-xl text-foreground-muted mb-8 max-w-2xl mx-auto">
            Join hundreds of affiliates already using CPAzen to track, optimize, and scale profitably.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-brand hover:opacity-90 text-primary-foreground font-semibold px-12 py-6 text-lg group">
              Start Tracking Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-card-border">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img src="/cpazen-logo.png" alt="CPAzen" className="h-8" />
                <span className="text-xl font-bold bg-gradient-to-r from-brand-teal to-brand-purple bg-clip-text text-transparent">
                  CPAzen
                </span>
              </Link>
              <p className="text-foreground-muted text-sm">
                Enterprise-grade CPA tracking for performance marketers.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-foreground-muted text-sm">
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/demo" className="hover:text-foreground transition-colors">Demo</Link></li>
                <li><Link to="/integration" className="hover:text-foreground transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-foreground-muted text-sm">
                <li><Link to="/integration" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link to="/auth" className="hover:text-foreground transition-colors">API Reference</Link></li>
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-foreground-muted text-sm">
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-card-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-foreground-muted text-sm">
              © {new Date().getFullYear()} CPAzen. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-foreground-muted text-sm">
              <Shield className="w-4 h-4 text-success" />
              SOC2 Compliant
              <span className="mx-2">•</span>
              <Lock className="w-4 h-4 text-success" />
              256-bit SSL Encryption
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
