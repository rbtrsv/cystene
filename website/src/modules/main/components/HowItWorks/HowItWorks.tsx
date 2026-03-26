import { PlugZap, DatabaseZap, Sparkles, CodeXml } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: PlugZap,
    title: 'Connect Your Store',
    description: 'Link your Shopify, WooCommerce, or Magento store in minutes with native API adapters.',
  },
  {
    id: 2,
    icon: DatabaseZap,
    title: 'Data Sync',
    description: 'Your product catalog and order history are automatically imported and normalized.',
  },
  {
    id: 3,
    icon: Sparkles,
    title: 'AI Recommendations',
    description: 'Our engine analyzes purchase patterns and generates intelligent product suggestions.',
  },
  {
    id: 4,
    icon: CodeXml,
    title: 'Embed & Earn',
    description: 'Drop recommendation components into your store and watch your revenue grow.',
  },
];

export default function HowItWorks() {
  return (
    <section id='how-it-works'>
      <div className='bg-white py-6 sm:py-14 dark:bg-black'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='text-3xl font-bold tracking-tight text-black lg:text-4xl dark:text-white'>
            How It Works
          </h2>
        </div>
      </div>

      <div className='bg-white px-7 pb-16 md:px-20 dark:bg-black'>
        <div className='mx-auto max-w-5xl'>

          {/* Desktop — horizontal steps with connecting line */}
          <div className='hidden md:block'>
            <div className='relative flex items-start justify-between'>
              {/* Connecting line behind the circles */}
              <div className='absolute top-8 right-12 left-12 h-0.5 bg-linear-to-r from-[#17FFFD] to-[#2631f7]' />

              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className='relative flex w-1/4 flex-col items-center text-center px-3'>
                    {/* Numbered circle with icon */}
                    <div className='relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 ring-4 ring-white dark:bg-zinc-900 dark:ring-black'>
                      <Icon className='h-7 w-7 text-cyan-500' />
                    </div>
                    {/* Step number */}
                    <span className='mt-3 text-sm font-bold text-cyan-500'>
                      Step {step.id}
                    </span>
                    {/* Title */}
                    <h3 className='mt-2 text-base font-semibold text-black dark:text-white'>
                      {step.title}
                    </h3>
                    {/* Description */}
                    <p className='mt-2 text-sm text-black/70 dark:text-white/70'>
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile — vertical steps with connecting line */}
          <div className='md:hidden'>
            <div className='relative'>
              {/* Vertical connecting line */}
              <div className='absolute top-8 bottom-8 left-8 w-0.5 bg-linear-to-b from-[#17FFFD] to-[#2631f7]' />

              <div className='space-y-10'>
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className='relative flex gap-5'>
                      {/* Circle with icon */}
                      <div className='relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-100 ring-4 ring-white dark:bg-zinc-900 dark:ring-black'>
                        <Icon className='h-7 w-7 text-cyan-500' />
                      </div>
                      {/* Content */}
                      <div className='pt-1'>
                        <span className='text-sm font-bold text-cyan-500'>
                          Step {step.id}
                        </span>
                        <h3 className='mt-1 text-base font-semibold text-black dark:text-white'>
                          {step.title}
                        </h3>
                        <p className='mt-1 text-sm text-black/70 dark:text-white/70'>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
