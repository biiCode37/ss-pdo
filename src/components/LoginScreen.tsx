import { useState, useEffect } from "react";
import { signIn, signOut } from "../services/googleSheets";
import { verifyUserProfile, upsertUserProfile } from "../services/routeService";
import { formatUserError } from "../utils/errorFormatter";
import { LegalModals } from "./login/LegalModals";
import type { LegalModalType } from "./login/LegalModals";
import { LoginHeroCard } from "./login/LoginHeroCard";
import { LoginFeatureCards } from "./login/LoginFeatureCards";
import { LoginInfoModal } from "./login/LoginInfoModal";
import { LoginFooter } from "./login/LoginFooter";
import { useMobileBackHandler } from "../hooks/useMobileBackHandler";
import { TEXT_AUTH } from "../constants/texts";

interface Props {
  onLoginSuccess: () => void;
  isApiReady: boolean;
}

export function LoginScreen({ onLoginSuccess, isApiReady }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<LegalModalType>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Mobile Back Navigation: Close legal modals or info modal on hardware back / swipe back
  useMobileBackHandler({
    id: "legal_modal",
    isOpen: Boolean(activeModal),
    onClose: () => closeModal(),
  });

  useMobileBackHandler({
    id: "login_info_modal",
    isOpen: isInfoModalOpen,
    onClose: () => setIsInfoModalOpen(false),
  });

  // Dukungan URL Hash langsung untuk verifikasi crawler Google (#privacy, #terms, #developer, #info)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (
        hash === "privacy" ||
        hash === "privacypolicy" ||
        hash === "privacy-policy"
      ) {
        setActiveModal("privacy");
      } else if (
        hash === "terms" ||
        hash === "termsofservice" ||
        hash === "terms-of-service"
      ) {
        setActiveModal("terms");
      } else if (hash === "developer" || hash === "contact") {
        setActiveModal("developer");
      } else if (hash === "info" || hash === "about") {
        setIsInfoModalOpen(true);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    if (window.location.hash) {
      try {
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      } catch {}
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn();

      // PDO_USER_EMAIL sekarang pasti tersedia karena signIn() menunggu userinfo selesai
      const userEmail = localStorage.getItem("PDO_USER_EMAIL") || "";
      const userName = localStorage.getItem("PDO_USER_NAME") || "";
      const userAvatar = localStorage.getItem("PDO_USER_AVATAR") || "";

      if (userEmail) {
        // Verifikasi apakah user terdaftar dan aktif di Supabase
        const verify = await verifyUserProfile(userEmail);
        if (!verify.isAllowed) {
          await signOut();
          setError(verify.message || TEXT_AUTH.NOT_ALLOWED);
          return;
        }

        if (verify.profile) {
          if (verify.profile.full_name)
            localStorage.setItem("PDO_USER_NAME", verify.profile.full_name);
          if (verify.profile.email)
            localStorage.setItem("PDO_USER_EMAIL", verify.profile.email);
          if (verify.profile.role)
            localStorage.setItem("PDO_USER_ROLE", verify.profile.role);
        }

        const finalAvatar =
          userAvatar ||
          verify.profile?.avatar_url ||
          localStorage.getItem("PDO_USER_AVATAR") ||
          "";

        if (finalAvatar) {
          localStorage.setItem("PDO_USER_AVATAR", finalAvatar);
        }

        // Sinkronkan profil user ke Supabase (fire-and-forget, tidak blocking)
        // ponytail: upsert async agar tidak memperlambat login
        upsertUserProfile({
          email: userEmail,
          full_name: userName || verify.profile?.full_name || userEmail,
          avatar_url: finalAvatar || undefined,
        }).catch(() => {
          // Gagal upsert bukan fatal — user tetap bisa masuk
        });

        onLoginSuccess();
      } else {
        // BUG-38: Jika email tidak tersedia setelah OAuth, tolak akses
        await signOut();
        setError(TEXT_AUTH.UNVERIFIED_IDENTITY);
        return;
      }
    } catch (err: any) {
      const userMessage = formatUserError(err);
      if (userMessage) {
        setError(userMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="app-container login-page-container"
      style={{
        paddingTop: "20px",
        paddingBottom: "40px",
        maxWidth: "580px",
        margin: "0 auto",
      }}
    >
      {/* 1. Hero Card: Brand & Login Action */}
      <LoginHeroCard
        isLoading={isLoading}
        isApiReady={isApiReady}
        error={error}
        onLogin={handleLogin}
        onOpenInfo={() => setIsInfoModalOpen(true)}
      />

      {/* 2. Feature Pillar Cards */}
      <LoginFeatureCards />

      {/* 3. Footer Links & Copyright */}
      <LoginFooter onSelectModal={(modal) => setActiveModal(modal)} />

      {/* 4. Bottom Sheet Info: Tentang PUSM, Komparasi, & Transparansi Izin */}
      <LoginInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

      {/* 5. Modal Popup: Kebijakan Privasi / Terms / Developer Info */}
      <LegalModals activeModal={activeModal} onClose={closeModal} />
    </div>
  );
}
