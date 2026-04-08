import Link from 'next/link';
import { Check, X } from 'lucide-react';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'Scan one target with external scanners. No credit card required.',
    cta: 'Get Started',
    highlighted: false,
    features: [
      { text: '1 scan target', included: true },
      { text: '20 scans per month', included: true },
      { text: 'External scanners (port, DNS, SSL, web)', included: true },
      { text: 'Basic reports', included: true },
      { text: 'Internal scanners (SSH, cloud, mobile)', included: false },
      { text: 'Scheduled scans', included: false },
      { text: 'Compliance reports', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    description: 'For teams scanning real infrastructure with internal access and scheduled assessments.',
    cta: 'Get Started',
    highlighted: true,
    features: [
      { text: '10 scan targets', included: true },
      { text: '500 scans per month', included: true },
      { text: 'All external scanners', included: true },
      { text: 'Internal scanners (SSH host audit, cloud audit, mobile APK)', included: true },
      { text: 'Scheduled scans (daily, weekly, monthly)', included: true },
      { text: 'Compliance reports (SOC2, ISO27001)', included: true },
      { text: 'Active Directory audit', included: false },
    ],
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: '/mo',
    description: 'Full platform access for organizations with compliance requirements and large infrastructure.',
    cta: 'Get Started',
    highlighted: false,
    features: [
      { text: 'Unlimited scan targets', included: true },
      { text: '5000 scans per month', included: true },
      { text: 'All 12 scanner types', included: true },
      { text: 'Active Directory audit (LDAP)', included: true },
      { text: 'Hourly scheduled scans', included: true },
      { text: 'Executive summary + delta reports', included: true },
      { text: 'Unlimited credentials (SSH, cloud, domain)', included: true },
    ],
  },
];

export default function Pricing() {
  return (
    <section id='pricing'>
      <div className='bg-white py-6 sm:py-14 dark:bg-black'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='text-3xl font-bold tracking-tight text-black lg:text-4xl dark:text-white'>
            Pricing
          </h2>
          <p className='mt-4 text-lg text-black/60 dark:text-white/60'>
            From a single domain to full infrastructure coverage. Pay for the access you need.
          </p>
        </div>
      </div>

      <div className='bg-white px-7 pb-16 md:px-20 dark:bg-black'>
        <div className='mx-auto max-w-5xl'>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col rounded-xl p-7 ${
                  tier.highlighted
                    ? 'bg-linear-to-br from-[#3AFF00]/10 to-[#23FFF6]/10 ring-2 ring-green-400 dark:from-[#3AFF00]/5 dark:to-[#23FFF6]/5'
                    : 'bg-zinc-100 dark:bg-zinc-900'
                }`}
              >
                <div>
                  <h3 className='text-lg font-bold text-black dark:text-white'>
                    {tier.name}
                  </h3>
                  <div className='mt-3 flex items-baseline'>
                    <span className='text-3xl font-bold text-black dark:text-white'>
                      {tier.price}
                    </span>
                    <span className='ml-1 text-sm text-black/50 dark:text-white/50'>
                      {tier.period}
                    </span>
                  </div>
                  <p className='mt-3 text-sm leading-relaxed text-black/60 dark:text-white/60'>
                    {tier.description}
                  </p>
                </div>

                <ul className='mt-6 grow space-y-2.5'>
                  {tier.features.map((feature) => (
                    <li key={feature.text} className='flex items-start gap-2.5'>
                      {feature.included ? (
                        <Check className='mt-0.5 h-4 w-4 shrink-0 text-green-400' />
                      ) : (
                        <X className='mt-0.5 h-4 w-4 shrink-0 text-black/20 dark:text-white/20' />
                      )}
                      <span className={`text-xs leading-relaxed ${
                        feature.included
                          ? 'text-black/80 dark:text-white/80'
                          : 'text-black/30 dark:text-white/30'
                      }`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href='https://client.cystene.com/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-opacity duration-200 hover:opacity-90 ${
                    tier.highlighted
                      ? 'bg-linear-to-r from-[#3AFF00] to-[#23FFF6] text-black'
                      : 'bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
