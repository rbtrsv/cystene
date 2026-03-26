import '@/modules/main/styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className='h-full' lang='en' suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Impact.com affiliate network site verification */}
        <meta name='impact-site-verification' content='33c1983a-0cff-4777-ac53-2317815501bc' />
      </head>
      <body className='h-full bg-white text-black dark:bg-black dark:text-white'>
        {children}
        <Analytics mode={'production'} />
      </body>
    </html>
  );
}
