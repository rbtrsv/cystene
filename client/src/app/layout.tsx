import type { Metadata } from "next";
import "@/modules/main/styles/globals.css";
import Favicon from '@/modules/main/public/favicon.ico';

export const metadata: Metadata = {
  title: "Cystene",
  description: "Cybersecurity Scanning Platform",
};

function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          try {
            // Skip dark mode on Shopify embedded routes — Polaris handles its own theming.
            // Force light color-scheme + white background immediately (before CSS loads) —
            // without this, Safari applies native dark background when macOS is in dark mode.
            if (window.location.pathname.startsWith('/shopify')) {
              document.documentElement.style.colorScheme = 'light';
              document.documentElement.style.backgroundColor = 'white';
              return;
            }
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Shopify App Bridge — CDN loading requirements:
          ───────────────────────────────────────────────
          1. <meta name="shopify-api-key"> MUST appear before the App Bridge script
          2. App Bridge script MUST be synchronous (no async/defer) — Shopify rejects async loading
          3. Do NOT use next/script with strategy="beforeInteractive" — it adds async attribute
             automatically, which breaks App Bridge initialization (GitHub #311, Shopify community)
          4. Next.js App Router injects its chunk scripts (/_next/static/chunks/*.js) BEFORE
             user-defined <head> content, but chunks have async attribute so they don't block —
             App Bridge still loads synchronously at parse time
          5. This meta + script pair must render on ALL routes (root layout ensures this)
          6. Shopify automated check ("Using the latest App Bridge script loaded from Shopify's CDN")
             requires active session data — install app on dev store, interact with it, wait up to 2h
             Known issue: check may not pass with Next.js App Router (multiple unresolved community threads)

          Sources:
          - https://github.com/Shopify/shopify-app-bridge/issues/311
          - https://community.shopify.dev/t/shopify-app-fails-using-the-latest-app-bridge-script-check-even-when-loading-from-cdn/22168
          - https://community.shopify.dev/t/app-bridge-cdn-automated-check-not-passing-in-hybrid-next-js-app-pages-app-router/28960
          - https://nextjs.org/docs/messages/no-before-interactive-script-outside-document
        */}
        <meta name="shopify-api-key" content="37b4b12ed793e4127ba69f5e8d5f5922" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- Shopify requires synchronous App Bridge loading */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
        <ThemeScript />
        <link rel='icon' href={Favicon.src} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
