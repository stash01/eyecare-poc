"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "./auth-context";

export type SubscriptionPlan = "klara_membership";

export const PLAN_DETAILS = {
  name: "Klara Membership",
  introPrice: 129,
  introMonths: 3,
  monthlyPrice: 59,
  features: [
    "Full dry eye assessment & severity score",
    "Personalized treatment plan",
    "Prescription suggestions",
    "Specialist consultation booking",
    "Symptom tracking history",
    "Product recommendations",
    "Procedural treatment guidance",
    "Ongoing care coordination",
  ],
};

interface SubscriptionContextType {
  isSubscribed: boolean;
  plan: SubscriptionPlan | null;
  cancelSubscription: () => Promise<void>;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, refreshUser } = useAuth();

  const plan = (user?.subscriptionPlan as SubscriptionPlan | null) ?? null;

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
