'use client';

import { Fragment, useState, ReactNode } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

import {
  TbChevronCompactRight,
  TbChevronCompactLeft,
  TbMinusVertical,
} from 'react-icons/tb';

import Image from 'next/image';
import logoLight from '@/images/company/logo-v7-black.png';
import logoDark from '@/images/company/logo-v7-white.png';

import { Tooltip } from './Tooltip';

const navigation = [
  { name: 'Dashboard', href: '/dash', icon: HomeIcon },
  { name: 'Team', href: '/team', icon: UsersIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'Documents', href: '/documents', icon: DocumentDuplicateIcon },
  { name: 'Reports', href: '/reports', icon: ChartPieIcon },
];

const teams = [
  { id: 1, name: 'Heroicons', href: '/teams/heroicons', initial: 'H' },
  { id: 2, name: 'Tailwind Labs', href: '/teams/tailwind', initial: 'T' },
  { id: 3, name: 'Workcation', href: '/teams/workcation', initial: 'W' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

interface SidebarProps {
  children: ReactNode;
}

const CollapseButton = ({ isCollapsed, setIsCollapsed }) => {
  const [hover, setHover] = useState(false);

  const handleMouseEnter = () => setHover(true);
  const handleMouseLeave = () => setHover(false);

  const getIcon = () => {
    const iconComponent = isCollapsed ? (
      <TbChevronCompactRight className='h-6 w-6 stroke-[3px] font-bold' />
    ) : (
      <TbChevronCompactLeft className='h-6 w-6 stroke-[3px]' />
    );

    const tooltipContent = isCollapsed ? 'Open sidebar' : 'Close sidebar';

    return (
      <Tooltip position='right' content={tooltipContent}>
        {iconComponent}
      </Tooltip>
    );
  };

  return (
    <div
      className={`fixed top-1/2 z-50 hidden -translate-y-1/2 transform lg:block ${
        isCollapsed ? 'left-[75px]' : 'left-[240px]'
      }`}
    >
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          setHover(false);
          setIsCollapsed(!isCollapsed);
        }}
        className='bg-black! flex items-center justify-center rounded-full p-2 text-black/25 hover:text-black focus:outline-hidden'
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {hover ? (
          getIcon()
        ) : (
          <TbMinusVertical className='h-6 w-6 transform stroke-[3px] text-black/25 hover:text-black' />
        )}
      </button>
    </div>
  );
};

