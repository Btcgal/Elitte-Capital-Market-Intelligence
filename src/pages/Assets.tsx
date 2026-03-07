import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2, Filter, Search, ArrowUpRight, Plus, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { cn } from '../lib/utils';

interface AssetData {
  ticker: string;
  name: string;
  category: 'dividendos' | 'ganho_capital' | 'buy_hold';
  sector: string;
  targetPrice: number;
  dividendYield?: number;
  thesis?: string;
}

const initialAssets: AssetData[] = [
  { ticker: 'BBAS3', name: 'Banco do Brasil', category: 'dividendos', sector: 'Financeiro', targetPrice: 35.00, dividendYield: 10.5, thesis: 'Banco com forte geração de caixa e payout elevado. Valuation descontado em relação aos pares privados.' },
  { ticker: 'VALE3', name: 'Vale S.A.', category: 'dividendos', sector: 'Materiais Básicos', targetPrice: 85.00, dividendYield: 8.2, thesis: 'Líder global em minério de ferro de alta qualidade. Forte geração de caixa livre e retorno aos acionistas via dividendos e recompras.' },
  { ticker: 'TAEE11', name: 'Taesa', category: 'dividendos', sector: 'Utilidade Pública', targetPrice: 42.00, dividendYield: 9.1, thesis: 'Receita previsível e corrigida pela inflação (IGP-M/IPCA). Excelente histórico de pagamento de dividendos.' },
  { ticker: 'MGLU3', name: 'Magazine Luiza', category: 'ganho_capital', sector: 'Varejo', targetPrice: 3.50, thesis: 'Aposta na recuperação do consumo doméstico e queda da taxa de juros. Forte presença no e-commerce.' },
  { ticker: 'WEGE3', name: 'WEG S.A.', category: 'ganho_capital', sector: 'Bens Industriais', targetPrice: 45.00, thesis: 'Empresa de alta qualidade com exposição global e crescimento consistente. Beneficiária da transição energética.' },
  { ticker: 'PRIO3', name: 'PetroRio', category: 'ganho_capital', sector: 'Petróleo e Gás', targetPrice: 60.00, thesis: 'Foco em revitalização de campos maduros com baixo custo de extração (lifting cost). Potencial de crescimento inorgânico.' },
  { ticker: 'ITUB4', name: 'Itaú Unibanco', category: 'buy_hold', sector: 'Financeiro', targetPrice: 40.00, dividendYield: 5.5, thesis: 'Melhor banco da América Latina, com gestão conservadora e alta rentabilidade (ROE). Digitalização avançada.' },
  { ticker: 'EGIE3', name: 'Engie Brasil', category: 'buy_hold', sector: 'Utilidade Pública', targetPrice: 50.00, dividendYield: 6.8, thesis: 'Maior geradora privada de energia do Brasil. Diversificação para transmissão e gasodutos. Perfil defensivo.' },
  { ticker: 'RADL3', name: 'Raia Drogasil', category: 'buy_hold', sector: 'Saúde', targetPrice: 32.00, dividendYield: 1.2, thesis: 'Líder absoluta no varejo farmacêutico. Execução impecável e ganho de market share consistente.' },
];

