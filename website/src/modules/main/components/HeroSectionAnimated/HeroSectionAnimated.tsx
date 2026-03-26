import React from 'react';
import './HeroSectionAnimated.css';

const HeroSectionAnimated: React.FC = () => {
  return (
    <header id='hero-section'>
      <h1
        className='letter-spacing-custom text-center leading-none font-bold text-transparent select-none max-lg:text-5xl max-md:text-4xl max-sm:pt-24 max-sm:text-3xl sm:pt-36 lg:text-6xl'
        aria-label='Unparalleled. Commerce. Solutions.'
      >
        <span
          data-content='Unparalleled.'
          className='before:animate-gradient-background-1 relative mx-[-0.25rem] inline-block before:absolute before:top-0 before:bottom-0 before:left-0 before:z-0 before:block before:w-full before:px-2 before:text-center before:text-black before:content-[attr(data-content)] dark:before:text-white'
        >
          <span className='animate-gradient-foreground-1 from-[#c517ff] to-[#2631f7] bg-linear-to-r bg-clip-text px-2 text-transparent'>
            Unparalleled.
          </span>
        </span>
        <span
          data-content='Commerce.'
          className='before:animate-gradient-background-2 relative mx-[-0.25rem] inline-block before:absolute before:top-0 before:bottom-0 before:left-0 before:z-0 before:block before:w-full before:px-2 before:text-center before:text-black before:content-[attr(data-content)] dark:before:text-white'
        >
          <span className='animate-gradient-foreground-2 from-[#007cf0] to-[#00dfd8] bg-linear-to-r bg-clip-text px-2 text-transparent'>
            Commerce.
          </span>
        </span>
        <span
          data-content='Solutions.'
          className='before:animate-gradient-background-3 relative mx-[-0.25rem] inline-block before:absolute before:top-0 before:bottom-0 before:left-0 before:z-0 before:block before:w-full before:px-2 before:text-center before:text-black before:content-[attr(data-content)] dark:before:text-white'
        >
          <span className='animate-gradient-foreground-3 from-[#7928ca] to-[#ff0080] bg-linear-to-r bg-clip-text px-2 text-transparent'>
            Solutions.
          </span>
        </span>
      </h1>
      <h2 className='mx-auto max-w-3xl py-6 text-center leading-8 font-normal tracking-tight text-black/90 max-lg:text-lg max-sm:text-lg sm:px-16 lg:text-xl dark:text-white/90'>
        Smarter recommendations. More revenue. One platform for every store.
      </h2>
    </header>
  );
};

export default HeroSectionAnimated;
