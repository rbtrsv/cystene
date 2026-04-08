import { Crosshair, SlidersHorizontal, Radar, ClipboardCheck, ArrowRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: Crosshair,
    title: 'Add Your Target',
    description: 'Enter the domain, IP address, or CIDR range you want to assess.',
  },
  {
    id: 2,
    icon: SlidersHorizontal,
    title: 'Configure Scan',
    description: 'Choose scan types and templates — or use smart defaults to get started fast.',
  },
  {
    id: 3,
    icon: Radar,
    title: 'Run Assessment',
    description: 'Our engines scan ports, DNS, SSL, and web security in parallel across your targets.',
  },
  {
    id: 4,
    icon: ClipboardCheck,
    title: 'Review Findings',
    description: 'Get prioritized vulnerabilities with severity ratings and remediation guidance.',
  },
];

const scenarios = [
  {
    persona: 'Freelance Developer',
    detail: 'Add your client\'s domain → run port scan + SSL check + web scan → get findings with severity ratings → share PDF report with the client.',
  },
  {
    persona: 'DevOps Team',
    detail: 'Add 10 production servers → configure weekly scheduled scans → upload SSH keys for host audits → track vulnerability trends across infrastructure over time.',
  },
  {
    persona: 'Security & Compliance',
    detail: 'Map entire infrastructure with business context → scan all targets with all 12 engines → generate SOC2 compliance reports → present executive summary to leadership.',
  },
];

export default function Workflow() {
  return (
    <section id='workflow'>
      <div className='bg-white py-6 sm:py-14 dark:bg-black'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='text-3xl font-bold tracking-tight text-black lg:text-4xl dark:text-white'>
            Workflow
          </h2>
        </div>
      </div>

      <div className='bg-white px-7 pb-16 md:px-20 dark:bg-black'>
        <div className='mx-auto max-w-5xl'>

          {/* Desktop — horizontal steps with connecting line */}
          <div className='hidden md:block'>
            <div className='relative flex items-start justify-between'>
              {/* Connecting line behind the circles */}
              <div className='absolute top-8 right-12 left-12 h-0.5 bg-linear-to-r from-[#3AFF00] to-[#23FFF6]' />

              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className='relative flex w-1/4 flex-col items-center text-center px-3'>
                    {/* Numbered circle with icon */}
                    <div className='relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 ring-4 ring-white dark:bg-zinc-900 dark:ring-black'>
                      <Icon className='h-7 w-7 text-green-400' />
                    </div>
                    {/* Step number */}
                    <span className='mt-3 text-sm font-bold text-green-400'>
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
              <div className='absolute top-8 bottom-8 left-8 w-0.5 bg-linear-to-b from-[#3AFF00] to-[#23FFF6]' />

              <div className='space-y-10'>
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className='relative flex gap-5'>
                      {/* Circle with icon */}
                      <div className='relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-100 ring-4 ring-white dark:bg-zinc-900 dark:ring-black'>
                        <Icon className='h-7 w-7 text-green-400' />
                      </div>
                      {/* Content */}
                      <div className='pt-1'>
                        <span className='text-sm font-bold text-green-400'>
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

          {/* How it works in practice — per persona examples */}
          <div className='mt-14 mb-8'>
            <h3 className='text-center text-xl font-semibold text-black dark:text-white'>
              How it works in practice
            </h3>
            <div className='mt-8 space-y-4'>
              {scenarios.map((scenario) => (
                <div
                  key={scenario.persona}
                  className='rounded-xl bg-zinc-100 p-6 dark:bg-zinc-900'
                >
                  <div className='flex items-center gap-2'>
                    <ArrowRight className='h-4 w-4 shrink-0 text-green-400' />
                    <span className='text-sm font-semibold text-black dark:text-white'>
                      {scenario.persona}
                    </span>
                  </div>
                  <p className='mt-1.5 pl-6 text-xs leading-relaxed text-black/60 dark:text-white/60'>
                    {scenario.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
