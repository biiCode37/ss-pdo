import { FileSpreadsheet, ChevronDown, ChevronUp } from "lucide-react";
import { TEXT_AUTH } from "@/constants/texts";

interface LoginInfoPermissionsSectionProps {
  showDetails: boolean;
  onToggleDetails: () => void;
}

export function LoginInfoPermissionsSection({
  showDetails,
  onToggleDetails,
}: LoginInfoPermissionsSectionProps) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <FileSpreadsheet size={16} color="var(--color-action-primary-bg)" />
        <h4
          style={{
            fontSize: "16px",
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
          fontSize: "13px",
          color: "var(--text-secondary)",
          lineHeight: 1.55,
          marginBottom: "10px",
        }}
      >
        Aplikasi memerlukan izin akses Google Spreadsheet untuk membaca jadwal rute dan menyimpan laporan pengisian tugas operasional ke sheet resmi yang ditugaskan kepada Anda.
      </p>

      <button
        type="button"
        onClick={onToggleDetails}
        data-testid="toggle-scope-details-btn"
        style={{
          background: "none",
          border: "none",
          color: "var(--color-link)",
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
        {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <span>
          {showDetails
            ? TEXT_AUTH.HIDE_PERMISSIONS_DETAIL
            : TEXT_AUTH.VIEW_PERMISSIONS_DETAIL}
        </span>
      </button>

      {showDetails && (
        <div
          data-testid="scope-details-box"
          style={{
            padding: "12px",
            borderRadius: "12px",
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
          <div style={{ marginTop: "6px", color: "var(--color-link)" }}>
            Keamanan login dan transmisi token dienkripsi langsung oleh infrastruktur resmi Google.
          </div>
        </div>
      )}
    </div>
  );
}
