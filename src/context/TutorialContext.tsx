import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tutorial, TutorialStep } from '../types';
import { defaultTutorials } from '../data/tutorials';

export type { Tutorial, TutorialStep };

interface TutorialContextType {
  tutorials: Tutorial[];
  addTutorial: (tutorial: Tutorial) => void;
  updateTutorial: (tutorial: Tutorial) => void;
  deleteTutorial: (id: string) => void;
  getTutorial: (id: string) => Tutorial | undefined;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [tutorials, setTutorials] = useState<Tutorial[]>(() => {
    const saved = localStorage.getItem('tutorials');
    return saved ? JSON.parse(saved) : defaultTutorials;
  });

  useEffect(() => {
    localStorage.setItem('tutorials', JSON.stringify(tutorials));
  }, [tutorials]);

  const addTutorial = (tutorial: Tutorial) => {
    setTutorials(prev => [...prev, tutorial]);
  };

  const updateTutorial = (tutorial: Tutorial) => {
    setTutorials(prev => prev.map(t => t.id === tutorial.id ? tutorial : t));
  };

  const deleteTutorial = (id: string) => {
    setTutorials(prev => prev.filter(t => t.id !== id));
  };

  const getTutorial = (id: string) => {
    return tutorials.find(t => t.id === id);
  };

  return (
    <TutorialContext.Provider value={{ tutorials, addTutorial, updateTutorial, deleteTutorial, getTutorial }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorials() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorials must be used within a TutorialProvider');
  }
  return context;
}
