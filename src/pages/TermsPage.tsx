import { Link } from "react-router-dom";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link to="/" className="text-brand-teal hover:text-brand-teal/80 transition-colors">← Back to Cpazen</Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-8 text-foreground">Terms of Service</h1>
        
        <div className="prose prose-invert text-foreground-muted space-y-6">
          <p className="text-lg">Last updated: January 10, 2025</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Acceptance of Terms</h2>
            <p>By accessing and using Cpazen, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Service Description</h2>
            <p>Cpazen provides CPA offer tracking, analytics, and affiliate marketing tools. We reserve the right to modify or discontinue our services at any time.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">User Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
            <p>Cpazen shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Information</h2>
            <p>For questions regarding these terms, please contact us at <a href="mailto:support@cpazen.com" className="text-brand-teal hover:underline">support@cpazen.com</a>.</p>
          </section>
        </div>
        
        <footer className="mt-16 pt-8 border-t border-card-border text-center">
          <div className="flex justify-center space-x-6 text-sm text-foreground-muted">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <a href="mailto:support@cpazen.com" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TermsPage;