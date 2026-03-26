'use client';

import React, { useState, useEffect, Fragment, ReactNode } from 'react';
import { Dialog, Transition, TransitionChild } from '@headlessui/react';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { useSidebarStore } from '@/modules/dashboard/useSidebarStore';

import {
  HomeIcon as HomeIconOutline,
  StarIcon as StarIconOutline,
  UsersIcon as UsersIconOutline,
  FolderIcon as FolderIconOutline,
  CalendarIcon as CalendarIconOutline,
  DocumentDuplicateIcon as DocumentDuplicateIconOutline,
  ChartPieIcon as ChartPieIconOutline,
  XMarkIcon,
  UserCircleIcon as UserCircleIconOutline,
  Bars3Icon,
} from '@heroicons/react/24/outline';

import {
  HomeIcon as HomeIconSolid,
  StarIcon as StarIconSolid,
  UsersIcon as UsersIconSolid,
  FolderIcon as FolderIconSolid,
  CalendarIcon as CalendarIconSolid,
  DocumentDuplicateIcon as DocumentDuplicateIconSolid,
  ChartPieIcon as ChartPieIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import {
  TbMinusVertical,
} from 'react-icons/tb';

import Image from 'next/image';
import logoFinpy from '@/modules/main/images/logos/finpy_white.svg';
import { ToggleTooltip } from './ToggleTooltip';
import { CollapsedSidebarItem } from './CollapsedSidebarItem';
import { ExpandedSidebarItem } from './ExpandedSidebarItem';
import { CollapsedLetterBadgeItem } from './CollapsedLetterBadgeItem';
import { ExpandedLetterBadgeItem } from './ExpandedLetterBadgeItem';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    iconOutline: HomeIconOutline,
    iconSolid: HomeIconSolid,
  },
  {
    name: 'Premium',
    href: '/dashboard/premium',
    iconOutline: StarIconOutline,
    iconSolid: StarIconSolid,
  },
  {
    name: 'Team',
    href: '/team',
    iconOutline: UsersIconOutline,
    iconSolid: UsersIconSolid,
  },
  {
    name: 'Projects',
    href: '/projects',
    iconOutline: FolderIconOutline,
    iconSolid: FolderIconSolid,
  },
  {
    name: 'Calendar',
    href: '/calendar',
    iconOutline: CalendarIconOutline,
    iconSolid: CalendarIconSolid,
  },
  {
    name: 'Documents',
    href: '/documents',
    iconOutline: DocumentDuplicateIconOutline,
    iconSolid: DocumentDuplicateIconSolid,
  },
  {
    name: 'Neo4j',
    href: '/dashboard/neo4j',
    iconOutline: ChartPieIconOutline,
    iconSolid: ChartPieIconSolid,
  },
];

