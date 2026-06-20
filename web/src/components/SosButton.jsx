import { useState } from 'react';
import { useI18n } from '../i18n/index.jsx';

export default function SosButton({ onTrigger }) {
  const { t } = useI18n();
  const [sending, setSending] = useState(false);

  const trigger = async () => {
    if (sending) return;
    setSending(true);
    try { await onTrigger?.(); } finally { setSending(false); }
  };

  return (
    <div className="col" style={{ alignItems: 'center', gap: 12 }}>
      <button
        onClick={trigger}
        disabled={sending}
        style={{ position: 'relative', width: 200, height: 200, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'radial-gradient(circle at 50% 38%, #ff6b78, var(--danger) 55%, var(--danger-deep))',
          boxShadow: '0 18px 50px -10px rgba(255,77,94,.6)', color: '#fff', userSelect: 'none', opacity: sending ? .75 : 1 }}>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 36, letterSpacing: 2 }}>{sending ? '...' : t('sos.title')}</div>
            <div style={{ fontSize: 11, opacity: .9, fontWeight: 600 }}>{sending ? t('sos.sending') : t('sos.tap')}</div>
          </div>
        </div>
      </button>
      <div className="dim" style={{ fontSize: 13, textAlign: 'center', maxWidth: 260 }}>{t('sos.desc')}</div>
    </div>
  );
}
