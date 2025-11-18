// app/api/payments/create-intent/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { sendTemporaryPassword } from '@/lib/email';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

export async function POST(request: Request) {
  try {
    const { amount, currency, countryCodeHint, email, createAccount, language } = await request.json();

    if (typeof amount !== 'number' || amount < 1) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (typeof currency !== 'string' || currency.length !== 3) {
        return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }

    const metadata: { [key: string]: string } = { countryCodeHint: countryCodeHint || 'N/A' };
    if (createAccount && email) {
      // 1. Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        // Decide how to handle this case: maybe just proceed with payment but don't create an account,
        // or return an error. For now, we'll return an error.
        return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 });
      }

      // 2. Generate a temporary password
      const tempPassword = randomBytes(8).toString('hex');

      // 3. Hash the password
      const salt = randomBytes(16).toString('hex');
      const hash = (await scrypt(tempPassword, salt, 32)) as Buffer;
      const hashedPassword = salt + '.' + hash.toString('hex');

      // 4. Create user in the database
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          username: email.split('@')[0], // Or generate a unique username
          role: 'PATRON',
        },
      });

      // 5. Send the welcome email
      await sendTemporaryPassword(email, tempPassword, language);

      // Add user ID to metadata to link payment to user
      metadata.userId = newUser.id;
      metadata.email = email;
    }

    const paymentIntent = await stripe.paymentents.create({
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
    // More specific error handling
    if (error.code === 'P2002') { // Prisma unique constraint violation
        return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
