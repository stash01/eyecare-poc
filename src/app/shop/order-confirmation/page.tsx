"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  CheckCircle,
  Package,
  Truck,
  Mail,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function OrderConfirmationPage() {
  const orderNumber = `KLR-${Date.now().toString().slice(-8)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-semibold text-primary-900">KlaraMD</span>
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Thank You for Your Order!
          </h1>
          <p className="text-gray-600 mb-8">
            Your order has been confirmed and will be shipped soon.
          </p>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between pb-4 border-b mb-4">
                <span className="text-sm text-gray-500">Order Number</span>
                <span className="font-mono font-bold text-gray-900">
                  {orderNumber}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Mail className="h-6 w-6 text-primary-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      Confirmation Email Sent
                    </p>
                    <p className="text-sm text-gray-500">
                      Check your inbox for order details and receipt
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Package className="h-6 w-6 text-primary-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      Order Processing
                    </p>
                    <p className="text-sm text-gray-500">
                      Your order is being prepared for shipment
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Truck className="h-6 w-6 text-primary-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      Estimated Delivery
                    </p>
                    <p className="text-sm text-gray-500">
                      3-5 business days within Ontario
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Link href="/shop" className="block">
              <Button size="lg" className="w-full">
                Continue Shopping
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button size="lg" variant="ghost" className="w-full">
                Return to Home
              </Button>
            </Link>
          </div>

          <Card className="mt-8 border-primary-200 bg-primary-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Need personalized guidance?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Our ophthalmologists can help you get the most out of your
                dry eye treatment products.
              </p>
              <Link href="/assessment">
                <Button variant="secondary" size="sm">
                  Take Free Assessment
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
