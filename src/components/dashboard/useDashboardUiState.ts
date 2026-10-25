import { useState, useEffect, useCallback } from "react";
import { useMobileBackHandler } from "@/hooks/useMobileBackHandler";
import { slugifyUnitId } from "@/utils/analytics";
import { getStoredUserRole } from "@/utils/roleStorage";

export type DashboardView =
  | "dashboard"
  | "user_management"
  | "regional_monitoring"
  | "page_management";

export type DashboardMainTab = "input" | "analytics" | "units";

interface UseDashboardUiStateOptions {
  onClearError?: () => void;
  initialView?: DashboardView;
}

export function useDashboardUiState(options: UseDashboardUiStateOptions = {}) {
  const { onClearError, initialView } = options;

  // Global System & Connectivity States
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isAuthExpired, setIsAuthExpired] = useState(false);
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  // Modal and Sheet Visibility States
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [isAccSheetOpen, setIsAccSheetOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // View Navigation States:
  // Selain peran 'pdo' (yaitu 'superadmin', 'admin', 'korwil', 'korlap'),
  // halaman pembuka pertama aplikasi adalah 'regional_monitoring'.
  const [currentView, setCurrentView] = useState<DashboardView>(() => {
    if (initialView) return initialView;
    const role = getStoredUserRole();
    return role !== "pdo" ? "regional_monitoring" : "dashboard";
  });
  const [monitoringDate, setMonitoringDate] = useState<string | null>(null);

  // Active Main Tab
  const [mainTab, setMainTab] = useState<DashboardMainTab>("analytics");

  // App Theme State
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document !== "undefined") {
      return (
        (document.documentElement.getAttribute("data-theme") as
          | "light"
          | "dark") || "dark"
      );
    }
    return "dark";
  });

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", nextTheme);
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("PDO_THEME", nextTheme);
      }
      return nextTheme;
    });
  }, []);

  // Swipe Tab Navigation
  const mainTabs: DashboardMainTab[] = ["input", "analytics", "units"];

  const handleSwipeNextTab = useCallback(() => {
    setMainTab((prev) => {
      const currentIndex = mainTabs.indexOf(prev);
      const nextIndex = (currentIndex + 1) % mainTabs.length;
      return mainTabs[nextIndex];
    });
  }, [mainTabs]);

  const handleSwipePrevTab = useCallback(() => {
    setMainTab((prev) => {
      const currentIndex = mainTabs.indexOf(prev);
      const prevIndex = (currentIndex - 1 + mainTabs.length) % mainTabs.length;
      return mainTabs[prevIndex];
    });
  }, [mainTabs]);

  // Target Bus Selection & 6-Second Glowing Pulse Highlight
  const handleSelectUnit = useCallback((unit: string) => {
    setMainTab("units");
    setTimeout(() => {
      const slug = slugifyUnitId(unit);
      const el =
        document.getElementById(`unit-card-${slug}`) ||
        document.getElementById(`bus-card-${slug}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.remove("bus-card-highlight");
        void el.offsetWidth;
        el.classList.add("bus-card-highlight");
        setTimeout(() => {
          el.classList.remove("bus-card-highlight");
        }, 6000);
      }
    }, 150);
  }, []);

  const userRole = getStoredUserRole();
  const isPdoRole = userRole === "pdo";

  // Hardware Back Navigation Interceptors
  // Bagi user non-PDO: 'dashboard' rute tunggal adalah sub-view dari 'regional_monitoring'
  useMobileBackHandler({
    id: "route_dashboard_view",
    isOpen: !isPdoRole && currentView === "dashboard",
    onClose: () => setCurrentView("regional_monitoring"),
  });

  // Bagi user PDO: jika membuka regional_monitoring (fallback): kembali ke 'dashboard'
  useMobileBackHandler({
    id: "regional_monitoring_view",
    isOpen: isPdoRole && currentView === "regional_monitoring",
    onClose: () => setCurrentView("dashboard"),
  });

  useMobileBackHandler({
    id: "user_management_view",
    isOpen: currentView === "user_management",
    onClose: () =>
      setCurrentView(isPdoRole ? "dashboard" : "regional_monitoring"),
  });

  useMobileBackHandler({
    id: "page_management_view",
    isOpen: currentView === "page_management",
    onClose: () =>
      setCurrentView(isPdoRole ? "dashboard" : "regional_monitoring"),
  });

  useMobileBackHandler({
    id: "profile_menu_sheet",
    isOpen: isProfileMenuOpen,
    onClose: () => setIsProfileMenuOpen(false),
  });

  useMobileBackHandler({
    id: "acc_sheet",
    isOpen: isAccSheetOpen,
    onClose: () => setIsAccSheetOpen(false),
  });

  useMobileBackHandler({
    id: "queue_modal",
    isOpen: isQueueModalOpen,
    onClose: () => setIsQueueModalOpen(false),
  });

  // Global Window Event Listeners (Auth Expiry & Connectivity)
  useEffect(() => {
    const handleAuthExpired = () => setIsAuthExpired(true);
    const handleLoginSuccess = () => {
      setIsAuthExpired(false);
      onClearError?.();
    };
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("google-auth-expired", handleAuthExpired);
    window.addEventListener("google-login-success", handleLoginSuccess);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("google-auth-expired", handleAuthExpired);
      window.removeEventListener("google-login-success", handleLoginSuccess);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onClearError]);

  return {
    isOnline,
    setIsOnline,
    isAuthExpired,
    setIsAuthExpired,
    isReauthenticating,
    setIsReauthenticating,
    isQueueModalOpen,
    setIsQueueModalOpen,
    isAccSheetOpen,
    setIsAccSheetOpen,
    isProfileMenuOpen,
    setIsProfileMenuOpen,
    currentView,
    setCurrentView,
    monitoringDate,
    setMonitoringDate,
    mainTab,
    setMainTab,
    theme,
    toggleTheme,
    handleSwipeNextTab,
    handleSwipePrevTab,
    handleSelectUnit,
  };
}
