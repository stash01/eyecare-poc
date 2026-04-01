"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "./auth-context";

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
  subscribe: (plan: SubscriptionPlan) => Promise<{ error?: string }>;
  cancelSubscription: () => Promise<void>;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // Subscription state is derived from the authenticated user object (set by /api/auth/me)
  const { user, isLoading, refreshUser } = useAuth();

  const plan = (user?.subscriptionPlan as SubscriptionPlan | null) ?? null;

  async function subscribe(newPlan: SubscriptionPlan): Promise<{ error?: string }> {
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ plan: newPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error ?? "Subscription failed" };
      }

      // Refresh user to pick up the new subscription_plan from the server
      await refreshUser();
      return {};
    } catch {
      return { error: "Network error. Please try again." };
    }
  }

  async function cancelSubscription() {
    await fetch("/api/subscriptions", {
      method: "DELETE",
      credentials: "same-origin",
    });
    await refreshUser();
  }

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
