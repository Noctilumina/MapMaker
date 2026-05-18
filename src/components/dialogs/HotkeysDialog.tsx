import { HOTKEYS } from '../../hotkeys';
import { theme } from '../../theme';

interface Props {
  onClose: () => void;
}

export default function HotkeysDialog({ onClose }: Props) {
  const categories = Array.from(new Set(HOTKEYS.map(h => h.category)));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.bg, border: theme.borderLight,
          borderRadius: theme.radius, padding: 24, minWidth: 480,
          maxHeight: '80vh', overflowY: 'auto',
          boxShadow: theme.shadowLg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: theme.fontHeading, fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.primary, flex: 1 }}>
            Keyboard Shortcuts
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {categories.map(cat => (
            <div key={cat}>
              <div style={{ fontFamily: theme.fontHeading, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted, marginBottom: 8, borderBottom: `1px solid ${theme.borderSubtle}`, paddingBottom: 4 }}>
                {cat}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {HOTKEYS.filter(h => h.category === cat).map(h => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <kbd style={{
                      background: theme.surface, border: theme.borderLight,
                      borderRadius: 4, padding: '1px 6px', fontSize: 10,
                      fontFamily: 'monospace', color: theme.text,
                      whiteSpace: 'nowrap', flexShrink: 0,
                      minWidth: 60, textAlign: 'center',
                    }}>
                      {h.key}
                    </kbd>
                    <span style={{ fontSize: 11, color: theme.textMuted }}>{h.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
