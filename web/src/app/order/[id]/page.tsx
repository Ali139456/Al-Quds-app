import { Suspense } from 'react';
import OrderDetailClient from './OrderDetailClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading...</div>}>
      <OrderDetailClient />
    </Suspense>
  );
}
