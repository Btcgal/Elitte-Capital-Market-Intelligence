import { cn } from '../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ title, value, change, subtitle, icon, className }: MetricCardProps) {
  return (
    <div className={cn("bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
        {icon && <div className="text-accent">{icon}</div>}
      </div>
      <p className="text-3xl font-serif font-semibold text-primary">{value}</p>
      <div className="mt-2 flex items-center space-x-2">
        {change && (
          <span className={cn(
            "text-sm font-medium flex items-center",
            change.startsWith('+') ? "text-success" : change.startsWith('-') ? "text-destructive" : "text-muted-foreground"
          )}>
            {change}
          </span>
        )}
        {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  );
}
