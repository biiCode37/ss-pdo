import { X } from "lucide-react";

export type LegalModalType = "privacy" | "terms" | "developer" | null;

interface LegalModalsProps {
  activeModal: LegalModalType;
  onClose: () => void;
}

export function LegalModals({ activeModal, onClose }: LegalModalsProps) {
  if (!activeModal) return null;

  return (
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
      onClick={onClose}
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
            {activeModal === "privacy" && "Kebijakan Privasi (Privacy Policy)"}
            {activeModal === "terms" && "Syarat & Ketentuan Layanan (Terms of Service)"}
            {activeModal === "developer" && "Informasi Kontak Pengembang"}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "4px",
            }}
            aria-label="Tutup"
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
              <strong>Terakhir Diperbarui: 21 Agustus 2026</strong>
            </p>
            <p>
              Aplikasi <strong>PUSM</strong> (<em>PDO Utara Spreadsheet Mobile</em>) sangat menghargai dan menjaga keamanan data setiap pengguna. Halaman ini menjelaskan cara kami mengelola informasi saat Anda menggunakan aplikasi:
            </p>

            <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
              1. Informasi yang Digunakan
            </h4>
            <p>
              Saat Anda masuk menggunakan akun Google, aplikasi hanya menggunakan informasi dasar seperti nama, alamat email, dan foto profil semata-mata untuk mengenali identitas Anda sebagai petugas yang berhak mengakses sistem.
            </p>

            <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
              2. Penggunaan Akses Google Spreadsheet
            </h4>
            <p>
              Aplikasi ini hanya mengakses file spreadsheet tugas operasional yang telah disiapkan untuk mencatat ritase dan kondisi armada. Aplikasi <strong>tidak akan pernah</strong> melihat atau membuka file pribadi lain di Google Drive Anda.
            </p>

            <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
              3. Keamanan & Kerahasiaan Data
            </h4>
            <p>
              Semua catatan kerja tersimpan langsung di spreadsheet Google resmi instansi. Kami tidak pernah membagikan atau menjual data operasional Anda kepada pihak luar mana pun.
            </p>

            <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
              4. Kontak Bantuan
            </h4>
            <p>
              Bila ada pertanyaan atau kendala seputar privasi data, Anda dapat menghubungi kami melalui email:{" "}
              <a
                href="mailto:bionex37@gmail.com"
                style={{ color: "#3ECF8E" }}
              >
                bionex37@gmail.com
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
              <strong>Terakhir Diperbarui: 21 Agustus 2026</strong>
            </p>
            <p>
              Dengan menggunakan aplikasi <strong>PUSM</strong>, Anda menyetujui beberapa ketentuan penggunaan berikut:
            </p>

            <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
              1. Peruntukan Aplikasi
            </h4>
            <p>
              Aplikasi ini disediakan untuk membantu petugas operasional lapangan (Petugas Driving Order) dan tim pengawas dalam mengelola tugas harian armada Mikrotrans Transjakarta.
            </p>

            <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
              2. Penggunaan Akun
            </h4>
            <p>
              Petugas diharapkan menjaga keamanan akun Google masing-masing dan memastikan data ritase yang dimasukkan ke dalam spreadsheet sesuai dengan kondisi nyata di lapangan.
            </p>

            <h4 style={{ color: "var(--text-primary)", marginTop: "14px" }}>
              3. Ketersediaan Layanan
            </h4>
            <p>
              Aplikasi terus dipelihara agar selalu lancar dan memudahkan tugas Anda di lapangan. Pengembang berupaya memastikan sistem selalu siap pakai kapan pun dibutuhkan.
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
            onClick={onClose}
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
  );
}
