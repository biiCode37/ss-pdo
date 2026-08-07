import { useEffect, useRef } from 'react';
import { sendUserHeartbeat } from '../services/routeService';

const HEARTBEAT_INTERVAL_MS = 3 * 60 * 1000; // 3 menit
const HEARTBEAT_SECONDS = 180;

/**
 * Custom hook untuk melacak waktu aktif & durasi sesi pengguna.
 * Mengirim pulsa heartbeat ke Supabase `user_profiles` setiap 3 menit
 * HANYA jika tab/layar sedang aktif (`document.visibilityState === 'visible'`).
 */
export function useUserActivityTracking(isSignedIn: boolean, userEmail?: string): void {
  const emailRef = useRef(userEmail);
  emailRef.current = userEmail;

  useEffect(() => {
    if (!isSignedIn || !emailRef.current) return;

    const email = emailRef.current;
    // Initial heartbeat update saat mount / login
    sendUserHeartbeat(email, 0).catch(() => {});

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine && emailRef.current) {
        sendUserHeartbeat(emailRef.current, HEARTBEAT_SECONDS).catch(() => {});
      }
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine && emailRef.current) {
        sendUserHeartbeat(emailRef.current, 0).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSignedIn, userEmail]);
}
