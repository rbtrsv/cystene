import { Metadata } from 'next';
import nudgioLogo from '@/modules/main/images/logos/nudgio_black_text_with_logo.svg';
import Favicon from '@/modules/main/public/favicon.ico';

interface PageSEOProps {
  title: string;
  description: string;
  slug: string;
  type?: 'article' | 'page' | 'website';
  publishDate?: string;
  author?: string;
  keywords?: string[];
  image?: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
  noindex?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.nudgio.tech';

export function generatePageMetadata({
  title,
  description,
  slug,
  type = 'page',
  publishDate,
  author,
  keywords = [],
  image,
  noindex = false,
}: PageSEOProps): Metadata {
  const pageImage = image ? {
    url: image.url.startsWith('http') ? image.url : `${BASE_URL}${image.url}`,
    width: image.width || 1200,
    height: image.height || 630,
    alt: image.alt,
  } : {
    url: `${BASE_URL}${nudgioLogo.src}`,
    width: nudgioLogo.width || 1200,
    height: nudgioLogo.height || 630,
    alt: title,
  };

  const pageUrl = `${BASE_URL}/${slug}`;
  const pageTitle = `${title} | Nudgio`;

  return {
    metadataBase: new URL(BASE_URL),
    title: pageTitle,
    description,
    creator: author || 'Nudgio Team',
    publisher: 'Nudgio',
    category: keywords.join(', '),
    robots: {
      index: !noindex,
      follow: true,
      nocache: false,
      googleBot: {
        index: !noindex,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      type: type === 'article' ? 'article' : 'website',
      url: pageUrl,
      siteName: 'Nudgio',
      locale: 'en_US',
      images: [pageImage],
      ...(type === 'article' && publishDate && author && {
        publishedTime: publishDate,
        authors: [author],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@nudgio_tech',
      site: '@nudgio_tech',
      images: [pageImage.url],
    },
    authors: author ? [{ name: author }] : [{ name: 'Nudgio Team' }],
    alternates: { canonical: pageUrl },
    keywords: keywords,
    icons: {
      icon: Favicon.src,
      shortcut: Favicon.src,
      apple: Favicon.src,
    },
  };
}