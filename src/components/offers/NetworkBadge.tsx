import { Badge } from "@/components/ui/badge";

interface NetworkBadgeProps {
  network: string;
}

export const NetworkBadge = ({ network }: NetworkBadgeProps) => {
  const getNetworkInfo = (network: string) => {
    const networkLower = network.toLowerCase();
    
    if (networkLower.includes('maxbounty')) {
      return { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: '🎯' };
    }
    if (networkLower.includes('clickdealer')) {
      return { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: '🔥' };
    }
    if (networkLower.includes('everflow')) {
      return { color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: '🌊' };
    }
    if (networkLower.includes('shareasale')) {
      return { color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: '🤝' };
    }
    if (networkLower.includes('cpajunction')) {
      return { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: '⚡' };
    }
    if (networkLower.includes('adsterra')) {
      return { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: '🚀' };
    }
    if (networkLower.includes('crakrevenue')) {
      return { color: 'bg-pink-500/10 text-pink-500 border-pink-500/20', icon: '💰' };
    }
    
    return { color: 'bg-muted text-muted-foreground', icon: '🏢' };
  };

  const { color, icon } = getNetworkInfo(network);

  return (
    <Badge variant="outline" className={color}>
      <span className="mr-1">{icon}</span>
      {network}
    </Badge>
  );
};