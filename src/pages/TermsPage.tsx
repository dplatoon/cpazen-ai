import { Link } from "react-router-dom";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center text-sm text-brand-teal hover:text-brand-teal/80 transition-colors mb-8"
        >
          ← Back to Cpazen
        </Link>

        {/* Header */}
        <div className="bg-card rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-foreground-muted">
            Last updated: January 10, 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-card rounded-lg shadow-sm p-8 space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Acceptance of Terms
            </h2>
            <p className="text-foreground-muted mb-4">
              By accessing and using Cpazen, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Service Description
            </h2>
            <p className="text-foreground-muted mb-4">
              Cpazen provides CPA offer tracking, analytics, and affiliate marketing tools including:
            </p>
            <ul className="list-disc list-inside text-foreground-muted space-y-2 ml-4">
              <li>Campaign creation and management</li>
              <li>Click and conversion tracking</li>
              <li>Real-time analytics and reporting</li>
              <li>Fraud detection and bot filtering</li>
              <li>Integration with affiliate networks</li>
            </ul>
            <p className="text-foreground-muted mt-4">
              We reserve the right to modify or discontinue services at any time.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              User Responsibilities
            </h2>
            <p className="text-foreground-muted mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to:
            </p>
            <ul className="list-disc list-inside text-foreground-muted space-y-2 ml-4">
              <li>Provide accurate registration information</li>
              <li>Be at least 18 years of age</li>
              <li>Keep your password confidential</li>
              <li>Comply with all applicable laws</li>
              <li>Not engage in fraudulent activity</li>
              <li>Not attempt to bypass security measures</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Acceptable Use Policy
            </h2>
            <p className="text-foreground-muted mb-4">
              You may not use Cpazen to:
            </p>
            <ul className="list-disc list-inside text-foreground-muted space-y-2 ml-4">
              <li>Promote illegal products or services</li>
              <li>Engage in fraud or deceptive practices</li>
              <li>Violate intellectual property rights</li>
              <li>Distribute malware or harmful code</li>
              <li>Spam or harass other users</li>
              <li>Attempt to hack or disrupt our services</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Intellectual Property
            </h2>
            <p className="text-foreground-muted mb-4">
              All content, features, and functionality of Cpazen are owned by us and protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-foreground-muted">
              You retain ownership of your campaign data and may export it at any time.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Limitation of Liability
            </h2>
            <p className="text-foreground-muted mb-4">
              Cpazen shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.
            </p>
            <p className="text-foreground-muted">
              Our total liability shall not exceed the amount you paid us in the past 12 months.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Termination
            </h2>
            <p className="text-foreground-muted mb-4">
              We may suspend or terminate your account if you violate these Terms. You may terminate your account at any time through your profile settings.
            </p>
            <p className="text-foreground-muted">
              Upon termination, you will lose access to your data unless you export it beforehand.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Changes to Terms
            </h2>
            <p className="text-foreground-muted mb-4">
              We may update these Terms from time to time. Material changes will be notified via email. Your continued use after changes constitutes acceptance.
            </p>
          </section>

          {/* Contact Section */}
          <section className="border-t border-card-border pt-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Contact Information
            </h2>
            <p className="text-foreground-muted mb-4">
              For questions regarding these terms, contact us at:
            </p>
            <div className="bg-background p-6 rounded-lg">
              <p className="text-foreground-muted mb-2">
                <strong>Email:</strong>{' '}
                <a href="mailto:support@cpazen.com" className="text-brand-teal hover:underline">
                  support@cpazen.com
                </a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-foreground-muted">
            © 2025 Cpazen. All rights reserved. |{' '}
            <Link to="/privacy" className="text-brand-teal hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;