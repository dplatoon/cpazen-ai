import { Link } from "react-router-dom";

const PrivacyPage = () => {
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
            Privacy Policy
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
              Information We Collect
            </h2>
            <p className="text-foreground-muted mb-4">
              When you use Cpazen, we collect information that you provide directly to us, such as when you create an account, configure tracking campaigns, or contact our support team.
            </p>
            <h3 className="text-xl font-medium text-foreground mb-3">
              Personal Information
            </h3>
            <ul className="list-disc list-inside text-foreground-muted space-y-2 ml-4">
              <li>Email address (required for account creation)</li>
              <li>Company name (optional)</li>
              <li>Timezone and preferences</li>
              <li>Profile information you choose to provide</li>
            </ul>
            <h3 className="text-xl font-medium text-foreground mb-3 mt-4">
              Usage Data
            </h3>
            <ul className="list-disc list-inside text-foreground-muted space-y-2 ml-4">
              <li>Campaign performance metrics (clicks, conversions, payouts)</li>
              <li>Tracking data (IP addresses, user agents, device information)</li>
              <li>API usage and integration logs</li>
              <li>Browser information and cookies</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              How We Use Your Information
            </h2>
            <p className="text-foreground-muted mb-4">
              We use the information we collect to provide, maintain, and improve our CPA tracking services, including analytics and performance monitoring for your affiliate campaigns.
            </p>
            <ul className="list-disc list-inside text-foreground-muted space-y-2 ml-4">
              <li>Provide and operate the Cpazen platform</li>
              <li>Track clicks, conversions, and campaign performance</li>
              <li>Detect and prevent fraud, abuse, and security threats</li>
              <li>Send you service notifications and updates</li>
              <li>Respond to support requests and communications</li>
              <li>Improve and optimize our services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Data Sharing and Disclosure
            </h2>
            <p className="text-foreground-muted mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-foreground-muted space-y-2 ml-4">
              <li><strong>With your consent:</strong> When you explicitly authorize us to share data</li>
              <li><strong>Service providers:</strong> Third-party vendors who assist in operating our platform</li>
              <li><strong>Legal requirements:</strong> When required by law, court order, or legal process</li>
              <li><strong>Security and fraud prevention:</strong> To protect against fraud, abuse, or security threats</li>
              <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Data Security
            </h2>
            <p className="text-foreground-muted mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <ul className="list-disc list-inside text-foreground-muted space-y-2 ml-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Row-level security (RLS) policies on database</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and authentication</li>
              <li>Secure API token management</li>
            </ul>
            <p className="text-foreground-muted mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Data Retention
            </h2>
            <p className="text-foreground-muted mb-4">
              We retain your information for as long as your account is active or as needed to provide services. Specific retention periods:
            </p>
            <ul className="list-disc list-inside text-foreground-muted space-y-2 ml-4">
              <li><strong>Account data:</strong> Retained while account is active, plus 90 days after deletion</li>
              <li><strong>Click tracking data:</strong> Retained for 12 months for analytics and fraud detection</li>
              <li><strong>Conversion data:</strong> Retained for 24 months for financial reconciliation</li>
              <li><strong>Audit logs:</strong> Retained for 36 months for security and compliance</li>
            </ul>
            <p className="text-foreground-muted mt-4">
              You may request deletion of your data at any time by contacting support.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Your Rights
            </h2>
            <p className="text-foreground-muted mb-4">
              Depending on your location, you may have certain rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-foreground-muted space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
              <li><strong>Restriction:</strong> Request limitation of data processing</li>
            </ul>
            <p className="text-foreground-muted mt-4">
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@cpazen.com" className="text-brand-teal hover:underline">
                privacy@cpazen.com
              </a>
            </p>
          </section>

          {/* Contact Section */}
          <section className="border-t border-card-border pt-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Contact Us
            </h2>
            <p className="text-foreground-muted mb-4">
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <div className="bg-background p-6 rounded-lg">
              <p className="text-foreground-muted mb-2">
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@cpazen.com" className="text-brand-teal hover:underline">
                  privacy@cpazen.com
                </a>
              </p>
              <p className="text-foreground-muted mb-2">
                <strong>Support:</strong>{' '}
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
            <Link to="/terms" className="text-brand-teal hover:underline">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;