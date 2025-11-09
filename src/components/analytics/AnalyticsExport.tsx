import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

export function AnalyticsExport() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [exportType, setExportType] = useState<'clicks' | 'conversions' | 'campaigns'>('clicks');
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = async () => {
    if (!user || !dateRange?.from || !dateRange?.to) {
      toast.error('Please select a date range');
      return;
    }

    setIsExporting(true);

    try {
      let data: any[] = [];
      let filename = '';

      switch (exportType) {
        case 'clicks':
          const { data: clicks } = await supabase
            .from('clicks')
            .select('*, campaigns(name)')
            .eq('user_id', user.id)
            .gte('created_at', dateRange.from.toISOString())
            .lte('created_at', dateRange.to.toISOString())
            .order('created_at', { ascending: false });

          data = clicks?.map(c => ({
            'Click ID': c.click_id,
            'Campaign': c.campaigns?.name,
            'Country': c.country,
            'City': c.city,
            'Device': c.device,
            'OS': c.os,
            'Browser': c.browser,
            'Is Bot': c.is_bot ? 'Yes' : 'No',
            'Referrer': c.referrer,
            'IP Address': c.ip_address,
            'Created At': format(new Date(c.created_at), 'yyyy-MM-dd HH:mm:ss'),
          })) || [];
          filename = 'clicks-export';
          break;

        case 'conversions':
          const { data: conversions } = await supabase
            .from('conversions')
            .select('*, campaigns(name), clicks(click_id, country)')
            .eq('user_id', user.id)
            .gte('created_at', dateRange.from.toISOString())
            .lte('created_at', dateRange.to.toISOString())
            .order('created_at', { ascending: false });

          data = conversions?.map(c => ({
            'Conversion ID': c.id,
            'Campaign': c.campaigns?.name,
            'Click ID': c.clicks?.click_id,
            'Country': c.clicks?.country,
            'Payout': c.payout,
            'Currency': c.currency,
            'Status': c.status,
            'Created At': format(new Date(c.created_at), 'yyyy-MM-dd HH:mm:ss'),
          })) || [];
          filename = 'conversions-export';
          break;

        case 'campaigns':
          const { data: campaigns } = await supabase
            .from('campaigns')
            .select(`
              *,
              clicks(count),
              conversions(count, payout)
            `)
            .eq('user_id', user.id);

          data = campaigns?.map(c => ({
            'Campaign ID': c.id,
            'Campaign Name': c.name,
            'Status': c.status,
            'Total Clicks': c.clicks?.length || 0,
            'Total Conversions': c.conversions?.length || 0,
            'Total Revenue': c.conversions?.reduce((sum: number, conv: any) => sum + (conv.payout || 0), 0).toFixed(2) || 0,
            'Conversion Rate': c.clicks?.length ? ((c.conversions?.length / c.clicks.length) * 100).toFixed(2) + '%' : '0%',
            'Created At': format(new Date(c.created_at), 'yyyy-MM-dd HH:mm:ss'),
          })) || [];
          filename = 'campaigns-export';
          break;
      }

      if (data.length === 0) {
        toast.info('No data to export for the selected period');
        setIsExporting(false);
        return;
      }

      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]?.toString() || '';
            // Escape commas and quotes
            return value.includes(',') || value.includes('"') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.csv`;
      link.click();

      toast.success(`Exported ${data.length} records successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Export Analytics Data</CardTitle>
            <CardDescription>
              Download your data in CSV format for external analysis
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Data Type</label>
            <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clicks">Clicks Data</SelectItem>
                <SelectItem value="conversions">Conversions Data</SelectItem>
                <SelectItem value="campaigns">Campaign Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          </div>
        </div>

        <Button 
          onClick={exportToCSV} 
          disabled={isExporting || !dateRange?.from || !dateRange?.to}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Export to CSV
            </>
          )}
        </Button>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium">Export includes:</p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            {exportType === 'clicks' && (
              <>
                <li>Click IDs, timestamps, and geo data</li>
                <li>Device, OS, and browser information</li>
                <li>Bot detection status</li>
              </>
            )}
            {exportType === 'conversions' && (
              <>
                <li>Conversion details and payouts</li>
                <li>Associated campaign information</li>
                <li>Conversion status and timing</li>
              </>
            )}
            {exportType === 'campaigns' && (
              <>
                <li>Campaign performance metrics</li>
                <li>Click and conversion totals</li>
                <li>Revenue and conversion rates</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
