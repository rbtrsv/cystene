import {
  Sparkles,
  ShoppingCart,
  ArrowUpRight,
  BarChart3,
  Code,
  Layers,
  Zap,
  Globe,
} from 'lucide-react';

const features = [
  {
    id: 1,
    icon: Sparkles,
    title: 'AI Recommendations',
    description: 'Intelligent product suggestions powered by your catalog and order history data.',
  },
  {
    id: 2,
    icon: ShoppingCart,
    title: 'Cross-Selling',
    description: 'Suggest complementary products that increase cart size and average order value.',
  },
  {
    id: 3,
    icon: ArrowUpRight,
    title: 'Upselling',
    description: 'Nudge customers toward higher-value alternatives and premium product options.',
  },
  {
    id: 4,
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track recommendation performance, conversion rates, and revenue impact in real time.',
  },
  {
    id: 5,
    icon: Code,
    title: 'Embeddable Components',
    description: 'Drop-in recommendation widgets that match your store design across any platform.',
  },
  {
    id: 6,
    icon: Layers,
    title: 'Multi-Platform',
    description: 'One recommendation engine across Shopify, WooCommerce, and Magento stores.',
  },
  {
    id: 7,
    icon: Zap,
    title: 'Fast Integration',
    description: 'Connect your store in minutes with native API adapters — no complex setup required.',
  },
  {
    id: 8,
    icon: Globe,
    title: 'Unified Data',
    description: 'All your product catalogs and order data normalized into a single, intelligent model.',
  },
];

export default function Features() {
  return (
    <section id='features'>
      <div className='bg-white py-6 sm:py-14 dark:bg-black'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='text-3xl font-bold tracking-tight text-black lg:text-4xl dark:text-white'>
            Features
          </h2>
        </div>
      </div>

      <div className='grid gap-6 bg-white px-7 pb-16 dark:bg-black max-sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:px-20 lg:grid-cols-4'>
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className='group relative flex min-h-[210px] w-full flex-col items-center justify-center gap-4 rounded bg-zinc-100 p-6 text-center transition-all duration-300 hover:bg-linear-to-br hover:from-[#17FFFD] hover:to-[#2631f7] dark:bg-zinc-900'
            >
              <Icon className='h-10 w-10 text-cyan-500 transition-colors duration-300 group-hover:text-white' />
              <h3 className='text-lg font-semibold text-black transition-colors duration-300 group-hover:text-white dark:text-white'>
                {item.title}
              </h3>
              <p className='text-sm text-black/75 transition-colors duration-300 group-hover:text-white/90 dark:text-white/75'>
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
