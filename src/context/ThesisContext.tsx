import React, { createContext, useContext, useState, useEffect } from 'react';
import { InvestmentThesis } from '../types';

interface ThesisContextType {
  theses: InvestmentThesis[];
  addThesis: (thesis: Omit<InvestmentThesis, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateThesis: (thesis: InvestmentThesis) => void;
  deleteThesis: (id: string) => void;
  getThesis: (id: string) => InvestmentThesis | undefined;
}

const ThesisContext = createContext<ThesisContextType | undefined>(undefined);

const initialTheses: InvestmentThesis[] = [
  {
    id: '1',
    title: 'Long Position on AI Infrastructure',
    ticker: 'NVDA',
    description: 'Demand for AI chips will continue to outpace supply for the next 18-24 months. Data center expansion is a key driver.',
    category: 'Equity',
    conviction: 'High',
    status: 'Active',
    targetPrice: 1200,
    entryPrice: 850,
    horizon: 'Medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['AI', 'Semiconductors', 'Growth']
  },
  {
    id: '2',
    title: 'Short US Treasury Bonds',
    ticker: 'TLT',
    description: 'Inflation remains sticky, and the Fed is likely to keep rates higher for longer. Yield curve inversion persists.',
    category: 'Fixed Income',
    conviction: 'Medium',
    status: 'Active',
    targetPrice: 85,
    entryPrice: 92,
    horizon: 'Short',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['Macro', 'Rates', 'Inflation']
  }
];

export function ThesisProvider({ children }: { children: React.ReactNode }) {
  const [theses, setTheses] = useState<InvestmentThesis[]>(() => {
    const saved = localStorage.getItem('investment_theses');
    return saved ? JSON.parse(saved) : initialTheses;
  });

  useEffect(() => {
    localStorage.setItem('investment_theses', JSON.stringify(theses));
  }, [theses]);

  const addThesis = (thesisData: Omit<InvestmentThesis, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newThesis: InvestmentThesis = {
      ...thesisData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTheses(prev => [newThesis, ...prev]);
  };

  const updateThesis = (updatedThesis: InvestmentThesis) => {
    setTheses(prev => prev.map(t => t.id === updatedThesis.id ? updatedThesis : t));
  };

  const deleteThesis = (id: string) => {
    setTheses(prev => prev.filter(t => t.id !== id));
  };

  const getThesis = (id: string) => {
    return theses.find(t => t.id === id);
  };

  return (
    <ThesisContext.Provider value={{ theses, addThesis, updateThesis, deleteThesis, getThesis }}>
      {children}
    </ThesisContext.Provider>
  );
}

export function useTheses() {
  const context = useContext(ThesisContext);
  if (context === undefined) {
    throw new Error('useTheses must be used within a ThesisProvider');
  }
  return context;
}
