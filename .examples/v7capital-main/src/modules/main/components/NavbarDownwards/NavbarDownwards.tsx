'use client';

import React, { useState, useEffect } from 'react';
import Button from './ButtonNavbar';
import Link from 'next/link';
import Image from 'next/image';
import logoLight from '@/images/company/logo-v7-black.png';
import logoDark from '@/images/company/logo-v7-white.png';

import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

function SunIcon(
  props: React.SVGProps<SVGSVGElement>
) {
  return (
    <svg
      viewBox='0 0 24 24'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      {...props}
    >
      <path d='M8 12.25A4.25 4.25 0 0 1 12.25 8v0a4.25 4.25 0 0 1 4.25 4.25v0a4.25 4.25 0 0 1-4.25 4.25v0A4.25 4.25 0 0 1 8 12.25v0Z' />
      <path
        d='M12.25 3v1.5M21.5 12.25H20M18.791 18.791l-1.06-1.06M18.791 5.709l-1.06 1.06M12.25 20v1.5M4.5 12.25H3M6.77 6.77 5.709 5.709M6.77 17.73l-1.061 1.061'
        fill='none'
      />
    </svg>
  );
}

function MoonIcon(
  props: React.SVGProps<SVGSVGElement>
) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
      <path
        d='M17.25 16.22a6.937 6.937 0 0 1-9.47-9.47 7.451 7.451 0 1 0 9.47 9.47ZM12.75 7C17 7 17 2.75 17 2.75S17 7 21.25 7C17 7 17 11.25 17 11.25S17 7 12.75 7Z'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

const NavbarDownwards: React.FC = () => {
  const Links = [
    { name: 'Work', link: '/#work' },
    { name: 'Press', link: '/#press' },
    { name: 'Team', link: '/#team' },
    { name: 'Portfolio', link: '/#portfolio' },
    { name: 'Contact', link: '/#contact' },
    { name: 'Social', link: 'https://substack.com/@v7capital', external: true },
    // { name: 'Blog', link: '/blog' },
  ];

  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(isDark ? 'dark' : 'light');

  const handleThemeSwitch = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  return (
    <nav className='backdrop-filter! fixed left-0 top-0 z-10 w-full bg-opacity-30 shadow-md backdrop-blur-lg'>
      <div
        className={`items-center justify-between px-7 py-3 md:flex md:px-20 ${
          open ? 'bg-white dark:bg-zinc-900' : ''
        }`}
      >
        <div className='flex cursor-pointer items-center'>
          <Link href='/'>
            <Image
              src={logoLight}
              alt='V7 Capital'
              width={170}
              height={75}
              className='block cursor-pointer dark:hidden'
              priority
            />
            <Image
              src={logoDark}
              alt='V7 Capital'
              width={170}
              height={75}
              className='hidden cursor-pointer dark:block'
              priority
            />
          </Link>
          {/* <span className='text-3xl text-indigo-600 mr-1 pt-2'>Company Name</span> */}
        </div>

        <div
          onClick={() => setOpen(!open)}
          className='absolute right-8 top-[18px] cursor-pointer text-3xl md:hidden'
        >
          {open ? (
            <XMarkIcon className='h-6 w-6 text-zinc-900 dark:text-white' />
          ) : (
            <Bars3Icon className='h-6 w-6 text-zinc-900 dark:text-white' />
          )}
        </div>

        <ul
          className={`absolute left-0 w-full pl-9 transition-all duration-0 ease-in md:static md:flex md:w-auto md:items-center md:pl-0 ${
            open
              ? 'top-16 h-screen bg-white dark:bg-zinc-900'
              : 'top-[-490px]'
          }`}
        >
          {Links.map((link) => (
            <li
              key={link.name}
              className='my-7 text-xl font-normal md:my-0 md:ml-8'
            >
              {/* For screen size below md */}
              <a
                onClick={() => setOpen(!open)}
                href={link.link}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className='text-2xl font-medium text-zinc-900 duration-100 hover:text-[#fb8b6e] dark:text-zinc-100 dark:hover:text-[#fb8b6e] md:hidden'
              >
                {link.name}
              </a>

              {/* For screen size above md */}
              <a
                href={link.link}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className='hidden font-medium text-zinc-900 duration-100 hover:text-[#fb8b6e] dark:text-zinc-100 dark:hover:text-[#fb8b6e] md:block'
              >
                {link.name}
              </a>
            </li>
          ))}

          {/* <Button>Get Started</Button> */}

          <li className='pl-5 max-md:pl-0'>
            <button
              type='button'
              aria-label='Toggle dark mode'
              className='pl-group rounded-full bg-white/90 px-3 py-2 shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-sm transition dark:bg-zinc-800/90 dark:ring-white/10 dark:hover:ring-white/20'
              onClick={handleThemeSwitch}
            >
              <SunIcon className='hidden h-5 w-5 fill-zinc-100 stroke-zinc-500 transition group-hover:fill-zinc-200 group-hover:stroke-zinc-700 dark:block [@media(prefers-color-scheme:dark)]:fill-violet-50 [@media(prefers-color-scheme:dark)]:stroke-orange-500 [@media(prefers-color-scheme:dark)]:group-hover:fill-violet-50 [@media(prefers-color-scheme:dark)]:group-hover:stroke-orange-600' />
              <MoonIcon className='h-5 w-5 fill-zinc-700 stroke-zinc-500 transition dark:hidden [@media(prefers-color-scheme:dark)]:group-hover:stroke-zinc-400 not-[@media_(prefers-color-scheme:dark)]:fill-orange-400/10 not-[@media_(prefers-color-scheme:dark)]:stroke-orange-500' />
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavbarDownwards;
