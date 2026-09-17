// Shared design tokens — mirrors web/src/index.css
// NOTE: typography must come AFTER colors (self-reference at module init)

export const colors = {
  primary:       "#0A1F44",
  primaryDark:   "#061229",
  primaryHover:  "#0d2855",
  primaryLight:  "#1a3a6e",

  textPrimary:   "#0D0D0D",
  textSecondary: "#4A5568",
  textMuted:     "#718096",
  textOnPrimary: "#FFFFFF",

  bg:            "#FFFFFF",
  bgSecondary:   "#EEF1F8",
  bgCard:        "#FFFFFF",
  bgHover:       "#F7F9FC",

  danger:        "#D92D20",
  dangerBg:      "#FEF3F2",
  dangerText:    "#B42318",
  dangerBorder:  "#FDA29B",

  warning:       "#F2B705",
  warningBg:     "#FFFAEB",
  warningText:   "#B54708",
  warningBorder: "#FEC84B",

  success:       "#12B76A",
  successBg:     "#ECFDF3",
  successText:   "#027A48",
  successBorder: "#6CE9A6",

  border:        "#E2E8F0",
  borderStrong:  "#CBD5E0",
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28,
};

export const radius = {
  sm: 6, md: 8, lg: 12, xl: 16, full: 100,
};

// typography comes AFTER colors so self-references are safe
export const typography = {
  h1:    { fontSize: 28, fontWeight: "700", color: colors.textPrimary, letterSpacing: -0.5 },
  h2:    { fontSize: 22, fontWeight: "600", color: colors.textPrimary },
  h3:    { fontSize: 18, fontWeight: "600", color: colors.textPrimary },
  body:  { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  small: { fontSize: 12, color: colors.textMuted },
  label: { fontSize: 13, fontWeight: "500", color: colors.textPrimary },
};

export const shadows = {
  sm: {
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  md: {
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,  shadowRadius: 8, elevation: 4,
  },
  lg: {
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
  },
};
