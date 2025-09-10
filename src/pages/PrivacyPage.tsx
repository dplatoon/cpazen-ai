import { Link } from "react-router-dom";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link to="/" className="text-brand-teal hover:text-brand-teal/80 transition-colors">← Back to Cpazen</Link>
        </div>
        
        <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
        
        <div className="prose prose-invert text-foreground-muted space-y-6">
          <p className="text-lg">Last updated: January 10, 2025</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
            <p>When you use Cpazen, we collect information that you provide directly to us, such as when you create an account, configure tracking campaigns, or contact our support team.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our CPA tracking services, including analytics and performance monitoring for your affiliate campaigns.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security</h2>
            <p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@cpazen.com" className="text-brand-teal hover:underline">support@cpazen.com</a>.</p>
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

export default PrivacyPage;