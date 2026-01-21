"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle,
  Package,
  ArrowLeft,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { PRODUCTS, PRODUCT_CATEGORIES } from "@/lib/constants";
import { useCart } from "@/lib/cart-context";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId as string;
  const product = PRODUCTS.find((p) => p.id === productId);

  const { addItem, itemCount } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  if (!product) {
    notFound();
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const category = PRODUCT_CATEGORIES[product.category];

  // Find related products in same category
  const relatedProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 3);

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
                  Back to Shop
                </Button>
              </Link>
              <Link href="/shop/cart" className="relative">
                <Button variant="secondary" size="sm" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Cart
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="relative aspect-square bg-white rounded-xl border flex items-center justify-center">
              <Package className="h-32 w-32 text-gray-200" />
              {product.badge && (
                <span className="absolute top-4 left-4 bg-primary-600 text-white text-sm font-medium px-3 py-1 rounded">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-4">
                <Link
                  href={`/shop?category=${product.category}`}
                  className="text-sm text-primary-600 hover:underline"
                >
                  {category.name}
                </Link>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              <p className="text-gray-600 mb-4">{product.description}</p>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
                {product.compareAtPrice && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      ${product.compareAtPrice.toFixed(2)}
                    </span>
                    <span className="text-sm font-medium text-red-600">
                      Save ${(product.compareAtPrice - product.price).toFixed(2)}
                    </span>
                  </>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                size="lg"
                className="w-full mb-4"
                onClick={handleAddToCart}
                disabled={!product.inStock || isAdded}
              >
                {isAdded ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart — ${(product.price * quantity).toFixed(2)}
                  </>
                )}
              </Button>

              {!product.inStock && (
                <p className="text-center text-red-500 mb-4">
                  This product is currently out of stock.
                </p>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 py-4 border-t border-b">
                <div className="text-center">
                  <Truck className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600">Free shipping over $50</p>
                </div>
                <div className="text-center">
                  <Shield className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600">Secure checkout</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-600">30-day returns</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  About This Product
                </h2>
                <p className="text-gray-600 mb-4">{product.longDescription}</p>
                <h3 className="font-medium text-gray-900 mb-2">How to Use</h3>
                <p className="text-gray-600">{product.usage}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Key Features
                </h2>
                <ul className="space-y-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                You May Also Like
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <Link key={relatedProduct.id} href={`/shop/${relatedProduct.id}`}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-gray-900 line-clamp-1">
                          {relatedProduct.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {relatedProduct.description}
                        </p>
                        <p className="font-bold text-gray-900 mt-2">
                          ${relatedProduct.price.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
