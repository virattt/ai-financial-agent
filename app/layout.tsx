import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AuthCheck } from '@/app/components/AuthCheck';

import { ThemeProvider } from '@/components/providers';
import { SessionProvider } from 'next-auth/react';
import { Analytics } from "@vercel/analytics/react"

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://chat.vercel.ai'),
  title: 'Financial Datasets | Chat',
  description: 'Chat with financial datasets',
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AuthCheck />
            <Toaster position="top-center" />
            {children}
          </ThemeProvider>
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}
