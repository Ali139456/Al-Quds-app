import { BRAND_NAME } from '@/lib/api';

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted">
        <p className="font-bold text-foreground">{BRAND_NAME} · Rawalpindi delivery</p>
        <p className="mt-1">Order online — same menu as our mobile app.</p>
        <p className="mt-3">Support: 0317 5858934</p>
      </div>
    </footer>
  );
}
