import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import type { PageKey, AppPageSetting } from '@/types/pageManagement';
import { DEFAULT_PAGE_SETTINGS } from '@/types/pageManagement';
import {
  fetchPageSettings,
  getCachedSettings,
  updatePageSetting,
  subscribeToPageSettings,
} from '@/services/pageManagementService';

export interface PageAccessContextType {
  pageSettings: Record<PageKey, AppPageSetting>;
  isLoading: boolean;
  canAccessPage: (pageKey: PageKey, userRole?: string | null) => boolean;
  isUnderMaintenance: (pageKey: PageKey) => boolean;
  togglePageStatus: (pageKey: PageKey, nextStatus: boolean) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const PageAccessContext = createContext<PageAccessContextType | null>(null);

export const PageAccessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settingsMap, setSettingsMap] = useState<Record<PageKey, AppPageSetting>>(() => {
    const initial = getCachedSettings();
    return initial.reduce((acc, curr) => {
      acc[curr.page_key] = curr;
      return acc;
    }, {} as Record<PageKey, AppPageSetting>);
  });

  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const list = await fetchPageSettings();
      setSettingsMap((prev) => {
        const nextMap = { ...prev };
        list.forEach((item) => {
          nextMap[item.page_key] = item;
        });
        return nextMap;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();

    const unsubscribe = subscribeToPageSettings((newSetting) => {
      setSettingsMap((prev) => ({
        ...prev,
        [newSetting.page_key]: newSetting,
      }));
    });

    return () => {
      unsubscribe();
    };
  }, [loadSettings]);

  const canAccessPage = useCallback(
    (pageKey: PageKey, userRole?: string | null): boolean => {
      // Superadmin memiliki kuasa penuh untuk mengakses seluruh halaman (bypass)
      if (userRole === 'superadmin') return true;
      const setting = settingsMap[pageKey];
      return setting ? setting.is_enabled : true;
    },
    [settingsMap]
  );

  const isUnderMaintenance = useCallback(
    (pageKey: PageKey): boolean => {
      const setting = settingsMap[pageKey];
      return setting ? !setting.is_enabled : false;
    },
    [settingsMap]
  );

  const togglePageStatus = useCallback(
    async (pageKey: PageKey, nextStatus: boolean): Promise<boolean> => {
      const email =
        (typeof localStorage !== 'undefined'
          ? localStorage.getItem('PDO_USER_EMAIL')
          : null) || 'superadmin';

      // Optimistic update
      setSettingsMap((prev) => {
        const existing = prev[pageKey];
        if (!existing) return prev;
        return {
          ...prev,
          [pageKey]: {
            ...existing,
            is_enabled: nextStatus,
            updated_by: email,
            updated_at: new Date().toISOString(),
          },
        };
      });

      const success = await updatePageSetting(pageKey, nextStatus, email);
      if (!success) {
        // Rollback jika update gagal
        await loadSettings();
      }
      return success;
    },
    [loadSettings]
  );

  const value = useMemo(
    () => ({
      pageSettings: settingsMap,
      isLoading,
      canAccessPage,
      isUnderMaintenance,
      togglePageStatus,
      refreshSettings: loadSettings,
    }),
    [settingsMap, isLoading, canAccessPage, isUnderMaintenance, togglePageStatus, loadSettings]
  );

  return (
    <PageAccessContext.Provider value={value}>
      {children}
    </PageAccessContext.Provider>
  );
};

const defaultFallbackSettingsMap: Record<PageKey, AppPageSetting> = DEFAULT_PAGE_SETTINGS.reduce(
  (acc, curr) => {
    acc[curr.page_key] = curr;
    return acc;
  },
  {} as Record<PageKey, AppPageSetting>
);

const defaultFallbackContext: PageAccessContextType = {
  pageSettings: defaultFallbackSettingsMap,
  isLoading: false,
  canAccessPage: () => true,
  isUnderMaintenance: () => false,
  togglePageStatus: async () => true,
  refreshSettings: async () => {},
};

export function usePageAccess(): PageAccessContextType {
  const context = useContext(PageAccessContext);
  if (!context) {
    return defaultFallbackContext;
  }
  return context;
}
