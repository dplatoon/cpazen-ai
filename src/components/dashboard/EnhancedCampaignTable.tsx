import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Play, 
  Pause, 
  Square, 
  Edit, 
  Copy, 
  Trash2, 
  MoreHorizontal, 
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown
} from "lucide-react";

// Enhanced mock campaign data with more realistic metrics
const mockCampaigns = [
  {
    id: "1",
    name: "Dating SOI - US Premium",
    status: "active",
    network: "MaxBounty",
    spend: 2340.50,
    revenue: 8967.25,
    roi: 283.4,
    clicks: 15423,
    conversions: 234,
    cr: 1.52,
    cpc: 0.15,
    lastUpdated: "2 mins ago"
  },
  {
    id: "2", 
    name: "Crypto Trading - Global",
    status: "active",
    network: "ClickDealer",
    spend: 1890.75,
    revenue: 6234.80,
    roi: 229.8,
    clicks: 12890,
    conversions: 156,
    cr: 1.21,
    cpc: 0.15,
    lastUpdated: "5 mins ago"
  },
  {
    id: "3",
    name: "Health Supplements - Tier1",
    status: "paused",
    network: "Adsterra", 
    spend: 3456.90,
    revenue: 12890.45,
    roi: 372.9,
    clicks: 23456,
    conversions: 389,
    cr: 1.66,
    cpc: 0.15,
    lastUpdated: "1 hour ago"
  },
  {
    id: "4",
    name: "Gaming CPI - Mobile US",
    status: "active",
    network: "Custom",
    spend: 5643.20,
    revenue: 8934.60,
    roi: 58.3,
    clicks: 45672,
    conversions: 234,
    cr: 0.51,
    cpc: 0.12,
    lastUpdated: "3 mins ago"
  },
  {
    id: "5",
    name: "Finance Lead Gen - CA",
    status: "active",
    network: "MaxBounty",
    spend: 1234.50,
    revenue: 4567.80,
    roi: 270.1,
    clicks: 8901,
    conversions: 123,
    cr: 1.38,
    cpc: 0.14,
    lastUpdated: "8 mins ago"
  },
  {
    id: "6",
    name: "E-commerce COD - UK",
    status: "stopped",
    network: "Adsterra",
    spend: 2890.30,
    revenue: 1234.50,
    roi: -57.3,
    clicks: 19234,
    conversions: 45,
    cr: 0.23,
    cpc: 0.15,
    lastUpdated: "2 days ago"
  },
  {
    id: "7",
    name: "Dating SOI - AU Premium",
    status: "active",
    network: "ClickDealer", 
    spend: 1567.90,
    revenue: 5234.70,
    roi: 233.8,
    clicks: 11234,
    conversions: 167,
    cr: 1.49,
    cpc: 0.14,
    lastUpdated: "1 min ago"
  },
  {
    id: "8",
    name: "Tech Software - B2B",
    status: "active",
    network: "Custom",
    spend: 4321.60,
    revenue: 15678.90,
    roi: 362.9,
    clicks: 28901,
    conversions: 456,
    cr: 1.58,
    cpc: 0.15,
    lastUpdated: "4 mins ago"
  },
  {
    id: "9",
    name: "Beauty Products - Female",
    status: "paused",
    network: "MaxBounty",
    spend: 2134.80,
    revenue: 6789.40,
    roi: 218.1,
    clicks: 15678,
    conversions: 234,
    cr: 1.49,
    cpc: 0.14,
    lastUpdated: "30 mins ago"
  },
  {
    id: "10",
    name: "Travel Booking - Tier2",
    status: "active",
    network: "Adsterra",
    spend: 3456.70,
    revenue: 8901.20,
    roi: 157.5,
    clicks: 23456,
    conversions: 189,
    cr: 0.81,
    cpc: 0.15,
    lastUpdated: "6 mins ago"
  }
];

type SortField = 'name' | 'spend' | 'revenue' | 'roi' | 'clicks' | 'conversions' | 'cr';
type SortOrder = 'asc' | 'desc';

export const EnhancedCampaignTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/20 text-success border-success/30';
      case 'paused':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'stopped':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-secondary/20 text-secondary border-secondary/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-3 w-3" />;
      case 'paused':
        return <Pause className="h-3 w-3" />;
      case 'stopped':
        return <Square className="h-3 w-3" />;
      default:
        return <Play className="h-3 w-3" />;
    }
  };

  const getRoiTrend = (roi: number) => {
    if (roi > 200) return <TrendingUp className="h-4 w-4 text-success" />;
    if (roi > 100) return <TrendingUp className="h-4 w-4 text-warning" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedCampaigns = mockCampaigns
    .filter(campaign => 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.network.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  const paginatedCampaigns = filteredAndSortedCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAndSortedCampaigns.length / itemsPerPage);

  return (
    <Card className="p-6 bg-gradient-card border-card-border backdrop-blur-sm bg-card/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Live Campaigns</h3>
          <p className="text-sm text-foreground-muted">
            {filteredAndSortedCampaigns.length} campaigns • Updated in real-time
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 bg-input border-input-border focus:border-input-focus"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-card-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-card-hover/30 hover:bg-card-hover/50">
              <TableHead 
                className="cursor-pointer select-none hover:text-foreground"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Campaign</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Network</TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:text-foreground text-right"
                onClick={() => handleSort('spend')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Spend</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:text-foreground text-right"
                onClick={() => handleSort('revenue')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Revenue</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:text-foreground text-right"
                onClick={() => handleSort('roi')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>ROI</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:text-foreground text-right"
                onClick={() => handleSort('clicks')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Clicks</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:text-foreground text-right"
                onClick={() => handleSort('cr')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>CR%</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCampaigns.map((campaign) => (
              <TableRow 
                key={campaign.id}
                className="hover:bg-card-hover/30 transition-colors group"
              >
                <TableCell className="font-medium">
                  <div>
                    <div className="text-foreground">{campaign.name}</div>
                    <div className="text-xs text-foreground-muted">
                      Updated {campaign.lastUpdated}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(campaign.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(campaign.status)}
                      <span className="capitalize">{campaign.status}</span>
                    </div>
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {campaign.network}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className="text-destructive">
                    ${campaign.spend.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className="text-success font-medium">
                    ${campaign.revenue.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {getRoiTrend(campaign.roi)}
                    <span className={`font-mono font-medium ${
                      campaign.roi > 100 ? 'text-success' : 'text-destructive'
                    }`}>
                      {campaign.roi > 0 ? '+' : ''}{campaign.roi.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-foreground-muted">
                  {campaign.clicks.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className={`${
                    campaign.cr > 1 ? 'text-success' : 'text-warning'
                  }`}>
                    {campaign.cr.toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-card-border">
                        <DropdownMenuItem className="text-foreground hover:bg-card-hover">
                          <Play className="h-4 w-4 mr-2" />
                          {campaign.status === 'active' ? 'Pause' : 'Start'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-card-hover">
                          <Copy className="h-4 w-4 mr-2" />
                          Clone Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-foreground-muted">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedCampaigns.length)} of {filteredAndSortedCampaigns.length} campaigns
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                size="sm"
                variant={currentPage === page ? "default" : "ghost"}
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
};