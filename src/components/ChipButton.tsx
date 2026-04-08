import { useState } from 'react';
import { theme } from '../theme';

type Variant = 'primary' | 'success' | 'warning' | 'info' | 'secondary' | 'danger';

const variantColors: Record<Variant, { active: string; text: string; alphaBg: string }> = {
  primary:   { active: theme.primary,  text: theme.bg, alphaBg: theme.primaryAlphaLow },
  success:   { active: theme.success,  text: theme.bg, alphaBg: theme.successAlphaLow },
  warning:   { active: theme.warning,  text: theme.bg, alphaBg: 'rgba(255,215,0,0.12)' },
  info:      { active: theme.info,     text: theme.bg, alphaBg: 'rgba(137,180,250,0.12)' },
  secondary: { active: theme.borderSubtle, text: theme.text, alphaBg: 'rgba(68,68,68,0.15)' },
  danger:    { active: theme.danger,   text: theme.bg, alphaBg: theme.primaryAlphaLow },
};

interface Props {
  variant?: Variant;
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
  disabled?: boolean;
}

export default function ChipButton({
  variant = 'secondary',
  selected = false,
  onClick,
  children,
  style,
  title,
  disabled,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const colors = variantColors[variant];

  const bg = selected
    ? colors.active
    : hovered
      ? colors.alphaBg
      : 'transparent';

  const color = selected
    ? colors.text
    : hovered
      ? colors.active
      : theme.textMuted;

  const border = selected
    ? `1px solid ${colors.active}`
    : `1px solid ${theme.borderSubtle}`;

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: bg,
        color,
        border,
        borderRadius: theme.radius,
        padding: '2px 8px',
        fontSize: 10,
        fontFamily: theme.fontHeading,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.12s ease',
        opacity: disabled ? 0.4 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
