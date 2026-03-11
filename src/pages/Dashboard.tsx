import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Calendar, Newspaper, Clock, Globe2, Bot, Loader2, ChevronRight, AlertTriangle, TrendingUp } from 'lucide-react';
import { MacroPanel, MacroIndicator } from '../components/MacroPanel';
import { ThesisCard } from '../components/ThesisCard';
import { MarketTicker } from '../components/MarketTicker';
import PortfolioMonthlyReport from '../reports/generators/PortfolioMonthlyGenerator';
import { chatWithAssistant } from '../services/gemini';
import { cn } from '../lib/utils';
import { InvestmentThesis, Portfolio } from '../types';

const mockPortfolio: Portfolio = {
  name: "Carteira Alpha",
  value: 2450000,
  performanceMonth: 4.82,
  assets: [
    { ticker: 'PETR4.SA', symbol: 'PETR4', allocation: 25, performance: 12.4 },
    { ticker: 'VALE3.SA', symbol: 'VALE3', allocation: 20, performance: -2.1 },
  ]
};

const initialIndicators: MacroIndicator[] = [
  { name: 'Selic', value: '10.50%', change: 'Mantida', region: 'BR' },
  { name: 'IPCA', value: '4.50%', change: '+0.2%', region: 'BR' },
  { name: 'Fed Funds', value: '5.25%', change: 'Mantida', region: 'US' },
  { name: 'CPI', value: '3.10%', change: '-0.1%', region: 'US' },
];

const mockTheses: any[] = [
  {
    id: '1',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    title: 'Apple Inc. Growth',
    category: 'Equity',
    status: 'Active',
    entryPrice: 170.50,
    exitPoint: 150.00,
    currentPrice: 185.20,
    targetPrice: 210.00,
    description: 'A tese de investimento na Apple baseia-se na expansão contínua do seu ecossistema de serviços e na adoção de IA em seus dispositivos.',
    tags: ['Tech', 'IA']
  },
  {
    id: '2',
    ticker: 'PETR4',
    name: 'Petrobras',
    title: 'Petrobras Dividends',
    category: 'Equity',
    status: 'Active',
    entryPrice: 32.00,
    exitPoint: 28.00,
    currentPrice: 38.50,
    targetPrice: 45.00,
    description: 'Forte geração de caixa e política de dividendos atrativa.',
    tags: ['Oil', 'Dividends']
  }
];

const marketNews = [
  { id: 1, source: 'Bloomberg', time: 'Há 30 min', title: 'Fed sinaliza cautela com inflação persistente antes do próximo FOMC.', impact: 'high' },
  { id: 2, source: 'Valor Econômico', time: 'Há 1 hora', title: 'Campos Neto reforça compromisso com meta fiscal em evento em SP.', impact: 'medium' },
  { id: 3, source: 'Reuters', time: 'Há 2 horas', title: 'Petróleo avança com tensões no Oriente Médio e cortes da OPEP+.', impact: 'high' },
  { id: 4, source: 'Financial Times', time: 'Há 3 horas', title: 'BCE mantém taxas de juros inalteradas, mas aponta para possíveis cortes.', impact: 'medium' },
  { id: 5, source: 'Exame', time: 'Há 4 horas', title: 'Ibovespa opera em alta puxado por commodities e exterior favorável.', impact: 'low' },
];

const economicCalendar = [
  { id: 1, date: 'Hoje, 14:00', event: 'Decisão da Taxa de Juros (FOMC)', country: 'US', impact: 'high' },
  { id: 2, date: 'Hoje, 18:30', event: 'Decisão da Taxa Selic (Copom)', country: 'BR', impact: 'high' },
  { id: 3, date: 'Amanhã, 09:30', event: 'Pedidos Iniciais por Seguro-Desemprego', country: 'US', impact: 'medium' },
  { id: 4, date: 'Sex, 09:00', event: 'IPCA-15 (Prévia da Inflação)', country: 'BR', impact: 'high' },
];

