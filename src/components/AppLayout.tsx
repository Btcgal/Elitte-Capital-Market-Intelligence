import { AppSidebar } from './AppSidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-secondary text-primary font-sans overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-secondary/50 flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        
        {/* Global Compliance Footer */}
        <footer className="mt-auto border-t border-border bg-white p-8 text-center hidden print:block">
          <div className="max-w-7xl mx-auto flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center space-x-8">
              <div className="flex flex-col items-center">
                <span className="font-serif text-xl font-semibold tracking-widest text-primary">ELITTE</span>
                <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Capital · Private</span>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="flex flex-col items-center">
                <span className="font-sans text-lg font-bold tracking-wider text-primary">NECTON</span>
                <span className="font-sans text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-1">Investimentos</span>
              </div>
            </div>
            
            <p className="text-[10px] text-muted-foreground max-w-4xl leading-relaxed text-justify mx-auto">
              A Elitte Capital é uma empresa de assessoria de investimento devidamente registrada na Comissão de Valores Mobiliários (CVM), na forma da Resolução CVM 16/2021. Atuamos no mercado financeiro através da Necton Investimentos, instituição financeira autorizada a funcionar pelo Banco Central do Brasil. As informações contidas neste relatório são de caráter exclusivamente informativo e não constituem oferta, recomendação ou sugestão de investimento. Rentabilidade passada não é garantia de rentabilidade futura.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
