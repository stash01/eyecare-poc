"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type SubscriptionPlan = "basic" | "premium" | "complete";

export const PLAN_DETAILS: Record<SubscriptionPlan, { name: string; price: number; features: string[] }> = {
  basic: {
    name: "Basic",
    price: 19.99,
    features: [
      "Assessment results & severity score",
      "Basic product recommendations",
      "Symptom tracking history",
    ],
  },
  premium: {
    name: "Premium",
    price: 39.99,
    features: [
      "Everything in Basic",
      "Detailed treatment plan",
      "Prescription suggestions",
      "Priority booking",
    ],
  },
  complete: {
    name: "Complete",
    price: 79.99,
    features: [
      "Everything in Premium",
      "1 specialist consultation included",
      "Procedural treatment guidance",
      "Ongoing care coordination",
    ],
  },
};

interface SubscriptionContextType {
  isSubscribed: boolean;
  plan: SubscriptionPlan | null;
  subscribe: (plan: SubscriptionPlan) => void;
  cancelSubscription: () => void;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const STORAGE_KEY = "klaramd_subscription";

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setPlan(data.plan);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const subscribe = (newPlan: SubscriptionPlan) => {
    setPlan(newPlan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ plan: newPlan }));
  };

  const cancelSubscription = () => {
    setPlan(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed: plan !== null,
        plan,
        subscribe,
        cancelSubscription,
        isLoading,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
