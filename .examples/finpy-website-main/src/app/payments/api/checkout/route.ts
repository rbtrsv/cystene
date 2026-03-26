import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/modules/stripe/stripeServer';

interface SessionRequestData {
  priceId: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data: SessionRequestData = await request.json();
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: data.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: 'http://localhost:3000',
    cancel_url: 'http://localhost:3000',
  });

  return NextResponse.json(session.url);
}
