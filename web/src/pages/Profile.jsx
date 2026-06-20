import { useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../store/auth.jsx';
import { useI18n, LANGS } from '../i18n/index.jsx';
import { useTheme } from '../store/theme.jsx';

const BLOODS = ['', 'A+','A-','B+','B-','AB+','AB-','O+','O-'];
export default function Profile() {
  const { t, setLang } = useI18n(); const { user, setUser } = useAuth(); const { theme, setTheme } = useTheme();
  const [f, setF] = useState({
    name: user?.name || '', bloodType: user?.bloodType || '', allergies: user?.allergies || '',
    conditions: user?.conditions || '', medications: user?.medications || '', language: user?.language || 'so',
    emergencyContacts: user?.emergencyContacts?.length ? user.emergencyContacts : [{ name: '', phone: '', relation: '' }],
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState(''); const [pwMsg, setPwMsg] = useState('');
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const contactOn = (i, k) => (e) => {
    const contacts = [...f.emergencyContacts];
    contacts[i] = { ...contacts[i], [k]: e.target.value };
    setF({ ...f, emergencyContacts: contacts });
  };
  const addContact = () => setF({ ...f, emergencyContacts: [...f.emergencyContacts, { name: '', phone: '', relation: '' }] });
  const removeContact = (i) => setF({ ...f, emergencyContacts: f.emergencyContacts.filter((_, idx) => idx !== i) });

  const save = async (e) => { e.preventDefault();
    const payload = { ...f, emergencyContacts: f.emergencyContacts.filter((c) => c.name.trim() && c.phone.trim()) };
    const { data } = await api.put('/users/me', payload); setUser(data.data); setLang(f.language); setMsg(data.message);
    setTimeout(() => setMsg(''), 2500);
  };
  const changePw = async (e) => { e.preventDefault();
    try { const { data } = await api.put('/users/me/password', pw); setPwMsg(data.message); setPw({ currentPassword: '', newPassword: '' }); }
    catch (e) { setPwMsg(e.response?.data?.message); } setTimeout(() => setPwMsg(''), 2500);
  };

  return (
    <div className="grid2">
      <form className="card" onSubmit={save}>
        <h3 style={{ marginBottom: 16 }}>{t('profile.medical')}</h3>
        <div className="field"><label>{t('auth.name')}</label><input className="input" value={f.name} onChange={on('name')} /></div>
        <div className="field"><label>{t('profile.bloodType')}</label>
          <select value={f.bloodType} onChange={on('bloodType')}>{BLOODS.map((b) => <option key={b} value={b}>{b || '—'}</option>)}</select></div>
        <div className="field"><label>{t('profile.allergies')}</label><input className="input" value={f.allergies} onChange={on('allergies')} /></div>
        <div className="field"><label>{t('profile.conditions')}</label><input className="input" value={f.conditions} onChange={on('conditions')} /></div>
        <div className="field"><label>{t('profile.medications')}</label><input className="input" value={f.medications} onChange={on('medications')} /></div>
        <div className="field"><label>{t('auth.language')}</label>
          <select value={f.language} onChange={on('language')}>{LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
        <div className="eyebrow" style={{ margin: '18px 0 10px' }}>{t('profile.emergencyContacts')}</div>
        {f.emergencyContacts.map((contact, i) => (
          <div key={i} className="card" style={{ boxShadow: 'none', padding: 12, marginBottom: 10 }}>
            <div className="field"><label>{t('profile.contactName')}</label><input className="input" value={contact.name} onChange={contactOn(i, 'name')} /></div>
            <div className="field"><label>{t('profile.contactPhone')}</label><input className="input" value={contact.phone} onChange={contactOn(i, 'phone')} placeholder="+252 ..." /></div>
            <div className="field"><label>{t('profile.relation')}</label><input className="input" value={contact.relation} onChange={contactOn(i, 'relation')} /></div>
            {f.emergencyContacts.length > 1 && <button type="button" className="btn ghost block" onClick={() => removeContact(i)}>{t('common.delete')}</button>}
          </div>
        ))}
        <button type="button" className="btn block" style={{ marginBottom: 12 }} onClick={addContact}>{t('profile.addContact')}</button>
        <button className="btn primary block">{t('common.save')}</button>
        {msg && <div className="dim" style={{ fontSize: 12, marginTop: 8, color: 'var(--safe)' }}>{msg}</div>}
      </form>

      <div className="col" style={{ gap: 18 }}>
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>{t('profile.theme')}</h3>
          <div className="row" style={{ gap: 10 }}>
            <button className={'btn block' + (theme === 'dark' ? ' primary' : '')} onClick={() => setTheme('dark')}>🌙 {t('profile.dark')}</button>
            <button className={'btn block' + (theme === 'light' ? ' primary' : '')} onClick={() => setTheme('light')}>☀️ {t('profile.light')}</button>
          </div>
        </div>
        <form className="card" onSubmit={changePw}>
          <h3 style={{ marginBottom: 14 }}>{t('profile.changePassword')}</h3>
          <div className="field"><label>{t('profile.current')}</label><input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
          <div className="field"><label>{t('profile.newPass')}</label><input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
          <button className="btn block">{t('common.save')}</button>
          {pwMsg && <div className="dim" style={{ fontSize: 12, marginTop: 8 }}>{pwMsg}</div>}
        </form>
      </div>
    </div>
  );
}
