import Stripe from 'stripe';

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY ?? '',
  {
    apiVersion: '2025-07-30.basil',
    appInfo: {
      name: 'finpy-web-app',
      version: '0.1.0',
    },
  }
);