interface SidebarProps {
  children: ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Mobile sidebar
  const mobileSidebar = (
    <Transition show={sidebarOpen} as={Fragment}>
      <Dialog
        as='div'
        className='relative z-50 lg:hidden'
        onClose={setSidebarOpen}
      >
        <TransitionChild
          as={Fragment}
          enter='transition-opacity ease-linear duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='transition-opacity ease-linear duration-300'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-zinc-900/80' />
        </TransitionChild>

        <div className='fixed inset-0 flex'>
          <TransitionChild
            as={Fragment}
            enter='transition ease-in-out duration-300 transform'
            enterFrom='-translate-x-full'
            enterTo='translate-x-0'
            leave='transition ease-in-out duration-300 transform'
            leaveFrom='translate-x-0'
            leaveTo='-translate-x-full'
          >
            <DialogPanel className='relative mr-16 flex w-full max-w-xs flex-1'>
              <TransitionChild
                as={Fragment}
                enter='ease-in-out duration-300'
                enterFrom='opacity-0'
                enterTo='opacity-100'
                leave='ease-in-out duration-300'
                leaveFrom='opacity-100'
                leaveTo='opacity-0'
              >
                <div className='absolute left-full top-0 flex w-16 justify-center pt-5'>
                  <button
                    type='button'
                    className='-m-2.5 p-2.5'
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className='sr-only'>Close sidebar</span>
                    <XMarkIcon
                      className='h-6 w-6 text-white'
                      aria-hidden='true'
                    />
                  </button>
                </div>
              </TransitionChild>
              <div className='bg-black! flex grow flex-col gap-y-5 overflow-y-auto bg-zinc-900 px-6 pb-2 ring-1 ring-white/10'>
                <div className='flex h-16 shrink-0 items-center pt-2'>
                  <Image
                    src={logoLight}
                    alt='V7 Capital'
                    width={150}
                    height={60}
                    className='block dark:hidden transition-all'
                  />
                  <Image
                    src={logoDark}
                    alt='V7 Capital'
                    width={150}
                    height={60}
                    className='hidden dark:block transition-all'
                  />
                </div>
                <nav className='flex flex-1 flex-col'>
                  <ul role='list' className='flex flex-1 flex-col gap-y-7'>
                    <li>
                      <ul role='list' className='-mx-2 space-y-1'>
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <a
                              href={item.href}
                              className={classNames(
                                pathname === item.href
                                  ? 'bg-zinc-800 text-white'
                                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                                'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6'
                              )}
                            >
                              <item.icon
                                className='h-6 w-6 shrink-0'
                                aria-hidden='true'
                              />
                              {item.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                    <li>
                      <div className='text-xs font-medium leading-6 text-zinc-400'>
                        Your teams
                      </div>
                      <ul role='list' className='-mx-2 mt-2 space-y-1'>
                        {teams.map((team) => (
                          <li key={team.name}>
                            <a
                              href={team.href}
                              className={classNames(
                                pathname === team.href
                                  ? 'bg-zinc-800 text-white'
                                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                                'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6'
                              )}
                            >
                              <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-[0.625rem] font-medium text-zinc-400 group-hover:text-white'>
                                {team.initial}
                              </span>
                              <span className='truncate'>{team.name}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );

  // Expanded sidebar for large screens
  const expandedSidebar = (
    <div className='hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-[245px] lg:flex-col'>
      <div className='bg-black! flex grow flex-col gap-y-5 overflow-y-auto bg-zinc-900 px-6'>
        <div className='flex h-16 shrink-0 items-center pt-2'>
          <Image
            src={logoLight}
            alt='V7 Capital'
            width={130}
            height={130}
            className='block dark:hidden'
          />
          <Image
            src={logoDark}
            alt='V7 Capital'
            width={130}
            height={130}
            className='hidden dark:block'
          />
        </div>
        <nav className='flex flex-1 flex-col'>
          <ul role='list' className='flex flex-1 flex-col gap-y-7'>
            <li>
              <ul role='list' className='-mx-2 space-y-1'>
                {navigation.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6'
                      )}
                    >
                      <item.icon
                        className='h-6 w-6 shrink-0'
                        aria-hidden='true'
                      />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <div className='text-xs font-medium leading-6 text-zinc-400'>
                Your teams
              </div>
              <ul role='list' className='-mx-2 mt-2 space-y-1'>
                {teams.map((team) => (
                  <li key={team.name}>
                    <a
                      href={team.href}
                      className={classNames(
                        pathname === team.href
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                        'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6'
                      )}
                    >
                      <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-[0.625rem] font-medium text-zinc-400 group-hover:text-white'>
                        {team.initial}
                      </span>
                      <span className='truncate'>{team.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </li>

            <li className='-mx-6 mt-auto pb-3'>
              <a
                href='/profile'
                className={classNames(
                  pathname === '/profile'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                  'mx-3 flex items-center gap-x-4 rounded-md px-3 py-2 text-sm font-medium leading-6'
                )}
              >
                <UserCircleIcon className='h-7 w-7 rounded-full' />
                <span className='sr-only'>Your profile</span>
                <span aria-hidden='true'>Your profile</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );

  // Collapsed sidebar for large screens
  const collapsedSidebar = (
    <div className='hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-[80px] lg:flex-col'>
      <div className='bg-black! flex grow flex-col gap-y-5 overflow-y-auto bg-zinc-900 px-2'>
        <nav className='flex flex-1 flex-col pt-7'>
          <ul role='list' className='flex flex-1 flex-col items-center gap-y-7'>
            {navigation.map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={classNames(
                    pathname === item.href
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                    'group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6'
                  )}
                >
                  <item.icon className='h-6 w-6 shrink-0' aria-hidden='true' />
                </a>
              </li>
            ))}

            <li className='-mx-6 mt-auto pb-3'>
              <a
                href='/profile'
                className={classNames(
                  pathname === '/profile'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                  'mx-3 flex items-center gap-x-4 rounded-md px-3 py-2 text-sm font-medium leading-6'
                )}
              >
                <UserCircleIcon className='h-7 w-7 rounded-full' />
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );

  const sidebarCollapseButton = <CollapseButton isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;

  return (
    <>
      <div>
        {mobileSidebar}
        {isCollapsed ? collapsedSidebar : expandedSidebar}
        {sidebarCollapseButton}

        <div className='bg-! sticky top-0 z-40 flex items-center gap-x-6 bg-zinc-900 px-4 py-4 shadow-xs sm:px-6 lg:hidden'>
          <button
            type='button'
            className='-m-2.5 p-2.5 text-white lg:hidden'
            onClick={() => setSidebarOpen(true)}
          >
            <span className='sr-only'>Open sidebar</span>
            <Bars3Icon className='h-6 w-6' aria-hidden='true' />
          </button>
          <div className='flex-1 text-sm font-medium leading-6 text-white'>
            Dashboard
          </div>
          <a href='#'>
            <span className='sr-only'>Your profile</span>
            <UserCircleIcon className='h-7 w-7 rounded-full text-white' />
          </a>
        </div>

        <main
          className={`py-10 ${
            isCollapsed ? 'lg:pl-20' : 'lg:pl-52'
          } h-screen bg-white`}
        >
          <div className='px-4 sm:px-6 lg:px-8'>{children}</div>
        </main>
      </div>
    </>
  );
};

export default Sidebar;
