import { style } from "@vanilla-extract/css";
import { theme } from "./theme.css";

// Layout utilities
export const flexCenter = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const flexBetween = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const flexCol = style({
  display: "flex",
  flexDirection: "column",
});

export const flexRow = style({
  display: "flex",
  flexDirection: "row",
});

export const fullHeight = style({
  height: "100%",
});

export const fullWidth = style({
  width: "100%",
});

export const fullSize = style({
  width: "100%",
  height: "100%",
});

// Spacing utilities
export const spacing = {
  p: {
    xs: style({ padding: theme.spacing.xs }),
    sm: style({ padding: theme.spacing.sm }),
    md: style({ padding: theme.spacing.md }),
    lg: style({ padding: theme.spacing.lg }),
    xl: style({ padding: theme.spacing.xl }),
  },
  m: {
    xs: style({ margin: theme.spacing.xs }),
    sm: style({ margin: theme.spacing.sm }),
    md: style({ margin: theme.spacing.md }),
    lg: style({ margin: theme.spacing.lg }),
    xl: style({ margin: theme.spacing.xl }),
  },
  mb: {
    xs: style({ marginBottom: theme.spacing.xs }),
    sm: style({ marginBottom: theme.spacing.sm }),
    md: style({ marginBottom: theme.spacing.md }),
    lg: style({ marginBottom: theme.spacing.lg }),
    xl: style({ marginBottom: theme.spacing.xl }),
  },
  ml: {
    xs: style({ marginLeft: theme.spacing.xs }),
    sm: style({ marginLeft: theme.spacing.sm }),
    md: style({ marginLeft: theme.spacing.md }),
    lg: style({ marginLeft: theme.spacing.lg }),
    xl: style({ marginLeft: theme.spacing.xl }),
  },
  px: {
    xs: style({ paddingLeft: theme.spacing.xs, paddingRight: theme.spacing.xs }),
    sm: style({ paddingLeft: theme.spacing.sm, paddingRight: theme.spacing.sm }),
    md: style({ paddingLeft: theme.spacing.md, paddingRight: theme.spacing.md }),
    lg: style({ paddingLeft: theme.spacing.lg, paddingRight: theme.spacing.lg }),
    xl: style({ paddingLeft: theme.spacing.xl, paddingRight: theme.spacing.xl }),
  },
  py: {
    xs: style({ paddingTop: theme.spacing.xs, paddingBottom: theme.spacing.xs }),
    sm: style({ paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.sm }),
    md: style({ paddingTop: theme.spacing.md, paddingBottom: theme.spacing.md }),
    lg: style({ paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.lg }),
    xl: style({ paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xl }),
  },
};

// Text utilities
export const textStyles = {
  xs: style({ fontSize: theme.typography.fontSize.xs }),
  sm: style({ fontSize: theme.typography.fontSize.sm }),
  base: style({ fontSize: theme.typography.fontSize.base }),
  lg: style({ fontSize: theme.typography.fontSize.lg }),
  xl: style({ fontSize: theme.typography.fontSize.xl }),
  "2xl": style({ fontSize: theme.typography.fontSize["2xl"] }),
  "3xl": style({ fontSize: theme.typography.fontSize["3xl"] }),
  "4xl": style({ fontSize: theme.typography.fontSize["4xl"] }),
};

export const fontWeight = {
  light: style({ fontWeight: theme.typography.fontWeight.light }),
  normal: style({ fontWeight: theme.typography.fontWeight.normal }),
  medium: style({ fontWeight: theme.typography.fontWeight.medium }),
  semibold: style({ fontWeight: theme.typography.fontWeight.semibold }),
  bold: style({ fontWeight: theme.typography.fontWeight.bold }),
};

// Border utilities
export const rounded = {
  none: style({ borderRadius: theme.borderRadius.none }),
  sm: style({ borderRadius: theme.borderRadius.sm }),
  md: style({ borderRadius: theme.borderRadius.md }),
  lg: style({ borderRadius: theme.borderRadius.lg }),
  xl: style({ borderRadius: theme.borderRadius.xl }),
  "2xl": style({ borderRadius: theme.borderRadius["2xl"] }),
  full: style({ borderRadius: theme.borderRadius.full }),
};

// Shadow utilities
export const shadow = {
  sm: style({ boxShadow: theme.shadows.sm }),
  md: style({ boxShadow: theme.shadows.md }),
  lg: style({ boxShadow: theme.shadows.lg }),
  xl: style({ boxShadow: theme.shadows.xl }),
};

// Color utilities
export const bg = {
  primary: style({ backgroundColor: theme.colors.primary[500] }),
  secondary: style({ backgroundColor: theme.colors.gray[100] }),
  success: style({ backgroundColor: theme.colors.success[500] }),
  warning: style({ backgroundColor: theme.colors.warning[500] }),
  error: style({ backgroundColor: theme.colors.error[500] }),
  white: style({ backgroundColor: "#ffffff" }),
  transparent: style({ backgroundColor: "transparent" }),
};

export const text = {
  primary: style({ color: theme.colors.primary[500] }),
  secondary: style({ color: theme.colors.gray[600] }),
  success: style({ color: theme.colors.success[500] }),
  warning: style({ color: theme.colors.warning[500] }),
  error: style({ color: theme.colors.error[500] }),
  white: style({ color: "#ffffff" }),
  muted: style({ color: theme.colors.gray[500] }),
};

// Interactive utilities
export const hover = {
  opacity: style({
    transition: "opacity 0.2s ease",
    ":hover": {
      opacity: 0.8,
    },
  }),
  scale: style({
    transition: "transform 0.2s ease",
    ":hover": {
      transform: "scale(1.05)",
    },
  }),
};

// Animation utilities
export const transition = {
  all: style({
    transition: "all 0.2s ease",
  }),
  colors: style({
    transition: "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",
  }),
  opacity: style({
    transition: "opacity 0.2s ease",
  }),
  transform: style({
    transition: "transform 0.2s ease",
  }),
};