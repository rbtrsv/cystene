import Image from 'next/image';
import LogoConfidas from '../../../../../public/logos-confidas.png';
import Logo7Card from '../../../../../public/logos-7card.png';
import LogoEasySales from '../../../../../public/logo-easy-sales.png';
import LogoFitAds from '../../../../../public/logo-fitads.png';
import LogoMinunino from '../../../../../public/logo-minuninu.png';
import LogoFlip from '../../../../../public/logo-flip.png';
import LogoHolde from '../../../../../public/logo-holde.png';
import LogoIncorporate from '../../../../../public/logo-incorporate.png';
import LogoPluria from '../../../../../public/logo-pluria.png';
import LogoV7Studio from '../../../../../public/logo-v7studio.png';
import LogoWineful from '../../../../../public/logo-wineful.png';

const data = [
  {
    id: 1,
    href: 'https://7card.ro/',
    image: Logo7Card,
    text: 'Romania’s main sport benefits concept',
    colour: 'bg-blue-400 hover:bg-blue-700',
    label: 'EXITED',
    labelColour: 'bg-[#fb8b6e]',
  },
  {
    id: 2,
    href: 'https://www.confidas.ro/',
    image: LogoConfidas,
    text: 'Confidas aims to help SMEs get paid on time',
    colour: 'bg-purple-400 hover:bg-purple-700',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
  },
  {
    id: 3,
    href: 'https://easy-sales.com/',
    image: LogoEasySales,
    text: 'Work smart, not hard. E-commerce made easy',
    colour: 'bg-green-400 hover:bg-green-700',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
  },
  {
    id: 4,
    href: 'http://fitads.ro',
    image: LogoFitAds,
    text: 'Indoor advertising network. The rest is noise',
    colour: 'bg-yellow-400 hover:bg-yellow-700',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
  },
  {
    id: 5,
    href: 'https://flip.ro',
    image: LogoFlip,
    text: 'A first hand experience for your second hand device',
    colour: 'bg-green-400 hover:bg-green-700',
    label: 'EXITED',
    labelColour: 'bg-[#fb8b6e]',
  },
  {
    id: 6,
    href: 'https://incorporate.ro/',
    image: LogoIncorporate,
    text: 'Automated wonder tool for online company registration & management',
    colour: 'bg-teal-400 hover:bg-teal-700',
    label: 'EXITED',
    labelColour: 'bg-[#fb8b6e]',
  },
  {
    id: 7,
    href: 'https://www.holde.eu/',
    image: LogoHolde,
    text: 'An innovative agricultural project in Romania',
    colour: 'bg-blue-400 hover:bg-blue-700',
    label: 'LISTED',
    labelColour: 'bg-[#fb8b6e]',
  },
  {
    id: 8,
    href: 'http://minunino.ro/',
    image: LogoMinunino,
    text: 'Supplements with herbal extracts for children',
    colour: 'bg-sky-400 hover:bg-sky-700',
    label: 'EXITED',
    labelColour: 'bg-[#fb8b6e]',
  },
  {
    id: 9,
    href: 'http://www.pluria.ro/front/',
    image: LogoPluria,
    text: 'Employee Happiness Platform',
    colour: 'bg-rose-400 hover:bg-rose-700',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
  },
  {
    id: 10,
    href: 'https://v7studio.ro/',
    image: LogoV7Studio,
    text: 'Coworking space, a place to focus, collaborate and thrive!',
    colour: 'bg-amber-400 hover:bg-amber-700',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
  },
  {
    id: 11,
    href: 'https://wineful.ro/',
    image: LogoWineful,
    text: 'The first wine subscription in Romania',
    colour: 'bg-violet-400 hover:bg-violet-700',
    label: '',
    labelColour: 'bg-[#fb8b6e]',
  },
];

export default function Portfolio() {
  return (
    <section>
      <div className='bg-zinc-900 py-10 sm:py-14'>
        <div className='mx-auto max-w-2xl text-center'>
          <h1
            id='portfolio'
            className='text-2xl font-bold tracking-tight text-white lg:text-5xl'
          >
            Portfolio
          </h1>
        </div>
      </div>

      <div className='grid bg-zinc-900 px-7 max-sm:grid-cols-2 max-sm:gap-5 sm:grid-cols-3 sm:justify-evenly sm:gap-6 md:px-20 lg:grid-cols-4 lg:justify-items-center lg:gap-12'>
        {data.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`${item.colour} relative flex h-[250px] w-[250px] flex-col items-center rounded p-3 max-sm:h-auto max-sm:w-auto lg:h-[270px] lg:w-[270px]`}
          >
            <Image
              src={item.image}
              alt='logo'
              width={180}
              height={75}
              className='cursor-pointer'
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
