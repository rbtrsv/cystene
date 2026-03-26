'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

interface BlogCategoryTabsProps {
  allCategories: string[];
  selectedCategories: string[];
}

const BlogCategoryTabs: React.FC<BlogCategoryTabsProps> = ({
  allCategories,
  selectedCategories
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (selectedCategories.includes(category)) {
      // Remove category if already selected
      const newCategories = selectedCategories.filter(cat => cat !== category);
      if (newCategories.length === 0) {
        params.delete('categories');
      } else {
        params.set('categories', newCategories.join(','));
      }
    } else {
      // Add new category to existing selection
      const newCategories = [...selectedCategories, category];
      params.set('categories', newCategories.join(','));
    }
    
    const queryString = params.toString();
    router.push(`/blog${queryString ? `?${queryString}` : ''}`);
  };

  const handleShowAll = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('categories');
    router.push('/blog');
  };

  const isAllSelected = selectedCategories.length === 0;

  // Define featured categories (always visible)
  const featuredCategories = ['Lifestyle', 'Health', 'Demo'];
  const additionalCategories = allCategories.filter(cat => !featuredCategories.includes(cat));
  
  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasAdditionalSelected = additionalCategories.some(cat => selectedCategories.includes(cat));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
      <div className="flex flex-wrap justify-center gap-3 items-center">
        
        {/* All Categories Tab */}
        <button
          onClick={handleShowAll}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            isAllSelected
              ? 'bg-linear-to-r from-[#c517ff] to-[#2631f7] text-white shadow-lg'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
          }`}
        >
          All
        </button>

        {/* Featured Category Tabs */}
        {featuredCategories.map((category) => {
          const isSelected = selectedCategories.includes(category);
          return (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-linear-to-r from-[#c517ff] to-[#2631f7] text-white shadow-lg'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              {category}
            </button>
          );
        })}

        {/* More Categories Dropdown */}
        {additionalCategories.length > 0 && (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                hasAdditionalSelected
                  ? 'bg-linear-to-r from-[#c517ff] to-[#2631f7] text-white shadow-lg'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              More
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 min-w-[150px] py-1">
                {additionalCategories.map((category) => {
                  const isSelected = selectedCategories.includes(category);
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        handleCategoryClick(category);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors duration-200 ${
                        isSelected
                          ? 'bg-linear-to-r from-[#c517ff] to-[#2631f7] text-white'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogCategoryTabs;