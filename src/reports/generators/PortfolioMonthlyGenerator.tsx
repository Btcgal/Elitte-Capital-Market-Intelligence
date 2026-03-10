import ReportPDF from '../ReportPDF';
import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Portfolio } from '../../types';

const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

const MOCK_ASSETS = [
  { ticker: 'PETR4', allocation: 25 },
  { ticker: 'VALE3', allocation: 20 },
  { ticker: 'ITUB4', allocation: 18 },
  { ticker: 'WEGE3', allocation: 15 },
  { ticker: 'CAIXA', allocation: 22 },
];

export default function PortfolioMonthlyReport({ portfolio }: { portfolio: Portfolio }) {
  const performance = 12.45; // mock (próxima etapa: yahoo-finance2 real)

  const chartData = useMemo(() => {
    const assets = portfolio.assets?.length ? portfolio.assets : MOCK_ASSETS;
    return assets.map((asset, index) => ({
      name: asset.ticker,
      value: asset.allocation,
      fill: COLORS[index % COLORS.length],
    }));
  }, [portfolio.assets]);

  return (
    <ReportPDF
      title={`Relatório Mensal - ${portfolio.name}`}
      filename={`Relatorio-Mensal-${portfolio.name}-${format(new Date(), 'dd-MM-yyyy')}`}
    >
      <h2 className="text-3xl font-bold text-center mb-8 text-emerald-600">
        Carteira {portfolio.name}
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="bg-zinc-100 p-6 rounded-2xl">
          <p className="text-sm text-zinc-500">Valor Atual da Carteira</p>
          <p className="text-4xl font-bold text-emerald-600">
            R$ {portfolio.value.toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="bg-zinc-100 p-6 rounded-2xl">
          <p className="text-sm text-zinc-500">Rentabilidade no Mês</p>
          <p className="text-4xl font-bold text-emerald-600">+{performance}%</p>
        </div>
      </div>

      {/* Gráfico de Alocação - Recharts PieChart */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-6 text-center text-emerald-700">
          Alocação de Ativos
        </h3>
        <div className="h-96 bg-white rounded-2xl p-4 shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={85}
                outerRadius={135}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, 'Alocação']} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Análise IA (placeholder para Gemini dinâmico) */}
      <div className="mt-8 text-sm text-zinc-600 border-t pt-6">
        <p className="font-semibold">Análise da IA (Gemini):</p>
        <p className="italic mt-2">
          "Carteira equilibrada. Recomendação: Manter PETR4 e VALE3. Considerar +3% em WEGE3 no próximo rebalance."
        </p>
      </div>

      {/* DISCLAIMER OBRIGATÓRIO */}
      <div className="mt-16 pt-8 border-t-2 border-zinc-300 text-[10px] text-zinc-500 text-center">
        <strong>Disclaimer:</strong> Este relatório não é recomendação de investimento. 
        Consulte seu advisor. Elitte Capital não se responsabiliza por decisões baseadas neste documento.
        <br />
        Gerado automaticamente em {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} • Confidencial
      </div>
    </ReportPDF>
  );
}
