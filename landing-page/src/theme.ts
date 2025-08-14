export const theme = {
  colors: {
    // Background colors
    bg: {
      primary: "#0f172a", // slate-900
      secondary: "#1e293b", // slate-800
      tertiary: "#334155", // slate-700
      card: "#1e293b", // slate-800
    },
    // Text colors
    text: {
      primary: "#f8fafc", // slate-50
      secondary: "#cbd5e1", // slate-300
      muted: "#94a3b8", // slate-400
    },
    // Accent colors
    accent: {
      primary: "#0385FF", // emerald-500
      secondary: "#0385FF", // blue-500
      tertiary: "#0385FF", // violet-500
    },
    // Status colors
    success: "#22c55e", // green-500
    warning: "#f59e0b", // amber-500
    error: "#ef4444", // red-500
  },
  spacing: {
    xs: "0.5rem", // 8px
    sm: "1rem", // 16px
    md: "1.5rem", // 24px
    lg: "2rem", // 32px
    xl: "3rem", // 48px
    xxl: "4rem", // 64px
  },
  borderRadius: {
    sm: "0.375rem", // 6px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
  },
} as const;

export type Theme = typeof theme;
