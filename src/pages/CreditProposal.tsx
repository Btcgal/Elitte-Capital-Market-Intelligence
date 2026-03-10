import { useState, useEffect, useRef } from 'react';
import { 
  Calculator, 
  FileText, 
  Download, 
  TrendingUp, 
  ArrowRightLeft, 
  Landmark, 
  Percent,
  Calendar,
  User,
  Building2,
  Printer,
  Share2,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { generateStandardPDF } from '../lib/pdfUtils';
import { ReportTemplate } from '../components/ReportTemplate';

// Rates from EFG Presentation (Page 14)
const LOAN_RATES = {
  CHF: { '1m': 0.95, '1y': 1.00, '2y': 1.07, '3y': 1.17, '4y': 1.29, '5y': 1.40 },
  EUR: { '1m': 2.92, '1y': 3.08, '2y': 3.38, '3y': 3.54, '4y': 3.70, '5y': 3.86 },
  USD: { '1m': 4.67, '1y': 4.60, '2y': 4.69, '3y': 4.87, '4y': 4.98, '5y': 5.10 }
};

const PORTFOLIO_YIELD = 6.0; // 6% p.a. base profitability
const LTV = 0.95; // 95% LTV

export default function CreditProposal() {
  // Inputs
  const [clientName, setClientName] = useState('');
  const [clientProfile, setClientProfile] = useState('Moderado');
  const [proposalDate, setProposalDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [initialInvestmentBRL, setInitialInvestmentBRL] = useState(5000000);
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'CHF'>('CHF');
  const [term, setTerm] = useState<'1m' | '1y' | '2y' | '3y' | '4y' | '5y'>('1y');
  
  // Rates & Costs
  const [selicRate, setSelicRate] = useState(15.0);
  const [portfolioYield, setPortfolioYield] = useState(6.0);
  const [structuringCostRate, setStructuringCostRate] = useState(1.0);
  
  // FX Costs
  const [iofOutbound, setIofOutbound] = useState(1.1);
  const [spreadOutbound, setSpreadOutbound] = useState(1.5);
  const [iofInbound, setIofInbound] = useState(0.38);
  const [spreadInbound, setSpreadInbound] = useState(1.5);

  // Market Data
  const [exchangeRate, setExchangeRate] = useState(0);
  const [loadingRates, setLoadingRates] = useState(false);

  // View State
  const [showProposal, setShowProposal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchRates = async () => {
      setLoadingRates(true);
      try {
        // Fetch Exchange Rate via new dedicated endpoint
        const fxRes = await fetch(`/api/exchange-rate?currency=${currency}`);
        if (!fxRes.ok) throw new Error('Failed to fetch FX');
        
        const fxData = await fxRes.json();
        if (fxData.price) {
          setExchangeRate(fxData.price);
        }

        // Fetch Selic (Reuse logic or fetch fresh)
        const selicRes = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        const selicData = await selicRes.json();
        if (selicData[0]) setSelicRate(parseFloat(selicData[0].valor));

      } catch (e) {
        console.error("Error fetching rates", e);
        // Fallbacks (Updated to approx. market rates as of late 2025/early 2026)
        if (currency === 'USD') setExchangeRate(5.75);
        if (currency === 'EUR') setExchangeRate(6.05);
        if (currency === 'CHF') setExchangeRate(6.35);
      } finally {
        setLoadingRates(false);
      }
    };
    fetchRates();
  }, [currency]);

  // Calculations
  const loanRate = LOAN_RATES[currency][term] || 0;
  
  // 1. Outbound (BRL -> FX)
  // Effective Exchange Rate for Buying FX (Spot + Spread)
  const exchangeRateOut = exchangeRate * (1 + spreadOutbound/100);
  // Net BRL after IOF
  const netBRLOut = initialInvestmentBRL * (1 - iofOutbound/100);
  // Principal in FX (Portfolio Value)
  const principalFX = exchangeRateOut > 0 ? netBRLOut / exchangeRateOut : 0;

  // 2. Offshore Investment & Loan
  const offshoreYieldFX = principalFX * (portfolioYield / 100);
  const loanAmountFX = principalFX * LTV;
  const loanInterestFX = loanAmountFX * (loanRate / 100);
  const structuringCostFX = loanAmountFX * (structuringCostRate / 100);

  // 3. Inbound (FX -> BRL)
  // Effective Exchange Rate for Selling FX (Spot - Spread)
  const exchangeRateIn = exchangeRate * (1 - spreadInbound/100);
  // Gross BRL from Loan
  const grossBRLIn = loanAmountFX * exchangeRateIn;
  // Net Capital In BRL after IOF
  const capitalInBRL = grossBRLIn * (1 - iofInbound/100);

  // 4. Onshore Investment
  const onshoreYieldBRL = capitalInBRL * (selicRate / 100);

  // 5. Consolidated Result (Annual)
  // Net Offshore Flow in FX
  const netOffshoreFlowFX = offshoreYieldFX - loanInterestFX - structuringCostFX;
  // Convert Net Offshore Flow to BRL (at inbound rate for conservative estimation)
  const netOffshoreFlowBRL = netOffshoreFlowFX * exchangeRateIn;
  
  const totalAnnualReturnBRL = onshoreYieldBRL + netOffshoreFlowBRL;
  const totalAnnualReturnPct = initialInvestmentBRL > 0 ? (totalAnnualReturnBRL / initialInvestmentBRL) * 100 : 0;

  // Formatting Helpers
  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatFX = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency }).format(val);
  const formatPct = (val: number) => val.toFixed(2) + '%';

  // Projection Data (5 Years)
  const projectionData = Array.from({ length: 6 }, (_, i) => {
    const year = i;
    const accumulatedReturn = totalAnnualReturnBRL * year;
    const totalWealth = initialInvestmentBRL + accumulatedReturn;
    return {
      year: `Ano ${year}`,
      'Patrimônio Total': totalWealth,
      'Apenas Selic': initialInvestmentBRL * Math.pow(1 + selicRate/100, year),
      'Apenas Offshore': initialInvestmentBRL * Math.pow(1 + portfolioYield/100, year)
    };
  });

  const handlePrint = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateStandardPDF(
        'pdf-export-credit',
        `Proposta_Credito_${clientName.replace(/\s+/g, '_') || 'Cliente'}.pdf`
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Verifique sua conexão.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (showProposal) {
    return (
      <div className="min-h-screen bg-white text-black p-8 print:p-0">
        {/* Print Controls */}
        <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
          <button 
            onClick={() => setShowProposal(false)}
            className="flex items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" /> Voltar para Editor
          </button>
          <div className="flex space-x-4">
            <button 
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
              {isGeneratingPdf ? 'Gerando PDF...' : 'Imprimir / Salvar PDF'}
            </button>
          </div>
        </div>

        {/* Proposal Content */}
        <div id="proposal-content" className="max-w-4xl mx-auto border border-gray-200 shadow-2xl p-12 rounded-none print:shadow-none print:border-none print:p-0 bg-white relative overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-start mb-16 border-b border-gray-100 pb-8">
            <div>
              <h1 className="text-4xl font-serif font-bold text-gray-900 tracking-tight mb-2">Proposta de Crédito Estruturado</h1>
              <p className="text-sm text-gray-500 uppercase tracking-[0.2em]">Lombard Loan & Carry Trade Strategy</p>
            </div>
            <div className="text-right">
              <div className="font-serif text-2xl font-bold text-gray-900 tracking-widest">ELITTE</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Capital · Private</div>
            </div>
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Cliente</h3>
              <div className="space-y-2">
                <div className="flex items-center text-gray-900">
                  <User className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium">{clientName || 'Nome do Cliente'}</span>
                </div>
                <div className="flex items-center text-gray-900">
                  <Building2 className="w-4 h-4 mr-3 text-gray-400" />
                  <span>Perfil: {clientProfile}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Detalhes da Proposta</h3>
              <div className="space-y-2">
                <div className="flex items-center text-gray-900">
                  <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                  <span>{new Date(proposalDate).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center text-gray-900">
                  <Landmark className="w-4 h-4 mr-3 text-gray-400" />
                  <span>Banco EFG International</span>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-gray-50 p-8 rounded-xl mb-12 border border-gray-100">
            <h3 className="text-lg font-serif font-semibold text-gray-900 mb-6">Estrutura da Operação</h3>
            <div className="grid grid-cols-4 gap-8">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Aporte Inicial (BRL)</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatBRL(initialInvestmentBRL)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Câmbio Efetivo (Ida)</p>
                <p className="text-xl font-bold text-gray-900 flex items-center">
                   {exchangeRateOut.toFixed(4)} <span className="text-xs font-normal text-gray-400 ml-2">({currency})</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Portfólio Offshore</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatFX(principalFX)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Capital Onshore (Volta)</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatBRL(capitalInBRL)}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">LTV: {(LTV * 100).toFixed(0)}% do Portfólio</p>
              </div>
            </div>
          </div>

          {/* The Strategy Visual */}
          <div className="mb-12">
            <h3 className="text-lg font-serif font-semibold text-gray-900 mb-6">Mecânica da Arbitragem (Carry Trade)</h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900">Fluxo de Operação</h4>
                    <p className="text-xs text-gray-500">Passo a passo da estruturação do capital</p>
                  </div>
                  <div className="px-3 py-1 bg-gray-900 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Estratégia Elitte
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 relative">
                  {/* Step 1 */}
                  <div className="relative z-10">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">01. Alocação</div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Portfólio Offshore</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">Investimento em ativos globais com yield alvo de {portfolioYield}% a.a.</p>
                  </div>
                  {/* Step 2 */}
                  <div className="relative z-10">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">02. Crédito</div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Lombard Loan</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">Linha de crédito de {(LTV * 100).toFixed(0)}% (LTV) sobre o portfólio como garantia.</p>
                  </div>
                  {/* Step 3 */}
                  <div className="relative z-10">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">03. Arbitragem</div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Carry Trade</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">Retorno do capital ao Brasil para aproveitar o diferencial de juros (Selic).</p>
                  </div>
                  {/* Step 4 */}
                  <div className="relative z-10">
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">04. Resultado</div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Alpha Gerado</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">Spread entre o rendimento total e o custo da dívida estruturada.</p>
                  </div>

                  {/* Connecting Line */}
                  <div className="absolute top-12 left-0 w-full h-px bg-gray-200 -z-0"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="border border-gray-100 rounded-xl p-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Eficiência de Custo</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Custo do Crédito ({currency})</span>
                      <span className="text-sm font-bold text-red-500">{(loanRate || 0).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Custo Estruturação</span>
                      <span className="text-sm font-bold text-red-500">{structuringCostRate.toFixed(2)}%</span>
                    </div>
                    <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Custo Total Efetivo</span>
                      <span className="text-sm font-bold text-red-600">{(loanRate + structuringCostRate).toFixed(2)}% a.a.</span>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-100 rounded-xl p-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Diferencial de Juros</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Rendimento Selic (BRL)</span>
                      <span className="text-sm font-bold text-green-600">{selicRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Rendimento Portfólio</span>
                      <span className="text-sm font-bold text-green-600">{portfolioYield.toFixed(2)}%</span>
                    </div>
                    <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Potencial de Arbitragem</span>
                      <span className="text-sm font-bold text-green-600">{(selicRate + portfolioYield - (loanRate + structuringCostRate)).toFixed(2)}% a.a.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="mb-12">
            <h3 className="text-lg font-serif font-semibold text-gray-900 mb-6">Projeção de Retorno (12 Meses)</h3>
            <div className="overflow-hidden border border-gray-100 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4 text-left">Componente</th>
                    <th className="px-6 py-4 text-right">Valor Inicial</th>
                    <th className="px-6 py-4 text-right">Taxa A.A.</th>
                    <th className="px-6 py-4 text-right">Valor Projetado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Rendimento Portfólio ({currency})</td>
                    <td className="px-6 py-4 text-right text-gray-400 font-mono text-xs">{formatFX(principalFX)}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{portfolioYield.toFixed(2)}%</td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">
                      + {formatFX(offshoreYieldFX)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Juros do Empréstimo ({currency})</td>
                    <td className="px-6 py-4 text-right text-gray-400 font-mono text-xs">{formatFX(loanAmountFX)}</td>
                    <td className="px-6 py-4 text-right text-red-500">-{(loanRate || 0).toFixed(2)}%</td>
                    <td className="px-6 py-4 text-right font-medium text-red-500">
                      - {formatFX(loanInterestFX)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Custo de Estruturação ({currency})</td>
                    <td className="px-6 py-4 text-right text-gray-400 font-mono text-xs">{formatFX(loanAmountFX)}</td>
                    <td className="px-6 py-4 text-right text-red-500">-{structuringCostRate.toFixed(2)}%</td>
                    <td className="px-6 py-4 text-right font-medium text-red-500">
                      - {formatFX(structuringCostFX)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">Fluxo Líquido Offshore</td>
                    <td className="px-6 py-4 text-right text-gray-400 font-mono text-xs">-</td>
                    <td className="px-6 py-4 text-right text-gray-500">{(portfolioYield - (loanRate || 0) - structuringCostRate).toFixed(2)}%</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      = {formatFX(netOffshoreFlowFX)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium text-gray-900">Rendimento Onshore (Selic)</td>
                    <td className="px-6 py-4 text-right text-gray-400 font-mono text-xs">{formatBRL(capitalInBRL)}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{(selicRate || 0).toFixed(2)}%</td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">
                      + {formatBRL(onshoreYieldBRL)}
                    </td>
                  </tr>
                  <tr className="bg-gray-900 text-white">
                    <td className="px-6 py-4 font-bold" colSpan={2}>Retorno Total Consolidado (Est. BRL)</td>
                    <td className="px-6 py-4 text-right font-bold">{(totalAnnualReturnPct || 0).toFixed(2)}%</td>
                    <td className="px-6 py-4 text-right font-bold">
                      {formatBRL(totalAnnualReturnBRL)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 italic">
              * O retorno consolidado em BRL assume a conversão do resultado offshore pela taxa de câmbio atual. Variações cambiais podem impactar o resultado final.
            </p>
          </div>

          {/* Consolidated Summary Box */}
          <div className="bg-gray-900 text-white p-8 rounded-2xl mb-12 shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-serif font-bold mb-2">Resumo da Estratégia</h3>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Retorno Projetado vs Benchmark</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-green-400">+{ (totalAnnualReturnPct - selicRate).toFixed(2) }%</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Alpha vs Selic</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8 mt-8 pt-8 border-t border-white/10">
              <div>
                <p className="text-[10px] text-gray-400 uppercase mb-1">Ganho Nominal Anual</p>
                <p className="text-2xl font-bold">{formatBRL(totalAnnualReturnBRL)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase mb-1">Retorno Total (%)</p>
                <p className="text-2xl font-bold">{totalAnnualReturnPct.toFixed(2)}% a.a.</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase mb-1">Custo Efetivo da Dívida</p>
                <p className="text-2xl font-bold text-red-400">{(loanRate + structuringCostRate).toFixed(2)}% a.a.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 pt-8 mt-16 flex justify-between items-end">
            <div className="text-xs text-gray-400 max-w-md">
              <p className="mb-2">Aviso Legal:</p>
              <p>Esta simulação tem caráter meramente informativo e não constitui oferta de crédito ou recomendação de investimento. As taxas estão sujeitas a alteração de mercado. A operação envolve riscos de mercado, crédito e liquidez.</p>
            </div>
            <div className="text-right">
              <p className="font-serif font-bold text-gray-900">Elitte Capital</p>
              <p className="text-xs text-gray-500">Wealth Management</p>
            </div>
          </div>
        </div>

        {/* Hidden PDF Template */}
        <ReportTemplate 
          id="pdf-export-credit" 
          title="Proposta de Crédito Estruturado"
          subtitle="Lombard Loan & Carry Trade Strategy"
        >
          <div className="space-y-8">
            {/* Client Info */}
            <div className="grid grid-cols-2 gap-12 mb-8 avoid-break">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Cliente</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-900">
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="font-medium">{clientName || 'Nome do Cliente'}</span>
                  </div>
                  <div className="flex items-center text-gray-900">
                    <Building2 className="w-4 h-4 mr-3 text-gray-400" />
                    <span>Perfil: {clientProfile}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Detalhes da Proposta</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-900">
                    <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                    <span>{new Date(proposalDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center text-gray-900">
                    <Landmark className="w-4 h-4 mr-3 text-gray-400" />
                    <span>Banco EFG International</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 avoid-break">
              <h3 className="text-lg font-serif font-semibold text-gray-900 mb-6">Estrutura da Operação</h3>
              <div className="grid grid-cols-4 gap-8">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Aporte Inicial (BRL)</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatBRL(initialInvestmentBRL)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Câmbio Efetivo (Ida)</p>
                  <p className="text-xl font-bold text-gray-900 flex items-center">
                     {exchangeRateOut.toFixed(4)} <span className="text-xs font-normal text-gray-400 ml-2">({currency})</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Portfólio Offshore</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatFX(principalFX)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Capital Onshore (Volta)</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatBRL(capitalInBRL)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">LTV: {(LTV * 100).toFixed(0)}% do Portfólio</p>
                </div>
              </div>
            </div>

            {/* Financials */}
            <div className="avoid-break">
              <h3 className="text-lg font-serif font-semibold text-gray-900 mb-6">Projeção de Retorno (12 Meses)</h3>
              <div className="overflow-hidden border border-gray-100 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4 text-left">Componente</th>
                      <th className="px-6 py-4 text-right">Valor Inicial</th>
                      <th className="px-6 py-4 text-right">Taxa A.A.</th>
                      <th className="px-6 py-4 text-right">Valor Projetado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Rendimento Portfólio ({currency})</td>
                      <td className="px-6 py-4 text-right text-gray-400 font-mono text-xs">{formatFX(principalFX)}</td>
                      <td className="px-6 py-4 text-right text-gray-500">{portfolioYield.toFixed(2)}%</td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">
                        + {formatFX(offshoreYieldFX)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Juros do Empréstimo ({currency})</td>
                      <td className="px-6 py-4 text-right text-gray-400 font-mono text-xs">{formatFX(loanAmountFX)}</td>
                      <td className="px-6 py-4 text-right text-red-500">-{(loanRate || 0).toFixed(2)}%</td>
                      <td className="px-6 py-4 text-right font-medium text-red-500">
                        - {formatFX(loanInterestFX)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Custo de Estruturação ({currency})</td>
                      <td className="px-6 py-4 text-right text-gray-400 font-mono text-xs">{formatFX(loanAmountFX)}</td>
                      <td className="px-6 py-4 text-right text-red-500">-{structuringCostRate.toFixed(2)}%</td>
                      <td className="px-6 py-4 text-right font-medium text-red-500">
                        - {formatFX(structuringCostFX)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-gray-900">Fluxo Líquido Offshore</td>
                      <td className="px-6 py-4 text-right text-gray-400 font-mono text-xs">-</td>
                      <td className="px-6 py-4 text-right text-gray-500">{(portfolioYield - (loanRate || 0) - structuringCostRate).toFixed(2)}%</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        = {formatFX(netOffshoreFlowFX)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 font-medium text-gray-900">Rendimento Onshore (Selic)</td>
                      <td className="px-6 py-4 text-right text-gray-400 font-mono text-xs">{formatBRL(capitalInBRL)}</td>
                      <td className="px-6 py-4 text-right text-gray-500">{(selicRate || 0).toFixed(2)}%</td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">
                        + {formatBRL(onshoreYieldBRL)}
                      </td>
                    </tr>
                    <tr className="bg-gray-900 text-white">
                      <td className="px-6 py-4 font-bold" colSpan={2}>Retorno Total Consolidado (Est. BRL)</td>
                      <td className="px-6 py-4 text-right font-bold">{(totalAnnualReturnPct || 0).toFixed(2)}%</td>
                      <td className="px-6 py-4 text-right font-bold">
                        {formatBRL(totalAnnualReturnBRL)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Consolidated Summary Box */}
            <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-xl avoid-break">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-serif font-bold mb-2">Resumo da Estratégia</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Retorno Projetado vs Benchmark</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-green-400">+{ (totalAnnualReturnPct - selicRate).toFixed(2) }%</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Alpha vs Selic</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-8 mt-8 pt-8 border-t border-white/10">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Ganho Nominal Anual</p>
                  <p className="text-2xl font-bold">{formatBRL(totalAnnualReturnBRL)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Retorno Total (%)</p>
                  <p className="text-2xl font-bold">{totalAnnualReturnPct.toFixed(2)}% a.a.</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Custo Efetivo da Dívida</p>
                  <p className="text-2xl font-bold text-red-400">{(loanRate + structuringCostRate).toFixed(2)}% a.a.</p>
                </div>
              </div>
            </div>
          </div>
        </ReportTemplate>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">Crédito Estruturado</h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.2em]">Lombard Loans & Alavancagem Inteligente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
            <h3 className="text-lg font-serif font-semibold text-primary mb-6 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Parâmetros
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Cliente</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Nome do Cliente"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Aporte Inicial (BRL)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    value={initialInvestmentBRL.toLocaleString('pt-BR')}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setInitialInvestmentBRL(Number(val));
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">IOF Envio (%)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    value={iofOutbound}
                    onChange={(e) => setIofOutbound(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Spread Envio (%)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    value={spreadOutbound}
                    onChange={(e) => setSpreadOutbound(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">IOF Volta (%)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    value={iofInbound}
                    onChange={(e) => setIofInbound(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Spread Volta (%)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    value={spreadInbound}
                    onChange={(e) => setSpreadInbound(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Yield Offshore (%)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    value={portfolioYield}
                    onChange={(e) => setPortfolioYield(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Selic (%)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    value={selicRate}
                    onChange={(e) => setSelicRate(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Custo Estruturação (%)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  value={structuringCostRate}
                  onChange={(e) => setStructuringCostRate(Number(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Moeda</label>
                  <select 
                    className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                  >
                    <option value="USD">USD (Dólar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="CHF">CHF (Franco)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Prazo</label>
                  <select 
                    className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    value={term}
                    onChange={(e) => setTerm(e.target.value as any)}
                  >
                    <option value="1m">1 Mês</option>
                    <option value="1y">1 Ano</option>
                    <option value="2y">2 Anos</option>
                    <option value="3y">3 Anos</option>
                    <option value="4y">4 Anos</option>
                    <option value="5y">5 Anos</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Taxa de Câmbio</span>
                  <span className="font-medium text-primary">
                    {loadingRates ? <Loader2 className="w-3 h-3 animate-spin" /> : (exchangeRate || 0).toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Taxa Selic</span>
                  <span className="font-medium text-primary">{(selicRate || 0).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Custo do Crédito ({currency})</span>
                  <span className="font-medium text-destructive">{(loanRate || 0).toFixed(2)}%</span>
                </div>
              </div>

              <button 
                onClick={() => setShowProposal(true)}
                className="w-full mt-4 py-3 bg-primary text-secondary rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center shadow-sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Gerar Proposta PDF
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-secondary/30 p-6 rounded-2xl border border-border shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Retorno Total Estimado</p>
              <p className="text-3xl font-serif font-semibold text-primary">{(totalAnnualReturnPct || 0).toFixed(2)}%</p>
              <p className="text-xs text-success mt-1 font-medium">+{(totalAnnualReturnPct - selicRate || 0).toFixed(2)}% vs Selic</p>
            </div>
            <div className="bg-secondary/30 p-6 rounded-2xl border border-border shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Spread da Operação</p>
              <p className="text-3xl font-serif font-semibold text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalAnnualReturnBRL)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Ganho Anual Projetado</p>
            </div>
            <div className="bg-secondary/30 p-6 rounded-2xl border border-border shadow-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Alavancagem</p>
              <p className="text-3xl font-serif font-semibold text-primary">{(LTV * 100).toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground mt-1">LTV Utilizado</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm h-96">
            <h3 className="text-lg font-serif font-semibold text-primary mb-6">Projeção de Patrimônio (5 Anos)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} tickFormatter={(val) => `R$ ${(val/1000000).toFixed(1)}M`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="Patrimônio Total" stroke="#1a1a1a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Estratégia Lombard" />
                <Line type="monotone" dataKey="Apenas Selic" stroke="#8c7b65" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Benchmark Selic" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
