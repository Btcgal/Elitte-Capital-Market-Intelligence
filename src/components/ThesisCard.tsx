import { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Edit2, 
  Trash2, 
  Globe2, 
  User, 
  Building2, 
  Maximize2, 
  X, 
  FileText,
  Download,
  Copy,
  Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { InvestmentThesis } from '../types';

export function ThesisCard({ 
  thesis, 
  onEdit, 
  onDelete,
  showActions = false
}: { 
  thesis: Partial<InvestmentThesis> & { ticker: string; title?: string; name?: string; id?: string };
  onEdit?: (thesis: any) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [marketData, setMarketData] = useState<{ price: number; change: number; changePercent: number } | null>(null);
  const [isLoadingMarketData, setIsLoadingMarketData] = useState(false);

  useEffect(() => {
    const fetchMarketData = async () => {
      if (!thesis.ticker) return;
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

  const currentPrice = marketData?.price || thesis.currentPrice || 0;
  const currencySymbol = thesis.ticker?.includes('.') || thesis.ticker?.length > 5 ? 'R$' : 'US$';
  const targetPrice = thesis.targetPrice || 0;
  const entryPrice = thesis.entryPrice || 0;
  const exitPoint = thesis.exitPoint || 0;
  
  const targetPct = currentPrice > 0 ? ((targetPrice - currentPrice) / currentPrice) * 100 : 0;
  const entryDistance = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
  const hasDetailedAnalysis = thesis.macroAnalysis || thesis.fundamentalAnalysis || thesis.technicalAnalysis;

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGeneratingPdf(true);
    
    try {
      // @ts-ignore
      const module = await import('html2pdf.js');
      const html2pdf = (module.default || module) as any;

      const element = document.getElementById(`pdf-content-${thesis.id}`);
      if (!element) throw new Error('PDF content element not found');

      // Clone the element to avoid scroll/overflow issues with html2canvas
      const container = element.cloneNode(true) as HTMLElement;
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '210mm';
      container.style.zIndex = '-9999';
      container.style.backgroundColor = 'white';
      container.style.height = 'auto';
      container.style.overflow = 'visible';
      container.style.display = 'block'; // Ensure it's visible for cloning
      document.body.appendChild(container);

      // Wait for browser to paint the cloned element
      await new Promise(resolve => setTimeout(resolve, 100));

      const opt = {
        margin: [15, 15, 15, 15],
        filename: `Relatorio_Tese_${thesis.ticker}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 1024, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      if (typeof html2pdf !== 'function') {
        throw new Error('html2pdf library not loaded correctly');
      }

      await html2pdf().from(container).set(opt).save();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyData = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const textToCopy = `
Tese de Investimento: ${thesis.title || thesis.ticker}
Ticker: ${thesis.ticker}
Status: ${statusLabels[thesis.status || 'Active']}
Categoria: ${thesis.category || 'Equity'}

PREÇOS
Entrada: ${currencySymbol} ${entryPrice.toFixed(2)}
Stop Loss: ${currencySymbol} ${exitPoint.toFixed(2)}
Atual: ${currencySymbol} ${currentPrice.toFixed(2)}
Alvo: ${currencySymbol} ${targetPrice.toFixed(2)}

RESUMO
${thesis.description || ''}

${thesis.macroAnalysis ? `ANÁLISE MACROECONÔMICA\n${thesis.macroAnalysis}\n\n` : ''}
${thesis.fundamentalAnalysis ? `ANÁLISE FUNDAMENTALISTA\n${thesis.fundamentalAnalysis}\n\n` : ''}
${thesis.technicalAnalysis ? `ANÁLISE TÉCNICA\n${thesis.technicalAnalysis}\n\n` : ''}
    `.trim();

    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Erro ao copiar os dados.');
    }
  };

  const statusLabels: Record<string, string> = {
    Draft: "Rascunho",
    Active: "Ativo",
    Closed: "Encerrado",
    compra_gradual: "Compra Gradual",
    posicao_cheia: "Posição Cheia",
    venda_programada: "Venda Programada",
    encerrada: "Encerrada",
    aguardando_ponto: "Aguardando Ponto",
    venda: "Venda",
  };

  const statusColors: Record<string, string> = {
    Draft: "bg-[#fffbeb] text-[#b45309] border-[#fef3c7]",
    Active: "bg-[#ecfdf5] text-[#047857] border-[#d1fae5]",
    Closed: "bg-[#f8fafc] text-[#334155] border-[#f1f5f9]",
    compra_gradual: "bg-[rgba(26,26,26,0.1)] text-[#1a1a1a] border-[rgba(26,26,26,0.2)]",
    posicao_cheia: "bg-[rgba(46,101,74,0.1)] text-[#2e654a] border-[rgba(46,101,74,0.2)]",
    venda_programada: "bg-[rgba(140,123,101,0.15)] text-[#8c7b65] border-[rgba(140,123,101,0.2)]",
    encerrada: "bg-[#e5e5e5] text-[#737373] border-[rgba(115,115,115,0.2)]",
    aguardando_ponto: "bg-[rgba(249,115,22,0.1)] text-[#ea580c] border-[rgba(249,115,22,0.2)]",
    venda: "bg-[rgba(138,46,46,0.1)] text-[#8a2e2e] border-[rgba(138,46,46,0.2)]",
  };

  return (
    <>
      <div className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                thesis.category === 'Macro' ? "bg-[#eff6ff] text-[#1d4ed8] border-[#dbeafe]" :
                thesis.category === 'Equity' ? "bg-[#f0fdf4] text-[#15803d] border-[#dcfce7]" :
                thesis.category === 'Crypto' ? "bg-[#faf5ff] text-[#7e22ce] border-[#f3e8ff]" :
                "bg-[#f9fafb] text-[#374151] border-[#f3f4f6]"
              )}>
                {thesis.category || 'Equity'}
              </span>
              {thesis.source && (
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1",
                  thesis.source === 'Personal' ? "bg-[#eef2ff] text-[#4338ca] border-[#e0e7ff]" : "bg-[#fff7ed] text-[#c2410c] border-[#ffedd5]"
                )}>
                  {thesis.source === 'Personal' ? <User className="w-2.5 h-2.5" /> : <Building2 className="w-2.5 h-2.5" />}
                  {thesis.source}
                </span>
              )}
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", statusColors[thesis.status || 'Active'])}>
                {statusLabels[thesis.status || 'Active']}
              </span>
            </div>
            <h3 className="text-xl font-serif font-semibold text-primary mt-2">{thesis.title || thesis.ticker}</h3>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{thesis.ticker}</p>
          </div>
          
          <div className="flex gap-1">
            <button 
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="p-1.5 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded transition-colors"
              title="Gerar PDF"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
            {showActions && (
              <>
                <button 
                  onClick={() => onEdit?.(thesis)}
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDelete?.(thesis.id!)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Price grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-[rgba(245,242,237,0.3)] rounded-xl border border-[rgba(229,229,229,0.5)]">
          <div>
            <p className="text-[10px] text-[#737373] uppercase tracking-wider mb-1">Entrada</p>
            <p className="text-base font-serif font-medium text-[#1a1a1a]">{currencySymbol} {entryPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#737373] uppercase tracking-wider mb-1">Stop Loss</p>
            <p className="text-base font-serif font-medium text-[#8a2e2e]">{currencySymbol} {exitPoint.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#737373] uppercase tracking-wider mb-1">Atual</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-base font-serif font-medium text-[#1a1a1a]">
                {isLoadingMarketData ? (
                  <Loader2 className="w-3 h-3 animate-spin text-[#737373] inline" />
                ) : (
                  `${currencySymbol} ${currentPrice.toFixed(2)}`
                )}
              </p>
              {marketData && (
                <span className={cn(
                  "text-[10px] font-medium flex items-center",
                  marketData.change >= 0 ? "text-[#2e654a]" : "text-[#8a2e2e]"
                )}>
                  {marketData.change >= 0 ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                  {Math.abs(marketData.changePercent).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Alvo</p>
            <p className="text-base font-serif font-medium text-[#2e654a]">{currencySymbol} {targetPrice.toFixed(2)}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-[11px] font-medium">
            <span className={cn(entryPrice > 0 && currentPrice <= entryPrice ? "text-[#2e654a]" : "text-[#737373]")}>
              {entryPrice === 0 ? "Entrada não definida" : 
               currentPrice <= entryPrice ? "No ponto de entrada" : 
               `+${entryDistance.toFixed(1)}% do ponto`}
            </span>
            <span className="text-[#8c7b65]">+{targetPct.toFixed(1)}% potencial</span>
          </div>
        </div>

        {/* Thesis text */}
        <div className="flex-1">
          <p className="text-sm text-[#737373] leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
            {thesis.description || (thesis as any).thesis}
          </p>
        </div>

        {/* Expandable Analysis Section */}
        {hasDetailedAnalysis && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-accent transition-colors"
              >
                <Globe2 className="w-3.5 h-3.5" />
                Análise 360°
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setIsFullScreen(true)}
                className="p-1 text-muted-foreground hover:text-accent transition-colors"
                title="Expandir"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {isExpanded && (
              <div className="mt-4 space-y-6 prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-primary prose-a:text-accent prose-p:text-muted-foreground prose-li:text-muted-foreground">
                {thesis.macroAnalysis && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest border-b border-border pb-1 mb-2 text-accent">Análise Macroeconômica</h4>
                    <div className="text-xs leading-relaxed"><ReactMarkdown>{thesis.macroAnalysis}</ReactMarkdown></div>
                  </div>
                )}
                {thesis.fundamentalAnalysis && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest border-b border-border pb-1 mb-2 text-accent">Análise Fundamentalista</h4>
                    <div className="text-xs leading-relaxed"><ReactMarkdown>{thesis.fundamentalAnalysis}</ReactMarkdown></div>
                  </div>
                )}
                {thesis.technicalAnalysis && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest border-b border-border pb-1 mb-2 text-accent">Análise Técnica</h4>
                    <div className="text-xs leading-relaxed"><ReactMarkdown>{thesis.technicalAnalysis}</ReactMarkdown></div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#e5e5e5] flex justify-between items-center text-[10px] text-[#737373]">
          <span>Horizonte: {thesis.horizon || 'Médio'}</span>
          <span>Atualizado: {thesis.updatedAt ? new Date(thesis.updatedAt).toLocaleDateString('pt-BR') : '-'}</span>
        </div>
      </div>

      {/* Full Screen Modal */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/10">
              <div>
                <h2 className="text-2xl font-serif font-bold text-primary">{thesis.title || thesis.ticker}</h2>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{thesis.ticker} • Análise 360°</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleCopyData}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-xl text-sm font-medium hover:bg-secondary/80 transition-all"
                  title="Copiar dados da tese"
                >
                  {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? 'Copiado!' : 'Copiar'}
                </button>
                <button 
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-xl text-sm font-medium hover:bg-secondary/80 transition-all"
                >
                  {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  PDF
                </button>
                <button 
                  onClick={() => setIsFullScreen(false)}
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-12 select-text">
              <div className="max-w-4xl mx-auto space-y-12">
                {thesis.macroAnalysis && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <Globe2 className="w-6 h-6 text-accent" />
                      <h3 className="text-2xl font-serif font-bold text-primary">Análise Macroeconômica</h3>
                    </div>
                    <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed text-justify">
                      <ReactMarkdown>{thesis.macroAnalysis}</ReactMarkdown>
                    </div>
                  </section>
                )}
                
                {thesis.fundamentalAnalysis && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <Building2 className="w-6 h-6 text-accent" />
                      <h3 className="text-2xl font-serif font-bold text-primary">Análise Fundamentalista</h3>
                    </div>
                    <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed text-justify">
                      <ReactMarkdown>{thesis.fundamentalAnalysis}</ReactMarkdown>
                    </div>
                  </section>
                )}
                
                {thesis.technicalAnalysis && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUp className="w-6 h-6 text-accent" />
                      <h3 className="text-2xl font-serif font-bold text-primary">Análise Técnica</h3>
                    </div>
                    <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed text-justify">
                      <ReactMarkdown>{thesis.technicalAnalysis}</ReactMarkdown>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF Template */}
      <div className="absolute top-0 left-0 w-[210mm] z-[-9999] pointer-events-none">
        <div id={`pdf-content-${thesis.id}`} className="pdf-report bg-white font-sans text-[#1a1a1a] leading-relaxed">
          {/* Header */}
          <div className="flex justify-between items-start mb-12 border-b border-[#e5e5e5] pb-8">
            <div className="flex items-center gap-6">
              <div className="bg-[#1a1a1a] text-white p-4 rounded-xl flex flex-col items-center justify-center min-w-[80px]">
                <span className="font-serif text-2xl font-bold tracking-tighter">GO</span>
              </div>
              <div>
                <h1 className="font-serif text-4xl font-bold text-[#1a1a1a] leading-tight mb-1">Relatório de Análise</h1>
                <p className="text-[10px] font-bold text-[#8c7b65] uppercase tracking-[0.3em]">Institutional Equity Intelligence</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex flex-col items-end mb-4">
                <span className="font-serif text-2xl font-bold tracking-widest text-[#1a1a1a] leading-none">ELITTE</span>
                <span className="font-sans text-[8px] uppercase tracking-[0.3em] text-[#737373] mt-1">Capital · Private</span>
              </div>
              <p className="text-[10px] text-[#d1d5db] font-bold tracking-widest">Capital · Private</p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-8 mb-12">
            <div className="flex items-center gap-3 bg-[#f9fafb] px-4 py-2 rounded-lg border border-[#f3f4f6]">
              <span className="w-2 h-2 rounded-full bg-[#8c7b65]"></span>
              <span className="text-sm font-bold text-[#1a1a1a]">{thesis.ticker}</span>
            </div>
            <div className="flex items-center gap-3 bg-[#f9fafb] px-4 py-2 rounded-lg border border-[#f3f4f6]">
              <span className="w-2 h-2 rounded-full bg-[#8c7b65]"></span>
              <span className="text-sm font-bold text-[#1a1a1a]">TESE COMPLETA 360°</span>
            </div>
            <div className="flex items-center gap-3 bg-[#f9fafb] px-4 py-2 rounded-lg border border-[#f3f4f6]">
              <span className="w-2 h-2 rounded-full bg-[#8c7b65]"></span>
              <span className="text-sm font-bold text-[#1a1a1a]">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mb-12 text-[11px] text-[#737373] uppercase tracking-[0.2em] font-bold border-t border-[#f5f5f5] pt-8">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8c7b65]"></span>
              <span>Gerado por: Demo User</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8c7b65]"></span>
              <span>Hora: {new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8c7b65]"></span>
              <span>ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
            </div>
          </div>

          {/* Summary Section */}
          <div className="mb-12">
            <h2 className="font-serif text-2xl font-bold text-[#1a1a1a] mb-6 border-b border-[#e5e5e5] pb-2">Resumo da Tese</h2>
            <div className="bg-white p-8 rounded-2xl border border-[#e5e5e5] shadow-sm">
              <div className="flex gap-4 mb-6">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full border border-[#dcfce7] bg-[#f0fdf4] text-[#15803d] uppercase">{thesis.category || 'Equity'}</span>
                <span className="text-[10px] font-bold px-3 py-1 rounded-full border border-[#d1fae5] bg-[#ecfdf5] text-[#047857] uppercase">{thesis.status || 'Active'}</span>
              </div>
              <h3 className="text-3xl font-serif font-bold text-[#1a1a1a] mb-1">{thesis.title || thesis.ticker}</h3>
              <p className="text-sm font-mono text-[#737373] uppercase tracking-widest mb-8">{thesis.ticker}</p>
              
              <div className="grid grid-cols-4 gap-6 p-6 bg-[#f9fafb] rounded-xl border border-[#f3f4f6] mb-8">
                <div>
                  <p className="text-[10px] text-[#737373] uppercase tracking-wider mb-1">Entrada</p>
                  <p className="text-lg font-serif font-bold text-[#1a1a1a]">{currencySymbol} {entryPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#737373] uppercase tracking-wider mb-1">Stop Loss</p>
                  <p className="text-lg font-serif font-bold text-[#8a2e2e]">{currencySymbol} {exitPoint.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#737373] uppercase tracking-wider mb-1">Atual</p>
                  <p className="text-lg font-serif font-bold text-[#1a1a1a]">{currencySymbol} {currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#737373] uppercase tracking-wider mb-1">Alvo</p>
                  <p className="text-lg font-serif font-bold text-[#2e654a]">{currencySymbol} {targetPrice.toFixed(2)}</p>
                </div>
              </div>

              <p className="text-base text-[#4b5563] leading-relaxed text-justify">{thesis.description || ''}</p>
            </div>
          </div>

          {/* Analysis Sections */}
          {thesis.macroAnalysis && (
            <div className="mb-12 page-break-before avoid-break">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-[#f9fafb] rounded-full flex items-center justify-center border border-[#f3f4f6]">
                  <span className="text-[#8c7b65]">●</span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-[#1a1a1a]">Análise Macro</h2>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-[#e5e5e5] text-[#4b5563] text-justify leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown>{thesis.macroAnalysis}</ReactMarkdown>
              </div>
            </div>
          )}

          {thesis.fundamentalAnalysis && (
            <div className="mb-12 avoid-break">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-[#f9fafb] rounded-full flex items-center justify-center border border-[#f3f4f6]">
                  <span className="text-[#8c7b65]">■</span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-[#1a1a1a]">Análise Fundamentalista</h2>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-[#e5e5e5] text-[#4b5563] text-justify leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown>{thesis.fundamentalAnalysis}</ReactMarkdown>
              </div>
            </div>
          )}

          {thesis.technicalAnalysis && (
            <div className="mb-12 avoid-break">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-[#f9fafb] rounded-full flex items-center justify-center border border-[#f3f4f6]">
                  <span className="text-[#8c7b65]">▲</span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-[#1a1a1a]">Análise Técnica</h2>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-[#e5e5e5] text-[#4b5563] text-justify leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown>{thesis.technicalAnalysis}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-20 pt-10 border-t border-[#e5e5e5] text-[10px] text-[#737373] text-justify">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col items-center opacity-40">
                <span className="font-serif text-lg font-bold tracking-widest text-[#1a1a1a] leading-none">ELITTE</span>
                <span className="font-sans text-[6px] uppercase tracking-[0.3em] text-[#737373] mt-1">Capital · Private</span>
              </div>
              <div className="text-[10px] font-bold text-[#d1d5db] tracking-[0.2em]">{new Date().getFullYear()}</div>
            </div>
            <div className="bg-[#f9fafb] p-6 rounded-xl border border-[#f3f4f6]">
              <p className="font-bold text-[#1a1a1a] mb-3 uppercase tracking-widest text-[9px]">Disclaimer Legal</p>
              <p className="leading-relaxed opacity-80">
                Este material tem caráter meramente informativo e não deve ser considerado como recomendação de investimento, oferta de compra ou venda de qualquer ativo financeiro. 
                A Elitte Capital não se responsabiliza por decisões tomadas com base nestas informações. Rentabilidade passada não garante rentabilidade futura. 
                As informações contidas neste relatório foram obtidas de fontes consideradas confiáveis, mas sua precisão e completude não são garantidas. 
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
