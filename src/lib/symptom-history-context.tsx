"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Severity } from "./assessment-utils";
import { useAuth } from "./auth-context";

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
  addResult: (result: Omit<AssessmentResult, "id" | "timestamp">) => Promise<void>;
  clearHistory: () => void;
  isLoading: boolean;
}

const SymptomHistoryContext = createContext<SymptomHistoryContextType | undefined>(undefined);

export function SymptomHistoryProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load assessment history from the server when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch("/api/assessments", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { history: [] }))
      .then((data) => setHistory(data.history ?? []))
      .catch(() => setHistory([]))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  async function addResult(result: Omit<AssessmentResult, "id" | "timestamp">) {
    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        score: result.score,
        deq5: result.deq5,
        deq5Positive: result.deq5Positive,
        severity: result.severity,
        autoimmune: result.autoimmune,
        diabetes: result.diabetes,
        mgd: result.mgd,
        triedTreatments: result.triedTreatments,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to save assessment result");
    }

    const data = await res.json();

    // Optimistically add to local state
    const newResult: AssessmentResult = {
      ...result,
      id: data.assessment.id,
      timestamp: data.assessment.timestamp,
    };
    setHistory((prev) => [...prev, newResult]);
  }

  function clearHistory() {
    // Local clear only — use the patient deletion endpoint for full PHIPA-compliant erasure
    setHistory([]);
  }

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
