import { CheckCircle2 } from "lucide-react";
import { TEXT_AUTH } from "@/constants/texts";

export function LoginInfoAboutSection() {
  return (
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
  );
}
