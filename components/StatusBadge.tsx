import { Badge } from './ui/badge';

interface StatusBadgeProps {
  status: 'In Stock' | 'Melted' | 'Resold' | 'Hold' | 'Quote';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-emerald-500 text-white hover:bg-emerald-600';
      case 'Melted':
        return 'bg-gray-500 text-white hover:bg-gray-600';
      case 'Resold':
        return 'bg-indigo-500 text-white hover:bg-indigo-600';
      case 'Hold':
        return 'bg-amber-500 text-white hover:bg-amber-600';
      case 'Quote':
        return 'bg-sky-500 text-white hover:bg-sky-600';
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };

  return (
    <Badge 
      className={`${getStatusColor(status)} ${className}`}
      variant="secondary"
    >
      {status}
    </Badge>
  );
}