import { useState } from "react";
import {
  X,
  Info,
  Zap,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TEXT_AUTH } from "../../constants/texts";

interface LoginInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginInfoModal({ isOpen, onClose }: LoginInfoModalProps) {
  const [showSheetsScopeDetails, setShowSheetsScopeDetails] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay login-info-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "flex-end", // Mobile bottom sheet style
        justifyContent: "center",
        zIndex: 1050,
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className="glass login-info-sheet no-scrollbar"
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "20px 20px 32px",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          textAlign: "left",
          position: "relative",
          backgroundColor: "var(--bg-card, #171717)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
          animation: "slideUp 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull Indicator Bar */}
        <div
          style={{
            width: "40px",
            height: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: "9999px",
            margin: "0 auto 16px auto",
          }}
        />

        {/* Sheet Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
            paddingBottom: "12px",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                padding: "6px",
                borderRadius: "8px",
                backgroundColor: "rgba(62, 207, 142, 0.15)",
                color: "var(--accent-color, #3ECF8E)",
              }}
            >
              <Info size={18} />
            </div>
            <h3
              style={{
                fontSize: "17px",
                fontWeight: 800,
                margin: 0,
                color: "var(--text-primary)",
              }}
            >
              Tentang Aplikasi & Izin Akses
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Tutup"
            data-testid="close-info-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Tentang PUSM */}
        <div style={{ marginBottom: "24px" }}>
          <h4
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            {TEXT_AUTH.ABOUT_TITLE}
          </h4>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "13px",
              lineHeight: 1.6,
              marginBottom: "12px",
            }}
          >
            <strong>PUSM</strong> (<em>PDO Utara Spreadsheet Mobile</em>) dibuat
            untuk memudahkan petugas lapangan dalam mencatat dan memantau kondisi
            armada, capaian ritase, kilometer, dan jumlah pelanggan Mikrotrans
            Transjakarta di Wilayah Utara secara praktis dan interaktif lewat ponsel.
          </p>

          <div style={{ display: "grid", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-color)",
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
                <strong style={{ color: "#3ECF8E" }}>
                  Digitalisasi Pencatatan Lapangan:
                </strong>{" "}
                Mengisi ritase dan kondisi shift harian tanpa perlu membawa kertas fisik.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-color)",
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
                <strong style={{ color: "#3ECF8E" }}>
                  Tersambung Langsung ke Spreadsheet Pengawas:
                </strong>{" "}
                Setiap laporan tersimpan rapi ke Google Spreadsheet resmi operasional.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-color)",
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
                <strong style={{ color: "#3ECF8E" }}>
                  Pemantauan Kinerja Cepat:
                </strong>{" "}
                Melihat jadwal rute, armada aktif, target ritase, dan data pelanggan langsung dari HP.
              </div>
            </div>
          </div>
        </div>

        {/* 2. Komparasi: PUSM vs Google Spreadsheet HP */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <Zap size={17} color="var(--accent-color, #3ECF8E)" />
            <h4
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {TEXT_AUTH.VS_TITLE}
            </h4>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              marginBottom: "12px",
            }}
          >
            Dirancang khusus untuk kenyamanan entri data operasional lapangan:
          </p>

          <div style={{ display: "grid", gap: "10px" }}>
            {/* Komparasi 1 */}
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  color: "var(--text-primary)",
                }}
              >
                1. Kenyamanan Tampilan Layar HP
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <XCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>
                    <strong style={{ color: "#ef4444" }}>Spreadsheet Biasa:</strong> Sel kecil, sering zoom in/out melelahkan.
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <CheckCircle2 size={15} color="#3ECF8E" style={{ flexShrink: 0 }} />
                  <span>
                    <strong style={{ color: "#3ECF8E" }}>PUSM:</strong> Tampilan kartu responsif, pas dioperasikan dengan satu tangan.
                  </span>
                </div>
              </div>
            </div>

            {/* Komparasi 2 */}
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  color: "var(--text-primary)",
                }}
              >
                2. Keamanan dan Format Pengisian
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <XCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>
                    <strong style={{ color: "#ef4444" }}>Spreadsheet Biasa:</strong> Rawan salah ketik format sel atau rumus terhapus.
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <CheckCircle2 size={15} color="#3ECF8E" style={{ flexShrink: 0 }} />
                  <span>
                    <strong style={{ color: "#3ECF8E" }}>PUSM:</strong> Form terarah otomatis memformat data tanpa menyentuh rumus sheet.
                  </span>
                </div>
              </div>
            </div>

            {/* Komparasi 3 */}
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  color: "var(--text-primary)",
                }}
              >
                3. Rekapitulasi & Akumulasi Periode
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <XCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                  <span>
                    <strong style={{ color: "#ef4444" }}>Spreadsheet Biasa:</strong> Harus membuka puluhan tab dan menjumlah manual.
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <CheckCircle2 size={15} color="#3ECF8E" style={{ flexShrink: 0 }} />
                  <span>
                    <strong style={{ color: "#3ECF8E" }}>PUSM:</strong> Akumulasi otomatis lintas tanggal dalam satu ketukan.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Transparansi Izin Akses Google Sheets */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <FileSpreadsheet size={17} color="var(--accent-color, #3ECF8E)" />
            <h4
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {TEXT_AUTH.PERMISSIONS_TITLE}
            </h4>
          </div>
          <p
            style={{
              fontSize: "12.5px",
              color: "var(--text-secondary)",
              lineHeight: 1.55,
              marginBottom: "10px",
            }}
          >
            Aplikasi memerlukan izin akses Google Spreadsheet untuk membaca jadwal rute dan menyimpan laporan pengisian tugas operasional ke sheet resmi yang ditugaskan kepada Anda.
          </p>

          <button
            type="button"
            onClick={() => setShowSheetsScopeDetails(!showSheetsScopeDetails)}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-color, #3ECF8E)",
              fontSize: "12px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              padding: "4px 0",
              marginBottom: "8px",
            }}
          >
            {showSheetsScopeDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            <span>
              {showSheetsScopeDetails
                ? "Sembunyikan rincian izin resmi Google"
                : "Lihat rincian izin resmi Google"}
            </span>
          </button>

          {showSheetsScopeDetails && (
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                border: "1px solid var(--border-color)",
                fontSize: "12px",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              <div style={{ marginBottom: "4px" }}>
                <strong style={{ color: "var(--text-primary)" }}>
                  Cakupan izin OAuth yang digunakan:
                </strong>
              </div>
              <div>• Akses baca & tulis Google Spreadsheet tugas operasional</div>
              <div>• Alamat email dan nama profil (verifikasi identitas petugas)</div>
              <div style={{ marginTop: "6px", color: "var(--accent-color, #3ECF8E)" }}>
                Keamanan login dan transmisi token dienkripsi langsung oleh infrastruktur resmi Google.
              </div>
            </div>
          )}
        </div>

        {/* Close Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="btn"
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Tutup & Kembali
        </button>
      </div>
    </div>
  );
}
