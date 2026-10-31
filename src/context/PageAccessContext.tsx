import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import type { PageKey, AppPageSetting, BulkActionType } from '@/types/pageManagement';
import { DEFAULT_PAGE_SETTINGS } from '@/types/pageManagement';
import {
  fetchPageSettings,
  getCachedSettings,
  updatePageSetting,
  updatePagePermissions,
  bulkUpdatePageSettings,
  fetchActiveSuperadmins,
  subscribeToPageSettings,
} from '@/services/pageManagementService';

export interface PageAccessContextType {
  pageSettings: Record<PageKey, AppPageSetting>;
  isLoading: boolean;
  activeSuperadmins: { email: string; full_name: string }[];
  canAccessPage: (pageKey: PageKey, userRole?: string | null, userEmail?: string | null) => boolean;
  isUnderMaintenance: (pageKey: PageKey) => boolean;
  togglePageStatus: (pageKey: PageKey, nextStatus: boolean) => Promise<boolean>;
  updatePermissions: (
    pageKey: PageKey,
    allowedRoles: string[],
    allowedUserEmails: string[],
    deniedUserEmails: string[]
  ) => Promise<boolean>;
  bulkUpdate: (
    pageKeys: PageKey[],
    action: BulkActionType,
    options: { is_enabled?: boolean; allowed_roles?: string[] }
  ) => Promise<boolean>;
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

  const [activeSuperadmins, setActiveSuperadmins] = useState<{ email: string; full_name: string }[]>([
    { email: 'superadmin@transjakarta.co.id', full_name: 'Superadmin Sistem' },
  ]);

  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const [list, superadmins] = await Promise.all([
        fetchPageSettings(),
        fetchActiveSuperadmins(),
      ]);

      setSettingsMap((prev) => {
        const nextMap = { ...prev };
        list.forEach((item) => {
          nextMap[item.page_key] = item;
        });
        return nextMap;
      });

      if (Array.isArray(superadmins) && superadmins.length > 0) {
        setActiveSuperadmins(superadmins);
      }
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
    (pageKey: PageKey, userRole?: string | null, userEmail?: string | null): boolean => {
      const role = userRole ? userRole.toLowerCase().trim() : null;

      // 1. Superadmin memiliki kuasa penuh untuk mengakses seluruh halaman (master bypass)
      if (role === 'superadmin') return true;

      const setting = settingsMap[pageKey];
      if (!setting) return true;

      // 2. Master Switch: Jika sedang dinonaktifkan (mode perbaikan)
      if (!setting.is_enabled) return false;

      // Ambil dan normalisasi email user aktif
      const rawEmail =
        userEmail ||
        (typeof localStorage !== 'undefined'
          ? localStorage.getItem('PDO_USER_EMAIL')
          : null) ||
        '';
      const email = rawEmail.toLowerCase().trim();

      // 3. User Blacklist (Explicit Deny) - Prioritas tertinggi untuk personil
      if (email && Array.isArray(setting.denied_user_emails) && setting.denied_user_emails.length > 0) {
        const isBlacklisted = setting.denied_user_emails.some(
          (e) => e.toLowerCase().trim() === email
        );
        if (isBlacklisted) return false;
      }

      // 4. User Whitelist (Explicit Allow) - Prioritas kedua untuk personil
      if (email && Array.isArray(setting.allowed_user_emails) && setting.allowed_user_emails.length > 0) {
        const isWhitelisted = setting.allowed_user_emails.some(
          (e) => e.toLowerCase().trim() === email
        );
        if (isWhitelisted) return true;
      }

      // 5. Role Baseline
      if (Array.isArray(setting.allowed_roles) && setting.allowed_roles.length > 0) {
        if (!role) return false;
        // Normalisasi peran petugas menjadi pdo
        const normalizedRole = role === 'petugas' ? 'pdo' : role;
        return setting.allowed_roles.some(
          (r) => r.toLowerCase().trim() === normalizedRole
        );
      }

      // Fallback legacy guard jika konfigurasi peran belum terisi
      if (
        (pageKey === 'regional_monitoring' ||
          pageKey === 'regional_summary' ||
          pageKey === 'regional_wa_report') &&
        (role === 'pdo' || role === 'petugas')
      ) {
        return false;
      }

      return true;
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
        await loadSettings();
      }
      return success;
    },
    [loadSettings]
  );

  const updatePermissions = useCallback(
    async (
      pageKey: PageKey,
      allowedRoles: string[],
      allowedUserEmails: string[],
      deniedUserEmails: string[]
    ): Promise<boolean> => {
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
            allowed_roles: allowedRoles,
            allowed_user_emails: allowedUserEmails,
            denied_user_emails: deniedUserEmails,
            updated_by: email,
            updated_at: new Date().toISOString(),
          },
        };
      });

      const success = await updatePagePermissions(
        pageKey,
        allowedRoles,
        allowedUserEmails,
        deniedUserEmails,
        email
      );

      if (!success) {
        await loadSettings();
      }
      return success;
    },
    [loadSettings]
  );

  const bulkUpdate = useCallback(
    async (
      pageKeys: PageKey[],
      action: BulkActionType,
      options: { is_enabled?: boolean; allowed_roles?: string[] }
    ): Promise<boolean> => {
      const email =
        (typeof localStorage !== 'undefined'
          ? localStorage.getItem('PDO_USER_EMAIL')
          : null) || 'superadmin';

      // Optimistic update
      setSettingsMap((prev) => {
        const next = { ...prev };
        pageKeys.forEach((key) => {
          const existing = next[key];
          if (existing) {
            if (action === 'set_status' && typeof options.is_enabled === 'boolean') {
              next[key] = { ...existing, is_enabled: options.is_enabled, updated_by: email };
            } else if (action === 'set_roles' && options.allowed_roles) {
              next[key] = { ...existing, allowed_roles: options.allowed_roles, updated_by: email };
            } else if (action === 'reset_default') {
              const def = DEFAULT_PAGE_SETTINGS.find((d) => d.page_key === key);
              next[key] = {
                ...existing,
                allowed_roles: def ? def.allowed_roles : ['superadmin', 'admin', 'korwil', 'korlap', 'pdo'],
                allowed_user_emails: [],
                denied_user_emails: [],
                updated_by: email,
              };
            }
          }
        });
        return next;
      });

      const success = await bulkUpdatePageSettings(pageKeys, action, options, email);
      if (!success) {
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
      activeSuperadmins,
      canAccessPage,
      isUnderMaintenance,
      togglePageStatus,
      updatePermissions,
      bulkUpdate,
      refreshSettings: loadSettings,
    }),
    [
      settingsMap,
      isLoading,
      activeSuperadmins,
      canAccessPage,
      isUnderMaintenance,
      togglePageStatus,
      updatePermissions,
      bulkUpdate,
      loadSettings,
    ]
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
  activeSuperadmins: [{ email: 'superadmin@transjakarta.co.id', full_name: 'Superadmin Sistem' }],
  canAccessPage: () => true,
  isUnderMaintenance: () => false,
  togglePageStatus: async () => true,
  updatePermissions: async () => true,
  bulkUpdate: async () => true,
  refreshSettings: async () => {},
};

export function usePageAccess(): PageAccessContextType {
  const context = useContext(PageAccessContext);
  if (!context) {
    return defaultFallbackContext;
  }
  return context;
}
