"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    itemCount,
    subtotal,
    tax,
    total,
  } = useCart();

  const FREE_SHIPPING_THRESHOLD = 50;
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 7.99;
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-semibold text-primary-900">Klara</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/shop">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            Your Cart
            {itemCount > 0 && (
              <span className="text-lg font-normal text-gray-500">
                ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
            )}
          </h1>

          {items.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Your cart is empty
                </h2>
                <p className="text-gray-500 mb-6">
                  Discover ophthalmologist-recommended products for dry eye relief.
                </p>
                <Link href="/shop">
                  <Button size="lg">
                    Browse Products
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {/* Free Shipping Progress */}
                {subtotal < FREE_SHIPPING_THRESHOLD && (
                  <Card className="bg-primary-50 border-primary-200">
                    <CardContent className="py-4">
                      <p className="text-sm text-primary-800 mb-2">
                        Add <span className="font-bold">${amountToFreeShipping.toFixed(2)}</span> more
                        for free shipping!
                      </p>
                      <div className="h-2 bg-primary-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 transition-all"
                          style={{
                            width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {items.map((item) => (
                  <Card key={item.product.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-10 w-10 text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                href={`/shop/${item.product.id}`}
                                className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-1"
                              >
                                {item.product.name}
                              </Link>
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {item.product.description}
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center border rounded-lg">
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity - 1)
                                }
                                className="p-2 hover:bg-gray-100 transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="px-3 py-1 font-medium min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity + 1)
                                }
                                className="p-2 hover:bg-gray-100 transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                ${(item.product.price * item.quantity).toFixed(2)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-gray-500">
                                  ${item.product.price.toFixed(2)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Order Summary
                    </h2>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span>
                          {shippingCost === 0 ? (
                            <span className="text-green-600">Free</span>
                          ) : (
                            `$${shippingCost.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Tax (HST 13%)</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-gray-200" />
                      <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Total</span>
                        <span>${(total + shippingCost).toFixed(2)}</span>
                      </div>
                    </div>

                    <Link href="/shop/checkout">
                      <Button size="lg" className="w-full">
                        Proceed to Checkout
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>

                    <p className="text-xs text-gray-500 text-center mt-4">
                      Secure checkout powered by Stripe
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
