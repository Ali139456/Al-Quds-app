'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';

export default function AccountPage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-bold">Not logged in</p>
        <Link href="/auth/login" className="btn-primary mt-4 inline-flex">Login</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-3xl font-extrabold">Account</h1>
      <div className="card mt-6 p-6">
        <p className="text-lg font-extrabold">{user.name}</p>
        <p className="text-muted">{user.email}</p>
        {user.phone && <p className="text-sm text-muted">{user.phone}</p>}
      </div>
      <div className="mt-4 space-y-2">
        <Link href="/orders" className="btn-secondary block w-full text-center">My orders</Link>
        <button type="button" className="btn-secondary w-full text-red-600" onClick={() => logout()}>
          Logout
        </button>
      </div>
    </div>
  );
}
