import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LocalShare - Instant Wi-Fi File & Text Sharing',
  description: 'Fast, seamless, and private local network file and text sharing across Windows, macOS, Linux, iOS, and Android on the same Wi-Fi.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LocalShare',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#090d16' },
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${plusJakartaSans.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body
        className="antialiased selection:bg-teal-500/30 selection:text-teal-200 min-h-screen"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
