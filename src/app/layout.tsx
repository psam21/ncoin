import '../styles/globals.css';
import '../styles/tiptap.css';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Plus_Jakarta_Sans, Noto_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

const noto = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
  variable: '--font-noto',
});

export const metadata: Metadata = {
  title: 'Nostr Messenger - Encrypted Messaging',
  description:
    'A decentralized messaging platform built on Nostr for secure, private communication.',
  keywords: [
    'nostr',
    'messaging',
    'encrypted',
    'decentralized',
    'privacy',
  ],
  authors: [{ name: 'Nostr Messenger' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Nostr Messenger - Encrypted Messaging',
    description: 'Secure, private messaging on Nostr',
    type: 'website',
    url: 'https://nostrcoin.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nostr Messenger - Encrypted Messaging',
    description: 'Secure, private messaging on Nostr',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${noto.variable} scroll-smooth`}>
      <body className="font-sans antialiased">
        {/* QW8: Skip to content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:text-purple-800 focus:px-4 focus:py-2 focus:rounded shadow"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="pt-16 lg:pt-20" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
