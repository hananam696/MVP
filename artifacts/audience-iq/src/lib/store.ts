import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Goal, AnalysisResult } from './audienceAnalysis';

interface AppContextType {
  currentGoal: Goal;
  setCurrentGoal: (goal: Goal) => void;
  lastAnalysis: AnalysisResult | null;
  setLastAnalysis: (result: AnalysisResult | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentGoal, setCurrentGoal] = useState<Goal>('viewers');
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);

  return React.createElement(
    AppContext.Provider,
    { value: { currentGoal, setCurrentGoal, lastAnalysis, setLastAnalysis } },
    children
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
