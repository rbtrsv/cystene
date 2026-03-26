import Image from 'next/image';
import Link from 'next/link';

import LogoConfidas from '@/images/portfolio/logos-confidas.png';
import Logo7Card from '@/images/portfolio/logos-7card.png';
import LogoEasySales from '@/images/portfolio/logo-easy-sales.png';
import LogoFitAds from '@/images/portfolio/logo-fitads.png';
import LogoMinunino from '@/images/portfolio/logo-minuninu.png';
import LogoFlip from '@/images/portfolio/logo-flip.png';
import LogoHolde from '@/images/portfolio/logo-holde.png';
import LogoIncorporate from '@/images/portfolio/logo-incorporate.png';
import LogoPluria from '@/images/portfolio/logo-pluria.png';
import LogoV7Studio from '@/images/portfolio/logo-v7studio.png';
import LogoWineful from '@/images/portfolio/logo-wineful.png';
import LogoFlowX from '@/images/portfolio/logo-flowx.png';
import LogoSEOMonitor from '@/images/portfolio/logo-seomonitor.png';
import LogoZaganu from '@/images/portfolio/logo-zaganu.png';
import LogoSportGuru from '@/images/portfolio/logo-sportguru.png';
import LogoOhvaz from '@/images/portfolio/logo-ohvaz-black.png';
import LogoEnten from '@/images/portfolio/logo-enten.png';
import LogoSeedblink from '@/images/portfolio/logo-seedblink.png';
import LogoZitamine from '@/images/portfolio/logo-zitamine.png';
import LogoNordensa from '@/images/portfolio/logo-nordensa.png';
import LogoCollabwriting from '@/images/portfolio/logo-collabwriting.png';
import LogoUpswing from '@/images/portfolio/logo-upswing.png';

