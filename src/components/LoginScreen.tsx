import { useState } from "react";
import { signIn, signOut } from "../services/googleSheets";
import { verifyUserProfile, upsertUserProfile } from "../services/routeService";
import {
  LogIn,
  Loader2,
  ShieldCheck,
  FileSpreadsheet,
  Bus,
  CheckCircle2,
  Lock,
  Mail,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  Activity,
  Layers,
  Zap,
  XCircle,
} from "lucide-react";
import { formatUserError } from "../utils/errorFormatter";

interface Props {
  onLoginSuccess: () => void;
  isApiReady: boolean;
}

type ModalType = "privacy" | "terms" | "developer" | null;

export function LoginScreen({ onLoginSuccess, isApiReady }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showSheetsScopeDetails, setShowSheetsScopeDetails] = useState(false);

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
          setError(
            verify.message ||
              "Akun Anda belum terdaftar. Silakan hubungi admin atau pengawas untuk pendaftaran akses.",
          );
          return;
        }

        if (verify.profile) {
          if (verify.profile.full_name)
            localStorage.setItem("PDO_USER_NAME", verify.profile.full_name);
          if (verify.profile.email)
            localStorage.setItem("PDO_USER_EMAIL", verify.profile.email);
          if (verify.profile.avatar_url)
            localStorage.setItem("PDO_USER_AVATAR", verify.profile.avatar_url);
        }

        // Sinkronkan profil user ke Supabase (fire-and-forget, tidak blocking)
        // ponytail: upsert async agar tidak memperlambat login
        upsertUserProfile({
          email: userEmail,
          full_name: userName || userEmail,
          avatar_url: userAvatar || undefined,
        }).catch(() => {
          // Gagal upsert bukan fatal — user tetap bisa masuk
        });

        onLoginSuccess();
      } else {
        // BUG-38: Jika email tidak tersedia setelah OAuth, tolak akses
        await signOut();
        setError(
          "Tidak dapat memverifikasi identitas akun Google Anda. Silakan coba masuk kembali.",
        );
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
      className="app-container"
      style={{
        paddingTop: "24px",
        paddingBottom: "48px",
        maxWidth: "680px",
        margin: "0 auto",
      }}
    >
      {/* 1. Hero Card: Branding & Login */}
      <div
        className="glass"
        style={{
          padding: "32px 24px",
          textAlign: "center",
          marginBottom: "20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow Accent */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "180px",
            height: "180px",
            background:
              "radial-gradient(circle, rgba(62, 207, 142, 0.25) 0%, rgba(62, 207, 142, 0) 70%)",
            pointerEvents: "none",
          }}
        />

        <img
          src="/app-logo.png"
          alt="Logo PUSM"
          style={{
            width: "88px",
            height: "88px",
            margin: "0 auto 16px auto",
            borderRadius: "22px",
            display: "block",
            filter: "drop-shadow(0 8px 24px rgba(62, 207, 142, 0.3))",
          }}
        />

        <h1
          style={{
            fontSize: "32px",
            fontWeight: 800,
            letterSpacing: "-0.5px",
            marginBottom: "4px",
            background: "var(--title-gradient)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          PUSM
        </h1>

        <div
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "20px",
            backgroundColor: "rgba(62, 207, 142, 0.12)",
            border: "1px solid rgba(62, 207, 142, 0.3)",
            color: "#3ECF8E",
            fontSize: "12px",
            fontWeight: 600,
            marginBottom: "12px",
            letterSpacing: "0.3px",
          }}
        >
          PDO Utara Spreadsheet Mobile
        </div>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "14px",
            lineHeight: 1.55,
            marginBottom: "24px",
            maxWidth: "480px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Aplikasi pencatatan dan pemantauan tugas operasional harian armada
          Transjakarta Mikrotrans Wilayah Utara yang terhubung langsung ke
          Google Spreadsheet internal.
        </p>

        {error && (
          <div
            className="error-text"
            style={{
              marginBottom: "18px",
              padding: "10px 14px",
              borderRadius: "10px",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              fontSize: "13px",
              textAlign: "left",
            }}
          >
            {error}
          </div>
        )}

        <button
          className="btn"
          onClick={handleLogin}
          disabled={isLoading || !isApiReady}
          style={{
            width: "100%",
            maxWidth: "360px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "14px 20px",
            fontSize: "15px",
            fontWeight: 600,
            borderRadius: "12px",
            opacity: isApiReady ? 1 : 0.5,
          }}
        >
          {isLoading ? (
            <Loader2 className="spinner" size={20} />
          ) : (
            <LogIn size={20} />
          )}
          Masuk dengan Akun Google
        </button>

        <p
          style={{
            fontSize: "11.5px",
            color: "var(--text-secondary)",
            marginTop: "12px",
          }}
        >
          Gunakan akun Google yang sudah didaftarkan oleh admin atau pengawas.
        </p>
      </div>

      {/* 2. Section: Tujuan Aplikasi & Informasi Publik */}
      <div
        className="glass"
        style={{
          padding: "24px",
          marginBottom: "16px",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              padding: "8px",
              borderRadius: "10px",
              backgroundColor: "rgba(62, 207, 142, 0.15)",
              color: "#3ECF8E",
            }}
          >
            <Info size={20} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
            Tentang PUSM
          </h2>
        </div>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "13.5px",
            lineHeight: 1.6,
            marginBottom: "16px",
          }}
        >
          <strong>PUSM</strong> (<em>PDO Utara Spreadsheet Mobile</em>) dibuat
          untuk memudahkan petugas lapangan dalam mencatat dan memantau kondisi
          armada, capaian ritase, kilometer dan jumlah pelanggan Mikrotrans
          Transjakarta di Wilayah Utara secara praktis dan interaktif lewat
          ponsel.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "12px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-color)",
            }}
          >
            <CheckCircle2
              size={18}
              color="#3ECF8E"
              style={{ flexShrink: 0, marginTop: "2px" }}
            />
            <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
              <strong style={{ color: "#3ECF8E" }}>
                Digitalisasi Pencatatan Lapangan
              </strong>
              <br />
              Mencatat data ritase dan kondisi armada shift harian langsung dari
              ponsel tanpa repot membawa dan menulis di lembaran kertas fisik.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "12px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-color)",
            }}
          >
            <CheckCircle2
              size={18}
              color="#3ECF8E"
              style={{ flexShrink: 0, marginTop: "2px" }}
            />
            <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
              <strong style={{ color: "#3ECF8E" }}>
                Tersambung Langsung ke Spreadsheet Pengawas
              </strong>
              <br />
              Setiap laporan yang diisi langsung tersimpan rapi ke Google
              Spreadsheet resmi yang digunakan bersama oleh tim pengawas.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "12px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-color)",
            }}
          >
            <CheckCircle2
              size={18}
              color="#3ECF8E"
              style={{ flexShrink: 0, marginTop: "2px" }}
            />
            <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
              <strong style={{ color: "#3ECF8E" }}>
                Pemantauan Kinerja Lapangan
              </strong>
              <br />
              Melihat jadwal rute, armada aktif, target kilometer, dan data
              penumpang secara terpusat kapan saja saat bertugas di lapangan.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section: Kenapa Pilih PUSM Dibanding Spreadsheet HP? */}
      <div
        className="glass"
        style={{
          padding: "24px",
          marginBottom: "16px",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              padding: "8px",
              borderRadius: "10px",
              backgroundColor: "rgba(62, 207, 142, 0.15)",
              color: "#3ECF8E",
            }}
          >
            <Zap size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
              Spreadsheet vs PUSM
            </h2>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              Dirancang khusus untuk kecepatan, kemudahan, dan keamanan kerja
              lapangan
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gap: "14px" }}>
          {/* Komparasi 1: Tampilan HP */}
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "10px",
              }}
            >
              1. Kenyamanan Tampilan di Layar HP
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  fontSize: "12.5px",
                  lineHeight: 1.45,
                }}
              >
                <XCircle
                  size={16}
                  color="#ef4444"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <div>
                  <strong style={{ color: "#ef4444" }}>
                    Google Spreadsheet HP:
                  </strong>{" "}
                  Tabel kotak-kotak kecil, harus sering <em>zoom in/out</em> dan
                  geser kanan-kiri yang melelahkan mata.
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(62, 207, 142, 0.08)",
                  border: "1px solid rgba(62, 207, 142, 0.25)",
                  fontSize: "12.5px",
                  lineHeight: 1.45,
                }}
              >
                <CheckCircle2
                  size={16}
                  color="#3ECF8E"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <div>
                  <strong style={{ color: "#3ECF8E" }}>PUSM:</strong> Tampilan
                  kartu ringkas yang pas di layar HP, nyaman dibaca dan mudah
                  dioperasikan dengan satu tangan.
                </div>
              </div>
            </div>
          </div>

          {/* Komparasi 2: Keamanan dan Kerapihan Format Input */}
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "10px",
              }}
            >
              2. Keamanan dan Kerapihan Format Input
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  fontSize: "12.5px",
                  lineHeight: 1.45,
                }}
              >
                <XCircle
                  size={16}
                  color="#ef4444"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <div>
                  <strong style={{ color: "#ef4444" }}>
                    Google Spreadsheet HP:
                  </strong>{" "}
                  Rawan salah ketik format angka/tanda baca, salah isi data sel,
                  atau tidak sengaja merubah/menghapus data lainnya.
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(62, 207, 142, 0.08)",
                  border: "1px solid rgba(62, 207, 142, 0.25)",
                  fontSize: "12.5px",
                  lineHeight: 1.45,
                }}
              >
                <CheckCircle2
                  size={16}
                  color="#3ECF8E"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <div>
                  <strong style={{ color: "#3ECF8E" }}>PUSM:</strong>{" "}
                  Fleksibilitas entri data terarah lewat form khusus dengan
                  metode fokus per kolom/semua kolom dengan format pengisian sel
                  yang rapih, aman, dan tanpa merusak susunan sel.
                </div>
              </div>
            </div>
          </div>

          {/* Komparasi 3: Rekap & Akumulasi Lintas Tanggal */}
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "10px",
              }}
            >
              3. Rekap & Akumulasi Periode
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  fontSize: "12.5px",
                  lineHeight: 1.45,
                }}
              >
                <XCircle
                  size={16}
                  color="#ef4444"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <div>
                  <strong style={{ color: "#ef4444" }}>
                    Google Spreadsheet HP:
                  </strong>{" "}
                  Harus membuka beberapa tab sheet per tanggal satu per satu dan
                  menjumlahkan data secara manual untuk membuat rekapitulasi
                  periode.
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(62, 207, 142, 0.08)",
                  border: "1px solid rgba(62, 207, 142, 0.25)",
                  fontSize: "12.5px",
                  lineHeight: 1.45,
                }}
              >
                <CheckCircle2
                  size={16}
                  color="#3ECF8E"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
                <div>
                  <strong style={{ color: "#3ECF8E" }}>PUSM:</strong> Mendukung
                  akumulasi dan perbandingan data dari berbagai tanggal secara
                  otomatis dalam satu tampilan yang ringkas dan praktis.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section: Transparansi Izin Google Spreadsheet */}
      <div
        className="glass"
        style={{
          padding: "24px",
          marginBottom: "16px",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              padding: "8px",
              borderRadius: "10px",
              backgroundColor: "rgba(62, 207, 142, 0.15)",
              color: "#3ECF8E",
            }}
          >
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
              PUSM Perlu Izin Akun Google
            </h2>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              Penjelasan mengenai akses yang dibutuhkan oleh PUSM
            </p>
          </div>
        </div>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "13px",
            lineHeight: 1.6,
            marginBottom: "14px",
          }}
        >
          Saat Anda masuk dengan Google, PUSM memerlukan izin akses Google
          Spreadsheet untuk kebutuhan tugas kerja berikut:
        </p>

        <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-color)",
              fontSize: "12.5px",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "#3ECF8E" }}>
              1. Melihat Data Armada per Rute:
            </strong>{" "}
            Membuka rute, nomor body unit, data kilometer, dan jumlah pelanggan
            yang ada di spreadsheet operasional.
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-color)",
              fontSize: "12.5px",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "#3ECF8E" }}>
              2. Menyimpan Catatan Tugas:
            </strong>{" "}
            Menyimpan data operasional dan catatan kondisi armada langsung ke
            spreadsheet operasional.
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-color)",
              fontSize: "12.5px",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "#3ECF8E" }}>
              3. Privasi Anda Tetap Aman:
            </strong>{" "}
            PUSM <strong>hanya</strong> membuka file spreadsheet operasional
            internal berdasarkan Link/URL spreadsheet yang dibagikan oleh admin
            internal kepada anda.
          </div>
        </div>

        <button
          onClick={() => setShowSheetsScopeDetails(!showSheetsScopeDetails)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {showSheetsScopeDetails ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
          {showSheetsScopeDetails
            ? "Sembunyikan rincian izin Google"
            : "Lihat rincian izin resmi Google"}
        </button>

        {showSheetsScopeDetails && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              borderRadius: "8px",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              border: "1px solid var(--border-color)",
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            <div style={{ marginBottom: "4px" }}>
              <strong style={{ color: "var(--text-primary)" }}>
                Izin resmi yang digunakan:
              </strong>
            </div>
            <div>• Akses baca & tulis Google Spreadsheet tugas operasional</div>
            <div>
              • Alamat email dan nama profil (sebagai tanda Login petugas)
            </div>
            <div style={{ marginTop: "6px", color: "#3ECF8E" }}>
              Seluruh proses login dan pengiriman data diamankan langsung oleh
              sistem keamanan resmi Google.
            </div>
          </div>
        )}
      </div>

      {/* 4. Section: Fitur Utama */}
      <div
        className="glass"
        style={{
          padding: "24px",
          marginBottom: "24px",
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              padding: "8px",
              borderRadius: "10px",
              backgroundColor: "rgba(62, 207, 142, 0.15)",
              color: "#3ECF8E",
            }}
          >
            <Layers size={20} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
            Fitur Utama Aplikasi
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "12px",
          }}
        >
          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                color: "#3ECF8E",
                fontWeight: 600,
                fontSize: "13.5px",
              }}
            >
              <Activity size={16} /> Dashboard Capaian Rute
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Menyajikan capaian total ritase, kilometer, dan jumlah pelanggan
              rute terkait termasuk capaian per unitnya serta menyajikan
              perbandingan performa Shift 1 vs Shift 2 per unit.
            </p>
          </div>

          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                color: "#3ECF8E",
                fontWeight: 600,
                fontSize: "13.5px",
              }}
            >
              <Bus size={16} /> Pencarian Unit & Catatan Lapangan
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Cari nomor bodi armada dalam sekejap, lengkapi data kilometer, dan
              tandai unit yang siap jalan maupun perbaikan hanya dengan satu
              ketukan.
            </p>
          </div>

          <div
            style={{
              padding: "14px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                color: "#3ECF8E",
                fontWeight: 600,
                fontSize: "13.5px",
              }}
            >
              <Lock size={16} /> Formulir Cepat & Aman
            </div>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Cukup isi formulir kartu di HP, data otomatis terkirim dan
              tersimpan rapi ke file Google Spreadsheet resmi tanpa mengubah
              struktur rumus.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Footer: Links & Legal Information */}
      <div
        style={{
          textAlign: "center",
          paddingTop: "8px",
          borderTop: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "18px",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          <button
            onClick={() => setActiveModal("privacy")}
            style={{
              background: "none",
              border: "none",
              color: "#3ECF8E",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px",
            }}
          >
            <ShieldCheck size={14} /> Kebijakan Privasi
          </button>

          <button
            onClick={() => setActiveModal("terms")}
            style={{
              background: "none",
              border: "none",
              color: "#3ECF8E",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px",
            }}
          >
            <FileText size={14} /> Syarat & Ketentuan
          </button>

          <button
            onClick={() => setActiveModal("developer")}
            style={{
              background: "none",
              border: "none",
              color: "#3ECF8E",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px",
            }}
          >
            <Mail size={14} /> Kontak Pengembang
          </button>
        </div>

        <p
          style={{
            fontSize: "11.5px",
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >
          © 2026 PUSM — PDO Utara Spreadsheet Mobile. Hak cipta dilindungi.
        </p>
      </div>

      {/* 6. Modal Popup: Kebijakan Privasi / Terms / Developer Info */}
      {activeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            className="glass"
            style={{
              width: "100%",
              maxWidth: "560px",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "24px",
              borderRadius: "16px",
              textAlign: "left",
              position: "relative",
              backgroundColor: "var(--bg-card, #171717)",
              border: "1px solid var(--border-color)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--text-primary)",
                }}
              >
                {activeModal === "privacy" &&
                  "Kebijakan Privasi (Privacy Policy)"}
                {activeModal === "terms" &&
                  "Syarat & Ketentuan Layanan (Terms of Service)"}
                {activeModal === "developer" && "Informasi Kontak Pengembang"}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content: Privacy Policy */}
            {activeModal === "privacy" && (
              <div
                style={{
                  fontSize: "13px",
                  lineHeight: 1.65,
                  color: "var(--text-secondary)",
                }}
              >
                <p>
                  <strong>Terakhir Diperbarui: 20 Agustus 2026</strong>
                </p>
                <p>
                  Aplikasi <strong>PUSM</strong> (
                  <em>PDO Utara Spreadsheet Mobile</em>) sangat menghargai dan
                  menjaga keamanan data setiap pengguna. Halaman ini menjelaskan
                  cara kami mengelola informasi saat Anda menggunakan aplikasi:
                </p>

                <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
                  1. Informasi yang Digunakan
                </h4>
                <p>
                  Saat Anda masuk menggunakan akun Google, aplikasi hanya
                  menggunakan informasi dasar seperti nama, alamat email, dan
                  foto profil semata-mata untuk mengenali identitas Anda sebagai
                  petugas yang berhak mengakses sistem.
                </p>

                <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
                  2. Penggunaan Akses Google Spreadsheet
                </h4>
                <p>
                  Aplikasi ini hanya mengakses file spreadsheet tugas
                  operasional yang telah disiapkan untuk mencatat ritase dan
                  kondisi armada. Aplikasi <strong>tidak akan pernah</strong>{" "}
                  melihat atau membuka file pribadi lain di Google Drive Anda.
                </p>

                <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
                  3. Keamanan & Kerahasiaan Data
                </h4>
                <p>
                  Semua catatan kerja tersimpan langsung di spreadsheet Google
                  resmi instansi. Kami tidak pernah membagikan atau menjual data
                  operasional Anda kepada pihak luar mana pun.
                </p>

                <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
                  4. Kontak Bantuan
                </h4>
                <p>
                  Bila ada pertanyaan atau kendala seputar privasi data, Anda
                  dapat menghubungi kami melalui email:{" "}
                  <a
                    href="mailto:muhammadabyn37@gmail.com"
                    style={{ color: "#3ECF8E" }}
                  >
                    muhammadabyn37@gmail.com
                  </a>
                  .
                </p>
              </div>
            )}

            {/* Content: Terms of Service */}
            {activeModal === "terms" && (
              <div
                style={{
                  fontSize: "13px",
                  lineHeight: 1.65,
                  color: "var(--text-secondary)",
                }}
              >
                <p>
                  <strong>Terakhir Diperbarui: 20 Agustus 2026</strong>
                </p>
                <p>
                  Dengan menggunakan aplikasi <strong>PUSM</strong>, Anda
                  menyetujui beberapa ketentuan penggunaan berikut:
                </p>

                <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
                  1. Peruntukan Aplikasi
                </h4>
                <p>
                  Aplikasi ini disediakan untuk membantu petugas operasional
                  lapangan (Petugas Driving Order) dan tim pengawas dalam
                  mengelola tugas harian armada Mikrotrans Transjakarta.
                </p>

                <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
                  2. Penggunaan Akun
                </h4>
                <p>
                  Petugas diharapkan menjaga keamanan akun Google masing-masing
                  dan memastikan data ritase yang dimasukkan ke dalam
                  spreadsheet sesuai dengan kondisi nyata di lapangan.
                </p>

                <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
                  3. Ketersediaan Layanan
                </h4>
                <p>
                  Aplikasi terus dipelihara agar selalu lancar dan memudahkan
                  tugas Anda di lapangan. Pengembang berupaya memastikan sistem
                  selalu siap pakai kapan pun dibutuhkan.
                </p>
              </div>
            )}

            {/* Content: Developer Contact */}
            {activeModal === "developer" && (
              <div
                style={{
                  fontSize: "13px",
                  lineHeight: 1.65,
                  color: "var(--text-secondary)",
                }}
              >
                <p>
                  Aplikasi <strong>PUSM</strong> dikembangkan dan dikelola oleh:
                </p>
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-color)",
                    marginTop: "12px",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <strong style={{ color: "var(--text-primary)" }}>
                      Pengembang:
                    </strong>{" "}
                    M. Abi Nubly
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong style={{ color: "var(--text-primary)" }}>
                      Email:
                    </strong>{" "}
                    <a
                      href="mailto:bionex37@gmail.com"
                      style={{ color: "#3ECF8E" }}
                    >
                      bionex37@gmail.com
                    </a>
                  </div>
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>
                      Tautan Aplikasi:
                    </strong>{" "}
                    <a
                      href="https://bionex-pusm.vercel.app"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#3ECF8E" }}
                    >
                      https://bionex-pusm.vercel.app
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                className="btn"
                onClick={() => setActiveModal(null)}
                style={{
                  padding: "8px 18px",
                  fontSize: "13px",
                  borderRadius: "8px",
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
