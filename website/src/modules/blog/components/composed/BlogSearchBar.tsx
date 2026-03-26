'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { searchBlogPosts, highlightText } from '@/modules/blog/lib/search';
import type { BlogPost, SearchResult } from '@/modules/blog/lib/search';

interface BlogSearchBarProps {
  blogPosts: BlogPost[];
  onSearchResults?: (results: SearchResult[]) => void;
  className?: string;
}

const BlogSearchBar: React.FC<BlogSearchBarProps> = ({
  blogPosts,
  onSearchResults,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);


  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      onSearchResults?.([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate slight delay to show loading state
    setTimeout(() => {
      const searchResults = searchBlogPosts(searchQuery, blogPosts);
      setResults(searchResults);
      setShowResults(true);
      setIsLoading(false);
      onSearchResults?.(searchResults);
    }, 100);
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onSearchResults?.([]);
    inputRef.current?.focus();
  };

  // Handle result click
  const handleResultClick = () => {
    setShowResults(false);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-zinc-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search articles..."
          className="block w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors duration-200"
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (query.length > 1) && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          
          {isLoading ? (
            <div className="p-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-700">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              
              {results.slice(0, 8).map((result) => (
                <Link
                  key={result.slug}
                  href={result.href || `/blog/articles/${result.slug}`}
                  onClick={handleResultClick}
                  className="block p-3 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors duration-200 border-b border-zinc-100 dark:border-zinc-700 last:border-b-0"
                >
                  <div className="flex flex-col space-y-1.5">
                    {/* Title */}
                    <h3 
                      className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightText(result.title, result.highlights) 
                      }}
                    />
                    
                    {/* Categories */}
                    {result.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.categories.map((category, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Snippet */}
                    <p 
                      className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightText(result.snippet, result.highlights) 
                      }}
                    />
                    
                    {/* Score (for debugging - remove in production) */}
                    {process.env.NODE_ENV === 'development' && (
                      <span className="text-xs text-zinc-400">Score: {result.score}</span>
                    )}
                  </div>
                </Link>
              ))}
              
              {results.length > 8 && (
                <div className="p-3 text-xs text-zinc-500 dark:text-zinc-400 text-center border-t border-zinc-100 dark:border-zinc-700">
                  Showing top 8 of {results.length} results
                </div>
              )}
            </>
          ) : (
            <div className="p-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No articles found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
      
    </div>
  );
};

export default BlogSearchBar;