import ReportPDF from '../ReportPDF';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { Portfolio } from '../../types';
import { analyzePortfolioForReport } from '../../services/gemini';

const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

export default function PortfolioMonthlyReport({ portfolioName = 'Alpha' }: { portfolioName?: string }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dados reais do backend (yahoo-finance2 continua no server.ts)
    fetch(`/api/portfolio/${portfolioName.toLowerCase()}`)
      .then(r => r.json())
      .then(async (data: Portfolio) => {
        setPortfolio(data);

        // Análise Gemini 100% frontend (resolve o erro de key)
        const geminiText = await analyzePortfolioForReport(data);
        setAnalysis(geminiText);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [portfolioName]);

  const exportExcel = () => {
    if (!portfolio) return;
    const ws = XLSX.utils.json_to_sheet(portfolio.assets);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Carteira_Alpha');
    XLSX.writeFile(wb, `Elitte_Carteira_Alpha_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  if (loading || !portfolio) {
    return <div className="text-emerald-400 text-center py-12">Carregando dados reais + análise Gemini...</div>;
  }

  const chartData = portfolio.assets.map((a, i) => ({
    name: a.symbol,
    value: a.allocation,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <ReportPDF title={`Relatório Mensal - ${portfolio.name}`} filename={`Relatorio-Mensal-${portfolio.name}`}>
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="bg-zinc-100 p-6 rounded-2xl">
          <p className="text-sm text-zinc-500">Valor Atual</p>
          <p className="text-4xl font-bold text-emerald-600">R$ {portfolio.value.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-zinc-100 p-6 rounded-2xl">
          <p className="text-sm text-zinc-500">Rentabilidade Mês</p>
          <p className="text-4xl font-bold text-emerald-600">+{portfolio.performanceMonth}%</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-6 text-center text-emerald-700">Alocação de Ativos (real-time)</h3>
        <div className="h-96 bg-white rounded-2xl p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={85} outerRadius={135} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Análise Gemini DINÂMICA (frontend) */}
      <div className="mt-8 text-sm text-zinc-600 border-t pt-6">
        <p className="font-semibold">Análise da IA (Gemini 2.0 Flash):</p>
        <p className="italic mt-3 leading-relaxed">{analysis}</p>
      </div>

      <button onClick={exportExcel} className="mt-10 w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl text-white font-medium">
        📊 Exportar Excel Completo da Carteira
      </button>

      <div className="mt-16 text-[10px] text-zinc-500 text-center border-t pt-6">
        <strong>Disclaimer:</strong> Este relatório não é recomendação de investimento. Consulte seu advisor. 
        Elitte Capital não se responsabiliza por decisões baseadas neste documento. 
        Gerado com dados reais da Yahoo Finance + Gemini.
      </div>
    </ReportPDF>
  );
}
