import type { UserRole } from "@/utils/roleStorage";

export interface ProfileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAccumulation?: () => void;
  onOpenRegionalMonitoring?: () => void;
  onReturnToRouteView?: () => void;
  isInMonitoringView?: boolean;
  onOpenUserManagement?: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  offlineQueueCount: number;
  isOnline: boolean;
  onLogout: () => void;
  onFormatWholeSheet?: () => Promise<void>;
  currentTabName?: string;
  hasActiveData?: boolean;
}

export interface UserProfileState {
  full_name: string;
  email: string;
  avatar_url?: string;
  role?: UserRole | "petugas";
}
