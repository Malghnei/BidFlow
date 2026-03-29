import { useState } from "react";

const styles = [
  {
    id: "dark-premium",
    label: "Dark + Premium",
    subtitle: "Auction energy, high-end feel",
    bg: "#0A0E0C",
    bgCard: "#111916",
    bgCardAlt: "#182420",
    primary: "#00A651",
    primaryLight: "#00D168",
    accent: "#C5A55A",
    accentLight: "#E8D49A",
    text: "#F0F5F2",
    textMuted: "#8DA99A",
    border: "rgba(0,166,81,0.2)",
    borderAccent: "rgba(197,165,90,0.3)",
    fontDisplay: "'Playfair Display', Georgia, serif",
    fontBody: "'DM Sans', sans-serif",
    radius: "12px",
    radiusSm: "8px",
  },
  {
    id: "clean-minimal",
    label: "Clean + Minimal",
    subtitle: "Apple-like, whitespace-first",
    bg: "#FAFBFA",
    bgCard: "#FFFFFF",
    bgCardAlt: "#F3F6F4",
    primary: "#00843D",
    primaryLight: "#E8F5EE",
    accent: "#1A1A1A",
    accentLight: "#666666",
    text: "#1A1A1A",
    textMuted: "#8C8C8C",
    border: "rgba(0,0,0,0.08)",
    borderAccent: "rgba(0,132,61,0.2)",
    fontDisplay: "'SF Pro Display', -apple-system, sans-serif",
    fontBody: "'SF Pro Text', -apple-system, sans-serif",
    radius: "16px",
    radiusSm: "10px",
  },
  {
    id: "bold-colorful",
    label: "Bold + Colorful",
    subtitle: "Charity fundraiser energy",
    bg: "#F0FFF6",
    bgCard: "#FFFFFF",
    bgCardAlt: "#E5FAEE",
    primary: "#00A651",
    primaryLight: "#CCFCE3",
    accent: "#FF6B35",
    accentLight: "#FFE0D0",
    text: "#0D2818",
    textMuted: "#4A7A5E",
    border: "rgba(0,166,81,0.15)",
    borderAccent: "rgba(255,107,53,0.25)",
    fontDisplay: "'Sora', sans-serif",
    fontBody: "'Plus Jakarta Sans', sans-serif",
    radius: "20px",
    radiusSm: "12px",
  },
  {
    id: "islamic-elegant",
    label: "Islamic Geometric",
    subtitle: "Elegant patterns & heritage",
    bg: "#FEFCF7",
    bgCard: "#FFFFFF",
    bgCardAlt: "#F8F4ED",
    primary: "#00693E",
    primaryLight: "#E2F0E9",
    accent: "#B88A3E",
    accentLight: "#F5ECD8",
    text: "#1C2B22",
    textMuted: "#6B7F72",
    border: "rgba(0,105,62,0.12)",
    borderAccent: "rgba(184,138,62,0.25)",
    fontDisplay: "'Cormorant Garamond', Georgia, serif",
    fontBody: "'Nunito Sans', sans-serif",
    radius: "8px",
    radiusSm: "4px",
  },
];

const PhoneMockup = ({ children, theme }) => (
  <div style={{
    width: 280,
    height: 560,
    borderRadius: 36,
    border: `2px solid ${theme.id === "dark-premium" ? "#333" : "#D1D5DB"}`,
    background: theme.bg,
    overflow: "hidden",
    position: "relative",
    flexShrink: 0,
  }}>
    <div style={{
      height: 44,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 20px",
    }}>
      <div style={{
        width: 80,
        height: 24,
        borderRadius: 12,
        background: theme.id === "dark-premium" ? "#1a1a1a" : "#E5E7EB",
      }} />
    </div>
    <div style={{ padding: "0 16px", height: 516, overflow: "hidden" }}>
      {children}
    </div>
  </div>
);

