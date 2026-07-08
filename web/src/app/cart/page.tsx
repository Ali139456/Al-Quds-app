'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/providers/CartProvider';
import { formatPKR, resolveImageUrl } from '@/lib/utils';

export default function CartPage() {
  const { items, updateQty, removeItem, totalItems, totalPrice } = useCart();
  const router = useRouter();

  if (totalItems === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-xl font-bold">Your cart is empty</p>
        <p className="mt-2 text-muted">Add something delicious from the menu.</p>
        <Link href="/menu" className="btn-primary mt-6 inline-flex">Browse menu</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Your cart</h1>
      <p className="mt-1 text-muted">{totalItems} item{totalItems > 1 ? 's' : ''}</p>

      <div className="mt-6 space-y-4">
        {items.map((line) => (
          <div key={line.lineKey} className="card flex gap-4 p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
              <Image src={resolveImageUrl(line.food.image)} alt={line.food.name} fill className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col">
              <h3 className="font-bold">{line.food.name}</h3>
              {line.variety && <p className="text-xs text-muted">Size: {line.variety}</p>}
              {line.addons?.length ? (
                <p className="text-xs text-muted">+ {line.addons.map((a) => a.name).join(', ')}</p>
              ) : null}
              <p className="mt-1 font-bold text-accent-dark">{formatPKR(line.unitPrice)}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center rounded-lg border border-border">
                  <button type="button" className="px-3 py-1 font-bold" onClick={() => updateQty(line.lineKey, line.quantity - 1)}>−</button>
                  <span className="min-w-6 text-center text-sm font-bold">{line.quantity}</span>
                  <button type="button" className="px-3 py-1 font-bold" onClick={() => updateQty(line.lineKey, line.quantity + 1)}>+</button>
                </div>
                <button type="button" className="text-sm font-semibold text-red-600" onClick={() => removeItem(line.lineKey)}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-4">
        <div className="flex justify-between text-lg font-extrabold">
          <span>Subtotal</span>
          <span className="text-accent-dark">{formatPKR(totalPrice)}</span>
        </div>
        <button type="button" className="btn-primary mt-4 w-full" onClick={() => router.push('/checkout')}>
          Proceed to checkout
        </button>
      </div>
    </div>
  );
}
