import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, User, Bot, Loader2 } from "lucide-react";
import { useCampaignKpis, useCampaignHealthScore } from "@/hooks/useCampaignAnalytics";
import { useRecommendations } from "@/hooks/useRecommendations";
import { cn } from "@/lib/utils";

interface AiCopilotPanelProps {
  campaignId: string;
  campaignName?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// TODO: Replace with actual LLM call via Lovable AI
function generateLocalResponse(
  question: string, 
  kpis: any, 
  health: any, 
  recommendations: any[]
): string {
  const q = question.toLowerCase();
  
  // Handle common questions with heuristic responses
  if (q.includes('reduce cpa') || q.includes('lower cpa')) {
    if (kpis?.cpa > 0) {
      const suggestions = [];
      if (kpis.conversionRate < 2) {
        suggestions.push("Your conversion rate is below 2%. Consider testing new landing pages or improving your targeting.");
      }
      if (recommendations?.some(r => r.type === 'lower_bid')) {
        suggestions.push("AI recommends lowering bids on underperforming sources.");
      }
      suggestions.push("Focus on high-performing GEOs and devices, and pause sources with CPA above your target.");
      return suggestions.join("\n\n");
    }
    return "To reduce CPA, focus on optimizing your targeting, testing new creatives, and pausing underperforming traffic sources.";
  }
  
  if (q.includes('wrong') || q.includes('issue') || q.includes('problem')) {
    const issues = [];
    if (health?.label === 'Needs attention') {
      issues.push(`Campaign health is showing "${health.label}". ${health.reason}`);
    }
    if (kpis?.profit < 0) {
      issues.push(`Campaign is currently unprofitable with a loss of $${Math.abs(kpis.profit).toFixed(2)}.`);
    }
    if (kpis?.conversionRate < 1) {
      issues.push(`Conversion rate is very low at ${kpis.conversionRate.toFixed(2)}%. This could indicate targeting or landing page issues.`);
    }
    return issues.length > 0 
      ? issues.join("\n\n") 
      : "No major issues detected. Campaign metrics are within acceptable ranges.";
  }
  
  if (q.includes('scale') || q.includes('grow') || q.includes('increase')) {
    if (kpis?.roas >= 1.5 || kpis?.profit > 0) {
      return `Your campaign is profitable with ${kpis.roas.toFixed(2)}x ROAS. To scale:\n\n1. Gradually increase daily budget by 20-30%\n2. Expand to similar GEOs that performed well\n3. Test new traffic sources while maintaining current winners\n4. Consider running A/B tests on landing pages`;
    }
    return "Before scaling, focus on improving profitability first. Your current metrics suggest optimization is needed.";
  }
  
  if (q.includes('perform') || q.includes('how') || q.includes('stats')) {
    if (kpis) {
      return `Campaign Performance Summary:\n\n• Clicks: ${kpis.clicks.toLocaleString()}\n• Conversions: ${kpis.conversions}\n• Revenue: $${kpis.revenue.toFixed(2)}\n• Profit: $${kpis.profit.toFixed(2)}\n• CPA: $${kpis.cpa.toFixed(2)}\n• Conversion Rate: ${kpis.conversionRate.toFixed(2)}%\n\nHealth: ${health?.label || 'Unknown'} (${health?.score || 0}/100)`;
    }
    return "I don't have enough data to provide a performance summary yet.";
  }
  
  // Default response
  return `Based on your campaign data:\n\n• Health Score: ${health?.score || 'N/A'}/100 (${health?.label || 'Unknown'})\n• ${recommendations?.filter(r => r.status === 'new').length || 0} pending recommendations\n\nTry asking specific questions like:\n- "How can I reduce CPA?"\n- "What went wrong this week?"\n- "How can I scale this campaign?"`;
}

export function AiCopilotPanel({ campaignId, campaignName }: AiCopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: kpis } = useCampaignKpis(campaignId);
  const { data: health } = useCampaignHealthScore(campaignId);
  const { data: recommendations } = useRecommendations(campaignId);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate local response (TODO: Replace with actual LLM call)
    const response = generateLocalResponse(input, kpis, health, recommendations || []);
    const assistantMessage: Message = { role: 'assistant', content: response };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "How can I reduce CPA?",
    "What went wrong this week?",
    "How do I scale this campaign?",
  ];

  return (
    <Card className="bg-gradient-card border-card-border h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Copilot</CardTitle>
            <Badge variant="outline" className="text-xs mt-1">Beta</Badge>
          </div>
        </div>
        <CardDescription>
          Ask questions about your campaign performance
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-4">
                  Ask me anything about {campaignName || 'this campaign'}
                </p>
                <div className="space-y-2">
                  {suggestedQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setInput(q);
                      }}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="p-2 rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[85%]",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="p-2 rounded-full bg-muted h-8 w-8 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3">
                <div className="p-2 rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 pt-4 mt-4 border-t">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your campaign..."
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button 
            size="icon" 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
