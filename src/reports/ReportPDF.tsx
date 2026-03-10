import html2pdf from 'html2pdf.js';
import { useRef } from 'react';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportPDFProps {
  title: string;
  children: React.ReactNode;
  filename?: string;
}

export default function ReportPDF({ title, children, filename }: ReportPDFProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const generatePDF = () => {
    const element = reportRef.current;
    if (!element) return;

    const opt = {
      margin: [15, 15, 15, 15] as [number, number, number, number],
      filename: filename || `${title.replace(/\s+/g, '-')}-${format(new Date(), 'dd-MM-yyyy')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <FileText className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-zinc-400">Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          </div>
        </div>
        <button
          onClick={generatePDF}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl text-white font-medium transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
        >
          <Download className="w-5 h-5" />
          Baixar PDF (A4)
        </button>
      </div>

      {/* Área que vai virar PDF */}
      <div className="overflow-hidden rounded-2xl shadow-2xl">
        <div ref={reportRef} className="bg-white text-black p-10 max-w-[210mm] mx-auto min-h-[297mm]">
          {/* Cabeçalho Elitte Capital */}
          <div className="border-b-2 border-emerald-600 pb-6 mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-emerald-600">ELITTE CAPITAL</h1>
              <p className="text-lg text-zinc-600">Market Intelligence • Gestão de Patrimônio</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">CNPJ: 00.000.000/0001-00</p>
              <p className="text-xs text-zinc-500">Rio de Janeiro • Brasil</p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
