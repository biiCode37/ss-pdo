import { useState, useEffect } from "react";
import { verifyUserProfile, upsertUserProfile } from "@/services/routeService";
import { fetchGoogleUserProfile } from "@/services/googleSheets/auth";
import { getStoredUserRole } from "@/utils/roleStorage";
import { TEXT_DASHBOARD } from "@/constants/texts";
import type { UserProfileState } from "./types";

export function useProfileData(isOpen: boolean) {
  // BUG-57: Avatar gagal load dilacak via state agar fallback bisa pulih
  // saat URL baru tersedia (sebelumnya display:none imperatif permanen).
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileState>({
    full_name:
      localStorage.getItem("PDO_USER_NAME") ||
      TEXT_DASHBOARD.PROFILE_MENU.DEFAULT_USER_NAME,
    email:
      localStorage.getItem("PDO_USER_EMAIL") ||
      TEXT_DASHBOARD.PROFILE_MENU.DEFAULT_USER_EMAIL,
    avatar_url: localStorage.getItem("PDO_USER_AVATAR") || undefined,
    role: getStoredUserRole(),
  });

  useEffect(() => {
    if (!isOpen) return;

    // Ambil data profil dari localStorage & sync dari Supabase DB
    const cachedEmail = localStorage.getItem("PDO_USER_EMAIL") || "";
    const cachedName = localStorage.getItem("PDO_USER_NAME") || "";
    const cachedAvatar = localStorage.getItem("PDO_USER_AVATAR") || "";

    if (cachedEmail || cachedName) {
      setUserProfile({
        full_name: cachedName || TEXT_DASHBOARD.PROFILE_MENU.DEFAULT_USER_NAME,
        email: cachedEmail || TEXT_DASHBOARD.PROFILE_MENU.DEFAULT_USER_EMAIL,
        avatar_url: cachedAvatar || undefined,
        role: getStoredUserRole(),
      });
    }

    // Jika avatar belum ada di localStorage, ambil langsung dari Google UserInfo API
    if (!cachedAvatar) {
      fetchGoogleUserProfile().then((info) => {
        if (info && info.picture) {
          setUserProfile((prev) => ({
            ...prev,
            avatar_url: info.picture,
            full_name: info.name || prev.full_name,
          }));
          if (cachedEmail) {
            upsertUserProfile({
              email: cachedEmail,
              full_name: info.name || cachedName || cachedEmail,
              avatar_url: info.picture,
            }).catch(() => {});
          }
        }
      });
    }

    if (cachedEmail) {
      verifyUserProfile(cachedEmail).then((res) => {
        if (res.isAllowed && res.profile) {
          const profile = res.profile;
          const effectiveAvatar =
            profile.avatar_url ||
            localStorage.getItem("PDO_USER_AVATAR") ||
            undefined;

          setUserProfile((prev) => ({
            full_name: profile.full_name || prev.full_name || cachedEmail,
            email: profile.email || prev.email,
            avatar_url: effectiveAvatar || prev.avatar_url,
            role: profile.role || prev.role || "pdo",
          }));

          if (profile.full_name)
            localStorage.setItem("PDO_USER_NAME", profile.full_name);
          if (profile.email)
            localStorage.setItem("PDO_USER_EMAIL", profile.email);
          if (profile.role)
            localStorage.setItem("PDO_USER_ROLE", profile.role);
          if (effectiveAvatar)
            localStorage.setItem("PDO_USER_AVATAR", effectiveAvatar);
        }
      });
    }
  }, [isOpen]);

  return {
    userProfile,
    setUserProfile,
    avatarFailed,
    setAvatarFailed,
  };
}
