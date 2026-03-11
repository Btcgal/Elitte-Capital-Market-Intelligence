import { GoogleGenAI, Type, ThinkingLevel, GenerateContentResponse } from '@google/genai';

// Initialize the API client using the platform-provided key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface Asset {
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  currency: string;
  type: 'Stock' | 'BDR' | 'FII' | 'Fixed Income' | 'Crypto' | 'Other';
  institution: string;
}

// Helper to convert ArrayBuffer to Base64 in browser
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to handle Gemini API errors consistently
function handleGeminiError(e: any): never {
  const isRateLimit = 
    e.status === 429 || 
    e.message?.includes('429') || 
    e.message?.includes('RESOURCE_EXHAUSTED') || 
    e.message?.includes('quota') ||
    e.error?.code === 429 ||
    e.error?.status === 'RESOURCE_EXHAUSTED';

  if (isRateLimit) {
    console.warn('Gemini API Rate Limit hit. Retrying or failing gracefully.');
    throw new Error('Limite de requisições da IA excedido. Por favor, aguarde um momento e tente novamente.');
  }
  
  console.error('Gemini API Error:', e);
  throw e;
}

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 10, delay = 3000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (
      error.status === 429 || 
      error.message?.includes('429') || 
      error.message?.includes('RESOURCE_EXHAUSTED') || 
      error.message?.includes('quota') ||
      error.error?.code === 429 ||
      error.error?.status === 'RESOURCE_EXHAUSTED' ||
      error.message?.includes('Limite de requisições')
    )) {
      const jitter = Math.random() * 1000;
      const finalDelay = delay + jitter;
      console.log(`Rate limit hit. Retrying in ${Math.round(finalDelay)}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, finalDelay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function extractPortfolioFromImages(files: File[]): Promise<Asset[]> {
  const parts = await Promise.all(
    files.map(async (file) => {
      const buffer = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      return {
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      };
    })
  );

  const prompt = `
    Você é um analista financeiro sênior.
    Extraia os ativos financeiros destas imagens de extratos de contas de investimento.
    Consolide os dados em uma lista estruturada.
    Se houver ativos globais (ex: AAPL, MSFT), tente identificar se são BDRs na bolsa brasileira (ex: AAPL34, MSFT34) ou ativos diretos no exterior.
    Se o preço atual não estiver disponível, estime com o preço médio ou deixe 0.
    Identifique a instituição financeira se possível pelo layout do extrato (ex: XP, BTG, Itaú, Avenue).
  `;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [...parts, { text: prompt }],
      },
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ticker: { type: Type.STRING, description: 'Ticker do ativo (ex: PETR4, AAPL34)' },
              name: { type: Type.STRING, description: 'Nome da empresa ou fundo' },
              quantity: { type: Type.NUMBER, description: 'Quantidade de cotas/ações' },
              averagePrice: { type: Type.NUMBER, description: 'Preço médio de compra' },
              currentPrice: { type: Type.NUMBER, description: 'Preço atual (se disponível no extrato)' },
              currency: { type: Type.STRING, description: 'Moeda (BRL, USD)' },
              type: { type: Type.STRING, description: 'Stock, BDR, FII, Fixed Income, Crypto, Other' },
              institution: { type: Type.STRING, description: 'Nome da corretora/banco' },
            },
            required: ['ticker', 'name', 'quantity', 'averagePrice', 'currency', 'type', 'institution'],
          },
        },
      },
    }));

    const text = response.text || '[]';
    return JSON.parse(text) as Asset[];
  } catch (e: any) {
    try {
      handleGeminiError(e);
    } catch (handledError) {
      if ((handledError as Error).message.includes('Limite de requisições')) {
        throw handledError;
      }
    }
    return [];
  }
}

export async function extractThesisFromPdf(file: File): Promise<Partial<ThesisStructuredData> | null> {
  const buffer = await file.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  
  const prompt = `
    Você é um analista sênior de investimentos.
    Extraia as informações de tese de investimento deste documento PDF (relatório de análise).
    Tente identificar: ticker, nome da empresa, tipo de ativo, preço alvo, ponto de entrada, ponto de saída, resumo da tese e as análises macro, fundamentalista e técnica.
    
    Retorne EXATAMENTE um objeto JSON com a seguinte estrutura:
    {
      "ticker": "TICKER",
      "name": "Nome da Empresa",
      "type": "acao" | "fii" | "internacional" | "renda_fixa" | "outro",
      "targetPrice": 00.00,
      "entryPoint": 00.00,
      "exitPoint": 00.00,
      "currency": "BRL" | "USD",
      "thesisSummary": "Resumo...",
      "macroAnalysis": "Análise macro...",
      "fundamentalAnalysis": "Análise fundamentalista...",
      "technicalAnalysis": "Análise técnica..."
    }
  `;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [
        {
          inlineData: {
            data: base64,
            mimeType: 'application/pdf',
          },
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    }));

    const text = response.text || '{}';
    return JSON.parse(text) as Partial<ThesisStructuredData>;
  } catch (e: any) {
    handleGeminiError(e);
    return null;
  }
}

export interface ThesisStructuredData {
  ticker: string;
  name: string;
  title?: string;
  type: 'acao' | 'fii' | 'internacional' | 'renda_fixa' | 'outro';
  status: 'compra_gradual' | 'posicao_cheia' | 'aguardando_ponto' | 'venda';
  currentPrice: number;
  targetPrice: number;
  entryPoint: number;
  exitPoint: number;
  currency: string;
  bdrTicker?: string;
  gradualBuys: { price: number; percentage: number }[];
  thesisSummary: string;
  macroAnalysis: string;
  fundamentalAnalysis: string;
  technicalAnalysis: string;
}

export async function generateThesisData(ticker: string): Promise<ThesisStructuredData | null> {
  const prompt = `
    Você é o Diretor Global de Equity Research da Elitte Capital. Sua reputação depende da precisão e profundidade desta análise.
    Faça uma análise 360° exaustiva do ativo ${ticker}.
    
    REQUISITOS DE PROFUNDIDADE:
    1. Macroeconômica: Analise o cenário global e local, política monetária, câmbio e como isso afeta especificamente este setor e empresa.
    2. Fundamentalista: Analise balanços (DRE, BP, DFC), múltiplos históricos vs atuais, vantagens competitivas (Moats), governança e riscos regulatórios.
    3. Técnica: Identifique suportes, resistências, tendências de curto e médio prazo e indicadores de momentum.
    
    DETERMINAÇÕES FINANCEIRAS:
    - Preço Alvo (Target Price): Justifique com base em valuation (DCF ou Múltiplos).
    - Ponto de Entrada Ideal (Entry Point): Baseado em análise técnica e margem de segurança.
    - Ponto de Saída/Stop (Exit Point): Gestão de risco rigorosa.
    - Aporte Gradual: Defina 3 faixas de preço estratégicas para acumulação.
    
    Retorne EXATAMENTE um objeto JSON com a seguinte estrutura, sem formatação markdown em volta:
    {
      "ticker": "${ticker}",
      "name": "Nome Completo da Empresa",
      "type": "acao" | "fii" | "internacional" | "renda_fixa" | "outro",
      "status": "compra_gradual" | "posicao_cheia" | "aguardando_ponto" | "venda",
      "currentPrice": 00.00,
      "targetPrice": 00.00,
      "entryPoint": 00.00,
      "exitPoint": 00.00,
      "currency": "BRL" | "USD",
      "bdrTicker": "TICKER34" (se aplicável),
      "gradualBuys": [{ "price": 00.00, "percentage": 30 }, { "price": 00.00, "percentage": 30 }, { "price": 00.00, "percentage": 40 }],
      "thesisSummary": "Resumo executivo de alto impacto (máximo 3 linhas).",
      "macroAnalysis": "Análise macro detalhada em Markdown...",
      "fundamentalAnalysis": "Análise fundamentalista profunda em Markdown...",
      "technicalAnalysis": "Análise técnica profissional em Markdown..."
    }
  `;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    }));

    const text = response.text || '{}';
    return JSON.parse(text) as ThesisStructuredData;
  } catch (e: any) {
    try {
      handleGeminiError(e);
    } catch (handledError) {
      if ((handledError as Error).message.includes('Limite de requisições')) {
        throw handledError;
      }
    }
    return null;
  }
}

export interface PortfolioAnalysis360 {
  macroContext: string;
  riskAssessment: string;
  hedgeRecommendations: string;
  assetNewsAndUpdates: { ticker: string; update: string }[];
  overallConclusion: string;
}

export async function analyzePortfolio360(assets: Asset[]): Promise<PortfolioAnalysis360 | null> {
  const assetList = assets.map(a => `${a.ticker} (${a.type}): ${a.quantity} shares/units`).join('\n');
  
  const prompt = `
    Você é um analista chefe de Wealth Management da Elitte Capital.
    Faça uma análise 360° do seguinte portfólio consolidado de um cliente:
    
    ${assetList}
    
    Busque os dados mais recentes do mercado e informativos oficiais para estes ativos.
    
    Retorne EXATAMENTE um objeto JSON com a seguinte estrutura, sem formatação markdown em volta:
    {
      "macroContext": "Análise macroeconômica completa dos ativos (impacto de juros, inflação, etc no portfólio)...",
      "riskAssessment": "Avaliação de risco potencial do portfólio consolidado...",
      "hedgeRecommendations": "Avaliação se é necessário incluir hedge (cenários de crise e proteção sugerida)...",
      "assetNewsAndUpdates": [
        { "ticker": "TICKER", "update": "Últimos informativos oficiais ou fatos relevantes..." }
      ],
      "overallConclusion": "Conclusão geral e recomendação para o cliente..."
    }
  `;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    }));

    const text = response.text || '{}';
    return JSON.parse(text) as PortfolioAnalysis360;
  } catch (e: any) {
    try {
      handleGeminiError(e);
    } catch (handledError) {
      if ((handledError as Error).message.includes('Limite de requisições')) {
        throw handledError;
      }
    }
    return null;
  }
}

export async function generateResearchReport(ticker: string, frameworkType: 1 | 2 | 3 | 4): Promise<string> {
  const prompts = {
    1: `Você é o Diretor de Equity Research da Elitte Capital. Forneça um relatório institucional de altíssimo nível para ${ticker}.
    Use dados em tempo real. Seja extremamente detalhado.
    
    ESTRUTURA OBRIGATÓRIA:
    # Seção I - Fundação do Negócio
    - Análise profunda do modelo de negócio e fosso econômico (Moat).
    - Mix de receitas detalhado e drivers de crescimento.
    
    # Seção II - Métricas Financeiras e Valuation
    - Tabela completa de múltiplos (P/L, EV/EBITDA, P/VP).
    - Análise de margens e eficiência operacional.
    - Justificativa de Valuation.
    
    # Seção III - Desempenho e Mercado
    - Performance relativa ao benchmark.
    - Volatilidade e Beta.
    
    # Seção IV - Sentimento Institucional
    - Consenso de analistas (Buy/Hold/Sell).
    - Movimentação de grandes fundos.
    
    # Seção V - Riscos e Mitigantes
    - Matriz de riscos detalhada.
    
    Responda em Português do Brasil, usando Markdown profissional. Cite fontes e datas.`,
    
    2: `Você é um Auditor Forense e Analista de Crédito Sênior. Sua missão é dissecar a saúde financeira de ${ticker}.
    
    FOCO DA ANÁLISE:
    - Qualidade dos Lucros: Identifique itens não recorrentes e ajustes contábeis.
    - Solvência e Liquidez: Análise profunda da estrutura de capital e cronograma de dívida.
    - Ciclo Financeiro: Prazos de estoque, recebimento e pagamento.
    - Fluxo de Caixa: Conversão de Ebitda em Caixa Livre.
    
    ESTRUTURA:
    # Diagnóstico de Resultados
    # Solidez do Balanço Patrimonial
    # Dinâmica de Fluxo de Caixa
    # Red Flags e Indicadores de Alerta
    
    Seja crítico e técnico. Responda em Português do Brasil em Markdown.`,

    3: `Você é um Analista de Earnings Intelligence. Analise o último resultado trimestral de ${ticker} com profundidade cirúrgica.
    
    PONTOS CHAVE:
    - Beat/Miss: Comparação exata com o consenso da Bloomberg/Refinitiv.
    - Guidance: O que mudou nas projeções da empresa?
    - Conferência de Resultados: Destaques do Q&A com analistas.
    - Reação do Mercado: Por que o preço reagiu desta forma?
    
    ESTRUTURA:
    # Resumo dos Resultados (Reportado vs Consenso)
    # Perspectivas e Guidance
    # Análise por Unidade de Negócio
    # Veredito: Qualidade do Trimestre
    
    Responda em Português do Brasil em Markdown.`,

    4: `Você é um Estrategista de Mercado. Realize uma matriz competitiva profunda de ${ticker} contra seus principais pares.
    
    COMPARAÇÃO:
    - Market Share e Posicionamento.
    - Eficiência Relativa (Margens e ROIC).
    - Valuation Relativo.
    - Vantagens Tecnológicas ou de Escala.
    
    ESTRUTURA:
    # Matriz Comparativa Quantitativa
    # Diferenciais Estratégicos
    # Análise de SWOT Setorial
    # Escolha do Setor (Top Pick)
    
    Responda em Português do Brasil em Markdown.`
  };

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompts[frameworkType],
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    }));

    return response.text || 'No content generated.';
  } catch (e: any) {
    try {
      handleGeminiError(e);
    } catch (handledError) {
      if ((handledError as Error).message.includes('Limite de requisições')) {
        return (handledError as Error).message;
      }
    }
    return 'Erro ao gerar o relatório.';
  }
}

export async function analyzePortfolioForReport(portfolio: any): Promise<string> {
  const prompt = `
    Você é o analista chefe da Elitte Capital.
    Analise esta carteira mensal e responda em português, máximo 110 palavras, tom executivo e direto:

    ${JSON.stringify(portfolio, null, 2)}

    Inclua:
    - Resumo de performance
    - Pontos fortes
    - Principal risco
    - Recomendação de rebalance (1 frase curta)

    Nunca use "talvez", "acho" ou palavras de dúvida.
  `;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    }));

    return response.text || 'Análise Gemini temporariamente indisponível.';
  } catch (err: any) {
    console.error('Gemini Analysis Error:', err);
    return 'Análise Gemini temporariamente indisponível. Dados reais da Yahoo Finance estão carregados.';
  }
}

export async function chatWithAssistant(message: string, context?: string): Promise<string> {
  const systemInstruction = `Você é um assistente de IA para a CEO da Elitte Capital, uma assessoria de investimentos.
  Seu objetivo é ajudar a analisar o cenário macroeconômico Brasil e Global, avaliar premissas de risco e retorno, e ajudar a proteger carteiras.
  Responda de forma profissional, analítica e focada em wealth management.
  Se o usuário perguntar sobre dados recentes, use a ferramenta de busca.
  Contexto atual: ${context || 'Nenhum contexto específico fornecido.'}`;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    }));

    return response.text || '';
  } catch (e: any) {
    handleGeminiError(e);
    return ''; // Unreachable due to handleGeminiError throwing
  }
}

export interface TaxAnalysisResult {
  currentRegime: string;
  estimatedSavings: string;
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
  detailedAnalysis: string;
  opportunities: { title: string; description: string }[];
  legalInsights: string[];
  actionPlan: string[];
}

export async function analyzeTaxDocuments(file: File): Promise<TaxAnalysisResult | null> {
  const buffer = await file.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  
  const prompt = `
    Você é um especialista tributário sênior e advogado fiscalista no Brasil.
    Analise este documento (Declaração de IR ou Balanço Patrimonial) com extrema atenção aos detalhes.
    
    Seu objetivo é realizar um Planejamento Tributário completo para este contribuinte (CPF ou CNPJ).
    
    1. Identifique o regime tributário atual (ex: Simples Nacional, Lucro Presumido, Lucro Real, Pessoa Física - Tabela Progressiva).
    2. Analise as receitas, despesas dedutíveis e estrutura patrimonial.
    3. Identifique oportunidades de elisão fiscal (legal) e eficiência tributária.
    4. Verifique riscos fiscais (inconsistências, passivos ocultos).
    5. Busque na web (Google Search) por leis recentes (2024-2026), novas teses jurídicas e jurisprudências do CARF/STF que possam beneficiar este perfil.
    6. Estime uma economia potencial se as recomendações forem aplicadas.
    
    Retorne EXATAMENTE um objeto JSON com a seguinte estrutura:
    {
      "currentRegime": "Regime Identificado",
      "estimatedSavings": "R$ Valor Estimado / ano",
      "riskLevel": "Baixo" | "Médio" | "Alto",
      "detailedAnalysis": "Texto longo e detalhado em Markdown explicando a situação atual, pontos de atenção e a lógica do planejamento...",
      "opportunities": [
        { "title": "Nome da Oportunidade", "description": "Descrição breve..." }
      ],
      "legalInsights": [
        "Insight sobre lei X...",
        "Tese jurídica Y..."
      ],
      "actionPlan": [
        "Passo 1...",
        "Passo 2..."
      ]
    }
  `;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64,
              mimeType: file.type,
            },
          },
          { text: prompt }
        ],
      },
      config: {
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentRegime: { type: Type.STRING },
            estimatedSavings: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: ['Baixo', 'Médio', 'Alto'] },
            detailedAnalysis: { type: Type.STRING },
            opportunities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            },
            legalInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    }));

    const text = response.text || '{}';
    return JSON.parse(text) as TaxAnalysisResult;
  } catch (e: any) {
    try {
      handleGeminiError(e);
    } catch (handledError) {
      if ((handledError as Error).message.includes('Limite de requisições')) {
        throw handledError;
      }
    }
    return null;
  }
}