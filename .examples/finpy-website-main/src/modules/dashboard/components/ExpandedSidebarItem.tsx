import React from 'react';

interface ExpandedSidebarItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}

export const ExpandedSidebarItem: React.FC<ExpandedSidebarItemProps> = ({
  href,
  icon: Icon,
  iconSolid: IconSolid,
  isActive,
  ariaLabel,
  children
}) => {
  return (
    <li>
      <a
        href={href}
        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium ${
          isActive
            ? 'bg-zinc-800 text-white'
            : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
        }`}
        aria-label={ariaLabel}
      >
        {isActive ? (
          <IconSolid className='h-6 w-6' />
        ) : (
          <Icon className='h-6 w-6' />
        )}
        {children}
      </a>
    </li>
  );
};