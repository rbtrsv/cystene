import React from 'react';
import { CollapsedTooltip } from './CollapsedTooltip';

interface CollapsedLetterBadgeItemProps {
  href: string;
  initial: string;
  isActive: boolean;
  ariaLabel: string;
  tooltipContent: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-11 w-11', 
  lg: 'h-12 w-12'
};

export const CollapsedLetterBadgeItem: React.FC<CollapsedLetterBadgeItemProps> = ({
  href,
  initial,
  isActive,
  ariaLabel,
  tooltipContent,
  size = 'md'
}) => {
  return (
    <li className='w-full'>
      <CollapsedTooltip position='right' content={tooltipContent}>
        <a
          href={href}
          className={`flex ${sizeClasses[size]} mx-auto items-center justify-center rounded-lg p-1 ${
            isActive
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400'
          } hover:bg-zinc-800 hover:text-white transition-colors duration-200`}
          aria-label={ariaLabel}
        >
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-700 bg-zinc-800 text-[0.5rem] font-medium ${
            isActive ? 'text-white' : 'text-zinc-400'
          }`}>
            {initial}
          </span>
        </a>
      </CollapsedTooltip>
    </li>
  );
};