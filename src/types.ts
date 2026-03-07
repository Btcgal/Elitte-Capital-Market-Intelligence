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
  status: 'Draft' | 'Active' | 'Closed';
  targetPrice?: number;
  entryPrice?: number;
  exitPoint?: number;
  currentPrice?: number;
  horizon: 'Short' | 'Medium' | 'Long';
  createdAt: string;
  updatedAt: string;
  tags: string[];
  macroAnalysis?: string;
  fundamentalAnalysis?: string;
  technicalAnalysis?: string;
  gradualBuys?: { price: number; percentage: number }[];
}
