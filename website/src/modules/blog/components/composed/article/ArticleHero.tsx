import React from 'react';
import { categoryColor } from '@/modules/blog/lib/categoryColor';

interface ArticleHeroProps {
  title: string;
  subtitle?: string;
  categories?: string[];
  author?: string;
  date: string;
}

/**
 * Premium article hero — a decorative brand gradient blur-blob behind centered
 * category chips, an extrabold title, an optional subtitle, and the byline.
 * Pure Tailwind, brand green→cyan (#3AFF00 → #23FFF6). Reused by every article.
 */
const ArticleHero: React.FC<ArticleHeroProps> = ({
  title,
  subtitle,
  categories = [],
  author = 'Cystene Team',
  date,
}) => (
  <section className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36">
    {/* Decorative brand gradient blob */}
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-10 h-80 w-[600px] max-w-full -translate-x-1/2 rounded-full bg-linear-to-br from-[#3AFF00]/15 to-[#23FFF6]/15 blur-3xl"
    />

    <div className="relative mx-auto max-w-3xl px-4 pb-10 text-center">
      {categories.length > 0 && (
        <div className="mb-5 inline-flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <span
              key={c}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${categoryColor(c)}`}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
        {title}
      </h1>

      {subtitle && (
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
          {subtitle}
        </p>
      )}

      <p className="mt-6 text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        {author} · {date}
      </p>
    </div>
  </section>
);

export default ArticleHero;
