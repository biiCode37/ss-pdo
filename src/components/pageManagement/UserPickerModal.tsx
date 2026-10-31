import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, User } from 'lucide-react';
import { TEXT_PAGE_MANAGEMENT } from '@/constants/texts';
import type { UserProfile } from '@/types/supabase';
import { fetchAllUserProfiles } from '@/services/routes/users';
import { RoleBadge } from '@/components/userManagement/RoleBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserProfile) => void;
  excludedEmails?: string[];
  title?: string;
}

export const UserPickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectUser,
  excludedEmails = [],
  title,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    fetchAllUserProfiles()
      .then((data) => {
        if (isMounted) {
          setUsers(data || []);
        }
      })
      .catch((err) => {
        console.warn('[UserPickerModal] Gagal memuat daftar pengguna:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Reset query saat dibuka kembali
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const excludedSet = useMemo(() => {
    return new Set(excludedEmails.map((e) => e.toLowerCase().trim()));
  }, [excludedEmails]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      if (u.is_active === false) return false;
      const email = (u.email || '').toLowerCase().trim();
      if (excludedSet.has(email)) return false;

      if (!q) return true;
      const name = (u.full_name || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, searchQuery, excludedSet]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || TEXT_PAGE_MANAGEMENT.USER_PICKER.TITLE}
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '85vh',
          backgroundColor: 'var(--color-surface-default)',
          borderRadius: '20px',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'pmSpringUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            {title || TEXT_PAGE_MANAGEMENT.USER_PICKER.TITLE}
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input Bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={TEXT_PAGE_MANAGEMENT.USER_PICKER.SEARCH_PLACEHOLDER}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text-primary)',
                fontSize: '13.5px',
                outline: 'none',
              }}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {isLoading ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              Memuat pengguna...
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.email}
                data-testid={`user-pick-item-${user.email}`}
                onClick={() => {
                  onSelectUser(user);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-surface-subtle)',
                  border: '1px solid var(--color-border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.32, 0.72, 0, 1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-surface-default)',
                      border: '1px solid var(--color-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    <User size={16} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.full_name}
                    </span>
                    <span
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--color-text-muted)',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.email}
                    </span>
                  </div>
                </div>

                <div style={{ flexShrink: 0, marginLeft: '10px' }}>
                  <RoleBadge role={user.role} size="xs" />
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              {searchQuery
                ? TEXT_PAGE_MANAGEMENT.USER_PICKER.NO_USERS_FOUND
                : TEXT_PAGE_MANAGEMENT.USER_PICKER.EMPTY_LIST}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

