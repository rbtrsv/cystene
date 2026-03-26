import React, { FC, ReactNode } from 'react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
interface ToggleTooltipProps {
  position: 'top' | 'bottom' | 'left' | 'right';
  content: React.ReactNode;
  children: React.ReactNode;
  extraClasses?: string;
}

export const ToggleTooltip: FC<ToggleTooltipProps> = ({
  position,
  content,
  children,
  extraClasses = '',
}) => (
  <div id='toggle-tooltip' className='group relative cursor-pointer'>
    <div>{children}</div>
    <span
      className={classNames(
        'absolute hidden rounded bg-zinc-900 p-2 text-sm whitespace-nowrap text-white group-hover:inline-block',
        extraClasses,
        position === 'top'
          ? 'bottom-[calc(100%+5px)] left-1/2 -translate-x-1/2'
          : '',
        position === 'bottom'
          ? 'top-[calc(100%+5px)] left-1/2 -translate-x-1/2'
          : '',
        position === 'left'
          ? 'top-1/2 right-[calc(100%+5px)] -translate-y-1/2'
          : '',
        position === 'right'
          ? 'top-1/2 left-[calc(100%+5px)] -translate-y-1/2'
          : ''
      )}
    >
      {content}
    </span>
    <span
      className={classNames(
        'absolute hidden border-[6px] group-hover:inline-block',
        extraClasses,
        position === 'top'
          ? 'bottom-full left-1/2 -translate-x-1/2 border-b-0 border-t-zinc-900 border-r-transparent border-l-transparent'
          : '',
        position === 'bottom'
          ? 'top-full left-1/2 -translate-x-1/2 border-t-0 border-r-transparent border-b-zinc-900 border-l-transparent'
          : '',
        position === 'left'
          ? 'top-1/2 right-full -translate-y-1/2 border-r-0 border-t-transparent border-b-transparent border-l-zinc-900'
          : '',
        position === 'right'
          ? 'top-1/2 left-full -translate-y-1/2 border-l-0 border-t-transparent border-r-zinc-900 border-b-transparent'
          : ''
      )}
    ></span>
  </div>
);
