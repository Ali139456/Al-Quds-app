import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getRiderModeActive } from '@/utils/storage';

/** Keep customers on the food app; rider UI only after explicit rider login this session. */
export function RoleGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [riderMode, setRiderMode] = useState(false);
  const [riderModeLoaded, setRiderModeLoaded] = useState(false);

  useEffect(() => {
    getRiderModeActive().then((active) => {
      setRiderMode(active);
      setRiderModeLoaded(true);
    });
  }, [user?.id]);

  useEffect(() => {
    if (isLoading || !riderModeLoaded) return;
    const root = segments[0];
    const inAuth = root === 'auth';
    if (inAuth || !user) return;

    const inRider = root === '(rider)';
    const isRider = user.role === 'rider';

    if (!isRider && inRider) {
      router.replace('/(tabs)/');
      return;
    }

    // App reopen always lands on customer app unless rider logged in this session.
    if (isRider && inRider && !riderMode) {
      router.replace('/(tabs)/');
    }
  }, [user, isLoading, segments, router, riderMode, riderModeLoaded]);

  return <>{children}</>;
}
