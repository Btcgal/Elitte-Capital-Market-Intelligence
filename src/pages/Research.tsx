import { useState, useEffect } from 'react';
import { Search, FileText, Loader2, BarChart3, ShieldAlert, Target, Globe2, AlertTriangle, Mail, Send, Download, PlusCircle, UserPlus, X } from 'lucide-react';
import { generateResearchReport, generateThesisData, ThesisStructuredData } from '../services/gemini';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { ThesisCard } from '../components/ThesisCard';
import { useClients } from '../context/ClientContext';
import { useTheses } from '../context/ThesisContext';
import { useNavigate } from 'react-router-dom';
import { InvestmentThesis } from '../types';
import remarkGfm from 'remark-gfm';
import { Logo } from '../components/Logo';

const frameworks = [
  { id: 0, title: 'Tese Completa 360°', icon: Globe2, desc: 'Análise Macro, Fundamentalista e Técnica com Preço Alvo e Pontos de Entrada/Saída.' },
  { id: 1, title: 'Institutional Equity Intelligence', icon: Target, desc: 'Business foundation, core metrics, equity performance, analyst sentiment.' },
  { id: 2, title: 'Financial Statement Forensic Audit', icon: FileText, desc: 'Income statement, balance sheet, cash flow, risk/strength indicators.' },
  { id: 3, title: 'Earnings Intelligence Decoder', icon: BarChart3, desc: 'Reported results, forward outlook, segment performance, market reaction.' },
  { id: 4, title: 'Competitive Sector Matrix', icon: ShieldAlert, desc: 'Quantitative comparison, competitive positioning, risk assessment.' },
];

