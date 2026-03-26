import React, { FC } from 'react';

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface CollapsedTooltipProps {
  position: 'top' | 'bottom' | 'left' | 'right';
  content: React.ReactNode;
  children: React.ReactNode;
  extraClasses?: string;
}

export const CollapsedTooltip: FC<CollapsedTooltipProps> = ({
  position,
  content,
  children,
  extraClasses = '',
}) => (
  <div id='collapsed-tooltip' className='group relative cursor-pointer'>
    <div>{children}</div>
    <span
      className={classNames(
        'absolute hidden rounded bg-zinc-900 px-2 py-1 text-sm whitespace-nowrap text-white group-hover:inline-block z-50',
        extraClasses,
        position === 'top'
          ? 'bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2'
          : '',
        position === 'bottom'
          ? 'top-[calc(100%+12px)] left-1/2 -translate-x-1/2'
          : '',
        position === 'left'
          ? 'top-1/2 right-[calc(100%+12px)] -translate-y-1/2'
          : '',
        position === 'right'
          ? 'top-1/2 left-[calc(100%+12px)] -translate-y-1/2'
          : ''
      )}
    >
      {content}
    </span>
    <span
      className={classNames(
        'absolute hidden border-[6px] group-hover:inline-block z-40',
        extraClasses,
        position === 'top'
          ? 'bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 border-b-0 border-t-zinc-900 border-r-transparent border-l-transparent'
          : '',
        position === 'bottom'
          ? 'top-[calc(100%+6px)] left-1/2 -translate-x-1/2 border-t-0 border-r-transparent border-b-zinc-900 border-l-transparent'
          : '',
        position === 'left'
          ? 'top-1/2 right-[calc(100%+6px)] -translate-y-1/2 border-r-0 border-t-transparent border-b-transparent border-l-zinc-900'
          : '',
        position === 'right'
          ? 'top-1/2 left-[calc(100%+6px)] -translate-y-1/2 border-l-0 border-t-transparent border-r-zinc-900 border-b-transparent'
          : ''
      )}
    ></span>
  </div>
);