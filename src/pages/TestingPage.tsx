import { TestingChecklist } from '@/components/testing/TestingChecklist';
import { ClickToConversionTester } from '@/components/testing/ClickToConversionTester';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, PlayCircle } from 'lucide-react';

export default function TestingPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Testing & Validation</h1>
          <p className="text-muted-foreground">
            Test your tracking system and complete pre-launch validation
          </p>
        </div>

        <Tabs defaultValue="interactive" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="interactive">
              <PlayCircle className="h-4 w-4 mr-2" />
              Interactive Testing
            </TabsTrigger>
            <TabsTrigger value="checklist">
              <Shield className="h-4 w-4 mr-2" />
              Testing Checklist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interactive" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Interactive Flow Testing</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">End-to-End Validation</h3>
                    <p className="text-sm text-muted-foreground">
                      Test the complete click-to-conversion flow in real-time. Generate test clicks,
                      view tracking URLs, and fire sample postbacks to validate your setup.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">What You'll Test</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Click tracking and data capture</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Tracking URL generation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Postback endpoint functionality</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Conversion recording</span>
                      </li>
                    </ul>
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
                      <span>Create a test campaign with an active offer first</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Use the generated tracking URL in a new browser tab</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Check Analytics page after each test</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Verify click and conversion data is recorded</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Test with different payout amounts and statuses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Monitor edge function logs for any errors</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <ClickToConversionTester />
          </TabsContent>

          <TabsContent value="checklist" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
