"use client";

import { useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Package, ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function CheckoutPage() {
  const { items, subtotal, itemCount } = useCart();

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/stripe/checkout-shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      }),
    });
    const data = await res.json();
    return (data.clientSecret as string) ?? "";
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Eye className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-semibold text-primary-900">
                  KlaraMD
                </span>
              </Link>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-gray-500 mb-6">
            Add some products before checking out.
          </p>
          <Link href="/shop">
            <Button>Browse Products</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-semibold text-primary-900">
                KlaraMD
              </span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ShoppingCart className="h-4 w-4" />
              <span>Secure Checkout</span>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/shop/cart"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Cart
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex gap-3">
                        <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-medium">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-gray-200" />

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal ({itemCount} items)</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Shipping &amp; tax calculated at checkout
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stripe Embedded Checkout */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ fetchClientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
