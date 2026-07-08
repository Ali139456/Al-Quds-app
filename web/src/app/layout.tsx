import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { StoreClosedBanner } from '@/components/StoreClosedBanner';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Al-Quds — Order Food Online',
  description: 'Order burgers, fried chicken, pasta and more from Al-Quds in Rawalpindi. No app download needed.',
  icons: { icon: '/al-quds-icon.png', apple: '/al-quds-icon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProviders>
          <StoreClosedBanner />
          <SiteHeader />
          <main className="min-h-[calc(100vh-8rem)]">{children}</main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
