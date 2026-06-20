import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.jsx';
import { useI18n, LANGS } from '../i18n/index.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function Register() {
  const { t, lang } = useI18n(); const { register } = useAuth(); const nav = useNavigate();
  const [f, setF] = useState({ name: '', phone: '', password: '', language: lang });
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await register(f); nav('/'); }
    catch (e) { setErr(e.response?.data?.message || 'Error'); } finally { setBusy(false); }
  };
  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <div className="between" style={{ marginBottom: 18 }}>
          <div className="brand"><div className="logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2l8 3v6c0 5-3.4 8.5-8 11-4.6-2.5-8-6-8-11V5l8-3z" stroke="#06121c" strokeWidth="1.6"/></svg></div><h2>{t('appName')}</h2></div>
          <div className="row" style={{ gap: 8 }}><LanguageSwitcher /><ThemeToggle /></div>
        </div>
        <h3 style={{ fontSize: 20, marginBottom: 16 }}>{t('auth.createAccount')}</h3>
        <div className="field"><label>{t('auth.name')}</label><input className="input" value={f.name} onChange={on('name')} /></div>
        <div className="field"><label>{t('auth.phone')}</label><input className="input" value={f.phone} onChange={on('phone')} placeholder="+252 ..." /></div>
        <div className="field"><label>{t('auth.password')}</label>
          <div className="password-field">
            <input className="input" type={showPassword ? 'text' : 'password'} value={f.password} onChange={on('password')} />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10.6 10.6a2 2 0 002.8 2.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9.5 5.3A9.9 9.9 0 0112 5c5 0 8.5 4.4 9.5 7a13 13 0 01-2.6 3.8M6.2 6.2A13.4 13.4 0 002.5 12c1 2.6 4.5 7 9.5 7 1.4 0 2.7-.3 3.8-.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2"/></svg>
              )}
            </button>
          </div>
        </div>
        <div className="field"><label>{t('auth.language')}</label>
          <select value={f.language} onChange={on('language')}>{LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select>
        </div>
        {err && <div className="err">{err}</div>}
        <button className="btn primary block" disabled={busy} style={{ marginTop: 8 }}>{busy ? '…' : t('auth.register')}</button>
        <p className="dim" style={{ fontSize: 13, marginTop: 14, textAlign: 'center' }}>
          {t('auth.haveAccount')} <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>{t('auth.login')}</Link>
        </p>
      </form>
    </div>
  );
}