const WebMockup = ({ children, theme }) => (
  <div style={{
    width: "100%",
    minHeight: 380,
    borderRadius: 12,
    border: `1px solid ${theme.id === "dark-premium" ? "#222" : "#E5E7EB"}`,
    background: theme.bg,
    overflow: "hidden",
  }}>
    <div style={{
      height: 36,
      background: theme.id === "dark-premium" ? "#0D1210" : "#F9FAFB",
      borderBottom: `1px solid ${theme.id === "dark-premium" ? "#1a2420" : "#E5E7EB"}`,
      display: "flex",
      alignItems: "center",
      padding: "0 12px",
      gap: 6,
    }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C940" }} />
      <div style={{
        marginLeft: 12,
        flex: 1,
        height: 22,
        borderRadius: 6,
        background: theme.id === "dark-premium" ? "#111916" : "#F3F4F6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <span style={{ fontSize: 10, color: theme.textMuted, fontFamily: theme.fontBody }}>
          admin.bidflow.app
        </span>
      </div>
    </div>
    <div style={{ padding: 20 }}>
      {children}
    </div>
  </div>
);

const LiveDisplayMockup = ({ children, theme }) => (
  <div style={{
    width: "100%",
    minHeight: 300,
    borderRadius: 12,
    border: `1px solid ${theme.id === "dark-premium" ? "#222" : "#E5E7EB"}`,
    background: theme.id === "dark-premium" ? "#050807" : theme.id === "islamic-elegant" ? "#0F1F17" : "#071210",
    overflow: "hidden",
    position: "relative",
  }}>
    {children}
  </div>
);

const GeometricPattern = ({ color, opacity = 0.06 }) => (
  <svg style={{ position: "absolute", top: 0, right: 0, width: 160, height: 160, opacity }} viewBox="0 0 200 200">
    <defs>
      <pattern id="geo" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M20 0L40 20L20 40L0 20Z" fill="none" stroke={color} strokeWidth="0.8"/>
        <circle cx="20" cy="20" r="3" fill="none" stroke={color} strokeWidth="0.5"/>
      </pattern>
    </defs>
    <rect width="200" height="200" fill="url(#geo)" />
  </svg>
);

const ItemGalleryScreen = ({ theme }) => {
  const items = [
    { title: "Weekend Getaway", bid: "$1,250", groups: 2, img: "🏖️" },
    { title: "Diamond Necklace", bid: "$890", groups: 0, img: "💎" },
    { title: "Chef's Table", bid: "$650", groups: 1, img: "🍽️" },
  ];

  return (
    <div style={{ fontFamily: theme.fontBody }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: theme.primary, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: 0 }}>
          Live now
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: theme.text, margin: "4px 0 0", fontFamily: theme.fontDisplay }}>
          IRC Gala 2026
        </h2>
      </div>

      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 16,
      }}>
        {["All", "Live", "Upcoming"].map((tab, i) => (
          <div key={tab} style={{
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: i === 1 ? 600 : 400,
            background: i === 1 ? theme.primary : "transparent",
            color: i === 1 ? "#fff" : theme.textMuted,
            border: i === 1 ? "none" : `1px solid ${theme.border}`,
          }}>
            {tab}
          </div>
        ))}
      </div>

      {items.map((item, i) => (
        <div key={i} style={{
          background: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusSm,
          padding: 12,
          marginBottom: 10,
          display: "flex",
          gap: 12,
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {theme.id === "islamic-elegant" && i === 0 && (
            <div style={{
              position: "absolute", top: 0, right: 0,
              width: 60, height: 60,
              opacity: 0.08,
            }}>
              <svg viewBox="0 0 60 60" width="60" height="60">
                <path d="M30 0L60 30L30 60L0 30Z" fill="none" stroke={theme.accent} strokeWidth="1"/>
              </svg>
            </div>
          )}
          <div style={{
            width: 56,
            height: 56,
            borderRadius: theme.radiusSm,
            background: theme.id === "dark-premium"
              ? "linear-gradient(135deg, #182420, #1e3028)"
              : theme.bgCardAlt,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            flexShrink: 0,
          }}>
            {item.img}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: theme.text, margin: 0 }}>
              {item.title}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{
                fontSize: 16,
                fontWeight: 700,
                color: theme.id === "dark-premium" ? theme.accent : theme.primary,
                fontFamily: theme.fontDisplay,
              }}>
                {item.bid}
              </span>
              {item.groups > 0 && (
                <span style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: theme.id === "bold-colorful" ? theme.accentLight : theme.primaryLight,
                  color: theme.id === "bold-colorful" ? theme.accent : theme.primary,
                  fontWeight: 600,
                }}>
                  {item.groups} group{item.groups > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
            <path d="M6 3l5 5-5 5" fill="none" stroke={theme.textMuted} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      ))}

      <div style={{
        marginTop: 16,
        padding: 14,
        borderRadius: theme.radiusSm,
        background: theme.id === "dark-premium"
          ? "linear-gradient(135deg, rgba(0,166,81,0.15), rgba(197,165,90,0.1))"
          : theme.id === "bold-colorful"
          ? `linear-gradient(135deg, ${theme.primaryLight}, ${theme.accentLight})`
          : theme.primaryLight,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {theme.id === "islamic-elegant" && <GeometricPattern color={theme.accent} opacity={0.1} />}
        <p style={{
          fontSize: 18,
          fontWeight: 700,
          color: theme.id === "dark-premium" ? theme.primaryLight : theme.primary,
          margin: 0,
          fontFamily: theme.fontDisplay,
        }}>
          $12,450
        </p>
        <p style={{ fontSize: 11, color: theme.textMuted, margin: "2px 0 0" }}>
          Total raised tonight
        </p>
      </div>
    </div>
  );
};

