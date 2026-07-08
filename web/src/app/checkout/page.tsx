'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DeliveryLocationPicker } from '@/components/DeliveryLocationPicker';
import { useCart } from '@/providers/CartProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { apiFetch } from '@/lib/api';
import type { CouponResult } from '@/lib/types';
import type { DeliveryPin } from '@/lib/geo';
import {
  formatPKR,
  formatPakPhoneDisplay,
  isInRawalpindi,
  normalizePakPhone,
  PAYMENT_ACCOUNT,
} from '@/lib/utils';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { settings, getDeliveryFee } = useSettings();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [deliveryPin, setDeliveryPin] = useState<DeliveryPin | null>(null);
  const [houseStreet, setHouseStreet] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'digital'>('cod');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const subtotal = totalPrice;
  const discount = coupon?.valid ? coupon.discount || 0 : 0;
  const deliveryFee = getDeliveryFee(subtotal, coupon?.freeDelivery);
  const grandTotal = Math.max(0, subtotal - discount + deliveryFee);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-bold">Cart is empty</p>
        <Link href="/menu" className="btn-primary mt-4 inline-flex">Browse menu</Link>
      </div>
    );
  }

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    try {
      const result = await apiFetch<CouponResult>('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: couponInput.trim(),
          subtotal,
          userId: user?.id,
        }),
      });
      setCoupon(result);
      if (!result.valid) setError(result.error || 'Invalid coupon');
      else setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Coupon failed');
    }
  };

  const placeOrder = async () => {
    setError('');
    if (!settings.storeOpen) {
      setError('Store is closed. Please try again later.');
      return;
    }
    const normalizedPhone = normalizePakPhone(phone);
    if (!name.trim()) return setError('Enter your name');
    if (!normalizedPhone) return setError('Enter a valid Pakistani mobile (03XX XXXXXXX)');
    if (!deliveryPin) return setError('Set your delivery location on the map');
    if (!houseStreet.trim()) return setError('Enter house / street number');
    if (!isInRawalpindi(deliveryPin.lat, deliveryPin.lng)) {
      return setError('Sorry, we only deliver within Rawalpindi.');
    }

    const lat = deliveryPin.lat;
    const lng = deliveryPin.lng;
    const addressLine = [deliveryPin.addressLine, houseStreet.trim(), instructions.trim()]
      .filter(Boolean)
      .join(', ');
    const orderId = `order_${Date.now()}`;
    const userId = user?.id || 'guest';

    setPlacing(true);
    try {
      await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          id: orderId,
          userId,
          items: items.map((line) => ({
            foodId: line.food.id,
            name: line.food.name,
            price: line.unitPrice,
            quantity: line.quantity,
            variety: line.variety || '',
            addons: line.addons?.map((a) => a.name).join(', ') || '',
            addonIds: line.addons?.map((a) => a.id) || [],
            image: line.food.image,
          })),
          total: grandTotal,
          subtotal,
          addressLabel: 'Web order',
          addressLine,
          latitude: lat,
          longitude: lng,
          customerName: name.trim(),
          customerPhone: normalizedPhone,
          paymentMethod: paymentMethod === 'cod' ? 'COD' : PAYMENT_ACCOUNT.label,
          couponCode: coupon?.valid ? coupon.code : undefined,
          couponId: coupon?.valid ? coupon.couponId : undefined,
          discountAmount: discount,
          deliveryFee,
          specialInstructions: instructions.trim() || undefined,
        }),
      });

      const localOrders = JSON.parse(localStorage.getItem('alquds_web_orders') || '[]');
      localOrders.unshift({
        id: orderId,
        userId,
        items: items.map((line) => ({
          foodId: line.food.id,
          name: line.food.name,
          price: line.unitPrice,
          quantity: line.quantity,
        })),
        total: grandTotal,
        addressLabel: 'Web order',
        addressLine,
        latitude: lat,
        longitude: lng,
        status: 'placed',
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('alquds_web_orders', JSON.stringify(localOrders.slice(0, 50)));

      clearCart();
      router.push(`/order/${orderId}?placed=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Checkout</h1>
      <p className="mt-1 text-muted">Delivering in Rawalpindi only</p>

      <div className="mt-6 space-y-4">
        <div className="card space-y-3 p-4">
          <h2 className="font-bold">Your details</h2>
          <input className="input-field" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input-field" placeholder="Mobile 03XX XXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="card space-y-3 p-4">
          <h2 className="font-bold">Delivery location</h2>
          <DeliveryLocationPicker
            value={deliveryPin}
            onChange={setDeliveryPin}
            onError={setError}
          />
          <input
            className="input-field"
            placeholder="House / street / flat number"
            value={houseStreet}
            onChange={(e) => setHouseStreet(e.target.value)}
          />
          <input
            className="input-field"
            placeholder="Note for rider (optional)"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        <div className="card space-y-3 p-4">
          <h2 className="font-bold">Payment</h2>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3">
            <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
            <span>Cash on delivery</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3">
            <input type="radio" checked={paymentMethod === 'digital'} onChange={() => setPaymentMethod('digital')} />
            <span>{PAYMENT_ACCOUNT.label} — {PAYMENT_ACCOUNT.number}</span>
          </label>
        </div>

        <div className="card space-y-3 p-4">
          <h2 className="font-bold">Coupon</h2>
          <div className="flex gap-2">
            <input className="input-field" placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
            <button type="button" className="btn-secondary shrink-0" onClick={applyCoupon}>Apply</button>
          </div>
          {coupon?.valid && <p className="text-sm font-semibold text-green-600">Coupon applied: -{formatPKR(coupon.discount || 0)}</p>}
        </div>

        <div className="card space-y-2 p-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPKR(discount)}</span></div>}
          <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee === 0 ? 'Free' : formatPKR(deliveryFee)}</span></div>
          <div className="flex justify-between border-t border-border pt-2 text-lg font-extrabold">
            <span>Total</span><span className="text-accent-dark">{formatPKR(grandTotal)}</span>
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

        <button type="button" className="btn-primary w-full" disabled={placing} onClick={placeOrder}>
          {placing ? 'Placing order...' : `Place order · ${formatPKR(grandTotal)}`}
        </button>
        {phone && normalizePakPhone(phone) && (
          <p className="text-center text-xs text-muted">Delivering to {formatPakPhoneDisplay(phone)}</p>
        )}
      </div>
    </div>
  );
}
