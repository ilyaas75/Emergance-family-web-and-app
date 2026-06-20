import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useI18n } from '../i18n/index.jsx';

export default function Circles() {
  const { t } = useI18n();
  const [circles, setCircles] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'family' });
  const [joinCode, setJoinCode] = useState('');
  const [err, setErr] = useState('');

  const load = () => api.get('/circles/mine').then(({ data }) => setCircles(data.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => { e.preventDefault(); setErr('');
    try { await api.post('/circles', form); setForm({ name: '', type: 'family' }); load(); }
    catch (e) { setErr(e.response?.data?.message); } };
  const join = async (e) => { e.preventDefault(); setErr('');
    try { await api.post('/circles/join', { inviteCode: joinCode }); setJoinCode(''); load(); }
    catch (e) { setErr(e.response?.data?.message); } };

  return (
    <div className="grid2">
      <div className="card">
        <h3 style={{ marginBottom: 14 }}>{t('nav.circles')}</h3>
        {circles.length === 0 && <p className="dim" style={{ fontSize: 13 }}>{t('common.none')}</p>}
        {circles.map((c) => (
          <Link to={`/circles/${c._id}`} key={c._id} className="between" style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
            <div className="row"><div className="av" style={{ width: 38, height: 38, background: c.type === 'couple' ? 'var(--azure)' : 'var(--primary)' }}>{c.name.slice(0, 1)}</div>
              <div><div style={{ fontFamily: 'Sora', fontWeight: 600 }}>{c.name}</div>
                <div className="dim" style={{ fontSize: 12 }}>{t('circle.' + c.type)} · {c.members?.length} {t('common.members')}</div></div></div>
            <span className="mono dim" style={{ fontSize: 12 }}>{c.inviteCode}</span>
          </Link>
        ))}
      </div>
      <div className="col" style={{ gap: 18 }}>
        <form className="card" onSubmit={create}>
          <h3 style={{ marginBottom: 14 }}>{t('circle.create')}</h3>
          <div className="field"><label>{t('circle.name')}</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>{t('circle.type')}</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="family">{t('circle.family')}</option><option value="couple">{t('circle.couple')}</option>
            </select></div>
          <button className="btn primary block">{t('common.create')}</button>
        </form>
        <form className="card" onSubmit={join}>
          <h3 style={{ marginBottom: 14 }}>{t('circle.join')}</h3>
          <div className="field"><label>{t('circle.invite')}</label><input className="input mono" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="ABCD1234" /></div>
          <button className="btn block">{t('circle.joinCode')}</button>
          {err && <div className="err">{err}</div>}
        </form>
      </div>
    </div>
  );
}
