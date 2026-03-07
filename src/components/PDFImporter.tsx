import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, X, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { GoogleGenAI } from "@google/genai";
import { useTutorials } from '../context/TutorialContext';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PDFImporterProps {
  onClose: () => void;
}

export default function PDFImporter({ onClose }: PDFImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addTutorial } = useTutorials();

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  };

  const processWithGemini = async (text: string) => {
    try {
      // Initialize Gemini API
      // Note: In a real production app, this key should be handled more securely or via a backend proxy
      // For this demo environment, we use the environment variable if available
      const apiKey = process.env.GEMINI_API_KEY || '';
      
      if (!apiKey) {
        throw new Error('Chave da API Gemini não configurada (GEMINI_API_KEY).');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Você é um assistente bancário especialista da Elitte Capital.
        Analise o seguinte texto extraído de um documento bancário (PDF).
        
        Sua tarefa é criar um tutorial passo-a-passo claro e profissional.
        
        Regras de Ouro:
        1. Identifique se é para Pessoa Física (PF) ou Pessoa Jurídica (PJ).
        2. Se for um guia de "Primeiro Acesso" ou "Boas Vindas", FOCAR APENAS na ativação da conta, token e senha inicial.
        3. IGNORAR instruções operacionais irrelevantes para o primeiro acesso (ex: como fazer TED, DOC, Pix, Pagamentos), a menos que sejam cruciais para a ativação.
        4. Se for um documento puramente operacional (ex: "Manual de Pix"), crie um tutorial focado nisso.
        5. O tom deve ser profissional, direto e acolhedor.
        
        Retorne APENAS um objeto JSON com a seguinte estrutura (sem markdown, apenas o JSON):
        {
          "title": "Título do Tutorial (ex: Primeiro Acesso - Conta PJ)",
          "description": "Uma breve descrição do que este tutorial cobre.",
          "category": "PF" ou "PJ" ou "Geral",
          "steps": [
            {
              "title": "Título do Passo",
              "content": "Conteúdo detalhado do passo. Use markdown para formatar (negrito, listas)."
            }
          ]
        }

        Texto do Documento:
        ${text.substring(0, 30000)} // Limite de caracteres para segurança
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      
      const textResponse = response.text;
      
      if (!textResponse) {
        throw new Error("Não foi possível gerar o tutorial.");
      }
      
      // Clean up markdown code blocks if present
      const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(jsonString);
    } catch (err) {
      console.error("Erro ao processar com IA:", err);
      throw new Error("Falha ao processar o documento com inteligência artificial.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Por favor, selecione um arquivo PDF.');
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Extract Text
      const text = await extractTextFromPDF(file);
      
      // 2. Process with AI
      const tutorialData = await processWithGemini(text);

      // 3. Create Tutorial Object
      const newTutorial = {
        id: Date.now().toString(),
        title: tutorialData.title,
        description: tutorialData.description,
        category: tutorialData.category,
        updatedAt: new Date().toISOString(),
        steps: tutorialData.steps.map((step: any, index: number) => ({
          id: `step-${Date.now()}-${index}`,
          title: step.title,
          content: step.content
        }))
      };

      // 4. Add to Context
      addTutorial(newTutorial);
      
      // 5. Close and Notify (could add a toast here)
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao processar o arquivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Importar Documento</h2>
          <p className="text-sm text-gray-500 mt-1">
            Envie um PDF do banco para gerar um tutorial automaticamente.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isProcessing ? 'border-primary/30 bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-gray-50'
            }`}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <span className="text-sm font-medium text-primary">Processando documento...</span>
                <span className="text-xs text-gray-400 mt-1">Isso pode levar alguns segundos</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  {fileName ? fileName : 'Clique para selecionar o PDF'}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  {fileName ? 'Clique para trocar' : 'Suporta arquivos PDF'}
                </span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
            <strong>Dica:</strong> O sistema irá identificar automaticamente se é PF ou PJ e filtrar informações irrelevantes para o primeiro acesso.
          </div>
        </div>
      </div>
    </div>
  );
}
