import { useEffect } from "react";
import { RotateCw, Trash2 } from "lucide-react";
import type { SyncItem } from "../hooks/useOfflineSync";
import { showInfoToast, showWarningToast } from "../utils/alertUtils";
import { TEXT_ALERTS } from "../constants/texts";

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
  // BUG-60: Escape-to-close + body scroll lock + ARIA dialog
  // (sebelumnya satu-satunya modal tanpa keyboard exit & scroll lock)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={TEXT_ALERTS.QUEUE_MODAL.TITLE}
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
          {TEXT_ALERTS.QUEUE_MODAL.TITLE}
        </h2>
        {queue.length === 0 ? (
          <p style={{ color: "var(--text-secondary)" }}>{TEXT_ALERTS.QUEUE_MODAL.EMPTY}</p>
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
                <strong>{TEXT_ALERTS.QUEUE_MODAL.TAB_LABEL(item.tabName, item.rowIndex)}</strong>
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
                  TEXT_ALERTS.QUEUE_MODAL.STATUS_PENDING((item.retryCount || 0) + 1)}
                {item.status === "failed" &&
                  TEXT_ALERTS.QUEUE_MODAL.STATUS_FAILED(item.retryCount)}
                {item.status === "conflict" &&
                  TEXT_ALERTS.QUEUE_MODAL.STATUS_CONFLICT}
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
                        showInfoToast(TEXT_ALERTS.QUEUE_MODAL.TOAST_RETRY);
                      }}
                    >
                      <RotateCw size={14} /> {TEXT_ALERTS.QUEUE_MODAL.BTN_RETRY}
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
                      <Trash2 size={14} /> {TEXT_ALERTS.QUEUE_MODAL.BTN_DELETE}
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
                        showInfoToast(TEXT_ALERTS.QUEUE_MODAL.TOAST_USE_SERVER);
                      }}
                    >
                      {TEXT_ALERTS.QUEUE_MODAL.BTN_USE_SERVER}
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
                        showWarningToast(TEXT_ALERTS.QUEUE_MODAL.TOAST_FORCE_SAVE);
                      }}
                    >
                      {TEXT_ALERTS.QUEUE_MODAL.BTN_FORCE_SAVE}
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
                showInfoToast(TEXT_ALERTS.QUEUE_MODAL.TOAST_START_SYNC);
              }}
            >
              {TEXT_ALERTS.QUEUE_MODAL.BTN_SYNC_NOW}
            </button>
          )}
          <button
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            {TEXT_ALERTS.QUEUE_MODAL.BTN_CLOSE}
          </button>
        </div>
      </div>
    </div>
  );
}