const GroupBidScreen = ({ theme }) => {
  const progress = 55;
  return (
    <div style={{ fontFamily: theme.fontBody }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M12 4l-8 8" fill="none" stroke={theme.textMuted} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 13, color: theme.textMuted }}>Weekend Getaway</span>
      </div>

      <div style={{
        textAlign: "center",
        padding: "16px 0 20px",
        position: "relative",
      }}>
        {theme.id === "islamic-elegant" && <GeometricPattern color={theme.primary} opacity={0.06} />}
        <p style={{
          fontSize: 11,
          color: theme.primary,
          fontWeight: 600,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          margin: "0 0 4px",
        }}>
          Group rivalry
        </p>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: 16,
          margin: "8px 0",
        }}>
          <div>
            <p style={{
              fontSize: 24,
              fontWeight: 700,
              color: theme.id === "dark-premium" ? theme.primaryLight : theme.primary,
              margin: 0,
              fontFamily: theme.fontDisplay,
            }}>$1,250</p>
            <p style={{
              fontSize: 14,
              fontWeight: 600,
              color: theme.text,
              margin: "2px 0 0",
            }}>Brothers</p>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: "2px 0 0" }}>8 members</p>
          </div>
          <span style={{
            fontSize: 14,
            fontWeight: 700,
            color: theme.id === "dark-premium" ? theme.accent : theme.textMuted,
            fontFamily: theme.fontDisplay,
          }}>VS</span>
          <div>
            <p style={{
              fontSize: 24,
              fontWeight: 700,
              color: theme.id === "bold-colorful" ? theme.accent : theme.id === "dark-premium" ? theme.accentLight : theme.accent || theme.primary,
              margin: 0,
              fontFamily: theme.fontDisplay,
            }}>$1,475</p>
            <p style={{
              fontSize: 14,
              fontWeight: 600,
              color: theme.text,
              margin: "2px 0 0",
            }}>Sisters</p>
            <p style={{ fontSize: 11, color: theme.textMuted, margin: "2px 0 0" }}>12 members</p>
          </div>
        </div>

        <div style={{
          height: 10,
          borderRadius: 5,
          background: theme.bgCardAlt,
          overflow: "hidden",
          margin: "12px 0",
          border: `1px solid ${theme.border}`,
        }}>
          <div style={{
            width: `${progress}%`,
            height: "100%",
            borderRadius: 5,
            background: theme.id === "dark-premium"
              ? `linear-gradient(90deg, ${theme.primary}, ${theme.primaryLight})`
              : theme.primary,
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      <div style={{
        background: theme.bgCard,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radiusSm,
        padding: 14,
        marginBottom: 12,
      }}>
        <p style={{ fontSize: 12, color: theme.textMuted, margin: "0 0 8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Your contribution
        </p>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: `2px solid ${theme.primary}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: theme.primary,
            fontWeight: 700,
          }}>-</div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{
              fontSize: 28,
              fontWeight: 700,
              color: theme.text,
              fontFamily: theme.fontDisplay,
            }}>$150</span>
          </div>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: theme.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: "#fff",
            fontWeight: 700,
          }}>+</div>
        </div>
      </div>

      <div style={{
        padding: "10px 14px",
        borderRadius: theme.radiusSm,
        background: theme.bgCardAlt,
        marginBottom: 8,
      }}>
        <p style={{ fontSize: 11, color: theme.textMuted, margin: "0 0 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Join code
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          {["8", "4", "7", "2"].map((d, i) => (
            <div key={i} style={{
              width: 36,
              height: 42,
              borderRadius: 6,
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: theme.text,
              fontFamily: theme.fontDisplay,
            }}>{d}</div>
          ))}
        </div>
      </div>

      <div style={{
        display: "flex",
        gap: 8,
        marginTop: 12,
      }}>
        <div style={{
          flex: 1,
          padding: "12px",
          borderRadius: theme.radiusSm,
          background: theme.primary,
          color: "#fff",
          textAlign: "center",
          fontSize: 13,
          fontWeight: 600,
        }}>
          Share QR
        </div>
        <div style={{
          flex: 1,
          padding: "12px",
          borderRadius: theme.radiusSm,
          border: `1px solid ${theme.border}`,
          color: theme.text,
          textAlign: "center",
          fontSize: 13,
          fontWeight: 600,
          background: "transparent",
        }}>
          Invite member
        </div>
      </div>
    </div>
  );
};

const DashboardScreen = ({ theme }) => {
  const stats = [
    { label: "Total raised", value: "$12,450", change: "+$850" },
    { label: "Active bidders", value: "147", change: "+12" },
    { label: "Live items", value: "3", change: "" },
    { label: "Groups active", value: "8", change: "+2" },
  ];
  const bidFeed = [
    { name: "The Don", amount: "+$200", item: "Weekend Getaway", group: "Brothers" },
    { name: "Anonymous #7", amount: "+$150", item: "Diamond Necklace", group: null },
    { name: "Nadia S.", amount: "+$75", item: "Weekend Getaway", group: "Sisters" },
  ];

  return (
    <div style={{ fontFamily: theme.fontBody }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: theme.text,
            margin: 0,
            fontFamily: theme.fontDisplay,
          }}>
            IRC Western Gala
          </h2>
          <p style={{ fontSize: 12, color: theme.textMuted, margin: "2px 0 0" }}>
            Live event dashboard
          </p>
        </div>
        <div style={{
          padding: "6px 12px",
          borderRadius: 20,
          background: theme.id === "dark-premium" ? "rgba(0,209,104,0.15)" : "rgba(0,166,81,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D168" }} />
          <span style={{ fontSize: 11, color: theme.primary, fontWeight: 600 }}>Live</span>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        marginBottom: 16,
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: "12px",
            borderRadius: theme.radiusSm,
            background: theme.bgCardAlt,
            border: `0.5px solid ${theme.border}`,
            position: "relative",
            overflow: "hidden",
          }}>
            {theme.id === "islamic-elegant" && i === 0 && (
              <div style={{ position: "absolute", top: -10, right: -10, opacity: 0.05 }}>
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <path d="M30 0L60 30L30 60L0 30Z" fill="none" stroke={theme.accent} strokeWidth="1.5"/>
                  <path d="M30 10L50 30L30 50L10 30Z" fill="none" stroke={theme.accent} strokeWidth="1"/>
                </svg>
              </div>
            )}
            <p style={{ fontSize: 10, color: theme.textMuted, margin: 0, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
              {s.label}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
              <span style={{
                fontSize: 20,
                fontWeight: 700,
                color: theme.text,
                fontFamily: theme.fontDisplay,
              }}>{s.value}</span>
              {s.change && (
                <span style={{
                  fontSize: 10,
                  color: theme.primary,
                  fontWeight: 600,
                }}>{s.change}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p style={{
        fontSize: 13,
        fontWeight: 600,
        color: theme.text,
        margin: "0 0 8px",
      }}>Recent bids</p>
      {bidFeed.map((bid, i) => (
        <div key={i} style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 0",
          borderBottom: i < bidFeed.length - 1 ? `0.5px solid ${theme.border}` : "none",
        }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: theme.primaryLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            color: theme.primary,
            flexShrink: 0,
          }}>
            {bid.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{bid.name}</span>
              {bid.group && (
                <span style={{
                  fontSize: 9,
                  padding: "1px 6px",
                  borderRadius: 6,
                  background: theme.primaryLight,
                  color: theme.primary,
                }}>{bid.group}</span>
              )}
            </div>
            <span style={{ fontSize: 10, color: theme.textMuted }}>{bid.item}</span>
          </div>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: theme.id === "dark-premium" ? theme.accent : theme.primary,
            fontFamily: theme.fontDisplay,
          }}>{bid.amount}</span>
        </div>
      ))}
    </div>
  );
};

const LiveRivalryScreen = ({ theme }) => {
  const brothersWidth = 46;
  const sistersWidth = 54;

  return (
    <div style={{
      fontFamily: theme.fontBody,
      padding: 24,
      color: "#fff",
      textAlign: "center",
      position: "relative",
      minHeight: 260,
    }}>
      {theme.id === "islamic-elegant" && (
        <>
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.04 }} viewBox="0 0 400 300" preserveAspectRatio="none">
            <defs>
              <pattern id="geolive" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M25 0L50 25L25 50L0 25Z" fill="none" stroke="#C5A55A" strokeWidth="0.5"/>
                <circle cx="25" cy="25" r="4" fill="none" stroke="#C5A55A" strokeWidth="0.3"/>
              </pattern>
            </defs>
            <rect width="400" height="300" fill="url(#geolive)" />
          </svg>
        </>
      )}

      <p style={{
        fontSize: 10,
        color: "rgba(255,255,255,0.5)",
        fontWeight: 600,
        letterSpacing: 3,
        textTransform: "uppercase",
        margin: "0 0 4px",
        position: "relative",
      }}>
        Live auction
      </p>
      <h2 style={{
        fontSize: 18,
        fontWeight: 700,
        color: "#fff",
        margin: "0 0 20px",
        fontFamily: theme.fontDisplay,
        position: "relative",
      }}>
        Weekend Getaway Package
      </h2>

      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        marginBottom: 20,
        position: "relative",
      }}>
        <div>
          <p style={{
            fontSize: 28,
            fontWeight: 700,
            color: theme.primaryLight,
            margin: 0,
            fontFamily: theme.fontDisplay,
          }}>$1,250</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>
            Brothers
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>
            8 members
          </p>
        </div>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: `2px solid ${theme.accent}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 800,
          color: theme.accent,
          fontFamily: theme.fontDisplay,
        }}>VS</div>
        <div>
          <p style={{
            fontSize: 28,
            fontWeight: 700,
            color: theme.accentLight,
            margin: 0,
            fontFamily: theme.fontDisplay,
          }}>$1,475</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "4px 0 0" }}>
            Sisters
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "2px 0 0" }}>
            12 members
          </p>
        </div>
      </div>

      <div style={{
        height: 16,
        borderRadius: 8,
        background: "rgba(255,255,255,0.1)",
        overflow: "hidden",
        margin: "0 12px 16px",
        display: "flex",
        position: "relative",
      }}>
        <div style={{
          width: `${brothersWidth}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryLight})`,
          borderRadius: "8px 0 0 8px",
          transition: "width 1s ease",
        }} />
        <div style={{
          width: `${sistersWidth}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentLight})`,
          borderRadius: "0 8px 8px 0",
          transition: "width 1s ease",
        }} />
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        margin: "0 12px",
        position: "relative",
      }}>
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>Latest</p>
          <p style={{ fontSize: 11, color: theme.primaryLight, margin: 0 }}>
            + $50 from "The Don"
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>Latest</p>
          <p style={{ fontSize: 11, color: theme.accentLight, margin: 0 }}>
            + $100 from "Anonymous #7"
          </p>
        </div>
      </div>
    </div>
  );
};

