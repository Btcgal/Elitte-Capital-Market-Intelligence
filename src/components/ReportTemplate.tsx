import React from 'react';

interface ReportTemplateProps {
  id: string;
  title: string;
  subtitle?: string;
  ticker?: string;
  children: React.ReactNode;
}

export function ReportTemplate({ id, title, subtitle, ticker, children }: ReportTemplateProps) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('pt-BR');
  const timeStr = today.toLocaleTimeString('pt-BR');
  const reportId = Math.random().toString(36).substring(2, 10).toUpperCase();

  return (
    <div className="hidden">
      {/* CORREÇÃO: Removido flexbox e min-h. Largura fixa em 800px */}
      <div id={id} className="bg-white text-[#1a1a1a] p-10 font-sans" style={{ width: '800px', boxSizing: 'border-box' }}>
        
        {/* CABEÇALHO INSTITUCIONAL */}
        <div className="flex justify-between items-center mb-8 border-b border-[#e5e5e5] pb-8 avoid-break">
          <div className="flex items-center gap-6">
            {ticker && (
              <div className="bg-[#1a1a1a] text-white w-16 h-16 rounded-xl flex flex-col items-center justify-center flex-shrink-0 shadow-md">
                <span className="font-serif text-2xl font-bold tracking-tighter">
                  {ticker.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="font-serif text-4xl font-bold text-[#1a1a1a] leading-tight mb-1">{title}</h1>
              {subtitle && (
                <p className="text-[10px] font-bold text-[#8c7b65] uppercase tracking-[0.3em] m-0">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <span className="font-serif text-4xl font-bold tracking-widest text-[#1a1a1a] leading-none">
              ELITTE
            </span>
            <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-[#737373] mt-1">
              Capital · Private
            </span>
          </div>
        </div>

        {/* BARRA DE METADADOS */}
        <div className="grid grid-cols-4 gap-4 mb-10 text-[9px] text-[#737373] uppercase tracking-[0.2em] font-bold bg-[#f9fafb] p-4 rounded-xl border border-[#f3f4f6] avoid-break">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8c7b65]"></span>
            <span>Data: {dateStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8c7b65]"></span>
            <span>Hora: {timeStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8c7b65]"></span>
            <span>Gerado por: Equipa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8c7b65]"></span>
            <span>Ref: {reportId}</span>
          </div>
        </div>

        {/* CONTEÚDO DO RELATÓRIO */}
        <div className="text-[#1a1a1a]">
          {children}
        </div>

        {/* RODAPÉ E DISCLAIMER NECTON / CVM */}
        <div className="mt-16 pt-8 border-t border-[#e5e5e5] text-center w-full avoid-break">
          <div className="flex justify-center items-center space-x-8 mb-4">
            <div className="flex flex-col items-center">
              <span className="font-serif text-2xl font-semibold tracking-widest text-[#1a1a1a] leading-none">ELITTE</span>
              <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-[#737373] mt-1">Capital · Private</span>
            </div>
            <span className="text-[#e5e5e5] h-8 w-px bg-[#e5e5e5]"></span>
            <div className="flex flex-col items-center">
                <span className="font-sans text-2xl font-bold tracking-wider text-[#1a1a1a] leading-none">NECTON</span>
                <span className="font-sans text-[9px] uppercase tracking-[0.1em] text-[#737373] mt-1">Investimentos</span>
            </div>
          </div>
          <p className="text-[9px] text-[#737373] max-w-4xl leading-relaxed text-justify mx-auto m-0">
            A Elitte Capital é uma empresa de assessoria de investimento devidamente registrada na Comissão de Valores Mobiliários (CVM), na forma da Resolução CVM 16/2021. Atuamos no mercado financeiro através da Necton Investimentos, instituição financeira autorizada a funcionar pelo Banco Central do Brasil. As informações contidas neste relatório são de caráter exclusivamente informativo e não constituem oferta, recomendação ou sugestão de investimento. Rentabilidade passada não é garantia de rentabilidade futura.
          </p>
        </div>

      </div>
    </div>
  );
}
