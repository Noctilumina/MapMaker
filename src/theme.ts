export const theme = {
  // Colors — CSS variable references
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  surfaceHover: 'var(--color-surface-hover)',
  canvas: 'var(--color-canvas)',
  text: 'var(--color-text)',
  textMuted: 'var(--color-muted)',
  border: 'var(--color-border)',
  borderSubtle: 'var(--color-border-subtle)',
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
  danger: 'var(--color-danger)',
  shadow: 'var(--color-shadow)',

  // Alpha tokens — pre-computed for template literals
  primaryAlphaLow: 'var(--color-primary-alpha-low)',
  primaryAlphaMid: 'var(--color-primary-alpha-mid)',
  primaryAlphaStripe: 'var(--color-primary-alpha-stripe)',
  successAlphaLow: 'var(--color-success-alpha-low)',
  successAlphaMid: 'var(--color-success-alpha-mid)',

  // Fonts
  fontHeading: "'Space Mono', monospace",
  fontBody: "'Inter', system-ui, sans-serif",

  // Border shorthands
  borderHeavy: 'var(--border-heavy)',
  borderMedium: 'var(--border-medium)',
  borderLight: 'var(--border-light)',

  // Border radius
  radius: 'var(--radius)' as string,

  // Shadows (em-based for proportional scaling)
  shadowSm: 'var(--shadow-sm)',
  shadowMd: 'var(--shadow-md)',
  shadowLg: 'var(--shadow-lg)',
} as const;
