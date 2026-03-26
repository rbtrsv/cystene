import React from 'react';

interface BlockquoteProps {
  children: React.ReactNode;
  author?: string;
  className?: string;
}

const Blockquote: React.FC<BlockquoteProps> = ({ 
  children, 
  author,
  className = '' 
}) => {
  return (
    <blockquote 
      className={`border-l-4 border-l-[#9f55f9] pl-4 py-2 my-4 italic text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 rounded-r-md ${className}`}
    >
      <div className="text-sm sm:text-base leading-relaxed">
        {children}
      </div>
      {author && (
        <footer className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 not-italic font-medium">
          — {author}
        </footer>
      )}
    </blockquote>
  );
};

export default Blockquote;