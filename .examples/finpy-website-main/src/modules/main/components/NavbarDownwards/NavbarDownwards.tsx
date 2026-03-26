'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logoFinpyDark from '@/modules/main/images/logos/finpy.svg';
import logoFinpyWhite from '@/modules/main/images/logos/finpy_white.svg';
import { Sun, MoonStar, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';

const navItems = [
  { name: 'Technologies', link: '/#technologies' },
  { name: 'Contact', link: '/#contact' },
  { name: 'Blog', link: '/blog' },
  { name: 'Dashboard', link: '/dashboard' },
  {
    name: 'Stock Market News',
    link: '#',
    subItems: [
      { name: 'Market Overview', link: '/market-overview' },
      { name: 'Company News', link: '/company-news' },
      { name: 'Economic Calendar', link: '/economic-calendar' },
    ],
  },
  {
    name: 'How to Invest',
    link: '#',
    subItems: [
      { name: "Beginner's Guide", link: '/beginners-guide' },
      { name: 'Investment Strategies', link: '/investment-strategies' },
      { name: 'Risk Management', link: '/risk-management' },
    ],
  },
];

const NavbarDownwards: React.FC = () => {
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(isDark ? 'dark' : 'light');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let lastScroll = 0;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only hide/show if we've scrolled past 100px
      if (currentScrollY < 100) {
        setIsVisible(true);
        lastScroll = currentScrollY;
        return;
      }
      
      if (currentScrollY > lastScroll) {
        // Scrolling down - hide after delay
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setIsVisible(false);
        }, 200);
      } else if (currentScrollY < lastScroll) {
        // Scrolling up - show immediately
        clearTimeout(timeoutId);
        setIsVisible(true);
      }
      
      lastScroll = currentScrollY;
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array

  const handleThemeSwitch = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    window.localStorage.setItem('theme', newTheme);
  };

  const Logo = () => (
    <div className='mr-3 flex cursor-pointer items-center sm:mr-4 md:mr-5 lg:mr-6'>
      <Link href='/' className=''>
        <Image
          src={logoFinpyDark}
          alt='logo'
          width={110}
          height={75}
          className='block w-[100px] cursor-pointer sm:w-[105px] md:w-[110px] lg:w-[110px] xl:w-[110px] 2xl:w-[115px] dark:hidden'
          priority
        />
        <Image
          src={logoFinpyWhite}
          alt='logo'
          width={110}
          height={75}
          className='hidden w-[100px] cursor-pointer sm:w-[105px] md:w-[110px] lg:w-[110px] xl:w-[110px] 2xl:w-[115px] dark:block'
          priority
        />
      </Link>
    </div>
  );

  const ThemeSwitchButton = () => (
    <button
      type='button'
      aria-label='Toggle dark mode'
      className='p-2 transition-colors duration-200'
      onClick={handleThemeSwitch}
    >
      <Sun className='hidden h-5 w-5 stroke-white/95 md:hover:stroke-violet-600 dark:block' />
      <MoonStar className='h-5 w-5 stroke-black/95 md:hover:stroke-violet-600 dark:hidden' />
    </button>
  );

  const MobileMenuButton = () => (
    <button
      onClick={() => setOpen(!open)}
      className='ml-4 cursor-pointer text-3xl md:hidden'
    >
      {open ? (
        <X className='h-6 w-6 text-black md:hover:text-violet-600 dark:text-white' />
      ) : (
        <Menu className='h-6 w-6 text-black md:hover:text-violet-600 dark:text-white' />
      )}
    </button>
  );

  return (
    <nav className={`bg-opacity-30 fixed top-0 left-0 z-50 w-full shadow-md backdrop-blur-lg backdrop-filter transition-transform duration-300 ease-in-out ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div
        className={`flex items-center justify-between px-7 py-2 md:px-20 ${open ? 'bg-white dark:bg-black' : ''}`}
      >
        <Logo />

        {/* Mobile Controls: Theme Switch and Menu Button */}
        <div className='flex items-center md:hidden'>
          <ThemeSwitchButton />
          <MobileMenuButton />
        </div>

        {/* Desktop Menu */}
        <ul className='hidden md:flex md:w-auto md:items-center md:pl-0'>
          {navItems.map((item, index) => (
            <li
              key={item.name}
              className={`relative my-0 ${index !== 0 ? 'ml-2 sm:ml-3 md:ml-4 lg:ml-5 xl:ml-6' : ''} text-xs font-normal sm:text-sm md:text-sm lg:text-base xl:text-lg 2xl:text-xl`}
            >
              {item.subItems ? (
                <div className='group relative'>
                  <button className='flex items-center text-xs font-medium text-black/95 transition-colors duration-200 group-hover:text-violet-600 sm:text-sm md:text-sm lg:text-base xl:text-lg 2xl:text-xl dark:text-white/95 dark:group-hover:text-violet-600'>
                    {item.name}
                    <ChevronDown className='ml-1 h-4 w-4 transition-transform duration-200 group-hover:hidden' />
                    <ChevronUp className='ml-1 hidden h-4 w-4 transition-transform duration-200 group-hover:block' />
                  </button>
                  <ul className='invisible absolute top-full left-0 mt-2 w-48 rounded-md border border-zinc-200 bg-white py-2 opacity-0 shadow-lg transition-all duration-300 group-hover:visible group-hover:opacity-100 dark:border-zinc-700 dark:bg-black'>
                    {item.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          href={subItem.link}
                          className='block px-4 py-2 mx-2 rounded-md text-[11px] text-black/95 hover:bg-zinc-100 sm:text-xs md:text-xs lg:text-sm dark:text-white/95 dark:hover:bg-zinc-800 transition-colors duration-150'
                        >
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Link
                  href={item.link}
                  className='text-xs font-medium text-black/95 transition-colors duration-200 hover:text-violet-600 sm:text-sm md:text-sm lg:text-base xl:text-lg 2xl:text-xl dark:text-white/95 dark:hover:text-violet-600'
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
          <li className='ml-4'>
            <ThemeSwitchButton />
          </li>
        </ul>

        {/* Mobile Menu */}
        <ul
          className={`absolute left-0 w-full pl-9 transition-all duration-0 ease-in md:hidden ${open ? 'top-[55px] h-screen bg-white dark:bg-black' : 'top-[-490px]'}`}
        >
          {navItems.map((item) => (
            <li key={item.name} className='my-7 text-xl font-normal'>
              {item.subItems ? (
                <div>
                  <button
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === item.name ? null : item.name
                      )
                    }
                    className='flex items-center text-xl font-medium text-black/95 dark:text-white/95'
                  >
                    {item.name}
                    {activeDropdown === item.name ? (
                      <ChevronUp className='ml-2 h-3 w-3 text-zinc-400' />
                    ) : (
                      <ChevronDown className='ml-2 h-3 w-3 text-zinc-400' />
                    )}
                  </button>
                  <ul
                    className={`mt-2 pl-4 ${activeDropdown === item.name ? 'block' : 'hidden'}`}
                  >
                    {item.subItems.map((subItem) => (
                      <li key={subItem.name} className='my-2'>
                        <Link
                          href={subItem.link}
                          onClick={() => setOpen(false)}
                          className='block text-base font-normal text-black/90 dark:text-white/90'
                        >
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Link
                  href={item.link}
                  onClick={() => setOpen(false)}
                  className='text-xl font-medium text-black/95 dark:text-white/95'
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default NavbarDownwards;
