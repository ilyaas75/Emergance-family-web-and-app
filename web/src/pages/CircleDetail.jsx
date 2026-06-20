import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useI18n } from '../i18n/index.jsx';

export default function CircleDetail() {
  const { id } = useParams(); const { t } = useI18n(); const nav = useNavigate();
  const [circle, setCircle] = useState(null);
  const [zones, setZones] = useState([]);
  const [zone, setZone] = useState({ name: '', lat: '', lng: '', radius: 150 });

  const load = () => {
    api.get(`/circles/${id}`).then(({ data }) => setCircle(data.data));
    api.get(`/circles/${id}/safezones`).then(({ data }) => setZones(data.data)).catch(() => {});
  };
  useEffect(() => { load(); }, [id]);

  const addZone = async (e) => { e.preventDefault();
    await api.post(`/circles/${id}/safezones`, { name: zone.name, lng: parseFloat(zone.lng), lat: parseFloat(zone.lat), radius: +zone.radius });
    setZone({ name: '', lat: '', lng: '', radius: 150 }); load();
  };
  const delZone = async (zid) => { await api.delete(`/circles/${id}/safezones/${zid}`); load(); };
  const leave = async () => { await api.post(`/circles/${id}/leave`); nav('/circles'); };

  if (!circle) return <div className="spin" />;
  return (
    <div className="grid2">
      <div className="card">
        <div className="between" style={{ marginBottom: 14 }}>
          <h3>{circle.name}</h3>
          <span className="pill safe">{t('circle.' + circle.type)} · {circle.inviteCode}</span>
        </div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{t('circle.members')}</div>
        {circle.members?.map((m) => (
          <div className="between" key={m.user?._id || m.user} style={{ padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
            <div className="row"><div className="av" style={{ width: 34, height: 34, background: 'var(--azure)' }}>{(m.user?.name || '?').slice(0, 1)}</div>
              <div style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 13 }}>{m.user?.name || '—'}</div></div>
            <span className={'pill ' + (m.role === 'admin' ? 'pending' : 'safe')}>{t('circle.' + m.role)}</span>
          </div>
        ))}
        <button className="btn danger" style={{ marginTop: 16 }} onClick={leave}>{t('circle.leave')}</button>
      </div>
      <div className="col" style={{ gap: 18 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>{t('circle.safezones')}</h3>
          {zones.length === 0 && <p className="dim" style={{ fontSize: 13 }}>{t('common.none')}</p>}
          {zones.map((z) => (
            <div className="between" key={z._id} style={{ padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
              <div><b style={{ fontFamily: 'Sora', fontSize: 13 }}>{z.name}</b><div className="mono dim" style={{ fontSize: 11 }}>{z.radius}m</div></div>
              <button className="btn ghost" onClick={() => delZone(z._id)}>🗑</button>
            </div>
          ))}
        </div>
        <form className="card" onSubmit={addZone}>
          <h3 style={{ marginBottom: 12 }}>{t('circle.addZone')}</h3>
          <div className="field"><label>{t('circle.name')}</label><input className="input" value={zone.name} onChange={(e) => setZone({ ...zone, name: e.target.value })} /></div>
          <div className="row" style={{ gap: 10 }}>
            <div className="field grow"><label>Lat</label><input className="input mono" value={zone.lat} onChange={(e) => setZone({ ...zone, lat: e.target.value })} placeholder="2.0469" /></div>
            <div className="field grow"><label>Lng</label><input className="input mono" value={zone.lng} onChange={(e) => setZone({ ...zone, lng: e.target.value })} placeholder="45.3182" /></div>
          </div>
          <div className="field"><label>Radius (m)</label><input className="input mono" type="number" value={zone.radius} onChange={(e) => setZone({ ...zone, radius: e.target.value })} /></div>
          <button className="btn primary block">{t('common.create')}</button>
        </form>
      </div>
    </div>
  );
}