const teams = [
  { id: 1, name: 'Heroicons', href: '/teams/heroicons', initial: 'H' },
  { id: 2, name: 'Tailwind Labs', href: '/teams/tailwind', initial: 'T' },
  { id: 3, name: 'Workcation', href: '/teams/workcation', initial: 'W' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
const CollapseButton = ({ isCollapsed, setIsCollapsed }) => {
  const [hover, setHover] = useState(false);

  const handleMouseEnter = () => setHover(true);
  const handleMouseLeave = () => setHover(false);

  const getIcon = () => {
    const iconComponent = isCollapsed ? (
      <ChevronRightIcon className='h-5 w-5' />
    ) : (
      <ChevronLeftIcon className='h-5 w-5' />
    );

    const tooltipContent = isCollapsed ? 'Open sidebar' : 'Close sidebar';

    return (
      <ToggleTooltip position='right' content={tooltipContent} extraClasses=''>
        {iconComponent}
      </ToggleTooltip>
    );
  };

  return (
    <div
      className={`fixed top-1/2 z-50 hidden -translate-y-1/2 transform lg:block ${
        isCollapsed ? 'left-[68px]' : 'left-[218px]'
      }`}
    >
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          setHover(false);
          setIsCollapsed(!isCollapsed);
        }}
        className='flex items-center justify-center p-1 text-gray-400 hover:text-gray-600 focus:outline-none'
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {hover ? (
          getIcon()
        ) : (
          <TbMinusVertical className='h-5 w-5 transform stroke-[2px] text-gray-400' />
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
  const [hoveredItem, setHoveredItem] = useState(null);

  // const [isCollapsed, setIsCollapsed] = useState(false);
  // const { isCollapsed, setIsCollapsed } = useSidebar();
  const { isCollapsed, setIsCollapsed } = useSidebarStore();

  const isCurrentPath = (href) => pathname === href;

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
          <div className='fixed inset-0 bg-black opacity-50' />
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
            <Dialog.Panel className='relative mr-16 flex w-full max-w-xs flex-1'>
              <TransitionChild
                as={Fragment}
                enter='ease-in-out duration-300'
                enterFrom='opacity-0'
                enterTo='opacity-100'
                leave='ease-in-out duration-300'
                leaveFrom='opacity-100'
                leaveTo='opacity-0'
              >
                <div className='absolute top-0 left-full flex w-16 justify-center pt-5'>
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
              <div className='flex grow flex-col gap-y-5 overflow-y-auto bg-black px-6 pb-2 ring-1 ring-white/10'>
                <div className='flex h-16 shrink-0 items-center pt-2'>
                  <Image
                    src={logoFinpy}
                    alt='company logo'
                    width={140}
                    height={140}
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
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                              )}
                            >
                              {isCurrentPath(item.href) ? (
                                <item.iconSolid className='h-6 w-6' />
                              ) : (
                                <item.iconOutline className='h-6 w-6' />
                              )}
                              {item.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                    <li>
                      <div className='text-xs leading-6 font-medium text-zinc-400'>
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
                                'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
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
            </Dialog.Panel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );

  // Expanded sidebar for large screens
  const expandedSidebar = (
    <div className='hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-[225px] lg:flex-col'>
      <div className='flex grow flex-col gap-y-5 overflow-y-auto bg-black px-6'>
        <div className='flex h-16 shrink-0 items-center pt-2'>
          <Image src={logoFinpy} alt='company logo' width={120} height={120} />
        </div>
        <nav className='flex flex-1 flex-col'>
          <ul role='list' className='flex flex-1 flex-col gap-y-7'>
            <li>
              <ul role='list' className='-mx-2 space-y-1'>
                {navigation.map((item) => (
                  <ExpandedSidebarItem
                    key={item.name}
                    href={item.href}
                    icon={item.iconOutline}
                    iconSolid={item.iconSolid}
                    isActive={isCurrentPath(item.href)}
                    ariaLabel={item.name}
                  >
                    {item.name}
                  </ExpandedSidebarItem>
                ))}
              </ul>
            </li>
            <li>
              <div className='text-xs leading-6 font-medium text-zinc-400'>
                Your teams
              </div>
              <ul role='list' className='-mx-2 mt-2 space-y-1'>
                {teams.map((team) => (
                  <ExpandedLetterBadgeItem
                    key={team.name}
                    href={team.href}
                    initial={team.initial}
                    isActive={pathname === team.href}
                    ariaLabel={team.name}
                  >
                    {team.name}
                  </ExpandedLetterBadgeItem>
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
                  'mx-3 flex items-center gap-x-4 rounded-md px-3 py-2 text-sm leading-6 font-medium'
                )}
              >
                {isCurrentPath('/profile') ? (
                  <UserCircleIconSolid className='h-6 w-6' />
                ) : (
                  <UserCircleIconOutline className='h-6 w-6' />
                )}
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
    <div className='hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-[72px] lg:flex-col lg:bg-black'>
      <div className='mx-2 flex flex-1 flex-col items-center py-4'>
        {/* Logo at the top */}
        <div className='mb-4 flex h-16 w-full items-center justify-center'>
          <Image src={logoFinpy} alt='company logo' width={62} height={62} />
        </div>

        {/* Navigation links with tooltips only */}
        <nav className='w-full flex-1'>
          <ul role='list' className='flex flex-1 flex-col gap-y-7'>
            <li>
              <ul role='list' className='space-y-1'>
                {navigation.map((item) => (
                  <CollapsedSidebarItem
                    key={item.name}
                    href={item.href}
                    icon={item.iconOutline}
                    iconSolid={item.iconSolid}
                    isActive={isCurrentPath(item.href)}
                    ariaLabel={item.name}
                    tooltipContent={item.name}
                  />
                ))}
              </ul>
            </li>
            
            {/* Teams section with tooltips */}
            <li>
              <ul role='list' className='space-y-1'>
                {teams.map((team) => (
                  <CollapsedLetterBadgeItem
                    key={team.name}
                    href={team.href}
                    initial={team.initial}
                    isActive={pathname === team.href}
                    ariaLabel={team.name}
                    tooltipContent={team.name}
                  />
                ))}
              </ul>
            </li>
          </ul>
        </nav>

        {/* Profile link at the bottom with tooltip */}
        <div className='mt-auto w-full'>
          <CollapsedSidebarItem
            href='/profile'
            icon={UserCircleIconOutline}
            iconSolid={UserCircleIconSolid}
            isActive={isCurrentPath('/profile')}
            ariaLabel='Your profile'
            tooltipContent='Your profile'
          />
        </div>
      </div>
    </div>
  );

  const sidebarCollapseButton = (
    <CollapseButton isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
  );

  return (
    <>
      <div>
        {mobileSidebar}
        {isCollapsed ? collapsedSidebar : expandedSidebar}
        {sidebarCollapseButton}

        <div className='sticky top-0 z-40 flex items-center gap-x-6 bg-black px-4 py-4 shadow-sm sm:px-6 lg:hidden'>
          <button
            type='button'
            className='-m-2.5 p-2.5 text-white lg:hidden'
            onClick={() => setSidebarOpen(true)}
          >
            <span className='sr-only'>Open sidebar</span>
            <Bars3Icon className='h-6 w-6' aria-hidden='true' />
          </button>
          <div className='flex-1 text-sm leading-6 font-medium text-white'>
            Dashboard
          </div>
          <a
            href='/profile'
            onMouseEnter={() => setHoveredItem('profile')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span className='sr-only'>Your profile</span>
            {/* {isCurrentPath("/profile") ? <UserCircleIconSolid className='h-7 w-7  text-white' /> : <UserCircleIconOutline className='h-7 w-7 text-white' />} */}
            {hoveredItem === 'profile' ? (
              <UserCircleIconSolid
                className='h-7 w-7 text-white'
                aria-hidden='true'
              />
            ) : (
              <UserCircleIconOutline
                className='h-7 w-7 text-white'
                aria-hidden='true'
              />
            )}
          </a>
        </div>

        <main
          className={`py-10 ${
            isCollapsed ? 'lg:pl-[88px]' : 'lg:pl-52'
          } flex h-screen items-center justify-center bg-white`}
        >
          <div className='bg-white px-4 sm:px-6 lg:px-8'>{children}</div>
        </main>
      </div>
    </>
  );
};

export default Sidebar;
