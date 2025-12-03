import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCampaignBreakdown, CampaignBreakdown } from "@/hooks/useCampaignAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Smartphone, Monitor, Tag, Share2 } from "lucide-react";

interface BreakdownTablesProps {
  campaignId: string;
}

type Dimension = 'geo' | 'device' | 'os' | 'subId' | 'trafficSource';

const DIMENSIONS: { value: Dimension; label: string; icon: React.ElementType }[] = [
  { value: 'geo', label: 'GEO', icon: Globe },
  { value: 'device', label: 'Device', icon: Smartphone },
  { value: 'os', label: 'OS', icon: Monitor },
  { value: 'subId', label: 'Sub ID', icon: Tag },
  { value: 'trafficSource', label: 'Source', icon: Share2 },
];

function BreakdownTable({ data, isLoading }: { data: CampaignBreakdown[] | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available for this breakdown
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Value</TableHead>
          <TableHead className="text-right">Clicks</TableHead>
          <TableHead className="text-right">Conversions</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Conv. Rate</TableHead>
          <TableHead className="text-right">CPA</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.slice(0, 20).map((row, index) => {
          const convRate = row.clicks > 0 ? (row.conversions / row.clicks) * 100 : 0;
          const cpa = row.conversions > 0 ? row.cost / row.conversions : 0;
          
          return (
            <TableRow key={`${row.value}-${index}`}>
              <TableCell>
                <Badge variant="outline" className="font-mono">
                  {row.value || 'Unknown'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{row.clicks.toLocaleString()}</TableCell>
              <TableCell className="text-right">{row.conversions.toLocaleString()}</TableCell>
              <TableCell className="text-right text-success">
                ${row.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right">{convRate.toFixed(2)}%</TableCell>
              <TableCell className="text-right">
                ${cpa.toFixed(2)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function BreakdownTables({ campaignId }: BreakdownTablesProps) {
  const [activeDimension, setActiveDimension] = useState<Dimension>('geo');
  
  const { data: geoData, isLoading: geoLoading } = useCampaignBreakdown(campaignId, 'geo');
  const { data: deviceData, isLoading: deviceLoading } = useCampaignBreakdown(campaignId, 'device');
  const { data: osData, isLoading: osLoading } = useCampaignBreakdown(campaignId, 'os');
  const { data: subIdData, isLoading: subIdLoading } = useCampaignBreakdown(campaignId, 'subId');
  const { data: sourceData, isLoading: sourceLoading } = useCampaignBreakdown(campaignId, 'trafficSource');

  const dataMap: Record<Dimension, { data: CampaignBreakdown[] | undefined; isLoading: boolean }> = {
    geo: { data: geoData, isLoading: geoLoading },
    device: { data: deviceData, isLoading: deviceLoading },
    os: { data: osData, isLoading: osLoading },
    subId: { data: subIdData, isLoading: subIdLoading },
    trafficSource: { data: sourceData, isLoading: sourceLoading },
  };

  return (
    <Card className="bg-gradient-card border-card-border">
      <CardHeader className="pb-2">
        <CardTitle>Performance Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeDimension} onValueChange={(v) => setActiveDimension(v as Dimension)}>
          <TabsList className="grid grid-cols-5 w-full max-w-xl">
            {DIMENSIONS.map((dim) => (
              <TabsTrigger key={dim.value} value={dim.value} className="gap-1">
                <dim.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{dim.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {DIMENSIONS.map((dim) => (
            <TabsContent key={dim.value} value={dim.value} className="mt-4">
              <BreakdownTable 
                data={dataMap[dim.value].data} 
                isLoading={dataMap[dim.value].isLoading} 
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