export default function Dashboard() {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [indicators, setIndicators] = useState<MacroIndicator[]>(initialIndicators);
  const [hasGeneratedInsight, setHasGeneratedInsight] = useState(false);

  const generateInsight = async (currentIndicators: MacroIndicator[]) => {
    setIsGeneratingInsight(true);
    try {
      const selic = currentIndicators.find(i => i.name === 'Selic')?.value || '10.50%';
      const ipca = currentIndicators.find(i => i.name === 'IPCA')?.value || '4.50%';
      const fedFunds = currentIndicators.find(i => i.name === 'Fed Funds')?.value || '5.25%';
      const cpi = currentIndicators.find(i => i.name === 'CPI')?.value || '3.10%';
      
      const prompt = `Como um estrategista chefe de Wealth Management, gere um "Morning Call" rápido (máximo 4 frases) resumindo o cenário macro de hoje. Considere os indicadores: Selic ${selic}, IPCA ${ipca}, Fed Funds ${fedFunds}, CPI ${cpi}. Dê um tom profissional, direto e focado em alocação de portfólio.`;
      const response = await chatWithAssistant(prompt, "");
      setAiInsight(response);
      setHasGeneratedInsight(true);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('Limite de requisições') || error.message?.includes('429')) {
        setAiInsight("Limite de requisições diárias atingido. Tente novamente mais tarde.");
      } else {
        setAiInsight("Não foi possível gerar o insight no momento.");
      }
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  useEffect(() => {
    const fetchBacenData = async () => {
      try {
        const selicRes = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        const selicData = await selicRes.json();
        
        const ipcaRes = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json');
        const ipcaData = await ipcaRes.json();

        const updatedIndicators = initialIndicators.map(ind => {
          if (ind.name === 'Selic' && selicData[0]) {
            return { ...ind, value: `${selicData[0].valor}%` };
          }
          if (ind.name === 'IPCA' && ipcaData[0]) {
            return { ...ind, value: `${ipcaData[0].valor}%` };
          }
          return ind;
        });
        
        setIndicators(updatedIndicators);
        
        // Auto-generate insight after fetching data
        if (!hasGeneratedInsight) {
          generateInsight(updatedIndicators);
        }
      } catch (error) {
        console.error('Failed to fetch BACEN data', error);
        // Generate anyway with initial indicators if fetch fails
        if (!hasGeneratedInsight) {
          generateInsight(initialIndicators);
        }
      }
    };

    fetchBacenData();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">Market Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.2em]">Morning Call & Radar Macroeconômico</p>
        </div>
      </div>

      {/* Live Market Tickers */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <MarketTicker ticker="^BVSP" name="Ibovespa" type="index" />
        <MarketTicker ticker="^GSPC" name="S&P 500" type="index" />
        <MarketTicker ticker="^IXIC" name="Nasdaq" type="index" />
        <MarketTicker ticker="USD" name="Dólar" type="currency" />
        <MarketTicker ticker="EUR" name="Euro" type="currency" />
        <MarketTicker ticker="BZ=F" name="Petróleo Brent" type="commodity" />
        <MarketTicker ticker="GC=F" name="Ouro" type="commodity" />
        <MarketTicker ticker="BTC-USD" name="Bitcoin" type="crypto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Macro & AI */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Morning Call */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-semibold text-primary flex items-center">
                <Bot className="w-5 h-5 mr-2 text-accent" />
                AI Morning Call
              </h3>
              <button 
                onClick={() => generateInsight(indicators)}
                disabled={isGeneratingInsight}
                className="px-4 py-2 bg-primary text-secondary rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center shadow-sm"
              >
                {isGeneratingInsight ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bot className="w-4 h-4 mr-2" />}
                {aiInsight ? 'Atualizar Visão' : 'Gerar Visão do Dia'}
              </button>
            </div>
            
            <div className="p-6 bg-secondary/30 rounded-xl border border-border/50">
              {aiInsight ? (
                <p className="text-primary leading-relaxed text-justify">{aiInsight}</p>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Clique em "Gerar Visão do Dia" para obter um resumo estratégico baseado nos indicadores atuais.</p>
                </div>
              )}
            </div>
          </div>

          {/* Macro Panel */}
          <MacroPanel indicators={indicators} />

          {/* Economic Calendar */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-secondary/30 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary" />
              <h3 className="text-lg font-serif font-semibold text-primary">Agenda Econômica</h3>
            </div>
            <div className="divide-y divide-border">
              {economicCalendar.map((item) => (
                <div key={item.id} className="p-4 flex items-center hover:bg-secondary/30 transition-colors">
                  <div className="w-24 flex-shrink-0">
                    <p className="text-xs font-medium text-muted-foreground flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.date}
                    </p>
                  </div>
                  <div className="flex-1 px-4">
                    <p className="text-sm font-medium text-primary">{item.event}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-md border border-border">
                      {item.country}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider min-w-[60px] text-center",
                      item.impact === 'high' ? "bg-red-100 text-red-700 border-red-200" :
                      item.impact === 'medium' ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                      "bg-green-100 text-green-700 border-green-200"
                    )}>
                      {item.impact === 'high' ? 'Alto' : item.impact === 'medium' ? 'Médio' : 'Baixo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: News */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-border bg-secondary/30 flex items-center">
              <Newspaper className="w-5 h-5 mr-2 text-primary" />
              <h3 className="text-lg font-serif font-semibold text-primary">Radar de Notícias</h3>
            </div>
            <div className="divide-y divide-border flex-1 overflow-y-auto">
              {marketNews.map((news) => (
                <a key={news.id} href="#" className="block p-5 hover:bg-secondary/30 transition-colors group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-accent uppercase tracking-wider">{news.source}</span>
                    <span className="text-xs text-muted-foreground">{news.time}</span>
                  </div>
                  <p className="text-sm font-medium text-primary leading-snug group-hover:text-accent transition-colors">
                    {news.title}
                  </p>
                </a>
              ))}
            </div>
            <div className="p-4 border-t border-border bg-secondary/30 text-center">
              <Link to="/news" className="text-xs font-medium text-primary hover:text-accent transition-colors flex items-center justify-center w-full">
                Ver todas as notícias <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Theses */}
      <div>
        <div className="flex justify-between items-end border-b border-border pb-6 mb-8 mt-4">
          <h2 className="text-2xl font-serif font-semibold text-primary tracking-tight">Teses em Destaque</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockTheses.map(thesis => (
            <ThesisCard key={thesis.id} thesis={thesis} />
          ))}
        </div>
      </div>

      {/* === RELATÓRIO MENSAL ELITTE (A + B + C + D) === */}
      <div className="mt-12 border-t border-zinc-800 pt-12">
        <h2 className="text-2xl font-bold text-emerald-500 mb-6">Relatório Mensal Carteira Alpha</h2>
        <PortfolioMonthlyReport portfolioName="Alpha" />
      </div>
    </div>
  );
}
