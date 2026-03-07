import { Newspaper, ChevronRight, ExternalLink } from 'lucide-react';

const allNews = [
  { id: 1, source: 'Bloomberg', time: 'Há 30 min', title: 'Fed sinaliza cautela com inflação persistente antes do próximo FOMC.', category: 'Global', url: '#' },
  { id: 2, source: 'Valor Econômico', time: 'Há 1 hora', title: 'Campos Neto reforça compromisso com meta fiscal em evento em SP.', category: 'Brasil', url: '#' },
  { id: 3, source: 'Reuters', time: 'Há 2 horas', title: 'Petróleo avança com tensões no Oriente Médio e cortes da OPEP+.', category: 'Commodities', url: '#' },
  { id: 4, source: 'Financial Times', time: 'Há 3 horas', title: 'BCE mantém taxas de juros inalteradas, mas aponta para possíveis cortes.', category: 'Global', url: '#' },
  { id: 5, source: 'Exame', time: 'Há 4 horas', title: 'Ibovespa opera em alta puxado por commodities e exterior favorável.', category: 'Brasil', url: '#' },
  { id: 6, source: 'InfoMoney', time: 'Há 5 horas', title: 'Dólar fecha em queda com otimismo sobre fluxo estrangeiro.', category: 'Câmbio', url: '#' },
  { id: 7, source: 'CNBC', time: 'Há 6 horas', title: 'Tech stocks rally as AI optimism continues to drive market sentiment.', category: 'Tech', url: '#' },
  { id: 8, source: 'O Globo', time: 'Há 7 horas', title: 'Governo anuncia novas medidas para estímulo ao crédito imobiliário.', category: 'Brasil', url: '#' },
];

export default function News() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">Radar de Notícias</h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.2em]">Acompanhe os principais destaques do mercado financeiro</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allNews.map((news) => (
          <div key={news.id} className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-center mb-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-primary border border-border">
                {news.category}
              </span>
              <span className="text-xs text-muted-foreground">{news.time}</span>
            </div>
            
            <h3 className="text-lg font-medium text-primary mb-3 group-hover:text-accent transition-colors">
              {news.title}
            </h3>
            
            <div className="flex justify-between items-center mt-auto pt-4 border-t border-border/50">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{news.source}</span>
              <a href={news.url} className="text-primary hover:text-accent transition-colors p-2">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
