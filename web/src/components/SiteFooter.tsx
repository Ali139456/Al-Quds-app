import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { BRAND_NAME } from '@/lib/api';

const FOOTER_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/orders', label: 'My Orders' },
  { href: '/cart', label: 'Cart' },
  { href: '/auth/login', label: 'Login' },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-16 border-t border-border">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <BrandLogo height={40} href={undefined} />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {BRAND_NAME} brings burgers, fried chicken, pasta and more to your doorstep in Rawalpindi.
              Order online — same menu as our mobile app.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Delivery & pickup available
            </div>
          </div>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-accent-dark">Quick links</h3>
            <ul className="mt-4 space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition hover:text-accent-dark">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-accent-dark">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>
                <span className="block text-xs font-bold uppercase tracking-wide text-foreground/60">Phone</span>
                <a href="tel:+923175858934" className="font-semibold text-foreground transition hover:text-accent-dark">
                  0317 5858934
                </a>
              </li>
              <li>
                <span className="block text-xs font-bold uppercase tracking-wide text-foreground/60">Location</span>
                Rawalpindi, Pakistan
              </li>
              <li>
                <span className="block text-xs font-bold uppercase tracking-wide text-foreground/60">Hours</span>
                Open daily · Check app for timings
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-center text-xs text-muted sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
          <p className="font-medium">Made with care in Rawalpindi</p>
        </div>
      </div>
    </footer>
  );
}
