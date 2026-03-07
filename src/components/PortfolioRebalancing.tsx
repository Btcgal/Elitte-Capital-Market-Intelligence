import { useState, useMemo } from 'react';
import { Asset } from '../services/gemini';
import { TrendingUp, Plus, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PortfolioRebalancingProps {
  portfolio: Asset[];
  riskProfile: string;
  initialContribution?: number;
  onContributionChange?: (value: number) => void;
}

// Target allocations based on risk profile
const TARGET_ALLOCATIONS: Record<string, Record<string, number>> = {
  'Conservador': {
    'Renda Fixa': 80,
    'FII': 10,
    'Ação': 5,
    'Internacional': 5,
  },
  'Moderado': {
    'Renda Fixa': 50,
    'FII': 20,
    'Ação': 20,
    'Internacional': 10,
  },
  'Agressivo': {
    'Renda Fixa': 20,
    'FII': 20,
    'Ação': 40,
    'Internacional': 20,
  },
};

// Map asset types to allocation classes
const mapAssetTypeToClass = (type: string): string => {
  const t = type.toLowerCase();
  if (t.includes('renda') || t.includes('fixa')) return 'Renda Fixa';
  if (t.includes('fii') || t.includes('imobili')) return 'FII';
  if (t.includes('acao') || t.includes('ação') || t.includes('stock')) return 'Ação';
  if (t.includes('internacional') || t.includes('exterior') || t.includes('bdr')) return 'Internacional';
  return 'Outro';
};

export function PortfolioRebalancing({ portfolio, riskProfile, initialContribution = 0, onContributionChange }: PortfolioRebalancingProps) {
  const [newContribution, setNewContribution] = useState<number>(initialContribution);
  const [allowSells, setAllowSells] = useState<boolean>(true);

  const handleContributionChange = (val: number) => {
    setNewContribution(val);
    onContributionChange?.(val);
  };

  const targetAllocation = TARGET_ALLOCATIONS[riskProfile] || TARGET_ALLOCATIONS['Moderado'];

  // Calculate current state
  const { currentTotal, currentAllocation } = useMemo(() => {
    let total = 0;
    const alloc: Record<string, number> = {};
    
    portfolio.forEach(asset => {
      const value = asset.quantity * (asset.currentPrice || asset.averagePrice);
      total += value;
      const assetClass = mapAssetTypeToClass(asset.type);
      alloc[assetClass] = (alloc[assetClass] || 0) + value;
    });

    return { currentTotal: total, currentAllocation: alloc };
  }, [portfolio]);

  const targetTotal = currentTotal + newContribution;

  // Calculate rebalancing actions
  const rebalancingPlan = useMemo(() => {
    const plan: { assetClass: string; currentPct: number; targetPct: number; currentVal: number; targetVal: number; diff: number; action: 'buy' | 'sell' | 'hold' }[] = [];
    
    // Get all unique classes from current and target
    const allClasses = new Set([...Object.keys(currentAllocation), ...Object.keys(targetAllocation)]);

    let remainingContribution = newContribution;

    allClasses.forEach(assetClass => {
      const currentVal = currentAllocation[assetClass] || 0;
      const currentPct = currentTotal > 0 ? (currentVal / currentTotal) * 100 : 0;
      const targetPct = targetAllocation[assetClass] || 0;
      const targetVal = targetTotal * (targetPct / 100);
      
      let diff = targetVal - currentVal;
      let action: 'buy' | 'sell' | 'hold' = 'hold';

      if (!allowSells && diff < 0) {
        // If sells are not allowed, we can't reduce this position.
        // It will remain overweight.
        diff = 0;
      }

      if (diff > 10) { // Threshold to avoid micro-transactions
        action = 'buy';
      } else if (diff < -10) {
        action = 'sell';
      }

      plan.push({
        assetClass,
        currentPct,
        targetPct,
        currentVal,
        targetVal,
        diff,
        action
      });
    });

    // If sells are not allowed, we need to recalculate to just distribute the new contribution
    // proportionally to the most underweight assets.
    if (!allowSells) {
      if (newContribution > 0) {
        const underweight = plan.filter(p => p.targetVal > p.currentVal);
        const totalUnderweightDiff = underweight.reduce((sum, p) => sum + (p.targetVal - p.currentVal), 0);
        
        plan.forEach(p => {
          if (p.targetVal > p.currentVal && totalUnderweightDiff > 0) {
            const share = (p.targetVal - p.currentVal) / totalUnderweightDiff;
            p.diff = newContribution * share;
            p.action = p.diff > 10 ? 'buy' : 'hold';
          } else {
            p.diff = 0;
            p.action = 'hold';
          }
        });
      } else {
        // No new contribution and no sells allowed = no action possible
        plan.forEach(p => {
          p.diff = 0;
          p.action = 'hold';
        });
      }
    }

    return plan.sort((a, b) => b.targetPct - a.targetPct);
  }, [currentAllocation, currentTotal, targetAllocation, targetTotal, newContribution, allowSells]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const chartData = useMemo(() => {
    return rebalancingPlan.map(row => ({
      name: row.assetClass,
      'Atual (%)': Number(row.currentPct.toFixed(1)),
      'Alvo (%)': Number(row.targetPct.toFixed(1)),
      diff: row.diff,
      action: row.action
    }));
  }, [rebalancingPlan]);

  if (portfolio.length === 0) {
    return (
      <div className="bg-white border border-border rounded-2xl p-12 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-xl font-serif font-medium text-primary mb-2">Carteira Vazia</h3>
        <p className="text-muted-foreground">Faça o upload dos extratos para habilitar o rebalanceamento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Novo Aporte (R$)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
            <input 
              type="number" 
              min="0"
              step="1000"
              value={newContribution || ''}
              onChange={(e) => handleContributionChange(Number(e.target.value))}
              placeholder="0,00"
              className="w-full pl-12 pr-4 py-3 bg-secondary/50 border border-border rounded-xl text-lg font-medium text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 w-full flex items-center h-[52px] px-4 bg-secondary/30 border border-border rounded-xl">
          <label className="flex items-center cursor-pointer w-full justify-between">
            <span className="text-sm font-medium text-primary">Permitir Vendas (Rebalanceamento Total)</span>
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={allowSells}
                onChange={(e) => setAllowSells(e.target.checked)}
              />
              <div className={cn("block w-10 h-6 rounded-full transition-colors", allowSells ? "bg-accent" : "bg-border")}></div>
              <div className={cn("dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform", allowSells ? "transform translate-x-4" : "")}></div>
            </div>
          </label>
        </div>
      </div>

      {/* Visual Feedback Chart */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
        <h3 className="text-xl font-serif font-semibold text-primary mb-6">Alocação Atual vs. Alvo</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} tickFormatter={(val) => `${val}%`} />
              <Tooltip 
                cursor={{ fill: '#f5f2ed' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Atual (%)" fill="#8c7b65" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Alvo (%)" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rebalancing Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-secondary/30 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-serif font-semibold text-primary">Plano de Ação</h3>
            <p className="text-sm text-muted-foreground mt-1">Perfil Alvo: <strong className="text-primary">{riskProfile}</strong></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Patrimônio Projetado</p>
            <p className="text-2xl font-serif font-semibold text-primary">{formatCurrency(targetTotal)}</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase tracking-wider bg-secondary/50">
              <tr>
                <th className="px-6 py-4 font-medium">Classe de Ativo</th>
                <th className="px-6 py-4 font-medium text-right">Atual</th>
                <th className="px-6 py-4 font-medium text-right">Alvo</th>
                <th className="px-6 py-4 font-medium text-right">Ação Sugerida</th>
                <th className="px-6 py-4 font-medium text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rebalancingPlan.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={cn(
                    "transition-colors",
                    row.action === 'buy' ? "bg-success/5 hover:bg-success/10" : 
                    row.action === 'sell' ? "bg-destructive/5 hover:bg-destructive/10" : 
                    "hover:bg-secondary/30"
                  )}
                >
                  <td className="px-6 py-5 font-medium text-primary flex items-center">
                    <div className={cn(
                      "w-2 h-2 rounded-full mr-3",
                      row.action === 'buy' ? "bg-success" : 
                      row.action === 'sell' ? "bg-destructive" : "bg-muted-foreground"
                    )} />
                    {row.assetClass}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="text-primary">{row.currentPct.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(row.currentVal)}</div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="text-primary font-medium">{row.targetPct.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(row.targetVal)}</div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {row.action === 'buy' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                        <Plus className="w-3 h-3 mr-1" /> Comprar
                      </span>
                    )}
                    {row.action === 'sell' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                        <TrendingUp className="w-3 h-3 mr-1 rotate-180" /> Vender
                      </span>
                    )}
                    {row.action === 'hold' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border">
                        Manter
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right font-medium">
                    <span className={cn(
                      row.action === 'buy' ? "text-success" : 
                      row.action === 'sell' ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {row.action === 'sell' ? '-' : row.action === 'buy' ? '+' : ''}
                      {formatCurrency(Math.abs(row.diff))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-secondary p-6 rounded-2xl border border-border flex items-start space-x-4">
        <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-primary mb-1">Nota de Execução</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Este plano de rebalanceamento é baseado no Asset Allocation estratégico para o perfil <strong>{riskProfile}</strong>. 
            Recomenda-se revisar a liquidez dos ativos antes de executar ordens de venda. Para aportes novos, a prioridade é sempre alocar nos ativos mais descontados em relação ao alvo.
          </p>
        </div>
      </div>
    </div>
  );
}
