import '@/modules/main/styles/globals.css';
import Favicon from '@/images/public/favicon.ico';
import { Analytics } from '@vercel/analytics/next';

function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          try {
            if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
          } catch (e) {}
        `,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel='icon' href={Favicon.src} />
      </head>
      <body className='bg-white text-black dark:bg-zinc-900 dark:text-white'>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
