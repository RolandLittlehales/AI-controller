import { globalStyle } from "@vanilla-extract/css";
import { theme } from "./theme.css";

// Reset and base styles
globalStyle("*", {
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
});

globalStyle("html", {
  height: "100%",
  fontSize: theme.typography.fontSize.base,
  lineHeight: theme.typography.lineHeight.normal,
});

globalStyle("body", {
  height: "100%",
  fontFamily: theme.typography.fontFamily.sans,
  backgroundColor: theme.colors.gray[50],
  color: theme.colors.gray[900],
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
});

globalStyle("#__nuxt", {
  height: "100%",
});

// Focus styles
globalStyle("*:focus-visible", {
  outline: `2px solid ${theme.colors.primary[500]}`,
  outlineOffset: "2px",
});

// Scrollbar styles
globalStyle("::-webkit-scrollbar", {
  width: theme.scrollbar.width,
  height: theme.scrollbar.width,
});

globalStyle("::-webkit-scrollbar-track", {
  backgroundColor: theme.colors.gray[100],
});

globalStyle("::-webkit-scrollbar-thumb", {
  backgroundColor: theme.colors.gray[400],
  borderRadius: theme.borderRadius.md,
});

globalStyle("::-webkit-scrollbar-thumb:hover", {
  backgroundColor: theme.colors.gray[500],
});

// Terminal specific styles
globalStyle(".xterm", {
  fontFamily: theme.typography.fontFamily.mono,
  fontSize: "14px",
  lineHeight: 1.2,
});

globalStyle(".xterm-viewport", {
  backgroundColor: theme.colors.terminal.background,
});

globalStyle(".xterm-screen", {
  backgroundColor: theme.colors.terminal.background,
});

// Button reset
globalStyle("button", {
  border: "none",
  background: "none",
  cursor: "pointer",
  fontFamily: "inherit",
});

// Input reset
globalStyle("input, textarea, select", {
  fontFamily: "inherit",
  fontSize: "inherit",
  lineHeight: "inherit",
  border: "none",
  outline: "none",
});