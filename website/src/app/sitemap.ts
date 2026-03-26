import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nudgio.tech';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  const articlesDirectory = path.join(process.cwd(), 'src', 'app', 'blog', 'articles');
  const articleUrls = getArticleUrls(articlesDirectory);

  return [...staticUrls, ...articleUrls];
}

function getArticleUrls(directory: string): MetadataRoute.Sitemap {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return getArticleUrls(fullPath);
    } else if (entry.isFile() && entry.name === 'page.tsx') {
      const relativePath = path.relative(path.join(process.cwd(), 'src', 'app'), directory);
      const url = `${BASE_URL}/${relativePath.replace(/\\/g, '/')}`;

      return {
        url,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      };
    }

    return [];
  });
}
