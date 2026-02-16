"use client";

import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { SymptomHistoryProvider } from "@/lib/symptom-history-context";
import { SubscriptionProvider } from "@/lib/subscription-context";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <CartProvider>
          <SymptomHistoryProvider>{children}</SymptomHistoryProvider>
        </CartProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