export default function BidFlowStyleExplorer() {
  const [activeStyle, setActiveStyle] = useState(0);
  const [activeScreen, setActiveScreen] = useState("ios");
  const theme = styles[activeStyle];

  const screens = [
    { id: "ios", label: "iOS app" },
    { id: "web", label: "Web dashboard" },
    { id: "live", label: "Live display" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", maxWidth: 800 }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=Sora:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;600;700&family=Nunito+Sans:wght@400;600;700&display=swap" rel="stylesheet" />

      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
        }}>
          {styles.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveStyle(i)}
              style={{
                padding: "14px 8px 12px",
                borderRadius: "var(--border-radius-lg, 12px)",
                border: activeStyle === i
                  ? `2px solid ${s.primary}`
                  : "1px solid var(--color-border-tertiary, #e5e7eb)",
                background: activeStyle === i
                  ? (s.id === "dark-premium" ? "#0A0E0C" : s.primaryLight)
                  : "var(--color-background-primary, #fff)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s",
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: s.primary,
                margin: "0 auto 6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: s.accent,
                }} />
              </div>
              <p style={{
                fontSize: 11,
                fontWeight: 600,
                margin: 0,
                color: activeStyle === i && s.id === "dark-premium" ? "#fff" : "var(--color-text-primary, #1a1a1a)",
              }}>{s.label}</p>
              <p style={{
                fontSize: 9,
                margin: "2px 0 0",
                color: activeStyle === i && s.id === "dark-premium" ? s.textMuted : "var(--color-text-secondary, #666)",
              }}>{s.subtitle}</p>
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: "flex",
        gap: 6,
        marginBottom: 16,
        background: "var(--color-background-secondary, #f5f5f5)",
        padding: 4,
        borderRadius: "var(--border-radius-md, 8px)",
      }}>
        {screens.map(scr => (
          <button
            key={scr.id}
            onClick={() => setActiveScreen(scr.id)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              fontSize: 13,
              fontWeight: activeScreen === scr.id ? 600 : 400,
              background: activeScreen === scr.id ? "var(--color-background-primary, #fff)" : "transparent",
              color: activeScreen === scr.id ? "var(--color-text-primary, #1a1a1a)" : "var(--color-text-secondary, #666)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >{scr.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
        {activeScreen === "ios" && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <PhoneMockup theme={theme}>
                <ItemGalleryScreen theme={theme} />
              </PhoneMockup>
              <p style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 8 }}>Item gallery</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <PhoneMockup theme={theme}>
                <GroupBidScreen theme={theme} />
              </PhoneMockup>
              <p style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 8 }}>Group bid view</p>
            </div>
          </div>
        )}
        {activeScreen === "web" && (
          <div style={{ width: "100%" }}>
            <WebMockup theme={theme}>
              <DashboardScreen theme={theme} />
            </WebMockup>
            <p style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 8, textAlign: "center" }}>Admin dashboard — event overview</p>
          </div>
        )}
        {activeScreen === "live" && (
          <div style={{ width: "100%" }}>
            <LiveDisplayMockup theme={theme}>
              <LiveRivalryScreen theme={theme} />
            </LiveDisplayMockup>
            <p style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 8, textAlign: "center" }}>Projector view — group vs group rivalry</p>
          </div>
        )}
      </div>

      <div style={{
        marginTop: 20,
        padding: 16,
        borderRadius: "var(--border-radius-lg, 12px)",
        background: "var(--color-background-secondary, #f5f5f5)",
      }}>
        <p style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--color-text-primary)",
          margin: "0 0 8px",
        }}>
          {theme.label} — design notes
        </p>
        <p style={{
          fontSize: 12,
          color: "var(--color-text-secondary)",
          margin: 0,
          lineHeight: 1.6,
        }}>
          {theme.id === "dark-premium" && "Dark backgrounds with IRC green and gold accents. Playfair Display for headings gives an upscale auction-house feel. Gold highlight for bid amounts creates visual hierarchy. Best for evening galas and formal fundraiser events where you want that premium, exclusive energy."}
          {theme.id === "clean-minimal" && "Maximum whitespace, SF Pro system font, and IRC green as the sole accent color. Ultra-clean card borders and generous spacing. Feels native to iOS. Best if you want BidFlow to feel like a polished, trustworthy utility — functional beauty over flashy."}
          {theme.id === "bold-colorful" && "IRC green paired with a warm orange accent for contrast. Rounded corners, soft gradients, and pill-shaped badges create a friendly, energetic feel. Sora + Jakarta Sans are modern and approachable. Best for university chapter events where you want maximum engagement."}
          {theme.id === "islamic-elegant" && "Subtle geometric patterns inspired by Islamic art traditions. Deep forest green paired with antique gold. Cormorant Garamond serif headings add classic sophistication. Tighter radius corners keep it refined. Best for IRC's flagship events where cultural identity and elegance matter."}
        </p>
        <div style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--color-text-secondary)" }}>
            <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Fonts:</span>
            <span style={{ fontFamily: theme.fontDisplay, fontWeight: 600 }}>{theme.fontDisplay.split("'")[1]}</span>
            <span>+</span>
            <span style={{ fontFamily: theme.fontBody }}>{theme.fontBody.split("'")[1] || "System"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--color-text-secondary)" }}>
            <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Colors:</span>
            <div style={{ display: "flex", gap: 3 }}>
              {[theme.primary, theme.primaryLight, theme.accent, theme.accentLight, theme.bg].map((c, i) => (
                <div key={i} style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: c,
                  border: "1px solid rgba(0,0,0,0.1)",
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 12,
        textAlign: "center",
      }}>
        <button
          onClick={() => sendPrompt(`I want the "${theme.label}" style. Build the full UI redesign with this direction.`)}
          style={{
            padding: "12px 32px",
            borderRadius: "var(--border-radius-md, 8px)",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            background: theme.primary,
            color: "#fff",
            transition: "transform 0.1s",
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
          onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          Choose "{theme.label}" and build it →
        </button>
      </div>
    </div>
  );
}
