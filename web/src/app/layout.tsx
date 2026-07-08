import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { StoreClosedBanner } from '@/components/StoreClosedBanner';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Al-Quds — Order Food Online',
  description: 'Order burgers, fried chicken, pasta and more from Al-Quds in Rawalpindi. No app download needed.',
  icons: {
    icon: '/al-quds-favicon.png',
    apple: '/al-quds-favicon.png',
    shortcut: '/al-quds-favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('alquds-theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${jakarta.variable} antialiased`} suppressHydrationWarning>
        <AppProviders>
          <StoreClosedBanner />
          <SiteHeader />
          <main className="min-h-[calc(100vh-10rem)]">{children}</main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
