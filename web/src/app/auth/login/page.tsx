'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) router.push('/account');
    else setError(result.error || 'Login failed');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-extrabold">Login</h1>
      <p className="mt-1 text-muted">Access your Al-Quds account</p>
      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
        <input className="input-field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input-field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        No account? <Link href="/auth/register" className="font-bold text-accent-dark">Register</Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted">You can also checkout as guest without login.</p>
    </div>
  );
}
