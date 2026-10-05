import React from "react";
import { Send, Loader2 } from "lucide-react";
import { TEXT_PDO_FORM } from "@/constants/texts";

interface ReportIssuesSectionProps {
  operationalIssues: string;
  onOperationalIssuesChange: (value: string) => void;
  saving: boolean;
  loading: boolean;
}

export const ReportIssuesSection: React.FC<ReportIssuesSectionProps> = ({
  operationalIssues,
  onOperationalIssuesChange,
  saving,
  loading,
}) => {
  return (
    <>
      <div style={{ marginBottom: "18px" }}>
        <label
          htmlFor="kendala-text"
          style={{
            fontSize: "11.5px",
            fontWeight: 700,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            display: "block",
            marginBottom: "6px",
          }}
        >
          {TEXT_PDO_FORM.ISSUES.SECTION_TITLE}
        </label>
        <textarea
          id="kendala-text"
          rows={2}
          className="input-field"
          placeholder={TEXT_PDO_FORM.ISSUES.PLACEHOLDER}
          value={operationalIssues}
          onChange={(e) => onOperationalIssuesChange(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "10px",
            fontSize: "12.5px",
            fontFamily: "inherit",
            resize: "vertical",
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={saving || loading}
        className="btn"
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          opacity: saving ? 0.75 : 1,
          transition: "all 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {saving ? (
          <>
            <Loader2 className="spinner" size={16} />
            <span>{TEXT_PDO_FORM.BUTTONS.SUBMITTING}</span>
          </>
        ) : (
          <>
            <Send size={16} />
            <span>{TEXT_PDO_FORM.BUTTONS.SUBMIT}</span>
          </>
        )}
      </button>
    </>
  );
};
