function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

interface TooltipProps {
  position: 'top' | 'bottom' | 'left' | 'right';
  content: React.ReactNode;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
  position,
  content,
  children,
}) => (
  <div id='tooltip' className='group relative cursor-pointer'>
    <div className='pr-1!'>{children}</div>
    <span
      className={classNames(
        'absolute hidden whitespace-nowrap rounded bg-zinc-800 p-2 text-sm text-white group-hover:inline-block',
        position === 'top'
          ? 'bottom-[calc(100%+5px)] left-1/2 -translate-x-1/2'
          : '',
        position === 'bottom'
          ? 'left-1/2 top-[calc(100%+5px)] -translate-x-1/2'
          : '',
        position === 'left'
          ? 'right-[calc(100%+5px)] top-1/2 -translate-y-1/2'
          : '',
        position === 'right'
          ? 'left-[calc(100%+5px)] top-1/2 -translate-y-1/2'
          : ''
      )}
    >
      {content}
    </span>
    <span
      className={classNames(
        'absolute hidden border-[6px] group-hover:inline-block',
        position === 'top'
          ? 'bottom-full left-1/2 -translate-x-1/2 border-b-0 border-l-transparent border-r-transparent border-t-zinc-800'
          : '',
        position === 'bottom'
          ? 'left-1/2 top-full -translate-x-1/2 border-t-0 border-b-zinc-800 border-l-transparent border-r-transparent'
          : '',
        position === 'left'
          ? 'right-full top-1/2 -translate-y-1/2 border-r-0 border-b-transparent border-l-zinc-800 border-t-transparent'
          : '',
        position === 'right'
          ? 'left-full top-1/2 -translate-y-1/2 border-l-0 border-b-transparent border-r-zinc-800 border-t-transparent'
          : ''
      )}
    ></span>
  </div>
);
