import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/modules/stripe/stripeServer';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const priceList = await stripe.prices.list({
    limit: 3,
  });

  return NextResponse.json(priceList.data.reverse());
}
