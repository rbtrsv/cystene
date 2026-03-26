import { ChevronRightIcon } from '@heroicons/react/20/solid';
import heroLogo from '../../../../../public/hero-v7-2x.jpg';
import Image from 'next/image';

export default function HeroSectionImage() {
  return (
    <div className='relative isolate overflow-hidden bg-zinc-900'>
      <svg
        className='absolute inset-0 -z-10 h-full w-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-white/10'
        aria-hidden='true'
      >
        <defs>
          <pattern
            id='983e3e4c-de6d-4c3f-8d64-b9761d1534cc'
            width={200}
            height={200}
            x='50%'
            y={-1}
            patternUnits='userSpaceOnUse'
          >
            <path d='M.5 200V.5H200' fill='none' />
          </pattern>
        </defs>
        <svg x='50%' y={-1} className='overflow-visible fill-zinc-700/20'>
          <path
            d='M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z'
            strokeWidth={0}
          />
        </svg>
        <rect
          width='100%'
          height='100%'
          strokeWidth={0}
          fill='url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)'
        />
      </svg>
      <div
        className='absolute top-10 left-[calc(50%-4rem)] -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:top-[calc(50%-30rem)] lg:left-48 xl:left-[calc(50%-24rem)]'
        aria-hidden='true'
      >
        <div
          className='aspect-1108/632 w-277 bg-linear-to-r from-[#80caff] to-[#4f46e5] opacity-20'
          style={{
            clipPath:
              'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
          }}
        />
      </div>

      <section className='relative -z-10 flex h-full w-full flex-col justify-evenly bg-cover max-sm:pt-20 sm:flex-row sm:pt-36'>
        <div className='basis-1/2 max-md:px-7 md:pl-20 lg:pt-10 lg:pr-10 lg:pl-28'>
          <h1 className='pb-4 text-left text-4xl font-bold text-white lg:text-6xl'>
            Start-up studio focused on <br />
            <span className='bg-linear-to-br from-[#fb8b6e] to-[#f5db8b] bg-clip-text text-4xl font-bold text-transparent lg:text-6xl'>
              Romanian <br /> ventures.
            </span>
          </h1>
          <p className='text-xl text-white lg:py-4 lg:pr-28 lg:text-2xl'>
            We are neither an incubator, nor a pure venture capital firm. We are
            a company that creates and grows companies.
          </p>
        </div>

        <div className='basis-1/2 sm:pb-8 md:pr-10 lg:pr-20 lg:pb-12'>
          <Image
            className='rounded-lg max-sm:my-5 max-sm:scale-95 sm:scale-100'
            src={heroLogo}
            alt='Hero image'
            height={650}
            width={650}
          />
        </div>
      </section>
    </div>
  );
}
