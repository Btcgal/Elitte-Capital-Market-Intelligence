import React from 'react';

interface ReportTemplateProps {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ReportTemplate({ id, title, subtitle, children }: ReportTemplateProps) {
  return (
    <div className="fixed top-0 left-[200vw] w-[210mm] pointer-events-none -z-50">
      <div id={id} className="bg-white text-[#1a1a1a] p-12 font-sans w-[210mm] min-h-[297mm] flex flex-col">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-start mb-10 border-b border-[#e5e5e5] pb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#1a1a1a] leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-[10px] font-bold text-[#8c7b65] uppercase tracking-[0.3em] mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="font-serif text-2xl font-bold tracking-widest text-[#1a1a1a] leading-none">
              ELITTE
            </span>
            <span className="font-sans text-[8px] uppercase tracking-[0.3em] text-[#737373] mt-1">
              Capital · Private
            </span>
            <span className="text-[10px] text-[#d1d5db] font-bold tracking-widest mt-2">
              {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="flex-1 text-[#1a1a1a]">
          {children}
        </div>

        {/* RODAPÉ E DISCLAIMER */}
        <div className="mt-12 pt-6 border-t border-[#e5e5e5] text-center w-full">
          <div className="flex justify-center items-center space-x-6 mb-3">
            <div className="flex flex-col items-center">
              <span className="font-serif text-lg font-semibold tracking-widest text-[#1a1a1a] leading-none">ELITTE</span>
              <span className="font-sans text-[8px] uppercase tracking-[0.2em] text-[#737373] mt-1">Capital · Private</span>
            </div>
            <span className="text-[#e5e5e5] h-6 w-px bg-[#e5e5e5]"></span>
            <div className="flex flex-col items-center">
                <span className="font-sans text-lg font-bold tracking-wider text-[#1a1a1a] leading-none">NECTON</span>
                <span className="font-sans text-[8px] uppercase tracking-[0.1em] text-[#737373] mt-1">Investimentos</span>
            </div>
          </div>
          <p className="text-[8px] text-[#737373] max-w-4xl leading-relaxed text-justify mx-auto mt-4">
            A Elitte Capital é uma empresa de assessoria de investimento devidamente registrada na Comissão de Valores Mobiliários (CVM), na forma da Resolução CVM 16/2021. Atuamos no mercado financeiro através da Necton Investimentos, instituição financeira autorizada a funcionar pelo Banco Central do Brasil. As informações contidas neste relatório são de caráter exclusivamente informativo e não constituem oferta, recomendação ou sugestão de investimento. Rentabilidade passada não é garantia de rentabilidade futura.
          </p>
        </div>

      </div>
    </div>
  );
}
