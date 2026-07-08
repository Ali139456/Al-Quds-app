import { Suspense } from 'react';
import MenuPage from './MenuPageClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading menu...</div>}>
      <MenuPage />
    </Suspense>
  );
}
