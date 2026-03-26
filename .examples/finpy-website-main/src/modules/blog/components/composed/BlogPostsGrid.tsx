import React from 'react';
import Link from 'next/link';

interface BlogPost {
  title: string;
  slug: string;
  summary: string;
  publishDate: string;
  categories: string[];
  href?: string;
}

interface BlogPostsGridProps {
  blogPosts: BlogPost[];
  selectedCategories: string[];
}

const BlogPostCard: React.FC<BlogPost> = ({ 
  title, 
  slug, 
  summary, 
  categories, 
  href 
}) => {
  const linkHref = href || `/blog/articles/${slug}`;
  
  return (
    <Link href={linkHref}>
      <article className="max-w-2xl mx-auto my-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 group cursor-pointer relative overflow-hidden">
        {/* Purple accent bar */}
        <div className="absolute left-0 top-0 w-1 h-full bg-linear-to-b from-[#c517ff] to-[#2631f7]" />
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 leading-tight">
            <span className="text-zinc-900 group-hover:text-[#9f55f9] dark:text-zinc-100 dark:group-hover:text-[#9f55f9] transition-colors duration-200">
              {title}
            </span>
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3 mb-6">{summary}</p>
          
          {/* Categories at bottom */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => {
              const getCategoryColor = (cat: string) => {
                const colors = {
                  'Lifestyle': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
                  'Demo': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
                  'Longevity': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
                  'Health': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
                  'Science': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
                  'Performance': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
                  'Supplements': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
                  'Entrepreneurship': 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
                  'Productivity': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800'
                };
                return colors[cat as keyof typeof colors] || 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600';
              };
              
              return (
                <span 
                  key={index} 
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-colors duration-200 ${getCategoryColor(category)}`}
                >
                  {category}
                </span>
              );
            })}
          </div>
        </div>
      </article>
    </Link>
  );
};

const BlogPostsGrid: React.FC<BlogPostsGridProps> = ({ 
  blogPosts, 
  selectedCategories 
}) => {
  // Filter posts based on selected categories
  const filteredPosts = selectedCategories.length === 0 
    ? blogPosts 
    : blogPosts.filter(post => 
        selectedCategories.some(category => 
          post.categories.includes(category)
        )
      );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      
      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {filteredPosts.length === blogPosts.length 
            ? `Showing all ${filteredPosts.length} articles`
            : `Showing ${filteredPosts.length} of ${blogPosts.length} articles`
          }
          {selectedCategories.length > 0 && (
            <span>
              {' '}in {selectedCategories.join(', ')}
            </span>
          )}
        </p>
      </div>

      {/* Posts List */}
      {filteredPosts.length > 0 ? (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <BlogPostCard key={post.slug} {...post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            No articles found
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Try selecting different categories or check back later for new content.
          </p>
        </div>
      )}
      
    </div>
  );
};

export default BlogPostsGrid;