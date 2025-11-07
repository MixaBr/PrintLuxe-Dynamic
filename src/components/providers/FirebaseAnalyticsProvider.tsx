'use client';

import { useEffect } from 'react';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { firebaseApp } from '@/lib/firebase';

export function FirebaseAnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Firebase Analytics only on the client side
    isSupported().then((supported) => {
      if (supported) {
        getAnalytics(firebaseApp);
      }
    });
  }, []);

  return <>{children}</>;
}
