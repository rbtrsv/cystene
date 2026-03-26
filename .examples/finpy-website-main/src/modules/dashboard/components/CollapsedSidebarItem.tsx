import React from 'react';
import { CollapsedTooltip } from './CollapsedTooltip';

interface CollapsedSidebarItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
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

export const CollapsedSidebarItem: React.FC<CollapsedSidebarItemProps> = ({
  href,
  icon: Icon,
  iconSolid: IconSolid,
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
          {isActive ? (
            <IconSolid className='h-5 w-5' />
          ) : (
            <Icon className='h-5 w-5' />
          )}
        </a>
      </CollapsedTooltip>
    </li>
  );
};