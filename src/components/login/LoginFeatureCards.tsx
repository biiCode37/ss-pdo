import { Activity, Bus, Lock } from "lucide-react";
import { TEXT_AUTH } from "../../constants/texts";

export function LoginFeatureCards() {
  const features = [
    {
      icon: Activity,
      title: TEXT_AUTH.FEATURE_CARDS.CARD_1_TITLE,
      desc: TEXT_AUTH.FEATURE_CARDS.CARD_1_DESC,
    },
    {
      icon: Bus,
      title: TEXT_AUTH.FEATURE_CARDS.CARD_2_TITLE,
      desc: TEXT_AUTH.FEATURE_CARDS.CARD_2_DESC,
    },
    {
      icon: Lock,
      title: TEXT_AUTH.FEATURE_CARDS.CARD_3_TITLE,
      desc: TEXT_AUTH.FEATURE_CARDS.CARD_3_DESC,
    },
  ];

  return (
    <div
      className="login-features-container"
      style={{
        marginBottom: "20px",
      }}
    >
      <h2
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "var(--text-secondary)",
          marginBottom: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          textAlign: "left",
          paddingLeft: "4px",
        }}
      >
        {TEXT_AUTH.FEATURES_TITLE}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "10px",
        }}
      >
        {features.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div
              key={idx}
              className="glass"
              style={{
                padding: "14px 16px",
                borderRadius: "14px",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "var(--accent-color, #3ECF8E)",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                <div
                  style={{
                    padding: "6px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(62, 207, 142, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconComponent size={16} />
                </div>
                <span>{item.title}</span>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
