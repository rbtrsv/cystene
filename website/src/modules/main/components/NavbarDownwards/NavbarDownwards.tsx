'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import logoCysteneDark from '@/modules/main/images/logos/cystene-black-text-with-logo.svg';
import logoCysteneLight from '@/modules/main/images/logos/cystene-white-text-with-logo.svg';
import { Sun, MoonStar, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';

const navItems = [
  { name: 'Features', link: '/#features' },
  { name: 'Blog', link: '/blog' },
  { name: 'Contact', link: '/#contact' },
  // {
  //   name: 'Resources',
  //   link: '#',
  //   subItems: [
  //     { name: 'Documentation', link: '/docs' },
  //     { name: 'Getting Started', link: '/getting-started' },
  //     { name: 'API Reference', link: '/api-reference' },
  //   ],
  // },
];

// Logo component — defined outside render to satisfy react-hooks/static-components
const Logo: React.FC = () => (
  <div className='mr-3 flex cursor-pointer items-center sm:mr-4 md:mr-5 lg:mr-6'>
    <Link href='/' className=''>
      <Image
        src={logoCysteneDark}
        alt='Cystene'
        width={110}
        height={75}
        className='block w-[100px] cursor-pointer sm:w-[105px] md:w-[110px] lg:w-[110px] xl:w-[110px] 2xl:w-[115px] dark:hidden'
        priority
      />
      <Image
        src={logoCysteneLight}
        alt='Cystene'
        width={110}
        height={75}
        className='hidden w-[100px] cursor-pointer sm:w-[105px] md:w-[110px] lg:w-[110px] xl:w-[110px] 2xl:w-[115px] dark:block'
        priority
      />
    </Link>
  </div>
);

// Theme switch button — receives handler as prop
const ThemeSwitchButton: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => (
  <button
    type='button'
    aria-label='Toggle dark mode'
    className='p-2 transition-colors duration-200'
    onClick={onSwitch}
  >
    <Sun className='hidden h-5 w-5 stroke-white/95 md:hover:stroke-green-400 dark:block' />
    <MoonStar className='h-5 w-5 stroke-black/95 md:hover:stroke-green-400 dark:hidden' />
  </button>
);

// Mobile menu button — receives open state and toggle handler as props
const MobileMenuButton: React.FC<{ open: boolean; onToggle: () => void }> = ({ open, onToggle }) => (
  <button
    onClick={onToggle}
    className='ml-4 cursor-pointer text-3xl md:hidden'
  >
    {open ? (
      <X className='h-6 w-6 text-black md:hover:text-green-400 dark:text-white' />
    ) : (
      <Menu className='h-6 w-6 text-black md:hover:text-green-400 dark:text-white' />
    )}
  </button>
);

const NavbarDownwards: React.FC = () => {
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(isDark ? 'dark' : 'light');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  return (
    <nav className={`bg-white/30 dark:bg-black/30 fixed top-0 left-0 z-50 w-full shadow-md backdrop-blur-lg transition-transform duration-300 ease-in-out ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div
        className={`flex items-center justify-between px-7 py-2 md:px-20 ${open ? 'bg-white dark:bg-black' : ''}`}
      >
        <Logo />

        {/* Mobile Controls: Theme Switch and Menu Button */}
        <div className='flex items-center md:hidden'>
          <ThemeSwitchButton onSwitch={handleThemeSwitch} />
          <MobileMenuButton open={open} onToggle={() => setOpen(!open)} />
        </div>

        {/* Desktop Menu */}
        <ul className='hidden md:flex md:w-auto md:items-center md:pl-0'>
          {navItems.map((item, index) => (
            <li
              key={item.name}
              className={`relative my-0 ${index !== 0 ? 'ml-2 sm:ml-3 md:ml-4 lg:ml-5 xl:ml-6' : ''} text-xs font-normal sm:text-sm md:text-sm lg:text-base xl:text-lg 2xl:text-xl`}
            >
              <Link
                href={item.link}
                className='text-xs font-medium text-black/95 transition-colors duration-200 hover:text-green-400 sm:text-sm md:text-sm lg:text-base xl:text-lg 2xl:text-xl dark:text-white/95 dark:hover:text-green-400'
              >
                {item.name}
              </Link>
              {/* Dropdown template (uncomment when subItems are added to navItems):
              {item.subItems && (
                <div className='group relative'>
                  <button className='flex items-center text-xs font-medium text-black/95 transition-colors duration-200 group-hover:text-green-400 sm:text-sm md:text-sm lg:text-base xl:text-lg 2xl:text-xl dark:text-white/95 dark:group-hover:text-green-400'>
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
              )}
              */}
            </li>
          ))}
          <li className='ml-4'>
            <ThemeSwitchButton onSwitch={handleThemeSwitch} />
          </li>
        </ul>

        {/* Mobile Menu */}
        <ul
          className={`absolute left-0 w-full pl-9 transition-all duration-0 ease-in md:hidden ${open ? 'top-[55px] h-screen bg-white dark:bg-black' : 'top-[-490px]'}`}
        >
          {navItems.map((item) => (
            <li key={item.name} className='my-7 text-xl font-normal'>
              <Link
                href={item.link}
                onClick={() => setOpen(false)}
                className='text-xl font-medium text-black/95 dark:text-white/95'
              >
                {item.name}
              </Link>
              {/* Mobile dropdown template (uncomment when subItems are added to navItems):
              {item.subItems && (
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
              )}
              */}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default NavbarDownwards;