export default function Research() {
  const [ticker, setTicker] = useState('');
  const [activeFramework, setActiveFramework] = useState(() => {
    const saved = localStorage.getItem('activeFramework');
    return saved ? parseInt(saved) : 0;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [thesisData, setThesisData] = useState<ThesisStructuredData | null>(null);
  
  const { clients, addClient } = useClients();
  const { addThesis } = useTheses();
  const navigate = useNavigate();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', riskProfile: 'Moderado' });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [generationTime, setGenerationTime] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('activeFramework', activeFramework.toString());
  }, [activeFramework]);

  useEffect(() => {
    fetch('/api/search-history?userId=demo-user')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSearchHistory(data);
        }
      })
      .catch(err => console.error('Failed to fetch search history', err));
  }, []);

  const handleSaveToTheses = () => {
    if (!thesisData && !report) return;

    const categoryMap: Record<string, InvestmentThesis['category']> = {
      'acao': 'Equity',
      'fii': 'Alternative',
      'internacional': 'Equity',
      'renda_fixa': 'Fixed Income',
      'cripto': 'Crypto',
      'outro': 'Alternative'
    };

    let newThesis: Omit<InvestmentThesis, 'id' | 'createdAt' | 'updatedAt'>;

    if (thesisData) {
      newThesis = {
        title: `${thesisData.name} (${thesisData.ticker})`,
        ticker: thesisData.ticker,
        description: thesisData.thesisSummary,
        category: (categoryMap[thesisData.type] || 'Equity') as InvestmentThesis['category'],
        conviction: 'Medium',
        status: 'Active',
        targetPrice: thesisData.targetPrice,
        entryPrice: thesisData.entryPoint,
        exitPoint: thesisData.exitPoint,
        currentPrice: thesisData.currentPrice,
        horizon: 'Medium',
        tags: [thesisData.type, thesisData.currency],
        macroAnalysis: thesisData.macroAnalysis,
        fundamentalAnalysis: thesisData.fundamentalAnalysis,
        technicalAnalysis: thesisData.technicalAnalysis,
        gradualBuys: thesisData.gradualBuys
      };
    } else {
      newThesis = {
        title: `Análise: ${ticker}`,
        ticker: ticker,
        description: report.substring(0, 500) + '...',
        category: 'Equity',
        conviction: 'Medium',
        status: 'Active',
        horizon: 'Medium',
        tags: ['Report', frameworks[activeFramework].title],
        fundamentalAnalysis: report,
      };
    }

    addThesis(newThesis);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
    
    if (confirm('Tese salva com sucesso! Deseja ir para a página de Teses de Investimento?')) {
      navigate('/theses');
    }
  };

  const handleQuickAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.email) return;

    const client = {
      id: Math.random().toString(36).substr(2, 9),
      ...newClient,
      aum: 0,
    };

    addClient(client);
    setSelectedClientId(client.id);
    setIsClientModalOpen(false);
    setNewClient({ name: '', email: '', phone: '', riskProfile: 'Moderado' });
  };

  const handleDownloadPdf = async () => {
    if (!report && !thesisData) return;
    setIsGeneratingPdf(true);

    const element = document.getElementById('research-report-content');
    if (!element) return;

    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `Relatorio_Research_${ticker}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 1.0 },
      html2canvas: { 
        scale: 3, 
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        windowWidth: 1200
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // @ts-ignore
      const module = await import('html2pdf.js');
      const html2pdf = module.default || module;
      
      if (typeof html2pdf !== 'function') {
        throw new Error('html2pdf library not loaded correctly');
      }

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerate = async () => {
    if (!ticker) return;
    setIsLoading(true);
    setReport('');
    setError(null);
    setThesisData(null);
    setEmailStatus('idle');

    // Save search history
    try {
      await fetch('/api/search-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'demo-user', 
          query: `${ticker} - ${frameworks[activeFramework].title}` 
        })
      });
      // Refresh history
      const res = await fetch('/api/search-history?userId=demo-user');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSearchHistory(data);
      }
    } catch (e) {
      console.error('Failed to save search history', e);
    }

    try {
      if (activeFramework === 0) {
        const result = await generateThesisData(ticker);
        if (result) {
          setThesisData(result);
          setGenerationTime(new Date().toLocaleTimeString());
        } else {
          setError('Erro ao gerar a tese 360. Verifique o ticker e tente novamente.');
        }
      } else {
        const result = await generateResearchReport(ticker, activeFramework as 1|2|3|4);
        setReport(result);
        setGenerationTime(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Limite de requisições') || err.message?.includes('429') || err.message?.includes('quota')) {
        setError('Limite de requisições da IA excedido. Por favor, aguarde um momento e tente novamente.');
      } else {
        setError('Erro ao gerar o relatório. Verifique o ticker e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedClientId) return;
    
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    setIsSendingEmail(true);
    setEmailStatus('idle');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: client.email,
          subject: `Relatório de Research: ${ticker} - ${frameworks.find(f => f.id === activeFramework)?.title}`,
          content: thesisData ? JSON.stringify(thesisData, null, 2) : report,
          type: thesisData ? 'thesis' : 'report',
          clientId: client.id,
          title: `Relatório: ${ticker}`,
          description: `Enviado via Research - Framework: ${frameworks[activeFramework].title}`
        }),
      });

      if (response.ok) {
        setEmailStatus('success');
        setTimeout(() => setEmailStatus('idle'), 3000);
      } else {
        setEmailStatus('error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailStatus('error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-end border-b border-border pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">Research & Teses</h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.2em]">Gere relatórios institucionais profundos com IA e dados em tempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6 flex flex-col h-full overflow-hidden">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex-shrink-0">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Ativo / Ticker</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Ex: AAPL, PETR4" 
                className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent uppercase transition-all"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col flex-shrink-0 max-h-[400px]">
            <div className="p-5 border-b border-border bg-secondary/30">
              <h3 className="text-sm font-semibold text-primary tracking-wide">Framework de Análise</h3>
            </div>
            <div className="p-3 space-y-2 overflow-y-auto flex-1">
              {frameworks.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setActiveFramework(fw.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl transition-colors flex items-start border",
                    activeFramework === fw.id 
                      ? "bg-secondary border-border" 
                      : "hover:bg-secondary/50 border-transparent"
                  )}
                >
                  <fw.icon className={cn("w-5 h-5 mt-0.5 mr-3 flex-shrink-0", activeFramework === fw.id ? "text-accent" : "text-muted-foreground")} />
                  <div>
                    <h4 className={cn("text-sm font-medium", activeFramework === fw.id ? "text-primary" : "text-muted-foreground")}>
                      {fw.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{fw.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-5 border-t border-border bg-white space-y-3">
              <button 
                onClick={handleGenerate}
                disabled={isLoading || !ticker}
                className="w-full flex items-center justify-center px-5 py-3 bg-primary text-secondary rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  'Gerar Relatório'
                )}
              </button>
            </div>
          </div>

          {/* Search History */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="p-5 border-b border-border bg-secondary/30">
              <h3 className="text-sm font-semibold text-primary tracking-wide">Histórico de Buscas</h3>
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-2 max-h-[300px]">
              {searchHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-30">
                  <Search className="w-8 h-8 mb-2" />
                  <p className="text-[10px] uppercase tracking-widest">Nenhuma busca recente</p>
                </div>
              ) : (
                searchHistory.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => setTicker(item.query.split(' - ')[0])}
                    className="w-full text-left p-3 rounded-xl bg-secondary/20 border border-border/50 hover:bg-secondary/40 transition-colors group"
                  >
                    <p className="font-medium text-primary truncate group-hover:text-accent transition-colors">{item.query}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : ''} • {item.created_at ? new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Report Output */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border bg-secondary/30 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-primary flex items-center tracking-wide">
              <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
              Resultado da Análise
            </h3>
            
            <div className="flex items-center space-x-3">
              {(report || thesisData) && (
                <>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="h-9 px-3 rounded-lg text-sm font-medium bg-secondary text-primary hover:bg-secondary/80 border border-border flex items-center transition-all disabled:opacity-50"
                    title="Baixar PDF"
                  >
                    {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleSaveToTheses}
                    className={cn(
                      "h-9 px-3 rounded-lg text-sm font-medium border flex items-center transition-all",
                      saveStatus === 'success' 
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-secondary text-primary hover:bg-secondary/80 border-border"
                    )}
                    title="Salvar em Teses de Investimento"
                  >
                    {saveStatus === 'success' ? <PlusCircle className="w-4 h-4 mr-1" /> : <PlusCircle className="w-4 h-4" />}
                    {saveStatus === 'success' && <span>Salvo!</span>}
                  </button>

                  <button
                    onClick={() => setIsClientModalOpen(true)}
                    className="h-9 px-3 rounded-lg text-sm font-medium bg-secondary text-primary hover:bg-secondary/80 border border-border flex items-center transition-all"
                    title="Adicionar Novo Cliente"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="h-9 rounded-lg border border-border bg-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Selecione um cliente...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={handleSendEmail}
                      disabled={!selectedClientId || isSendingEmail || emailStatus === 'success'}
                      className={cn(
                        "h-9 px-4 rounded-lg text-sm font-medium flex items-center transition-all",
                        emailStatus === 'success' 
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : emailStatus === 'error'
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isSendingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : emailStatus === 'success' ? (
                        <>Enviado!</>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar
                        </>
                      )}
                    </button>
                  </div>

                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary text-primary border border-border">
                    {ticker}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="p-8 md:p-12 overflow-y-auto flex-1 bg-white print-mode" id="research-report-content">
            {/* Header */}
            {(report || thesisData) && (
              <div className="mb-12 border-b-2 border-[#1a1a1a] pb-8 pdf-header">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-white font-serif text-xl font-bold">
                        {ticker.substring(0, 2)}
                      </div>
                      <div>
                        <h1 className="text-3xl font-serif font-bold text-[#1a1a1a] tracking-tight leading-none">Relatório de Análise</h1>
                        <p className="text-xs text-[#737373] mt-1 font-medium uppercase tracking-[0.2em]">Institutional Equity Intelligence</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[10px] text-[#737373] uppercase tracking-wider font-bold">
                      <div className="flex items-center gap-1.5 bg-[#f5f2ed] px-2 py-1 rounded text-[#1a1a1a] border border-[#e5e5e5]">
                        <Target className="w-3 h-3" />
                        <span>{ticker}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Globe2 className="w-3 h-3" />
                        <span>{frameworks.find(f => f.id === activeFramework)?.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />
                        <span>{new Date().toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-6 text-[9px] text-[#a3a3a3] uppercase tracking-[0.15em] font-semibold border-t border-[#f5f5f5] pt-4">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                        <span>Gerado por: Demo User</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                        <span>Hora da Emissão: {generationTime || new Date().toLocaleTimeString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                        <span>ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right pl-8 flex flex-col items-end">
                    <Logo size="lg" />
                    <div className="mt-2 text-[10px] font-serif italic text-[#8c7b65]">Capital · Private</div>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <p className="text-sm tracking-wide">Coletando dados do Google Search e processando com Gemini 3.1 Pro...</p>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-destructive space-y-4 p-8 text-center min-h-[400px]">
                <AlertTriangle className="w-12 h-12 opacity-50" />
                <p className="font-medium">{error}</p>
              </div>
            ) : thesisData ? (
              <div className="space-y-12 max-w-4xl mx-auto">
                <div className="avoid-break">
                  <h2 className="text-2xl font-serif font-bold text-[#1a1a1a] mb-6 border-b border-[#e5e5e5] pb-2">Resumo da Tese</h2>
                  <ThesisCard thesis={{
                    ...thesisData, 
                    id: 'temp', 
                    thesis: thesisData.thesisSummary,
                    macroAnalysis: undefined,
                    fundamentalAnalysis: undefined,
                    technicalAnalysis: undefined
                  }} />
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                  <div className="p-8 bg-[#f9fafb] rounded-2xl border border-[#e5e5e5] avoid-break">
                    <div className="flex items-center gap-3 mb-4">
                      <Globe2 className="w-5 h-5 text-[#8c7b65]" />
                      <h4 className="font-serif text-xl font-bold text-[#1a1a1a]">Análise Macro</h4>
                    </div>
                    <div className="prose prose-sm max-w-none text-[#4b5563] leading-relaxed text-justify">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{thesisData.macroAnalysis}</ReactMarkdown>
                    </div>
                  </div>

                  <div className="p-8 bg-[#f9fafb] rounded-2xl border border-[#e5e5e5] avoid-break">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-5 h-5 text-[#8c7b65]" />
                      <h4 className="font-serif text-xl font-bold text-[#1a1a1a]">Análise Fundamentalista</h4>
                    </div>
                    <div className="prose prose-sm max-w-none text-[#4b5563] leading-relaxed text-justify">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{thesisData.fundamentalAnalysis}</ReactMarkdown>
                    </div>
                  </div>

                  <div className="p-8 bg-[#f9fafb] rounded-2xl border border-[#e5e5e5] avoid-break">
                    <div className="flex items-center gap-3 mb-4">
                      <BarChart3 className="w-5 h-5 text-[#8c7b65]" />
                      <h4 className="font-serif text-xl font-bold text-[#1a1a1a]">Análise Técnica</h4>
                    </div>
                    <div className="prose prose-sm max-w-none text-[#4b5563] leading-relaxed text-justify">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{thesisData.technicalAnalysis}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ) : report ? (
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-[#1a1a1a] prose-a:text-[#8c7b65] prose-p:text-[#4b5563] prose-li:text-[#4b5563] prose-strong:text-[#1a1a1a] prose-table:border-collapse prose-th:bg-[#f3f4f6] prose-th:text-[#1a1a1a] prose-th:p-4 prose-td:p-4 prose-td:border-b prose-td:border-[#e5e5e5] prose-img:rounded-xl prose-hr:border-[#e5e5e5]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 min-h-[400px]">
                <Target className="w-16 h-16 mb-6 opacity-20" />
                <p className="text-lg tracking-wide font-light">Selecione um ticker e um framework para gerar a tese de investimento.</p>
              </div>
            )}

            {/* Footer */}
            {(report || thesisData) && (
              <div className="mt-16 pt-8 border-t border-[#e5e5e5] text-xs text-[#9ca3af] text-justify page-break">
                <div className="flex items-center justify-between mb-4">
                  <Logo size="sm" variant="default" className="opacity-50" />
                  <span className="text-[#d1d5db]">{new Date().getFullYear()}</span>
                </div>
                <p className="font-bold text-[#1a1a1a] mb-2">Disclaimer</p>
                <p className="leading-relaxed">Este material tem caráter meramente informativo e não deve ser considerado como recomendação de investimento. A Elitte Capital não se responsabiliza por decisões tomadas com base nestas informações. Rentabilidade passada não garante rentabilidade futura. As informações contidas neste relatório foram obtidas de fontes consideradas confiáveis, mas sua precisão e completude não são garantidas. Este relatório é destinado exclusivamente para clientes da Elitte Capital e não pode ser reproduzido ou distribuído sem autorização prévia.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Quick Add Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif font-semibold text-primary">Novo Cliente</h2>
              <button onClick={() => setIsClientModalOpen(false)} className="text-muted-foreground hover:text-primary">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleQuickAddClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2 border border-border rounded-lg"
                  value={newClient.name}
                  onChange={e => setNewClient({...newClient, name: e.target.value})}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">E-mail</label>
                <input 
                  type="email" 
                  required
                  className="w-full p-2 border border-border rounded-lg"
                  value={newClient.email}
                  onChange={e => setNewClient({...newClient, email: e.target.value})}
                  placeholder="Ex: joao@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Telefone</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-border rounded-lg"
                  value={newClient.phone}
                  onChange={e => setNewClient({...newClient, phone: e.target.value})}
                  placeholder="Ex: +55 11 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Perfil de Risco</label>
                <select 
                  className="w-full p-2 border border-border rounded-lg"
                  value={newClient.riskProfile}
                  onChange={e => setNewClient({...newClient, riskProfile: e.target.value})}
                >
                  <option value="Conservador">Conservador</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Agressivo">Agressivo</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-primary text-secondary rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
