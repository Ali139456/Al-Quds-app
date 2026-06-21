import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

/** Redirect customers to tabs and riders to the rider dashboard. */
export function RoleGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const root = segments[0];
    const inAuth = root === 'auth';
    if (inAuth || !user) return;

    const inRider = root === '(rider)';
    const isRider = user.role === 'rider';

    if (isRider && !inRider) {
      router.replace('/(rider)');
    } else if (!isRider && inRider) {
      router.replace('/(tabs)/');
    }
  }, [user, isLoading, segments, router]);

  return <>{children}</>;
}
