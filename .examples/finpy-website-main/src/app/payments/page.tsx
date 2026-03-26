'use client';

import { useState, useEffect, FC } from 'react';
import PricingCard from '@/modules/stripe/components/PricingCard';

interface Price {
  id: string;
  nickname: string;
  unit_amount: number;
}

const Pricing: FC = () => {
  const [prices, setPrices] = useState<Price[]>([]);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async (): Promise<void> => {
    try {
      const response = await fetch('/payments/api/products');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setPrices(data);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  return (
    <div className='bg-white py-24 sm:py-32 dark:bg-black'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl text-center'>
          <h2 className='mt-2 bg-linear-to-br from-[#c517ff] to-[#2631f7] bg-clip-text pb-6 text-4xl font-bold tracking-tight text-transparent sm:text-5xl'>
            Pricing plans for teams of all sizes
          </h2>
        </div>
        <p className='mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-black dark:text-white'>
          Choose an affordable plan that’s packed with the best features for
          engaging your audience, creating customer loyalty, and driving sales.
        </p>

        <div className='isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3'>
          {prices.map((price) => (
            <PricingCard price={price} key={price.id} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