function AssetRow({ asset }: { asset: AssetData }) {
  const [marketData, setMarketData] = useState<{ price: number; change: number; changePercent: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/market-data?ticker=${asset.ticker}`);
        if (res.ok) {
          const json = await res.json();
          setMarketData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [asset.ticker]);

  const currentPrice = marketData?.price || 0;
  const upside = currentPrice > 0 ? ((asset.targetPrice - currentPrice) / currentPrice) * 100 : 0;

  return (
    <>
      <tr className={cn("hover:bg-secondary/30 transition-colors group cursor-pointer", isOpen && "bg-secondary/30")} onClick={() => setIsOpen(!isOpen)}>
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-primary mr-4 font-serif font-bold text-xs">
              {asset.ticker.substring(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-primary">{asset.ticker}</p>
              <p className="text-xs text-muted-foreground">{asset.name}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
            asset.category === 'dividendos' && "bg-blue-50 text-blue-700 border-blue-200",
            asset.category === 'ganho_capital' && "bg-purple-50 text-purple-700 border-purple-200",
            asset.category === 'buy_hold' && "bg-green-50 text-green-700 border-green-200"
          )}>
            {asset.category === 'dividendos' ? 'Dividendos' : 
             asset.category === 'ganho_capital' ? 'Ganho de Capital' : 'Buy & Hold'}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-muted-foreground">{asset.sector}</td>
        <td className="px-6 py-4 text-right">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-auto" />
          ) : (
            <div>
              <p className="font-medium text-primary">R$ {currentPrice.toFixed(2)}</p>
              {marketData && (
                <p className={cn("text-xs font-medium flex items-center justify-end mt-0.5", marketData.change >= 0 ? "text-success" : "text-destructive")}>
                  {marketData.change >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {marketData.change > 0 ? '+' : ''}{(marketData.change || 0).toFixed(2)} ({Math.abs(marketData.changePercent || 0).toFixed(2)}%)
                </p>
              )}
            </div>
          )}
        </td>
        <td className="px-6 py-4 text-right">
          <p className="font-medium text-primary">R$ {asset.targetPrice.toFixed(2)}</p>
          {!loading && currentPrice > 0 && (
            <p className={cn("text-xs font-medium", upside >= 0 ? "text-success" : "text-destructive")}>
              {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
            </p>
          )}
        </td>
        <td className="px-6 py-4 text-right">
          {asset.dividendYield ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
              {asset.dividendYield.toFixed(1)}% a.a.
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </td>
        <td className="px-6 py-4 text-right">
          <button className="p-2 text-muted-foreground hover:text-accent transition-colors">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-secondary/10">
          <td colSpan={7} className="px-6 py-4">
            <div className="p-4 bg-white rounded-xl border border-border shadow-sm">
              <h4 className="text-sm font-semibold text-primary mb-2 flex items-center">
                <ArrowUpRight className="w-4 h-4 mr-2 text-accent" />
                Tese de Investimento & Fundamentos
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {asset.thesis || "Nenhuma tese cadastrada para este ativo."}
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Assets() {
  const [activeTab, setActiveTab] = useState<'dividendos' | 'ganho_capital' | 'buy_hold'>('dividendos');
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState<AssetData[]>(initialAssets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<AssetData>>({ category: 'dividendos' });

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (searchTerm) return matchesSearch;
    return asset.category === activeTab;
  });

  const handleAddAsset = () => {
    if (newAsset.ticker && newAsset.name && newAsset.targetPrice) {
      setAssets([...assets, newAsset as AssetData]);
      setIsModalOpen(false);
      setNewAsset({ category: activeTab });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">Ativos & Oportunidades</h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.2em]">Monitoramento de teses por estratégia</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-primary text-secondary rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Ativo
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex space-x-2 bg-secondary/50 p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('dividendos')}
            className={cn(
              "px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === 'dividendos' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
            )}
          >
            Dividendos
          </button>
          <button
            onClick={() => setActiveTab('ganho_capital')}
            className={cn(
              "px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === 'ganho_capital' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
            )}
          >
            Ganho de Capital
          </button>
          <button
            onClick={() => setActiveTab('buy_hold')}
            className={cn(
              "px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === 'buy_hold' ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-primary"
            )}
          >
            Buy & Hold
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar ativo..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Ativo</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Setor</th>
                <th className="px-6 py-4 font-medium text-right">Preço Atual</th>
                <th className="px-6 py-4 font-medium text-right">Preço Alvo</th>
                <th className="px-6 py-4 font-medium text-right">Dividend Yield</th>
                <th className="px-6 py-4 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAssets.map(asset => (
                <AssetRow key={asset.ticker} asset={asset} />
              ))}
              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    Nenhum ativo encontrado para esta estratégia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-serif font-semibold text-primary mb-6">Adicionar Novo Ativo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Ticker</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-border rounded-lg uppercase"
                  value={newAsset.ticker || ''}
                  onChange={e => setNewAsset({...newAsset, ticker: e.target.value.toUpperCase()})}
                  placeholder="Ex: PETR4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Nome da Empresa</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-border rounded-lg"
                  value={newAsset.name || ''}
                  onChange={e => setNewAsset({...newAsset, name: e.target.value})}
                  placeholder="Ex: Petrobras"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Setor</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-border rounded-lg"
                    value={newAsset.sector || ''}
                    onChange={e => setNewAsset({...newAsset, sector: e.target.value})}
                    placeholder="Ex: Petróleo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Categoria</label>
                  <select 
                    className="w-full p-2 border border-border rounded-lg"
                    value={newAsset.category}
                    onChange={e => setNewAsset({...newAsset, category: e.target.value as any})}
                  >
                    <option value="dividendos">Dividendos</option>
                    <option value="ganho_capital">Ganho de Capital</option>
                    <option value="buy_hold">Buy & Hold</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Preço Alvo (R$)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border border-border rounded-lg"
                    value={newAsset.targetPrice || ''}
                    onChange={e => setNewAsset({...newAsset, targetPrice: parseFloat(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">DY Estimado (%)</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border border-border rounded-lg"
                    value={newAsset.dividendYield || ''}
                    onChange={e => setNewAsset({...newAsset, dividendYield: parseFloat(e.target.value)})}
                    placeholder="0.0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Tese de Investimento</label>
                <textarea 
                  className="w-full p-2 border border-border rounded-lg h-24 resize-none"
                  value={newAsset.thesis || ''}
                  onChange={e => setNewAsset({...newAsset, thesis: e.target.value})}
                  placeholder="Descreva os fundamentos..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-8">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-muted-foreground hover:text-primary transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddAsset}
                className="px-6 py-2 bg-primary text-secondary rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Ativo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
