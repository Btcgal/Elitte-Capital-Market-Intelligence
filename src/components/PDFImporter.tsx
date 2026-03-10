import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, X, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
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

type FileStatus = 'pending' | 'processing' | 'success' | 'error';

interface FileUploadState {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
}

export default function PDFImporter({ onClose }: PDFImporterProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
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

  const processFile = async (id: string, file: File) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'processing' } : f));

    try {
      // 1. Extract Text
      const text = await extractTextFromPDF(file);
      
      // 2. Process with AI
      const tutorialData = await processWithGemini(text);

      // 3. Create Tutorial Object
      const newTutorial = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
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
      
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'success' } : f));
    } catch (err: any) {
      console.error(err);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: err.message || 'Erro ao processar arquivo.' } : f));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newFiles: FileUploadState[] = selectedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: file.type === 'application/pdf' ? 'pending' : 'error',
      error: file.type === 'application/pdf' ? undefined : 'Apenas arquivos PDF são permitidos.'
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Process valid files
    for (const fileState of newFiles) {
      if (fileState.status === 'pending') {
        processFile(fileState.id, fileState.file);
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isProcessingAny = files.some(f => f.status === 'processing');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isProcessingAny}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6 flex-shrink-0">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Importar Documentos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Envie PDFs do banco para gerar tutoriais automaticamente.
          </p>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors border-gray-200 hover:border-primary hover:bg-gray-50 cursor-pointer flex-shrink-0`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
            />
            
            <div className="flex flex-col items-center justify-center py-2">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                Clique para selecionar PDFs
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Suporta múltiplos arquivos PDF
              </span>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map(fileState => (
                <div key={fileState.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex flex-col truncate">
                      <span className="text-sm font-medium text-gray-700 truncate">{fileState.file.name}</span>
                      {fileState.error && <span className="text-xs text-red-500 truncate">{fileState.error}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {fileState.status === 'pending' && <span className="text-xs text-gray-500">Aguardando...</span>}
                    {fileState.status === 'processing' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                    {fileState.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {fileState.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 flex-shrink-0">
            <strong>Dica:</strong> O sistema irá identificar automaticamente se é PF ou PJ e filtrar informações irrelevantes para o primeiro acesso.
          </div>
        </div>
        
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isProcessingAny}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingAny ? 'Processando...' : 'Concluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