const data = [
  {
    id: 1,
    href: 'https://zitamine.ro',
    image: LogoZitamine,
    text: 'Your personalized vitamins.',
    colour: 'bg-sky-400 hover:bg-sky-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: 'invert',
  },
  {
    id: 2,
    href: 'https://easy-sales.com/',
    image: LogoEasySales,
    text: 'Work smart, not hard. E-commerce made easy.',
    colour: 'bg-green-400 hover:bg-green-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: '',
  },
  {
    id: 3,
    href: 'http://fitads.ro',
    image: LogoFitAds,
    text: 'Indoor advertising network. The rest is noise.',
    colour: 'bg-yellow-400 hover:bg-yellow-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: '',
  },
  {
    id: 4,
    href: 'https://www.seomonitor.com/',
    image: LogoSEOMonitor,
    text: 'SEO optimization platform.',
    colour: 'bg-blue-400 hover:bg-blue-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: 'invert',
  },
  {
    id: 5,
    href: 'https://www.holde.eu/',
    image: LogoHolde,
    text: 'An innovative agricultural project in Romania.',
    colour: 'bg-fuchsia-400 hover:bg-fuchsia-600',
    label: 'LISTED',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: '',
  },
  {
    id: 6,
    href: 'https://www.sportguru.ro/',
    image: LogoSportGuru,
    text: 'Specialized sports goods retailer.',
    colour: 'bg-rose-400 hover:bg-rose-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: 'invert',
  },
  {
    id: 7,
    href: 'https://wineful.ro/',
    image: LogoWineful,
    text: 'The first wine subscription in Romania.',
    colour: 'bg-lime-400 hover:bg-lime-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: '',
  },
  {
    id: 8,
    href: 'https://www.flowx.ai',
    image: LogoFlowX,
    text: 'AI-powered enterprise application modernization.',
    colour: 'bg-violet-400 hover:bg-violet-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: 'invert',
  },
  {
    id: 9,
    href: 'https://www.bere-zaganu.ro/',
    image: LogoZaganu,
    text: 'Craft beer infused with passion and innovative flavors.',
    colour: 'bg-teal-400 hover:bg-teal-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: 'invert',
  },
  {
    id: 10,
    href: 'https://www.ohvaz.ro/',
    image: LogoOhvaz,
    text: 'Artisanal food products made with love in Romania.',
    colour: 'bg-yellow-400 hover:bg-yellow-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: 'invert',
  },
  {
    id: 11,
    href: 'https://enten.ro/',
    image: LogoEnten,
    text: 'Harvesting precision. Technology and expertise for optimal crop performance.',
    colour: 'bg-emerald-400 hover:bg-emerald-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: 'invert',
  },
  {
    id: 12,
    href: 'https://www.nordensa.com/',
    image: LogoNordensa,
    text: 'Fans can support talented young players to join major football clubs ',
    colour: 'bg-orange-400 hover:bg-orange-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: 'invert',
  },
  {
    id: 13,
    href: 'https://collabwriting.com/',
    image: LogoCollabwriting,
    text: 'Tool that helps people find, share and collaborate on online information.',
    colour: 'bg-red-400 hover:bg-red-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: 'invert',
  },
  {
    id: 14,
    href: 'https://upswing.ro/',
    image: LogoUpswing,
    text: 'SEO and Content Marketing Agency.',
    colour: 'bg-fuchsia-400 hover:bg-fuchsia-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: 'invert',
  },
  {
    id: 15,
    href: 'https://seedblink.com/',
    image: LogoSeedblink,
    text: 'Online investing platform for Tech Startups.',
    colour: 'bg-indigo-400 hover:bg-indigo-600',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: 'invert',
  },
  {
    id: 16,
    href: 'https://7card.ro/',
    image: Logo7Card,
    text: 'Romania’s main sport benefits concept',
    colour: 'bg-blue-400 hover:bg-blue-600',
    label: 'EXITED',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: '',
  },
  {
    id: 17,
    href: 'https://www.confidas.ro/',
    image: LogoConfidas,
    text: 'Confidas aims to help SMEs get paid on time.',
    colour: 'bg-purple-400 hover:bg-purple-600',
    label: 'EXITED',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: '',
  },
  {
    id: 18,
    href: 'https://flip.ro',
    image: LogoFlip,
    text: 'A first hand experience for your second hand device.',
    colour: 'bg-sky-400 hover:bg-sky-600',
    label: 'EXITED',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: '',
  },
  {
    id: 19,
    href: 'http://minunino.ro/',
    image: LogoMinunino,
    text: 'Supplements with herbal extracts for children.',
    colour: 'bg-lime-400 hover:bg-lime-600',
    label: 'EXITED',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: '',
  },
  {
    id: 20,
    href: 'https://v7studio.ro/',
    image: LogoV7Studio,
    text: 'Coworking space, a place to focus, collaborate and thrive!',
    colour: 'bg-indigo-400 hover:bg-indigo-600',
    label: 'EXITED',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: '',
  },
  {
    id: 21,
    href: 'https://incorporate.ro/',
    image: LogoIncorporate,
    text: 'Automated wonder tool for online company registration & management.',
    colour: 'bg-teal-400 hover:bg-teal-600',
    label: 'EXITED',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: '',
  },
  {
    id: 22,
    href: 'http://www.pluria.ro/',
    image: LogoPluria,
    text: 'Employee happiness platform.',
    colour: 'bg-rose-400 hover:bg-rose-600',
    label: 'EXITED',
    labelColour: 'bg-[#fb8b6e]',
    imageExtraConfig: '',
  },
];

export default function PortfolioProgress() {
  return (
    <section id='portfolio'>
      <div className='bg-white py-10 dark:bg-zinc-900 sm:py-14'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='text-2xl font-bold tracking-tight text-zinc-900 dark:text-white lg:text-5xl'>
            Portfolio
          </h2>
        </div>
      </div>

      <div className='grid gap-6 bg-white px-7 dark:bg-zinc-900 max-sm:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 md:px-20 lg:grid-cols-4'>
        {data.map((item) => (
          <a
            key={item.id}
            href={item.href}
            target='_blank'
            className={`${item.colour} justify-evenly! relative flex min-h-[210px] w-full flex-col items-center justify-around rounded p-3`}
          >
            <Image
              src={item.image}
              alt='logo'
              width={160}
              height={120}
              className={`cursor-pointer ${
                item.imageExtraConfig === 'invert'
                  ? 'brightness-50 contrast-150 grayscale invert filter'
                  : ''
              }`}
            />
            <p className='text-white max-sm:text-sm'>{item.text}</p>
            <div
              className={`absolute -top-3 left-2 rounded-sm px-1 text-sm text-white ${item.labelColour}`}
            >
              {item.label}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
