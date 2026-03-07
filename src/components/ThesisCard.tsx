import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

export interface ThesisData {
  id: string;
  ticker: string;
  brTicker?: string;
  name: string;
  type: 'acao' | 'fii' | 'etf' | 'renda_fixa' | 'cripto' | 'internacional' | 'outro';
  status: 'compra_gradual' | 'posicao_cheia' | 'venda_programada' | 'encerrada' | 'aguardando_ponto' | 'venda';
  entryPoint: number;
  exitPoint: number;
  currentPrice: number;
  targetPrice: number;
  currency?: string;
  bdrTicker?: string;
  thesis: string;
  gradualBuys?: { price: number; percentage: number }[];
  macroAnalysis?: string;
  fundamentalAnalysis?: string;
  technicalAnalysis?: string;
}

const statusLabels: Record<ThesisData['status'], string> = {
  compra_gradual: "Compra Gradual",
  posicao_cheia: "Posição Cheia",
  venda_programada: "Venda Programada",
  encerrada: "Encerrada",
  aguardando_ponto: "Aguardando Ponto",
  venda: "Venda",
};

const statusColors: Record<ThesisData['status'], string> = {
  compra_gradual: "bg-[rgba(26,26,26,0.1)] text-[#1a1a1a] border-[rgba(26,26,26,0.2)]",
  posicao_cheia: "bg-[rgba(46,101,74,0.1)] text-[#2e654a] border-[rgba(46,101,74,0.2)]",
  venda_programada: "bg-[rgba(140,123,101,0.15)] text-[#8c7b65] border-[rgba(140,123,101,0.2)]",
  encerrada: "bg-[#e5e5e5] text-[#737373] border-[rgba(115,115,115,0.2)]",
  aguardando_ponto: "bg-[rgba(249,115,22,0.1)] text-[#ea580c] border-[rgba(249,115,22,0.2)]",
  venda: "bg-[rgba(138,46,46,0.1)] text-[#8a2e2e] border-[rgba(138,46,46,0.2)]",
};

const typeLabels: Record<ThesisData['type'], string> = {
  acao: "Ação", fii: "FII", etf: "ETF", renda_fixa: "Renda Fixa", cripto: "Cripto", internacional: "Internacional", outro: "Outro"
};

export function ThesisCard({ thesis }: { thesis: ThesisData }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [marketData, setMarketData] = useState<{ price: number; change: number; changePercent: number } | null>(null);
  const [isLoadingMarketData, setIsLoadingMarketData] = useState(false);

  useEffect(() => {
    const fetchMarketData = async () => {
      setIsLoadingMarketData(true);
      try {
        const response = await fetch(`/api/market-data?ticker=${thesis.ticker}`);
        if (response.ok) {
          const data = await response.json();
          setMarketData(data);
        }
      } catch (error) {
        console.error('Failed to fetch market data', error);
      } finally {
        setIsLoadingMarketData(false);
      }
    };
    fetchMarketData();
  }, [thesis.ticker]);

  const currentPrice = marketData?.price || thesis.currentPrice;
  const currencySymbol = thesis.currency === 'USD' ? 'US$' : 'R$';
  const targetPct = ((thesis.targetPrice - currentPrice) / currentPrice) * 100;
  const entryDistance = ((currentPrice - thesis.entryPoint) / thesis.entryPoint) * 100;
  const hasDetailedAnalysis = thesis.macroAnalysis || thesis.fundamentalAnalysis || thesis.technicalAnalysis;

  return (
    <div className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-xl font-serif font-semibold text-primary">{thesis.ticker}</h3>
            {(thesis.brTicker || thesis.bdrTicker) && (
              <span className="text-xs font-medium px-2 py-0.5 bg-secondary text-muted-foreground rounded-full border border-border">
                🇧🇷 {thesis.brTicker || thesis.bdrTicker}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{thesis.name}</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border uppercase tracking-wider", statusColors[thesis.status])}>
            {statusLabels[thesis.status]}
          </span>
          <span className="text-xs text-muted-foreground uppercase tracking-widest">{typeLabels[thesis.type]}</span>
        </div>
      </div>

      {/* Price grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-[rgba(245,242,237,0.3)] rounded-xl border border-border/50">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ponto Entrada</p>
          <p className="text-lg font-serif font-medium text-primary">{currencySymbol} {thesis.entryPoint.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Stop Loss</p>
          <p className="text-lg font-serif font-medium text-destructive">{currencySymbol} {thesis.exitPoint.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Atual</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-lg font-serif font-medium text-primary">
              {isLoadingMarketData ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground inline" />
              ) : (
                `${currencySymbol} ${currentPrice.toFixed(2)}`
              )}
            </p>
            {marketData && (
              <span className={cn(
                "text-xs font-medium flex items-center",
                marketData.change >= 0 ? "text-[#2e654a]" : "text-[#8a2e2e]"
              )}>
                {marketData.change >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {Math.abs(marketData.changePercent).toFixed(2)}%
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Alvo</p>
          <p className="text-lg font-serif font-medium text-[#2e654a]">{currencySymbol} {thesis.targetPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm font-medium">
          <span className={cn(entryDistance <= 0 ? "text-[#2e654a]" : "text-muted-foreground")}>
            {entryDistance <= 0 ? "No ponto de entrada" : `+${entryDistance.toFixed(1)}% do ponto`}
          </span>
          <span className="text-[#8c7b65]">+{targetPct.toFixed(1)}% potencial</span>
        </div>
      </div>

      {/* Gradual buys */}
      {thesis.gradualBuys && thesis.gradualBuys.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Compras Graduais</p>
          <div className="flex flex-wrap gap-2">
            {thesis.gradualBuys.map((buy, i) => (
              <span key={i} className="text-xs font-medium px-2 py-1 bg-[#f5f2ed] text-primary rounded-md border border-border">
                {currencySymbol}{buy.price.toFixed(2)} · {buy.percentage}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Thesis text */}
      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
          {thesis.thesis}
        </p>
      </div>

      {/* Expandable Analysis Section */}
      {hasDetailedAnalysis && (
        <div className="mt-4 pt-4 border-t border-border">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-sm font-medium text-primary hover:text-accent transition-colors"
          >
            <span>Análise Detalhada 360°</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {isExpanded && (
            <div className="mt-4 space-y-6 prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-primary prose-a:text-accent prose-p:text-muted-foreground prose-li:text-muted-foreground">
              {thesis.macroAnalysis && (
                <div>
                  <h4 className="text-sm font-semibold border-b border-border pb-1 mb-2">Análise Macroeconômica</h4>
                  <ReactMarkdown>{thesis.macroAnalysis}</ReactMarkdown>
                </div>
              )}
              {thesis.fundamentalAnalysis && (
                <div>
                  <h4 className="text-sm font-semibold border-b border-border pb-1 mb-2">Análise Fundamentalista</h4>
                  <ReactMarkdown>{thesis.fundamentalAnalysis}</ReactMarkdown>
                </div>
              )}
              {thesis.technicalAnalysis && (
                <div>
                  <h4 className="text-sm font-semibold border-b border-border pb-1 mb-2">Análise Técnica</h4>
                  <ReactMarkdown>{thesis.technicalAnalysis}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
