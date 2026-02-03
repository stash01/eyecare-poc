"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Severity } from "./assessment-utils";

export interface AssessmentResult {
  id: string;
  timestamp: string;
  score: number;
  deq5: number;
  deq5Positive: boolean;
  severity: Severity;
  autoimmune: boolean;
  diabetes: boolean;
  mgd: boolean;
  triedTreatments: boolean;
}

interface SymptomHistoryContextType {
  history: AssessmentResult[];
  latestResult: AssessmentResult | null;
  addResult: (result: Omit<AssessmentResult, "id" | "timestamp">) => void;
  clearHistory: () => void;
  isLoading: boolean;
}

const SymptomHistoryContext = createContext<SymptomHistoryContextType | undefined>(undefined);

const STORAGE_KEY = "klaramd_symptom_history";

export function SymptomHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsHydrated(true);
    setIsLoading(false);
  }, []);

  // Save to localStorage when history changes (after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, [history, isHydrated]);

  const addResult = (result: Omit<AssessmentResult, "id" | "timestamp">) => {
    const newResult: AssessmentResult = {
      ...result,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setHistory((prev) => [...prev, newResult]);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const latestResult = history.length > 0 ? history[history.length - 1] : null;

  return (
    <SymptomHistoryContext.Provider
      value={{ history, latestResult, addResult, clearHistory, isLoading }}
    >
      {children}
    </SymptomHistoryContext.Provider>
  );
}

export function useSymptomHistory() {
  const context = useContext(SymptomHistoryContext);
  if (context === undefined) {
    throw new Error("useSymptomHistory must be used within a SymptomHistoryProvider");
  }
  return context;
}
