import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Loader2, ArrowRight } from 'lucide-react';
import { seedDemoData } from '@/utils/seedDemoData';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function DemoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const handleSeedData = async () => {
    if (!user) {
      toast.error('Please login first');
      navigate('/auth');
      return;
    }

    const confirm = window.confirm(
      'This will add 5 demo campaigns and 30 days of sample data (approximately 3,000 clicks). Continue?'
    );
    
    if (!confirm) return;

    setLoading(true);
    try {
      const result = await seedDemoData(user.id);
      setSeeded(true);
      toast.success(
        `Demo data created! ${result.campaigns} campaigns, ${result.clicks} clicks, ${result.conversions} conversions`,
        { duration: 5000 }
      );
    } catch (error) {
      console.error('Failed to seed data:', error);
      toast.error('Failed to create demo data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">CPAzen Demo</h1>
          <p className="text-muted-foreground">
            Explore all features with realistic sample data
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">What you'll get:</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>5 sample campaigns across different verticals (Finance, E-commerce, Gaming, Health, Dating)</li>
                <li>30 days of click data (~3,000 total clicks)</li>
                <li>Realistic conversion data (2-8% CR depending on vertical)</li>
                <li>Geographic distribution across multiple countries</li>
                <li>Various traffic sources (Facebook, Google, TikTok, etc.)</li>
                <li>Bot detection samples (~5% flagged traffic)</li>
              </ul>
            </div>

            {!seeded ? (
              <Button 
                onClick={handleSeedData} 
                size="lg" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Demo Data...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Generate Demo Data
                  </>
                )}
              </Button>
            ) : (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-green-900 dark:text-green-100 font-medium mb-3">
                  ✅ Demo data successfully created!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Navigate to the sections below to explore your data.
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Note: This will only add data to your account. You can delete campaigns anytime.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View your campaign performance, revenue trends, and top performers with interactive charts
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Step 2: Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your campaigns, view detailed analytics, and get tracking URLs
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/campaigns')}>
                View Campaigns <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Step 3: AI Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get AI-powered campaign recommendations and generate offer descriptions
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/ai-tools')}>
                Try AI Features <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Step 4: Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Deep dive into your data with advanced charts, filters, and geo distribution
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/analytics')}>
                View Analytics <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
