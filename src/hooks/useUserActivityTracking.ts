import { useEffect, useRef } from 'react';
import { sendUserHeartbeat } from '../services/routeService';

const HEARTBEAT_INTERVAL_MS = 3 * 60 * 1000; // 3 menit
const MAX_ELAPSED_CAP_SECONDS = 200; // Batas atas untuk mengantisipasi jeda akibat device sleep

/**
 * Custom hook untuk melacak waktu aktif & durasi sesi pengguna.
 * Mengirim pulsa heartbeat ke Supabase `user_profiles` setiap ~3 menit
 * HANYA jika tab/layar sedang aktif (`document.visibilityState === 'visible'`).
 */
export function useUserActivityTracking(isSignedIn: boolean, userEmail?: string): void {
  const emailRef = useRef(userEmail);
  emailRef.current = userEmail;
  const lastHeartbeatRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isSignedIn || !emailRef.current) return;

    const email = emailRef.current;
    lastHeartbeatRef.current = Date.now();

    // Initial heartbeat update saat mount / login
    sendUserHeartbeat(email, 0).catch((err) => {
      console.warn('[ActivityTracking] Gagal mengirim heartbeat awal:', err);
    });

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine && emailRef.current) {
        const now = Date.now();
        const rawElapsedSeconds = Math.round((now - lastHeartbeatRef.current) / 1000);
        // Batasi nilai durasi agar tidak melonjak jika perangkat baru bangun dari mode sleep
        const elapsedSeconds = Math.min(Math.max(rawElapsedSeconds, 0), MAX_ELAPSED_CAP_SECONDS);
        lastHeartbeatRef.current = now;

        sendUserHeartbeat(emailRef.current, elapsedSeconds).catch((err) => {
          console.warn('[ActivityTracking] Gagal mengirim heartbeat interval:', err);
        });
      }
    }, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine && emailRef.current) {
        lastHeartbeatRef.current = Date.now();
        sendUserHeartbeat(emailRef.current, 0).catch((err) => {
          console.warn('[ActivityTracking] Gagal mengirim heartbeat visibility change:', err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSignedIn, userEmail]);
}

