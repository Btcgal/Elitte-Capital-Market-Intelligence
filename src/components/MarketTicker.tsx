import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface MarketTickerProps {
  ticker: string;
  name: string;
  type?: 'index' | 'currency' | 'commodity' | 'crypto';
}

export function MarketTicker({ ticker, name, type = 'index' }: MarketTickerProps) {
  const [data, setData] = useState<{ price: number; change: number; changePercent: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = `/api/market-data?ticker=${ticker}`;
        if (type === 'currency') {
          url = `/api/exchange-rate?currency=${ticker}`;
        }
        
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          // Normalize data structure if needed
          if (type === 'currency') {
             // Exchange rate endpoint returns { price, name, high, low, pctChange }
             // We need to map pctChange to changePercent and calculate change if missing
             setData({
               price: json.price,
               change: json.price * (json.pctChange / 100), // Approx change
               changePercent: json.pctChange
             });
          } else {
            setData(json);
          }
        } else {
          setData(null);
        }
      } catch (e) {
        console.error(e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 60000); // Poll every 1 minute
    
    return () => clearInterval(interval);
  }, [ticker, type]);

  const formatValue = (val: number) => {
    if (type === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    if (type === 'commodity') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    if (type === 'crypto') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{name}</p>
      {loading ? (
        <div className="flex items-center h-10">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/50" />
        </div>
      ) : data ? (
        <div>
          <p className="text-lg font-serif font-semibold text-primary leading-none">{formatValue(data.price)}</p>
          <div className={cn("flex items-center text-xs font-medium mt-2", data.change >= 0 ? "text-success" : "text-destructive")}>
            {data.change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {data.change > 0 ? '+' : ''}{(data.changePercent || 0).toFixed(2)}%
          </div>
        </div>
      ) : (
        <div className="flex items-center h-10">
          <p className="text-xs text-muted-foreground">Indisponível</p>
        </div>
      )}
    </div>
  );
}
