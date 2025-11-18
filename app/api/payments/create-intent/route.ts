// app/api/payments/create-intent/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

export async function POST(request: Request) {
  try {
    const { amount, currency, countryCodeHint, email, createAccount } = await request.json();

    if (typeof amount !== 'number' || amount < 1) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (typeof currency !== 'string' || currency.length !== 3) {
        return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }

    const metadata: { [key: string]: string } = { countryCodeHint: countryCodeHint || 'N/A' };
    if (createAccount && email) {
      metadata.email = email;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error creating PaymentIntent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
