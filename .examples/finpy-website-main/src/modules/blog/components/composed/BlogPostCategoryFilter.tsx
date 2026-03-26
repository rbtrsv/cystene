'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface BlogPost {
  title: string;
  slug: string;
  summary: string;
  publishDate: string;
  categories: string[];
  href?: string; // Optional custom href, if not provided uses /blog/articles/${slug}
}

interface BlogPostCategoryFilterProps {
  allCategories: string[];
  selectedCategories: string[];
  blogPosts: BlogPost[];
}

const BlogPostComponent: React.FC<BlogPost> = ({ title, slug, summary, publishDate, categories, href }) => {
  const linkHref = href || `/blog/articles/${slug}`;
  
  return (
    <article className="max-w-2xl mx-auto bg-linear-to-br from-[#c517ff] to-[#2631f7] p-[2px] my-4 rounded-lg shadow-lg">
      <div className="bg-zinc-100 dark:bg-zinc-900 p-4 sm:p-6 rounded-lg">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl mb-2">
          <Link href={linkHref}>
            <span className="text-zinc-800 hover:text-[#9f55f9] dark:text-zinc-200 dark:hover:text-[#9f55f9] cursor-pointer">
              {title}
            </span>
          </Link>
        </h2>
        <div className="text-xs text-zinc-600 dark:text-zinc-400 flex flex-col sm:flex-row sm:items-center">
          <time dateTime={publishDate}>{format(parseISO(publishDate), 'MMM d, yyyy')}</time>
          <span className="hidden sm:inline mx-2">•</span>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            {categories.map((category, index) => (
              <span 
                key={index} 
                className="bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-800 dark:text-zinc-200 text-xs inline-block hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors duration-200"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300 leading-6 line-clamp-3">{summary}</p>
      </div>
    </article>
  );
};

const BlogPostCategoryFilter: React.FC<BlogPostCategoryFilterProps> = ({
  allCategories,
  selectedCategories: initialSelectedCategories,
  blogPosts
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSelectedCategories);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedCategories(initialSelectedCategories);
  }, [initialSelectedCategories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCategoryChange = (category: string) => {
    const updatedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    setSelectedCategories(updatedCategories);
    const query = updatedCategories.length > 0 
      ? `?categories=${encodeURIComponent(updatedCategories.join(','))}`
      : '';
    router.push(`${pathname}${query}`);
  };

  const filteredPosts = selectedCategories.length > 0
    ? blogPosts.filter(post => post.categories.some(category => selectedCategories.includes(category)))
    : blogPosts;

  return (
    <>
      <div className="relative mt-8 max-w-xs mx-auto" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group w-full px-4 py-2 text-left bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#9f55f9]"
        >
          <span className="block truncate">
            {selectedCategories.length > 0 ? `${selectedCategories.length} selected` : 'Select categories'}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-zinc-400 group-hover:text-violet-600" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-violet-600" aria-hidden="true" />
            )}
          </span>
        </button>
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-lg max-h-60 overflow-auto">
            {allCategories.map((category) => (
              <label key={category} className="flex items-center px-4 py-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                  className="form-checkbox h-4 w-4 text-[#9f55f9] rounded-sm border-zinc-300 dark:border-zinc-600"
                />
                <span className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">{category}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      {selectedCategories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {selectedCategories.map((category) => (
            <span key={category} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#9f55f9] text-white">
              {category}
              <button
                onClick={() => handleCategoryChange(category)}
                className="ml-1 inline-flex items-center justify-center hover:bg-[#8f45e9] rounded-full p-0.5 transition-colors duration-200"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="mt-8 space-y-6">
        {filteredPosts.map((post) => (
          <BlogPostComponent key={post.slug} {...post} />
        ))}
      </div>
    </>
  );
};

export default BlogPostCategoryFilter;