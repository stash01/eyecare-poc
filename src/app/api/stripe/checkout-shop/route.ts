import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/server/session";
import { getStripe } from "@/lib/server/stripe";
import { PRODUCTS } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface CartItem {
  productId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  const session = await validateSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { items } = body as { items: CartItem[] };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Validate and build line items using server-authoritative prices
  const lineItems = [];
  for (const item of items) {
    const product = PRODUCTS.find((p) => p.id === item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Unknown product: ${item.productId}` },
        { status: 400 }
      );
    }
    if (!product.inStock) {
      return NextResponse.json(
        { error: `${product.name} is out of stock` },
        { status: 400 }
      );
    }
    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: "cad",
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: product.name,
          description: product.description,
        },
      },
    });
  }

  const stripe = getStripe();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get("origin") ?? "";

  const checkoutSession = await stripe.checkout.sessions.create({
    ui_mode: "embedded_page",
    mode: "payment",
    line_items: lineItems,
    shipping_address_collection: {
      allowed_countries: ["CA"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: "Standard Shipping (3–5 business days)",
          fixed_amount: { amount: 799, currency: "cad" },
          delivery_estimate: {
            minimum: { unit: "business_day", value: 3 },
            maximum: { unit: "business_day", value: 5 },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: "Free Shipping (orders over $50)",
          fixed_amount: { amount: 0, currency: "cad" },
          delivery_estimate: {
            minimum: { unit: "business_day", value: 5 },
            maximum: { unit: "business_day", value: 7 },
          },
        },
      },
    ],
    return_url: `${baseUrl}/shop/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    metadata: { patientId: session.patientId },
  });

  return NextResponse.json({ clientSecret: checkoutSession.client_secret });
}
