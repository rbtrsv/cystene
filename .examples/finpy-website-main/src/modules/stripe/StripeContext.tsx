'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { Stripe } from '@stripe/stripe-js';
import { getStripe } from './stripeClient';

interface StripeContextType {
  stripe: Stripe | null;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);

  useEffect(() => {
    getStripe().then((initializedStripe) => {
      setStripe(initializedStripe);
    });
  }, []);

  return (
    <StripeContext.Provider value={{ stripe }}>
      {children}
    </StripeContext.Provider>
  );
};

export const useStripe = (): StripeContextType => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};
