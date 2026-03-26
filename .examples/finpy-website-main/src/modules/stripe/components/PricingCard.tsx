import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface PriceProps {
  id: string;
  nickname: string;
  unit_amount: number;
}

const PricingCard: React.FC<{ price: PriceProps }> = ({ price }) => {
  const handleSubscription = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/payments/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: price.id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      window.location.assign(data);
    } catch (error) {
      console.error('Error during the subscription process:', error);
    }
  };

  const dynamicContent = (price: PriceProps) => {
    switch (price.nickname) {
      case 'Basic Analytics':
        return {
          planName: 'Startup',
          tagline: 'Most popular',
          description: 'A plan tailored for new ventures.',
          features: [
            '10 products',
            'Up to 500 subscribers',
            'Basic analytics',
            '48-hour support response time',
          ],
        };
      case 'Advanced Analytics':
        return {
          planName: 'Business',
          tagline: 'Best value',
          description: 'A plan that scales with your growing business.',
          features: [
            '50 products',
            'Up to 10,000 subscribers',
            'Advanced analytics',
            '24-hour support response time',
          ],
        };
      case 'Premium Analytics':
        return {
          planName: 'Enterprise',
          tagline: 'For large teams',
          description: 'Premium services for large enterprises.',
          features: [
            'Unlimited products',
            'Unlimited subscribers',
            'Premium analytics',
            'Priority support',
          ],
        };
      default:
        return {
          planName: 'Custom',
          tagline: 'Tailored solutions',
          description: 'Custom analytics solutions for unique needs.',
          features: [
            'Custom product limit',
            'Custom subscriber limit',
            'Custom analytics',
            'Dedicated support',
          ],
        };
    }
  };

  const content = dynamicContent(price);

  return (
    <div className='flex flex-col rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10 dark:bg-white dark:ring-violet-200'>
      <h2 className='text-2xl font-bold text-violet-600'>{content.planName}</h2>
      <p className='mt-2 font-semibold text-gray-900'>{content.tagline}</p>
      <p className='mt-4 text-gray-600'>{content.description}</p>
      <p className='mt-6 flex items-baseline gap-x-1'>
        <span className='text-4xl font-bold tracking-tight text-gray-900'>
          {(price.unit_amount / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </span>
        <span className='text-sm leading-6 font-semibold text-gray-600'>
          /month
        </span>
      </p>
      <ul
        role='list'
        className='mt-8 grow space-y-3 text-sm leading-6 text-gray-600'
      >
        {content.features.map((feature, idx) => (
          <li key={idx} className='flex space-x-3'>
            <CheckCircleIcon
              className='h-5 w-5 shrink-0 text-green-500'
              aria-hidden='true'
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        aria-describedby={price.id}
        onClick={handleSubscription}
        className='mt-8 block rounded-md bg-violet-600 px-3 py-2 text-center text-sm leading-6 font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-violet-600'
      >
        Buy Plan
      </button>
    </div>
  );
};

export default PricingCard;
