'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCart } from '@/providers/CartProvider';
import { useAuth } from '@/providers/AuthProvider';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/orders', label: 'Orders' },
];

export function SiteHeader() {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`glass-header sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled ? 'border-border shadow-sm shadow-black/5' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <BrandLogo height={40} />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link rounded-lg px-4 py-2 ${pathname === item.href ? 'nav-link-active bg-accent/10' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {user ? (
            <Link
              href="/account"
              className="hidden rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold transition hover:border-accent/40 sm:inline-flex"
            >
              {user.name.split(' ')[0]}
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="btn-secondary hidden !px-4 !py-2 text-sm sm:inline-flex"
            >
              Login
            </Link>
          )}

          <Link href="/cart" className="btn-primary relative !px-4 !py-2.5 text-sm">
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 6h15l-1.5 9H7.5L6 6z" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
                <path d="M6 6L5 3H2" />
              </svg>
              Cart
            </span>
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1 text-[10px] font-bold text-white dark:bg-accent dark:text-stone-900">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-3 font-semibold transition ${
                  pathname === item.href ? 'bg-accent/15 text-accent-dark' : 'hover:bg-card-hover'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href={user ? '/account' : '/auth/login'} className="rounded-xl px-4 py-3 font-semibold hover:bg-card-hover">
              {user ? 'My account' : 'Login / Register'}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
