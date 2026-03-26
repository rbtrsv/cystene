import { FaLinkedin, FaSquareFacebook, FaInstagram } from 'react-icons/fa6';
import { SiSubstack } from 'react-icons/si';

const navigation = [
  {
    name: 'Substack',
    href: 'https://substack.com/@v7capital',
    icon: (props) => <SiSubstack {...props} />,
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/v7-capital/',
    icon: (props) => <FaLinkedin {...props} />,
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/v7capital/',
    icon: (props) => <FaInstagram {...props} />,
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/v7capital/',
    icon: (props) => <FaSquareFacebook {...props} />,
  },
];

export default function Footer() {
  return (
    <footer className='bg-white dark:bg-zinc-900'>
      <div className='mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8'>
        <div className='flex justify-center space-x-6 md:order-2'>
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className='text-gray-900  hover:text-[#fb8b6e] dark:text-gray-300 dark:hover:text-[#fb8b6e]'
            >
              <span className='sr-only'>{item.name}</span>
              <item.icon className='h-6 w-6' aria-hidden='true' />
            </a>
          ))}
        </div>
        <div className='mt-8 md:order-1 md:mt-0'>
          <p className='text-center text-xs leading-5 text-gray-900 dark:text-gray-300'>
            &copy; 2025 V7 Capital. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
