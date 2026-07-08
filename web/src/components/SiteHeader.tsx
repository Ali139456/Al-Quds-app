'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/providers/CartProvider';
import { useAuth } from '@/providers/AuthProvider';

export function SiteHeader() {
  const { totalItems } = useCart();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/al-quds-mark.png" alt="Al-Quds" width={120} height={36} className="h-8 w-auto" priority />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
          <Link href="/" className="hover:text-accent-dark">Home</Link>
          <Link href="/menu" className="hover:text-accent-dark">Menu</Link>
          <Link href="/orders" className="hover:text-accent-dark">My Orders</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/account" className="hidden text-sm font-semibold text-muted hover:text-foreground sm:block">
              {user.name}
            </Link>
          ) : (
            <Link href="/auth/login" className="hidden text-sm font-semibold text-muted hover:text-foreground sm:block">
              Login
            </Link>
          )}
          <Link href="/cart" className="btn-primary relative !px-4 !py-2 text-sm">
            Cart
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1 text-[10px] font-bold text-white">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
