import {
  Network,
  Globe,
  ShieldCheck,
  Bug,
  BarChart3,
  CalendarClock,
  FileBarChart,
  Server,
} from 'lucide-react';

const features = [
  {
    id: 1,
    icon: Network,
    title: 'Port Scanning',
    description: 'Discover open ports and running services across your infrastructure with TCP connect and SYN scans.',
  },
  {
    id: 2,
    icon: Globe,
    title: 'DNS Enumeration',
    description: 'Map subdomains, DNS records, and zone configurations to uncover your full attack surface.',
  },
  {
    id: 3,
    icon: ShieldCheck,
    title: 'SSL/TLS Analysis',
    description: 'Validate certificates, cipher suites, and TLS configurations against current security standards.',
  },
  {
    id: 4,
    icon: Bug,
    title: 'Web Security',
    description: 'Detect misconfigurations, exposed headers, and common web vulnerabilities across your applications.',
  },
  {
    id: 5,
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track scan results, vulnerability trends, and security posture over time in real time.',
  },
  {
    id: 6,
    icon: CalendarClock,
    title: 'Scheduled Scans',
    description: 'Automate recurring security assessments on your own schedule — daily, weekly, or custom.',
  },
  {
    id: 7,
    icon: FileBarChart,
    title: 'Exportable Reports',
    description: 'Generate detailed PDF and JSON reports for compliance reviews and stakeholder briefings.',
  },
  {
    id: 8,
    icon: Server,
    title: 'Unified Asset View',
    description: 'All discovered infrastructure — hosts, ports, services, certificates — in a single security model.',
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
              className='group relative flex min-h-[210px] w-full flex-col items-center justify-center gap-4 rounded bg-zinc-100 p-6 text-center transition-all duration-300 hover:bg-linear-to-br hover:from-[#20F2EA] hover:to-[#36F200] dark:bg-zinc-900'
            >
              <Icon className='h-10 w-10 text-green-400 transition-colors duration-300 group-hover:text-white' />
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
