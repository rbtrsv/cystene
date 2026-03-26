import React from 'react';
import Favicon from '@/modules/main/public/favicon.ico';
import FinpyDefault from '@/modules/main/images/logos/finpy_default.png';

interface HeadProps {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogType?: string;
  ogLocale?: string;
  ogImage?: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  canonicalUrl: string;
  language?: string;
  revisitAfter?: string;
}

const Head: React.FC<HeadProps> = ({
  title,
  description,
  keywords,
  author,
  ogTitle,
  ogDescription,
  ogUrl,
  ogType = 'website',
  ogLocale = 'en_US',
  ogImage = FinpyDefault.src,
  twitterCard,
  twitterTitle,
  twitterDescription,
  canonicalUrl,
  language = 'English',
  revisitAfter = '7 days',
}) => {
  return (
    <head>
      <meta charSet='utf-8' />
      <meta
        name='viewport'
        content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      />
      <title>{title}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords.join(', ')} />
      <meta name='author' content={author} />

      {/* Open Graph / Facebook */}
      <meta property='og:type' content={ogType} />
      <meta property='og:title' content={ogTitle} />
      <meta property='og:description' content={ogDescription} />
      <meta property='og:image' content={ogImage} />
      <meta property='og:url' content={ogUrl} />
      <meta property='og:locale' content={ogLocale} />
      <meta property='og:site_name' content='Finpy Tech' />

      {/* Twitter */}
      <meta name='twitter:card' content={twitterCard} />
      <meta name='twitter:title' content={twitterTitle} />
      <meta name='twitter:description' content={twitterDescription} />
      <meta name='twitter:image' content={ogImage} />

      {/* Canonical URL */}
      <link rel='canonical' href={canonicalUrl} />

      {/* Favicon */}
      <link rel='icon' href={Favicon.src} />

      {/* Additional meta tags */}
      <meta name='language' content={language} />
      <meta name='revisit-after' content={revisitAfter} />
      <meta name='robots' content='index, follow' />
      <meta httpEquiv='Content-Type' content='text/html; charset=utf-8' />
      <meta name='distribution' content='global' />
      <meta
        httpEquiv='Content-Security-Policy'
        content='upgrade-insecure-requests'
      />
    </head>
  );
};

export default Head;
