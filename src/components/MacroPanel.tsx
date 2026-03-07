import { cn } from '../lib/utils';

export interface MacroIndicator {
  name: string;
  value: string;
  change: string;
  region: 'BR' | 'US' | 'EU' | 'CN';
}

const regionFlags: Record<MacroIndicator['region'], string> = { BR: "🇧🇷", US: "🇺🇸", EU: "🇪🇺", CN: "🇨🇳" };

export function MacroPanel({ indicators }: { indicators: MacroIndicator[] }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
      <h3 className="text-lg font-serif font-semibold text-primary mb-6">Cenário Macro</h3>
      <div className="space-y-4">
        {indicators.map((ind, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-xl">{regionFlags[ind.region]}</span>
              <span className="text-sm font-medium text-primary tracking-wide">{ind.name}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-serif font-semibold text-primary">{ind.value}</p>
              {ind.change && (
                <p className={cn(
                  "text-xs font-medium mt-0.5",
                  ind.change.startsWith('+') ? "text-success" : ind.change.startsWith('-') ? "text-destructive" : "text-muted-foreground"
                )}>
                  {ind.change}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
