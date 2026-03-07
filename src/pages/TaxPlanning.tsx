import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, ArrowRight, ShieldCheck, TrendingUp, Scale } from 'lucide-react';
import { cn } from '../lib/utils';
import { analyzeTaxDocuments, TaxAnalysisResult } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

export default function TaxPlanning() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TaxAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.type.startsWith('image/')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Por favor, envie apenas arquivos PDF ou imagens (JPG, PNG).");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeTaxDocuments(file);
      if (result) {
        setAnalysis(result);
      } else {
        setError("Não foi possível analisar o documento. Tente novamente.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao processar o arquivo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">Planejamento Tributário</h1>
          <p className="text-sm text-muted-foreground mt-2 uppercase tracking-[0.2em]">Inteligência Fiscal & Patrimonial</p>
        </div>
      </div>

      {!analysis ? (
        <div className="max-w-3xl mx-auto mt-12">
          <div 
            className={cn(
              "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300",
              dragActive ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-secondary/30",
              file ? "bg-secondary/50 border-primary" : "bg-white"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-4", file ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground")}>
                {file ? <CheckCircle className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
              </div>
              
              <h3 className="text-xl font-medium text-primary">
                {file ? file.name : "Arraste sua declaração de IR ou Balanço aqui"}
              </h3>
              
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {file 
                  ? "Arquivo pronto para análise. Clique no botão abaixo para iniciar." 
                  : "Suportamos PDF, JPG e PNG. O sistema analisará automaticamente regimes tributários, deduções e oportunidades legais."}
              </p>

              {!file && (
                <div className="mt-6">
                  <label htmlFor="file-upload" className="cursor-pointer px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Selecionar Arquivo
                  </label>
                  <input id="file-upload" type="file" className="hidden" accept=".pdf,image/*" onChange={handleChange} />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className="px-8 py-4 bg-accent text-white rounded-xl font-medium text-lg hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Analisando Documento...
                </>
              ) : (
                <>
                  Gerar Planejamento Tributário
                  <ArrowRight className="w-5 h-5 ml-3" />
                </>
              )}
            </button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-white rounded-xl border border-border shadow-sm">
              <ShieldCheck className="w-8 h-8 mx-auto text-primary mb-3" />
              <h4 className="font-medium text-primary mb-1">Compliance</h4>
              <p className="text-xs text-muted-foreground">Verificação de conformidade com as leis atuais (2025/2026).</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-border shadow-sm">
              <TrendingUp className="w-8 h-8 mx-auto text-accent mb-3" />
              <h4 className="font-medium text-primary mb-1">Eficiência</h4>
              <p className="text-xs text-muted-foreground">Identificação de oportunidades de elisão fiscal lícita.</p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-border shadow-sm">
              <Scale className="w-8 h-8 mx-auto text-primary mb-3" />
              <h4 className="font-medium text-primary mb-1">Comparativo</h4>
              <p className="text-xs text-muted-foreground">Simulação entre diferentes regimes tributários.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Regime Atual</h3>
              <p className="text-2xl font-serif font-semibold text-primary">{analysis.currentRegime}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Economia Estimada</h3>
              <p className="text-2xl font-serif font-semibold text-success">{analysis.estimatedSavings}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Risco Fiscal</h3>
              <p className={cn("text-2xl font-serif font-semibold", analysis.riskLevel === 'Alto' ? "text-destructive" : analysis.riskLevel === 'Médio' ? "text-accent" : "text-success")}>
                {analysis.riskLevel}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Analysis */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="text-xl font-serif font-semibold text-primary mb-6 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-accent" />
                  Análise Detalhada
                </h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <ReactMarkdown>{analysis.detailedAnalysis}</ReactMarkdown>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="text-xl font-serif font-semibold text-primary mb-6 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-success" />
                  Oportunidades Identificadas
                </h3>
                <div className="space-y-4">
                  {analysis.opportunities.map((opp, idx) => (
                    <div key={idx} className="p-4 bg-secondary/30 rounded-xl border border-border flex items-start">
                      <div className="w-6 h-6 rounded-full bg-success/10 text-success flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                        <span className="text-xs font-bold">{idx + 1}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-primary">{opp.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{opp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Insights */}
            <div className="space-y-8">
              <div className="bg-primary text-secondary p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-serif font-semibold mb-4 flex items-center">
                  <Scale className="w-5 h-5 mr-2" />
                  Insights Jurídicos
                </h3>
                <div className="space-y-4 text-sm opacity-90">
                  {analysis.legalInsights.map((insight, idx) => (
                    <div key={idx} className="border-b border-white/10 last:border-0 pb-3 last:pb-0">
                      <p>{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
                <h3 className="text-lg font-serif font-semibold text-primary mb-4">Ações Recomendadas</h3>
                <ul className="space-y-3">
                  {analysis.actionPlan.map((action, idx) => (
                    <li key={idx} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mr-2" />
                      {action}
                    </li>
                  ))}
                </ul>
                <button className="w-full mt-6 py-3 border border-primary text-primary rounded-xl font-medium hover:bg-primary hover:text-white transition-colors text-sm">
                  Agendar Consultoria Jurídica
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center pt-8">
            <button 
              onClick={() => { setFile(null); setAnalysis(null); }}
              className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center"
            >
              <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
              Realizar nova análise
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
