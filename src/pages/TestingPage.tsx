import { TestingChecklist } from '@/components/testing/TestingChecklist';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

export default function TestingPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Pre-Launch Testing</h1>
          <p className="text-muted-foreground">
            Complete all critical tests before soft launch
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Testing Guidelines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Critical Tests</h3>
                <p className="text-sm text-muted-foreground">
                  Must pass 100% of critical priority tests before launch. These cover authentication, 
                  tracking, conversions, and security.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">High Priority</h3>
                <p className="text-sm text-muted-foreground">
                  Should pass 90%+ of high priority tests. Address any failures before soft launch.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Medium Priority</h3>
                <p className="text-sm text-muted-foreground">
                  Nice to have. Can be addressed post-launch but should be tracked.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-lg">Testing Tips</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Test with multiple browsers (Chrome, Firefox, Safari)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Verify mobile responsiveness on actual devices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Test with slow network conditions (throttle in DevTools)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Use incognito mode to test fresh user experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Document any edge cases or unexpected behavior</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Check backend logs for errors during testing</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <TestingChecklist />
      </div>
    </div>
  );
}
