import React from 'react';
import { format, parseISO } from 'date-fns';

interface ArticleHeaderProps {
  title: string;
  publishDate?: string;
  categories: string[];
}

const ArticleHeader: React.FC<ArticleHeaderProps> = ({ title, publishDate, categories }) => {
  return (
    <header className="mb-8 sm:mb-12">
      <h1 className="bg-linear-to-br from-[#c517ff] to-[#2631f7] bg-clip-text text-center text-3xl sm:text-4xl font-bold text-transparent mb-4 sm:mb-6">
        {title}
      </h1>
      <div className="text-center text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
        <div className="flex flex-col sm:flex-row sm:items-center justify-center">
          {publishDate && (
            <>
              <time dateTime={publishDate}>{format(parseISO(publishDate), 'MMM d, yyyy')}</time>
              <span className="hidden sm:inline mx-2">•</span>
            </>
          )}
          <div className="flex flex-wrap justify-center gap-2 mt-2 sm:mt-0">
            {categories.map((category, index) => (
              <span 
                key={index}
                className="bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm inline-block hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors duration-200"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ArticleHeader;
