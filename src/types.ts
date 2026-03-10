export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  image?: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: TutorialStep[];
  updatedAt: string;
}

export interface InvestmentThesis {
  id: string;
  title: string;
  ticker: string;
  description: string;
  category: 'Macro' | 'Equity' | 'Fixed Income' | 'Crypto' | 'Alternative';
  conviction: 'High' | 'Medium' | 'Low';
  status: 'Draft' | 'Active' | 'Closed' | 'compra_gradual' | 'posicao_cheia' | 'venda_programada' | 'encerrada' | 'aguardando_ponto' | 'venda';
  targetPrice?: number;
  entryPrice?: number;
  exitPoint?: number;
  currentPrice?: number;
  horizon: 'Short' | 'Medium' | 'Long';
  createdAt: string;
  updatedAt: string;
  tags: string[];
  source?: 'Personal' | 'Bank' | 'BTG';
  macroAnalysis?: string;
  fundamentalAnalysis?: string;
  technicalAnalysis?: string;
  gradualBuys?: { price: number; percentage: number }[];
}

export interface Portfolio {
  id?: string;
  name: string;
  value: number;
  assets?: {
    ticker: string;
    allocation: number;
    performance: number;
  }[];
}
