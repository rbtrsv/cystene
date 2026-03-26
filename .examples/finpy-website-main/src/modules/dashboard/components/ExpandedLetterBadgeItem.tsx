import React from 'react';

interface ExpandedLetterBadgeItemProps {
  href: string;
  initial: string;
  isActive: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const ExpandedLetterBadgeItem: React.FC<ExpandedLetterBadgeItemProps> = ({
  href,
  initial,
  isActive,
  ariaLabel,
  children
}) => {
  return (
    <li>
      <a
        href={href}
        className={classNames(
          isActive
            ? 'bg-zinc-800 text-white'
            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
        )}
        aria-label={ariaLabel}
      >
        <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-[0.625rem] font-medium text-zinc-400 group-hover:text-white'>
          {initial}
        </span>
        <span className='truncate'>{children}</span>
      </a>
    </li>
  );
};