import { FaLinkedin, FaGithub, FaEnvelope } from 'react-icons/fa6';
import Link from 'next/link';

const navigation = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/rbtrsv/',
    icon: FaLinkedin,
  },
  {
    name: 'GitHub',
    href: 'https://github.com/rbtrsv/',
    icon: FaGithub,
  },
  {
    name: 'Email',
    href: 'mailto:robert.radoslav@pm.me',
    icon: FaEnvelope,
  },
];

export default function Footer() {
  return (
    <footer className='bg-white dark:bg-black'>
      <div className='mx-auto max-w-7xl px-6 py-12 lg:px-8'>
        <div className='flex justify-center md:justify-between items-center mb-6'>
          <div className='flex space-x-4 text-sm text-black dark:text-white'>
            <Link href='/legal/privacy-policy' className='hover:text-cyan-500 dark:hover:text-cyan-500'>
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href='/legal/terms-of-service' className='hover:text-cyan-500 dark:hover:text-cyan-500'>
              Terms of Service
            </Link>
          </div>
          <div className='hidden md:flex space-x-6'>
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className='text-black hover:text-cyan-500 dark:text-white dark:hover:text-cyan-500'
              >
                <span className='sr-only'>{item.name}</span>
                <item.icon className='h-6 w-6' aria-hidden='true' />
              </a>
            ))}
          </div>
        </div>
        <div className='flex justify-center md:hidden space-x-6 mb-6'>
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className='text-black hover:text-cyan-500 dark:text-white dark:hover:text-cyan-500'
            >
              <span className='sr-only'>{item.name}</span>
              <item.icon className='h-6 w-6' aria-hidden='true' />
            </a>
          ))}
        </div>
        <p className='text-center md:text-left text-xs leading-5 text-black dark:text-white'>
          &copy; 2025 Buraro Technologies. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
