"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  ShoppingCart,
  Plus,
  Filter,
  Package,
} from "lucide-react";
import Link from "next/link";
import { PRODUCTS, PRODUCT_CATEGORIES, ProductCategory, Product } from "@/lib/constants";
import { useCart } from "@/lib/cart-context";

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(product);
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="h-16 w-16 text-gray-300" />
        </div>
        {product.badge && (
          <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs font-medium px-2 py-1 rounded">
            {product.badge}
          </span>
        )}
        {product.compareAtPrice && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
            Sale
          </span>
        )}
      </div>
      <CardContent className="p-4">
        <Link href={`/shop/${product.id}`}>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.inStock || isAdding}
            className="gap-1"
          >
            {isAdding ? (
              "Added!"
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add
              </>
            )}
          </Button>
        </div>
        {!product.inStock && (
          <p className="text-sm text-red-500 mt-2">Out of stock</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ShopPage() {
  const { itemCount } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");

  const filteredProducts =
    selectedCategory === "all"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === selectedCategory);

  const categories = Object.entries(PRODUCT_CATEGORIES) as [
    ProductCategory,
    { name: string; description: string }
  ][];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/assessment">
                <Button variant="ghost" size="sm">
                  Take Assessment
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dry Eye Relief Products
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ophthalmologist-recommended products to help manage your dry eye symptoms.
              All products are carefully selected based on clinical evidence.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <Filter className="h-5 w-5 text-gray-400" />
            <Button
              variant={selectedCategory === "all" ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Products
            </Button>
            {categories.map(([key, { name }]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory(key)}
              >
                {name}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products found in this category.</p>
            </div>
          )}

          {/* Trust Banner */}
          <div className="mt-12 bg-primary-50 rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Not sure which products are right for you?
                </h3>
                <p className="text-sm text-gray-600">
                  Take our free assessment to get personalized recommendations.
                </p>
              </div>
              <Link href="/assessment">
                <Button>Start Free Assessment</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            Products are for informational purposes. Consult your ophthalmologist
            before starting any new treatment regimen.
          </p>
        </div>
      </footer>
    </div>
  );
}
