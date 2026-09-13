import { Zap, CheckCircle2, XCircle } from "lucide-react";
import { TEXT_AUTH } from "@/constants/texts";

export function LoginInfoComparisonSection() {
  return (
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
  );
}
