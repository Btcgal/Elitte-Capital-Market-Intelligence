import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export interface ThesisStructuredData {
  ticker: string;
  name: string;
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
    Você é um analista chefe de Wealth Management.
    Faça uma análise 360 (Macroeconômica, Fundamentalista e Técnica) do ativo ${ticker}.
    Busque os dados mais recentes do mercado (preço atual, balanços, notícias).
    Com base na sua análise, defina:
    - Preço Alvo (Target Price)
    - Ponto de Entrada Ideal (Entry Point)
    - Ponto de Saída/Stop (Exit Point)
    - Se é necessário aporte gradual (defina 2 a 3 faixas de preço e o percentual de aporte em cada uma, somando 100%).
    - Resumo da tese (máximo 3 linhas).
    - Identifique a moeda correta do ativo (BRL, USD, etc).
    - Se for um ativo internacional (EUA), verifique se existe um BDR correspondente na B3 e inclua o ticker (ex: AAPL -> AAPL34).
    
    Retorne EXATAMENTE um objeto JSON com a seguinte estrutura, sem formatação markdown em volta:
    {
      "ticker": "${ticker}",
      "name": "Nome da Empresa",
      "type": "acao" | "fii" | "internacional" | "renda_fixa" | "outro",
      "status": "compra_gradual" | "posicao_cheia" | "aguardando_ponto" | "venda",
      "currentPrice": 00.00,
      "targetPrice": 00.00,
      "entryPoint": 00.00,
      "exitPoint": 00.00,
      "currency": "BRL" | "USD",
      "bdrTicker": "TICKER34" (opcional),
      "gradualBuys": [{ "price": 00.00, "percentage": 50 }, { "price": 00.00, "percentage": 50 }],
      "thesisSummary": "Resumo...",
      "macroAnalysis": "Análise macro...",
      "fundamentalAnalysis": "Análise fundamentalista...",
      "technicalAnalysis": "Análise técnica..."
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
    1: `Você é um analista sênior de equity research em um banco de investimento global com acesso ao Terminal Bloomberg, FactSet e arquivos oficiais da SEC/CVM. Cada número deve incluir uma fonte clara e a data do relatório. Se algum dado não estiver disponível ou tiver mais de 30 dias, sinalize explicitamente. Não estime, interpole ou fabrique métricas.
Forneça uma avaliação completa de grau de investimento de ${ticker}.
Seção I - Fundação do Negócio
- Explique as operações da empresa em linguagem clara e não técnica
- Detalhe a arquitetura completa de receita, incluindo a contribuição percentual por segmento
- Resuma a principal vantagem competitiva da empresa em uma única frase precisa
Seção II - Métricas Financeiras Principais (fonte + data necessária para cada número)
- Receita (TTM e último trimestre reportado)
- Lucro líquido e EPS diluído
- Múltiplos de Valuation: P/L, P/L Projetado, P/S, PEG
- Estrutura de capital: dívida total e dívida/patrimônio líquido
- Fluxo de caixa livre (TTM)
- Comparação ano a ano versus o mesmo trimestre do ano passado
Seção III - Perfil de Desempenho da Ação
- Variação percentual de preço em 1M, 3M, 6M, 1A e YTD
- Máxima e mínima de 52 semanas
- Desempenho relativo contra o S&P 500 ou Ibovespa nos mesmos períodos
Seção IV - Sentimento do Analista
- Total de analistas cobrindo a ação
- Distribuição de Compra/Manutenção/Venda
- Preços-alvo médio, mais alto e mais baixo
- Mudança de recomendação mais recente (empresa, data e justificativa)
Seção V - Posicionamento Institucional
- Cinco principais acionistas institucionais e mudanças de posição trimestre a trimestre
- Entradas ou saídas notáveis de fundos de hedge
Entregue em markdown estruturado com tabelas onde relevante. Cite todas as fontes. Sinalize dados desatualizados claramente. Responda SEMPRE em Português do Brasil.`,
    
    2: `Você é um analista sênior de equity research. Cite cada métrica financeira com sua fonte precisa (arquivo SEC, 10-Q, 10-K, release de resultados) e data. Não estime ou arredonde números. Se indisponível, marque claramente como 'Não Reportado Publicamente'.
Analise as demonstrações financeiras mais recentes de ${ticker}.
Diagnóstico da Demonstração de Resultados
- Receita dos últimos quatro trimestres com números exatos e taxas de crescimento YoY
- Margens bruta, operacional e líquida para cada trimestre
- Trajetória da margem: quantifique expansão ou compressão
- P&D como porcentagem da receita (se aplicável)
Força do Balanço Patrimonial
- Ativos totais vs. passivos totais
- Liquidez corrente e seca
- Caixa e investimentos de curto prazo
- Dívida total com cronograma de vencimento
- Goodwill como % dos ativos totais (sinalize se acima de 30%)
Validação do Fluxo de Caixa
- Fluxo de caixa operacional (TTM)
- Despesas de capital (TTM)
- Fluxo de caixa livre e margem FCF
- Alocação de capital: recompras, dividendos, M&A, redução de dívida, P&D
- Tendência de fluxo de caixa YoY
Indicadores de Risco (Verifique Explicitamente Cada Um)
- Crescimento da receita divergindo do fluxo de caixa
- Crescimento da dívida excedendo o crescimento da receita
- Crescimento de contas a receber superando a receita
- Acúmulo de estoque sem crescimento de vendas correspondente
- Ajustes recorrentes divergindo do GAAP
- Mudanças de auditor ou opiniões modificadas
Indicadores de Força
- Expansão sequencial de margem
- Crescimento sustentado do FCF
- Desalavancagem ou aumento de liquidez
- Alinhamento entre GAAP e lucros ajustados
Benchmarking Competitivo
Construa uma tabela comparativa de margens e índices versus os três principais concorrentes.
Conclua com uma interpretação em linguagem clara: A empresa está se fortalecendo ou deteriorando operacionalmente? Responda SEMPRE em Português do Brasil.`,

    3: `Você é um analista de equity research focado no setor. Cite cada número reportado com atribuição de fonte. Distinga claramente resultados reportados de projeções futuras. Não fabrique comentários ou métricas.
Avalie o release de resultados mais recente de ${ticker}.
Resultados Reportados
- Receita: estimativa vs. real (superou/perdeu em $ e %)
- EPS: estimativa vs. real (superou/perdeu em $ e %)
- Identificação de ajustes únicos ou não recorrentes
Perspectiva Futura (Guidance)
- Mudanças no guidance (elevado, reduzido, reafirmado)
- Faixas de orientação de receita e EPS para o próximo trimestre
- Revisões para o ano completo
- Tom da linguagem usado pela gestão
Desempenho por Segmento
- Receita e crescimento por segmento
- Identificação de divisões com desempenho superior ou inferior
- Contribuição para superar ou perder as expectativas
Comentários da Gestão (De transcrição verificada)
- Resumo estratégico do CEO
- Ênfase na perspectiva financeira do CFO
- Riscos ou pivôs mencionados
- Avaliação do tom
Reação do Mercado
- Movimento de preço no after-hours e na próxima sessão (%)
- Revisões de analistas pós-resultados
- Temas dominantes de Q&A
Veredito de Investimento
- Número mais consequente no relatório
- Qualidade dos lucros (estrutural vs. cosmética)
- Métrica chave para monitorar no próximo trimestre
Formate em markdown estruturado com citações. Sinalize se a transcrição estiver indisponível. Responda SEMPRE em Português do Brasil.`,

    4: `Você é um analista sênior de equity research construindo um relatório de cenário competitivo. Cite cada métrica com sua fonte e data. Use apenas os dados reportados mais recentemente. Se indisponível, marque como 'N/A - Não Reportado Publicamente'.
Compare ${ticker} contra seus 2 principais concorrentes dentro de seu setor/indústria.
Tabela de Comparação Quantitativa
Para cada empresa inclua:
- Capitalização de mercado
- Receita TTM e crescimento YoY
- Margens bruta, operacional e líquida
- P/L, P/L Projetado, P/S, EV/EBITDA, PEG
- Dívida/patrimônio líquido e dívida líquida
- Fluxo de caixa livre e yield de FCF
- Métrica chave específica do setor
Posicionamento Competitivo
- Fosso econômico (moat) central para cada firma
- Ranking de participação de mercado (com fonte)
- Ganhadores vs. perdedores de share
Avaliação de Risco
- Risco primário de 12 meses por empresa
- Maior risco de alavancagem
- Maior risco de ruptura competitiva
Ranking Estratégico
- Melhor valuation relativo ao crescimento
- Maior trajetória de crescimento
- Balanço patrimonial mais forte
- Recomendação geral com justificativa
Entregue em tabelas markdown estruturadas com fontes completas. Sinalize qualquer métrica com mais de um trimestre. Responda SEMPRE em Português do Brasil.`
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