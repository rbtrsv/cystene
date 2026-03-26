import React from 'react';
import Image from 'next/image';
import Logo from '@/images/company/logo-v7-black.png';
import Link from 'next/link';
import {
  AiOutlineMenu,
  AiOutlineClose,
  AiOutlineInstagram,
  AiOutlineFacebook,
  AiOutlineTwitter,
} from 'react-icons/ai';
import { useState } from 'react';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = () => {
    setMenuOpen(!menuOpen);
  };
  return (
    <nav className='fixed z-10 h-20 w-full bg-white shadow-xl'>
      <div className='flex h-full w-full items-center justify-between px-4 xl:px-20 2xl:px-16'>
        {/* Desktop */}
        <Link href='/'>
          <Image
            src={Logo}
            alt='logo'
            width={205}
            height={75}
            className='cursor-pointer'
            priority
          />
        </Link>

        <div className='hidden sm:flex'>
          <ul className='hidden sm:flex'>
            <Link href='/about'>
              <li className='ml-10 text-xl uppercase hover:border-b'>Why Us</li>
            </Link>
            <Link href='/contact'>
              <li className='ml-10 text-xl uppercase hover:border-b'>
                Contact
              </li>
            </Link>
            <li className='ml-10'>
              <a
                href='https://substack.com/@v7capital'
                target='_blank'
                rel='noopener noreferrer'
                className='text-xl uppercase hover:border-b'
              >
                Social
              </a>
            </li>
            <Link href='/services'>
              <li className='ml-10 text-xl uppercase hover:border-b'>
                Services
              </li>
            </Link>
          </ul>
        </div>

        {/* Mobile */}
        <div onClick={handleNav} className='cursor-pointer pl-24 sm:hidden'>
          <AiOutlineMenu size={25} />
        </div>
      </div>
      <div
        className={
          menuOpen
            ? 'fixed left-0 top-0 h-screen w-[65%] bg-[#ecf0f3] p-10 duration-500 ease-in sm:hidden'
            : 'fixed -left-full top-0 p-10 duration-500 ease-in'
        }
      >
        <div className='flex w-full items-center justify-end'>
          <div onClick={handleNav} className='cursor-pointer'>
            <AiOutlineClose size={25} />
          </div>
        </div>

        <div className='flex-col py-4'>
          <ul>
            <Link href='/'>
              <li
                onClick={() => setMenuOpen(false)}
                className='cursor-pointer py-4'
              >
                Home
              </li>
            </Link>
            <Link href='/contact'>
              <li
                onClick={() => setMenuOpen(false)}
                className='cursor-pointer py-4'
              >
                Contact
              </li>
            </Link>
            <li className='cursor-pointer py-4'>
              <a
                href='https://substack.com/@v7capital'
                target='_blank'
                rel='noopener noreferrer'
                onClick={() => setMenuOpen(false)}
              >
                Social
              </a>
            </li>
            <Link href='/services'>
              <li
                onClick={() => setMenuOpen(false)}
                className='cursor-pointer py-4'
              >
                Services
              </li>
            </Link>
          </ul>
        </div>

        <div className='flex flex-row items-center justify-around pt-10'>
          <AiOutlineInstagram size={30} className='cursor-pointer' />
          <AiOutlineFacebook size={30} className='cursor-pointer' />
          <AiOutlineTwitter size={30} className='cursor-pointer' />
        </div>

        <div className='flex flex-col items-center justify-center pt-4'>
          <Link href='/'>
            <Image
              src={Logo}
              alt='logo'
              width={205}
              height={75}
              className='cursor-pointer pt-4'
              priority
            />
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
