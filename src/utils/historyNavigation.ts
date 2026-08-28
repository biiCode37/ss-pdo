import Swal from 'sweetalert2';
import { showToast } from './alertUtils';

export interface BackNavigationEntry {
  id: string;
  onBack: () => void;
}

// Global LIFO Stack for active modals / sheets / sub-views
const navigationStack: BackNavigationEntry[] = [];

// Flag to ignore popstate triggered programmatically by history.back()
let isProgrammaticPop = false;

// Double-back to exit timer for root dashboard in PWA / mobile mode
let lastRootBackPress = 0;

// Initialize history state on app startup
let isInitialized = false;

/**
 * Check if the app is running as an installed PWA / standalone mobile display
 */
export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Global PopState Listener to intercept hardware back button & swipe back gestures
 */
function handlePopState(_e?: PopStateEvent) {
  // If popstate was triggered by our own programmatic history.back(), skip handling
  if (isProgrammaticPop) {
    isProgrammaticPop = false;
    return;
  }

  // 1. Priority: SweetAlert2 modal is visible
  if (Swal.isVisible()) {
    Swal.close();
    // Re-push a history state if needed so stack depth matches
    return;
  }

  // 2. Priority: Custom registered modal/sheet/sub-view in the navigation stack
  if (navigationStack.length > 0) {
    const topEntry = navigationStack.pop();
    if (topEntry) {
      topEntry.onBack();
      return;
    }
  }

  // 3. Priority: Root view reached (No modals / sub-views active)
  const now = Date.now();
  if (now - lastRootBackPress < 2000) {
    // User pressed back twice within 2 seconds: allow exit/back to proceed
    lastRootBackPress = 0;
    return;
  }

  // First back press on root: show exit confirmation toast & guard history
  lastRootBackPress = now;
  showToast({
    title: 'Tekan sekali lagi untuk keluar',
    icon: 'info',
    timer: 2000,
    position: 'bottom',
  });

  // Re-push root guard entry so the app doesn't exit on the first back tap
  try {
    history.pushState({ pdoRootGuard: true, timestamp: now }, '');
  } catch (_err) {}
}

/**
 * Setup global history listeners on app boot
 */
export function initHistoryNavigation() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  try {
    // Replace initial state with root state
    history.replaceState({ pdoRoot: true }, '');
    // Push a root guard entry so mobile back button fires popstate rather than exiting immediately
    history.pushState({ pdoRootGuard: true }, '');
  } catch (_err) {}

  window.addEventListener('popstate', handlePopState);
}

/**
 * Register a modal / sheet / view to the mobile back navigation stack
 */
export function pushBackNavigation(entry: BackNavigationEntry) {
  // Prevent duplicate registration of the same ID
  const existingIdx = navigationStack.findIndex((item) => item.id === entry.id);
  if (existingIdx !== -1) {
    navigationStack.splice(existingIdx, 1);
  }

  navigationStack.push(entry);

  try {
    history.pushState({ pdoNavId: entry.id, depth: navigationStack.length }, '');
  } catch (_err) {}
}

/**
 * Unregister a modal / sheet / view when closed via UI (e.g. tap X button or swipe down)
 */
export function removeBackNavigation(id: string) {
  const index = navigationStack.findIndex((item) => item.id === id);
  if (index !== -1) {
    navigationStack.splice(index, 1);

    // If current history state corresponds to this modal, pop history without triggering popstate handler
    if (history.state?.pdoNavId === id) {
      isProgrammaticPop = true;
      try {
        history.back();
      } catch (_err) {
        isProgrammaticPop = false;
      }
    }
  }
}
