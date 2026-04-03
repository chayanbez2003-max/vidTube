// tailwind.config.js — Paper Planes Streaming Platform
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,html}", "./index.html"],
  theme: {
    extend: {

      colors: {
        bg: {
          base:      "var(--bg-base)",
          surface:   "var(--bg-surface)",
          elevated:  "var(--bg-elevated)",
          overlay:   "var(--bg-overlay)",
        },
        sky: {
          top:   "#8EC5D6",
          blue:  "#B8D4F0",
          mid:   "#CDB8E8",
          pink:  "#E8C4D8",
          blush: "#F0C8B8",
        },
        teal: {
          vivid:   "var(--primary-vivid)",
          DEFAULT: "var(--primary)",
          soft:    "var(--primary-soft)",
          dim:     "var(--primary-dim)",
          mist:    "var(--primary-mist)",
        },
        live: {
          DEFAULT: "var(--primary)",
          dim:     "var(--primary-mist)",
        },
        badge: {
          pink:   "#F4A0A0",
          blue:   "#A0C4F4",
          green:  "#A0F4C0",
          gold:   "#F4E0A0",
          purple: "#D0A0F4",
        },
        error:   "#F4A0A0",
        warning: "#F4E0A0",
        success: "#A0F4C0",
        info:    "#A0C4F4",
      },

      fontFamily: {
        sans:    ["DM Sans", "system-ui", "sans-serif"],
        display: ["DM Sans", "system-ui", "sans-serif"],
      },

      fontWeight: {
        thin:   "200",
        light:  "300",
        normal: "400",
        medium: "500",
      },

      letterSpacing: {
        tightest: "-0.035em",
        tighter:  "-0.02em",
        tight:    "-0.01em",
        normal:   "0em",
        wide:     "0.04em",
        wider:    "0.1em",
        widest:   "0.22em",
      },

      borderRadius: {
        xs:   "4px",
        sm:   "8px",
        md:   "12px",
        lg:   "16px",
        xl:   "24px",
        "2xl":"32px",
        pill: "999px",
      },

      boxShadow: {
        glass:         "0 8px 40px rgba(var(--bg-rgb),0.65), inset 0 1px 0 rgba(255,255,255,0.08)",
        "glass-lg":    "0 16px 56px rgba(var(--bg-rgb),0.80), inset 0 1px 0 rgba(255,255,255,0.10)",
        "glass-hover": "0 16px 48px rgba(var(--bg-rgb),0.75), 0 0 0 1px rgba(var(--primary-rgb),0.12)",
        nav:           "0 1px 0 rgba(var(--accent-rgb),0.08), 0 4px 24px rgba(var(--bg-rgb),0.55)",
        modal:         "0 24px 80px rgba(var(--bg-rgb),0.90), inset 0 1px 0 rgba(255,255,255,0.08)",
        "teal-sm":     "0 4px 20px rgba(var(--primary-rgb),0.28)",
        "teal-md":     "0 8px 28px rgba(var(--primary-rgb),0.32)",
        "teal-lg":     "0 12px 40px rgba(var(--primary-rgb),0.40)",
        "teal-focus":  "0 0 0 3px rgba(var(--primary-rgb),0.22)",
        "card-hover":  "0 16px 48px rgba(var(--bg-rgb),0.75), 0 0 0 1px rgba(var(--primary-rgb),0.10)",
        play:          "0 4px 24px rgba(0,0,0,0.40)",
        "play-hover":  "0 8px 32px rgba(var(--primary-rgb),0.45)",
        seek:          "0 0 10px rgba(var(--primary-rgb),0.48)",
        live:          "0 0 8px rgba(var(--primary-rgb),0.55)",
        notif:         "0 0 6px rgba(var(--primary-rgb),0.50)",
      },

      backgroundImage: {
        "page-wash": `
          radial-gradient(ellipse 80% 40% at 50% -10%,
            rgba(var(--accent-rgb),0.08) 0%,
            rgba(var(--accent-rgb),0.05) 50%,
            transparent 100%),
          radial-gradient(ellipse 50% 30% at 90% 80%,
            rgba(var(--primary-rgb),0.06) 0%, transparent 70%)
        `,
        "hero-overlay": `
          linear-gradient(to top,
            var(--bg-base) 0%, rgba(var(--bg-rgb),0.85) 30%,
            rgba(var(--bg-rgb),0.40) 60%, transparent 100%)
        `,
        "card-overlay": `
          linear-gradient(to top,
            rgba(var(--bg-rgb),0.88) 0%, rgba(var(--bg-rgb),0.35) 40%,
            transparent 70%)
        `,
        "section-sky": `
          radial-gradient(ellipse 100% 30% at 50% 0%,
            rgba(var(--accent-rgb),0.05) 0%, transparent 70%)
        `,
        "progress-teal":  "linear-gradient(90deg, var(--primary), var(--primary-vivid))",
        skeleton: `
          linear-gradient(90deg,
            rgba(255,255,255,0.04) 0%,
            rgba(var(--primary-rgb),0.08) 50%,
            rgba(255,255,255,0.04) 100%)
        `,
        divider: `
          linear-gradient(90deg,
            transparent 0%, rgba(255,255,255,0.08) 30%,
            rgba(var(--primary-rgb),0.20) 50%, rgba(255,255,255,0.08) 70%,
            transparent 100%)
        `,
      },

      animation: {
        "live-pulse":  "livePulse 2s ease-in-out infinite",
        shimmer:       "shimmer 1.6s ease-in-out infinite",
        "spin-slow":   "spin 20s linear infinite",
        fadeup:        "fadeUp 0.85s cubic-bezier(0.16,1,0.3,1) forwards",
        float:         "float 3s ease-in-out infinite",
        "glow-pulse":  "glowPulse 3s ease-in-out infinite",
        "slide-up":    "slideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
        "scale-in":    "scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
      },

      keyframes: {
        livePulse: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(var(--primary-rgb),0.5)" },
          "50%":     { boxShadow: "0 0 0 6px rgba(var(--primary-rgb),0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-6px)" },
        },
        glowPulse: {
          "0%,100%": { boxShadow: "0 0 8px rgba(var(--primary-rgb),0.3)" },
          "50%":     { boxShadow: "0 0 22px rgba(var(--primary-rgb),0.7)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.92)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
      },

      transitionTimingFunction: {
        expo:   "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        gentle: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },

      backdropBlur: {
        glass: "20px",
        nav:   "16px",
        modal: "12px",
        soft:  "8px",
      },

      opacity: {
        "3":  "0.03",
        "6":  "0.06",
        "8":  "0.08",
        "12": "0.12",
        "15": "0.15",
        "18": "0.18",
        "22": "0.22",
        "25": "0.25",
        "28": "0.28",
        "35": "0.35",
        "42": "0.42",
        "55": "0.55",
        "72": "0.72",
      },

      zIndex: {
        "100": "100",
        "200": "200",
      },

    },
  },

  plugins: [
    function ({ addUtilities, addComponents }) {

      // ── GLASS UTILITY CLASSES ──────────────────
      addUtilities({
        ".glass": {
          background:           "rgba(255,255,255,0.06)",
          backdropFilter:       "blur(20px) saturate(1.3)",
          WebkitBackdropFilter: "blur(20px) saturate(1.3)",
          border:               "1px solid rgba(255,255,255,0.10)",
        },
        ".glass-hover": {
          background: "rgba(255,255,255,0.10)",
        },
        ".glass-active": {
          background: "rgba(255,255,255,0.14)",
        },
        ".glass-card": {
          background:           "rgba(255,255,255,0.06)",
          backdropFilter:       "blur(20px) saturate(1.3)",
          WebkitBackdropFilter: "blur(20px) saturate(1.3)",
          border:               "1px solid rgba(255,255,255,0.10)",
          borderRadius:         "16px",
          boxShadow:            "0 8px 40px rgba(var(--bg-rgb),0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
          transition:           "border-color 0.3s, box-shadow 0.35s, transform 0.35s cubic-bezier(0.16,1,0.3,1)",
        },
        ".glass-card:hover": {
          borderColor: "rgba(var(--primary-rgb),0.35)",
          boxShadow:   "0 16px 48px rgba(var(--bg-rgb),0.7), 0 0 0 1px rgba(var(--primary-rgb),0.10)",
        },
        ".glass-nav": {
          background:           "rgba(var(--bg-rgb),0.75)",
          backdropFilter:       "blur(16px) saturate(1.3)",
          WebkitBackdropFilter: "blur(16px) saturate(1.3)",
          borderBottom:         "1px solid rgba(255,255,255,0.07)",
          boxShadow:            "0 1px 0 rgba(var(--accent-rgb),0.08), 0 4px 24px rgba(var(--bg-rgb),0.50)",
        },
        ".ring-teal": {
          boxShadow: "0 0 0 3px rgba(var(--primary-rgb),0.20)",
        },
        ".glow-teal": {
          boxShadow: "0 0 10px rgba(var(--primary-rgb),0.45)",
        },
        ".glow-live": {
          boxShadow: "0 0 8px rgba(var(--primary-rgb),0.55)",
        },
        ".skeleton": {
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(var(--primary-rgb),0.08) 50%, rgba(255,255,255,0.04) 100%)",
          backgroundSize: "200% 100%",
          animation:      "shimmer 1.6s ease-in-out infinite",
        },
        ".text-glow-teal": {
          textShadow: "0 0 20px rgba(var(--primary-rgb),0.5)",
        },
        ".text-sky-gradient": {
          backgroundImage:      "linear-gradient(135deg, #8EC5D6, #CDB8E8, #E8C4D8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor:  "transparent",
          backgroundClip:       "text",
        },
        ".text-teal-gradient": {
          backgroundImage:      "linear-gradient(90deg, var(--primary), var(--primary-vivid))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor:  "transparent",
          backgroundClip:       "text",
        },
        ".text-gradient": {
          backgroundImage:      "linear-gradient(90deg, var(--primary), var(--primary-vivid))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor:  "transparent",
          backgroundClip:       "text",
        },
        ".divider-sky": {
          height:          "1px",
          backgroundImage:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(var(--primary-rgb),0.20) 50%, rgba(255,255,255,0.08) 70%, transparent 100%)",
        },
        ".bg-page": {
          backgroundColor: "var(--bg-base)",
          backgroundImage: `
            radial-gradient(ellipse 80% 40% at 50% -10%,
              rgba(var(--accent-rgb),0.08) 0%,
              rgba(var(--accent-rgb),0.05) 50%,
              transparent 100%),
            radial-gradient(ellipse 50% 30% at 90% 80%,
              rgba(var(--primary-rgb),0.06) 0%, transparent 70%)
          `,
        },
      });

      // ── COMPONENT CLASSES ──────────────────────
      addComponents({

        // Buttons
        ".btn": {
          display:        "inline-flex",
          alignItems:     "center",
          justifyContent: "center",
          gap:            "8px",
          borderRadius:   "999px",
          fontSize:       "0.88rem",
          fontWeight:     "500",
          letterSpacing:  "0.02em",
          cursor:         "pointer",
          border:         "none",
          outline:        "none",
          transition:     "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          userSelect:     "none",
          whiteSpace:     "nowrap",
        },
        ".btn-primary": {
          background:    "var(--primary)",
          color:         "#041a17",
          fontWeight:    "600",
          borderRadius:  "999px",
          border:        "none",
          padding:       "10px 24px",
          fontSize:      "0.9rem",
          letterSpacing: "0.02em",
          boxShadow:     "0 4px 20px rgba(var(--primary-rgb),0.30)",
          transition:    "background 0.2s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s",
          cursor:        "pointer",
          display:       "inline-flex",
          alignItems:    "center",
          gap:           "8px",
          "&:hover": {
            background: "var(--primary-soft)",
            transform:  "translateY(-2px)",
            boxShadow:  "0 8px 28px rgba(var(--primary-rgb),0.35)",
          },
        },
        ".btn-ghost": {
          background:  "transparent",
          border:      "1px solid rgba(255,255,255,0.15)",
          color:       "rgba(255,255,255,0.72)",
          borderRadius:"999px",
          padding:     "10px 24px",
          fontSize:    "0.9rem",
          transition:  "border-color 0.2s, background 0.2s, color 0.2s",
          cursor:      "pointer",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.30)",
            background:  "rgba(255,255,255,0.08)",
            color:       "#ffffff",
          },
        },
        ".btn-secondary": {
          background:  "transparent",
          border:      "1px solid rgba(255,255,255,0.15)",
          color:       "rgba(255,255,255,0.72)",
          borderRadius:"999px",
          padding:     "10px 24px",
          fontSize:    "0.9rem",
          transition:  "border-color 0.2s, background 0.2s, color 0.2s",
          cursor:      "pointer",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.30)",
            background:  "rgba(255,255,255,0.08)",
            color:       "#ffffff",
          },
        },
        ".btn-icon": {
          width:          "38px",
          height:         "38px",
          padding:        "0",
          borderRadius:   "50%",
          background:     "rgba(255,255,255,0.06)",
          border:         "1px solid rgba(255,255,255,0.10)",
          color:          "rgba(255,255,255,0.72)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          cursor:         "pointer",
          transition:     "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          "&:hover": {
            background:  "rgba(255,255,255,0.12)",
            borderColor: "rgba(255,255,255,0.24)",
            color:       "#ffffff",
            transform:   "scale(1.08)",
          },
        },

        // Badges
        ".badge-live": {
          background:    "rgba(var(--primary-rgb),0.12)",
          border:        "1px solid rgba(var(--primary-rgb),0.30)",
          color:         "var(--primary)",
          borderRadius:  "999px",
          fontSize:      "0.65rem",
          fontWeight:    "700",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          padding:       "4px 10px",
          display:       "inline-flex",
          alignItems:    "center",
          gap:           "6px",
        },
        ".badge-drama":   { background:"rgba(244,160,160,0.12)", border:"1px solid rgba(244,160,160,0.28)", color:"#F4A0A0", borderRadius:"999px", fontSize:"0.65rem", fontWeight:"600", letterSpacing:"0.1em", padding:"3px 10px", textTransform:"uppercase" },
        ".badge-doc":     { background:"rgba(160,196,244,0.12)", border:"1px solid rgba(160,196,244,0.28)", color:"#A0C4F4", borderRadius:"999px", fontSize:"0.65rem", fontWeight:"600", letterSpacing:"0.1em", padding:"3px 10px", textTransform:"uppercase" },
        ".badge-nature":  { background:"rgba(160,244,192,0.12)", border:"1px solid rgba(160,244,192,0.28)", color:"#A0F4C0", borderRadius:"999px", fontSize:"0.65rem", fontWeight:"600", letterSpacing:"0.1em", padding:"3px 10px", textTransform:"uppercase" },
        ".badge-premium": { background:"rgba(244,224,160,0.12)", border:"1px solid rgba(244,224,160,0.28)", color:"#F4E0A0", borderRadius:"999px", fontSize:"0.65rem", fontWeight:"600", letterSpacing:"0.1em", padding:"3px 10px", textTransform:"uppercase" },
        ".badge-scifi":   { background:"rgba(208,160,244,0.12)", border:"1px solid rgba(208,160,244,0.28)", color:"#D0A0F4", borderRadius:"999px", fontSize:"0.65rem", fontWeight:"600", letterSpacing:"0.1em", padding:"3px 10px", textTransform:"uppercase" },
        ".badge-new":     { background:"var(--primary-mist)",  border:"1px solid rgba(var(--primary-rgb),0.35)",  color:"var(--primary-soft)", borderRadius:"999px", fontSize:"0.65rem", fontWeight:"600", letterSpacing:"0.1em", padding:"3px 10px", textTransform:"uppercase" },

        // Avatar
        ".avatar": {
          borderRadius: "50%",
          objectFit:    "cover",
          flexShrink:   "0",
          border:       "1.5px solid rgba(255,255,255,0.14)",
          transition:   "border-color 0.2s, box-shadow 0.2s",
          "&:hover": {
            borderColor: "var(--primary)",
            boxShadow:   "0 0 0 3px rgba(var(--primary-rgb),0.20)",
          },
        },
        ".avatar-lg": {
          width:        "44px",
          height:       "44px",
          borderRadius: "50%",
          objectFit:    "cover",
          flexShrink:   "0",
        },

        // Spinner
        ".spinner": {
          width:          "28px",
          height:         "28px",
          border:         "2px solid var(--primary-mist)",
          borderTopColor: "var(--primary)",
          borderRadius:   "50%",
          animation:      "spin 0.8s linear infinite",
        },

        // Input field
        ".input-field": {
          width:         "100%",
          background:    "rgba(255,255,255,0.05)",
          border:        "1px solid rgba(255,255,255,0.10)",
          borderRadius:  "12px",
          color:         "#ffffff",
          fontSize:      "0.9rem",
          padding:       "10px 16px",
          outline:       "none",
          transition:    "border-color 0.2s, background 0.2s",
          "&::placeholder": { color: "rgba(255,255,255,0.25)" },
          "&:focus": {
            borderColor: "var(--primary)",
            background:  "rgba(255,255,255,0.08)",
            boxShadow:   "0 0 0 3px var(--primary-mist)",
          },
        },
      });
    },
  ],
};
