import { FaLinkedin, FaInstagram, FaGithub, FaEnvelope } from 'react-icons/fa6';

const navigation = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/rbtrsv/',
    icon: FaLinkedin,
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/rbtrsv/',
    icon: FaInstagram,
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
      <div className='mx-auto max-w-(--breakpoint-2xl) px-7 py-12 md:flex md:items-center md:justify-between md:px-20'>
        <div className='flex justify-center space-x-6 md:order-2'>
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className='text-black hover:text-violet-600 dark:text-white dark:hover:text-violet-600'
            >
              <span className='sr-only'>{item.name}</span>
              <item.icon className='h-6 w-6' aria-hidden='true' />
            </a>
          ))}
        </div>
        <div className='mt-8 md:order-1 md:mt-0'>
          <p className='text-center text-xs leading-5 text-black dark:text-white'>
            &copy; 2023 Buraro & Finpy Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
