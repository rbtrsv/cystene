import React from 'react';
import { Metadata } from 'next';
import NavbarDownwards from '@/modules/main/components/NavbarDownwards/NavbarDownwards';
import Footer from '@/modules/main/components/Footer/Footer';
import BlogHeroHeader from '@/modules/blog/components/composed/BlogHeroHeader';
import BlogCategoryTabs from '@/modules/blog/components/composed/BlogCategoryTabs';
import BlogPostsGrid from '@/modules/blog/components/composed/BlogPostsGrid';
import BlogSearchBar from '@/modules/blog/components/composed/BlogSearchBar';
import { generatePageMetadata } from '@/modules/blog/components/composed/PageSEO';

export const metadata: Metadata = generatePageMetadata({
  title: 'Nudgio Blog',
  description: 'Insights on e-commerce, product recommendations, and growth strategies to help you increase revenue and customer engagement.',
  slug: 'blog',
  type: 'website',
  keywords: ['e-commerce', 'product recommendations', 'cross-selling', 'upselling', 'Shopify', 'WooCommerce', 'Magento'],
});

interface BlogPost {
  title: string;
  slug: string;
  summary: string;
  publishDate: string;
  categories: string[];
  href?: string;
}

const blogPosts: BlogPost[] = [
  {
    title: "Why Product Recommendations Matter for E-Commerce Revenue",
    slug: "why-product-recommendations-matter",
    summary: "Discover how AI-powered product recommendations can increase average order value, boost conversion rates, and create a personalized shopping experience for your customers.",
    publishDate: "2026-03-05",
    categories: ["E-Commerce", "Product Recommendations"],
    href: "/blog/articles/why-product-recommendations-matter"
  },
  {
    title: "Building a Cross-Platform E-Commerce Strategy",
    slug: "cross-platform-ecommerce-strategy",
    summary: "Learn why selling across Shopify, WooCommerce, and Magento simultaneously gives you a competitive edge — and how to unify your recommendation engine across all platforms.",
    publishDate: "2026-03-05",
    categories: ["E-Commerce", "Strategy"],
    href: "/blog/articles/cross-platform-ecommerce-strategy"
  },
];

export default async function BlogPage({
  searchParams
}: {
  searchParams: Promise<{ categories?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const selectedCategories = resolvedSearchParams.categories ? resolvedSearchParams.categories.split(',') : [];
  const allCategories = ['E-Commerce', 'Product Recommendations', 'Strategy'];

  return (
    <div className="flex flex-col min-h-screen">
      <NavbarDownwards />

      <main className="grow bg-white dark:bg-black">

        {/* Hero Header */}
        <section className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-4">
          <BlogHeroHeader />
        </section>

        {/* Category Filter with Search */}
        <section className="py-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <BlogCategoryTabs
            allCategories={allCategories}
            selectedCategories={selectedCategories}
          />

          {/* Search Bar below categories but above divider */}
          <div className="mt-6">
            <div className="w-72 max-w-72 mx-auto px-4">
              <BlogSearchBar blogPosts={blogPosts} />
            </div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-16">
          <BlogPostsGrid
            blogPosts={blogPosts}
            selectedCategories={selectedCategories}
          />
        </section>

        {/* Future: Pagination would go here */}

      </main>

      <Footer />
    </div>
  );
}
