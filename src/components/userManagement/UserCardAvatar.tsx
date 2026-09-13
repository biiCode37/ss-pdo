import React, { useState } from "react";
import type { UserProfile } from "@/types/supabase";

interface UserCardAvatarProps {
  user: UserProfile;
  isSelf: boolean;
}

export const UserCardAvatar: React.FC<UserCardAvatarProps> = ({
  user,
  isSelf,
}) => {
  const [imgError, setImgError] = useState(false);
  const effectiveAvatar =
    user.avatar_url ||
    (isSelf ? localStorage.getItem("PDO_USER_AVATAR") || undefined : undefined);

  if (effectiveAvatar && !imgError) {
    return (
      <img
        src={effectiveAvatar}
        alt={user.full_name || user.email}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setImgError(true)}
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          objectFit: "cover",
          border: "1px solid var(--card-border, rgba(255, 255, 255, 0.15))",
          flexShrink: 0,
        }}
      />
    );
  }

  const initial = (user.full_name || user.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div
      style={{
        width: "42px",
        height: "42px",
        borderRadius: "12px",
        background: "rgba(59, 130, 246, 0.12)",
        border: "1px solid rgba(59, 130, 246, 0.25)",
        color: "#60a5fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "15px",
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
};
