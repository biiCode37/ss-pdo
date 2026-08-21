import { RotateCw, Trash2 } from "lucide-react";
import type { SyncItem } from "../hooks/useOfflineSync";
import { showInfoToast, showWarningToast } from "../utils/alertUtils";

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: SyncItem[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onResolveConflict: (id: string) => void;
  onForceConflict: (id: string) => void;
  onProcessQueue: () => void;
}

export function QueueModal({
  isOpen,
  onClose,
  queue,
  onRetry,
  onDelete,
  onResolveConflict,
  onForceConflict,
  onProcessQueue,
}: QueueModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "16px",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          borderRadius: "12px",
          padding: "20px",
          width: "100%",
          maxWidth: "420px",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "var(--shadow)",
          border: "1px solid var(--border-color)",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: "16px" }}>
          Antrean Sinkronisasi
        </h2>
        {queue.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>Tidak ada antrean.</p>
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}>
                <strong>Tab {item.tabName}</strong> - Baris {item.rowIndex}
              </p>
              <p
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "13px",
                  color:
                    item.status === "pending"
                      ? "var(--warning-color)"
                      : item.status === "conflict"
                        ? "var(--accent-color)"
                        : "var(--danger-color)",
                }}
              >
                {item.status === "pending" &&
                  `⏳ Menunggu (percobaan ke-${(item.retryCount || 0) + 1})`}
                {item.status === "failed" &&
                  `❌ Gagal setelah ${item.retryCount} percobaan`}
                {item.status === "conflict" &&
                  "⚠️ Tabrakan data: Data server telah berubah"}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                {item.status === "failed" && (
                  <>
                    <button
                      className="btn btn-outline"
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={() => {
                        onRetry(item.id);
                        showInfoToast("Mencoba menyinkronkan kembali...");
                      }}
                    >
                      <RotateCw size={14} /> Coba Lagi
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        color: "var(--danger-color)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 size={14} /> Hapus
                    </button>
                  </>
                )}
                {item.status === "conflict" && (
                  <>
                    <button
                      className="btn btn-outline"
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={() => {
                        onResolveConflict(item.id);
                        showInfoToast("Menggunakan data dari server.");
                      }}
                    >
                      Gunakan Data Server
                    </button>
                    <button
                      className="btn"
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        background: "var(--danger-color)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      onClick={() => {
                        onForceConflict(item.id);
                        showWarningToast(
                          "Menimpa data server dengan data lokal...",
                        );
                      }}
                    >
                      Force Save
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          {queue.some((q) => q.status === "pending") && (
            <button
              className="btn"
              style={{ flex: 1 }}
              onClick={() => {
                onProcessQueue();
                onClose();
                showInfoToast("Memulai proses sinkronisasi antrean...");
              }}
            >
              Sinkronkan Sekarang
            </button>
          )}
          <button
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
