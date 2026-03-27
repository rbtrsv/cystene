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
  title: 'Cystene Blog',
  description: 'Insights on cybersecurity, vulnerability scanning, and infrastructure security to help you protect your systems and stay ahead of threats.',
  slug: 'blog',
  type: 'website',
  keywords: ['cybersecurity', 'vulnerability scanning', 'penetration testing', 'SSL/TLS', 'port scanning', 'DNS enumeration', 'security assessment'],
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
    title: "Why Continuous Vulnerability Scanning Matters for Infrastructure Security",
    slug: "why-vulnerability-scanning-matters",
    summary: "Discover why regular, automated vulnerability scanning is critical for identifying security gaps, reducing risk, and maintaining a strong security posture across your infrastructure.",
    publishDate: "2026-03-05",
    categories: ["Cybersecurity", "Vulnerability Scanning"],
    href: "/blog/articles/why-vulnerability-scanning-matters"
  },
  {
    title: "Understanding Your Attack Surface: DNS, SSL, and Web Security",
    slug: "understanding-your-attack-surface",
    summary: "Learn how DNS enumeration, SSL/TLS analysis, and web security scanning work together to map your full attack surface and identify vulnerabilities before attackers do.",
    publishDate: "2026-03-05",
    categories: ["Cybersecurity", "Attack Surface"],
    href: "/blog/articles/understanding-your-attack-surface"
  },
];

export default async function BlogPage({
  searchParams
}: {
  searchParams: Promise<{ categories?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const selectedCategories = resolvedSearchParams.categories ? resolvedSearchParams.categories.split(',') : [];
  const allCategories = ['Cybersecurity', 'Vulnerability Scanning', 'Attack Surface'];

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
