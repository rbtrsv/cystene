import React from 'react';
import Image from 'next/image';
import { Category } from '@/modules/blog/components/composed/ImageLeftSection';

interface AlternativeArticleHeaderProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  imageAlt?: string;
  author?: string;
  publishDate?: string;
  categories?: Array<{
    label: string;
    variant?: 'energy' | 'health' | 'performance' | 'supplements' | 'default';
  }>;
  className?: string;
}

const AlternativeArticleHeader: React.FC<AlternativeArticleHeaderProps> = ({
  title,
  subtitle,
  imageUrl,
  imageAlt,
  author,
  publishDate,
  categories = [],
  className = ''
}) => {
  return (
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Left side - Image (optional) */}
        {imageUrl && (
          <div className="lg:col-span-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <Image
                src={imageUrl}
                alt={imageAlt || title}
                width={400}
                height={400}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
        )}
        
        {/* Right side - Content */}
        <div className={imageUrl ? "lg:col-span-8" : "lg:col-span-12"}>
          <div className="space-y-4">
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {title}
            </h1>
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {subtitle}
              </p>
            )}
            
            {/* Meta information */}
            {(author || publishDate) && (
              <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                {author && <span>{author}</span>}
                {author && publishDate && <span>•</span>}
                {publishDate && <span>{publishDate}</span>}
              </div>
            )}
            
            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {categories.map((category, index) => (
                  <Category 
                    key={index} 
                    label={category.label} 
                    variant={category.variant} 
                    size="md"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlternativeArticleHeader;