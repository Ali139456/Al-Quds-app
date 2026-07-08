'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await register(name, email, phone, password);
    setLoading(false);
    if (result.ok) router.push('/account');
    else setError(result.error || 'Registration failed');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-extrabold">Create account</h1>
      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
        <input className="input-field" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input-field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input-field" placeholder="Phone 03XX XXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="input-field" type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account? <Link href="/auth/login" className="font-bold text-accent-dark">Login</Link>
      </p>
    </div>
  );
}
