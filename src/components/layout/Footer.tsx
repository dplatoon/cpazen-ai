import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-card-border bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center space-x-6 text-sm text-foreground-muted">
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <a 
            href="mailto:support@cpazen.com" 
            className="hover:text-foreground transition-colors"
          >
            Support
          </a>
        </div>
        <div className="text-center mt-4 text-xs text-foreground-subtle">
          © 2025 Cpazen. All rights reserved.
        </div>
      </div>
    </footer>
  );
}