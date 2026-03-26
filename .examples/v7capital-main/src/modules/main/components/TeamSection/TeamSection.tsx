import Image from 'next/image';

import IulianImage from '@/images/team/iulian-circiumaru.png';
import AndreiImage from '@/images/team/andrei-cretu.png';
import CameliaImage from '@/images/team/camelia-paduraru.png';
import RobertImage from '@/images/team/robert-radoslav.png';
import ElenaImage from '@/images/team/elena-sopotean.png';
import AndreeaImage from '@/images/team/andreea-budai.png';
import EduardImage from '@/images/team/eduard-burghelia.png';
import PaulImage from '@/images/team/paul-murariu.png';

const people = [
  {
    name: 'Iulian Circiumaru',
    role: 'Managing Partner',
    imageUrl: IulianImage,
    linkedinUrl: 'https://www.linkedin.com/in/iuliancirciumaru/',
  },
  {
    name: 'Camelia Păduraru',
    role: 'Partner',
    imageUrl: CameliaImage,
    linkedinUrl: 'https://www.linkedin.com/in/camelia-paduraru-cfa-99898a5/',
  },
  {
    name: 'Robert Radoslav',
    role: 'Investment Manager',
    imageUrl: RobertImage,
    linkedinUrl: 'https://www.linkedin.com/in/rbtrsv/',
  },
  {
    name: 'Elena Sopotean',
    role: 'Counsel',
    imageUrl: ElenaImage,
    linkedinUrl: 'https://www.linkedin.com/in/elena-sopotean-a02708107/',
  },
  {
    name: 'Eduard Burghelia',
    role: 'Venture Partner',
    imageUrl: EduardImage,
    linkedinUrl: 'https://www.linkedin.com/in/burghelia/',
  },
  {
    name: 'Andreea Budai',
    role: 'Communication & PR',
    imageUrl: AndreeaImage,
    linkedinUrl: 'https://www.linkedin.com/in/andreea-budai-b56a66a1/',
  },
  {
    name: 'Paul Murariu',
    role: 'Board Member',
    imageUrl: PaulImage,
    linkedinUrl: 'https://www.linkedin.com/in/paulmurariu/',
  },
  {
    name: 'Andrei Crețu',
    role: 'Board Member',
    imageUrl: AndreiImage,
    linkedinUrl: 'https://www.linkedin.com/in/andreicretu/',
  },
];

export default function TeamSection() {
  return (
    <div id='team' className='bg-white dark:bg-zinc-900 pt-24 max-sm:pt-16'>
      <div className='mx-auto max-w-7xl px-6 text-center lg:px-8'>
        <div className='mx-auto max-w-2xl'>
          <h2 className='text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl'>
            Meet our team
          </h2>
          <p className='mt-4 text-lg leading-8 text-zinc-700 dark:text-white'>
            Working together for over a decade. Serial entrepreneurs ourselves,
            with a background in management and strategy consulting, we know
            what it&apos;s like to be a Founder, grow and exit a business.
          </p>
        </div>

        <ul
          role='list'
          className='mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:justify-between lg:gap-8'
        >
          {people.map((person) => (
            <li
              key={person.name}
              className='rounded-2xl bg-zinc-100 px-8 py-10 dark:bg-zinc-800'
            >
              <Image
                className='mx-auto h-48 w-48 rounded-full md:h-56 md:w-56'
                src={person.imageUrl}
                alt={person.name}
                width={224}
                height={224}
                quality={75}
              />
              <h3 className='mt-6 text-base font-semibold leading-7 tracking-tight text-zinc-900 dark:text-white'>
                {person.name}
              </h3>
              <p className='text-sm leading-6 text-zinc-500 dark:text-zinc-400'>{person.role}</p>

              <ul role='list' className='mt-6 flex justify-center gap-x-6'>
                <li>
                  <a
                    href={person.linkedinUrl}
                    className='text-zinc-500 dark:text-zinc-400 hover:text-zinc-400 dark:hover:text-zinc-300'
                  >
                    <span className='sr-only'>LinkedIn</span>
                    <svg
                      className='h-5 w-5'
                      aria-hidden='true'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </a>
                </li>
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
