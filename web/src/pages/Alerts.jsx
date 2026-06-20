import { useEffect, useState } from 'react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useI18n } from '../i18n/index.jsx';

export default function Alerts() {
  const { t } = useI18n();
  const [circles, setCircles] = useState([]); const [circleId, setCircleId] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => { api.get('/circles/mine').then(({ data }) => { setCircles(data.data); if (data.data[0]) setCircleId(data.data[0]._id); }); }, []);
  const loadAlerts = () => { if (circleId) api.get(`/circles/${circleId}/alerts`).then(({ data }) => setAlerts(data.data)); };
  useEffect(loadAlerts, [circleId]);
  useEffect(() => {
    const s = getSocket(); if (!s || !circleId) return;
    s.emit('circle:join', circleId);
    s.on('alert:new', loadAlerts); s.on('alert:update', loadAlerts);
    return () => { s.off('alert:new', loadAlerts); s.off('alert:update', loadAlerts); };
  }, [circleId]);

  const respond = async (alertId, status) => {
    await api.post(`/circles/${circleId}/alerts/${alertId}/respond`, { status });
    loadAlerts();
  };
  const resolve = async (alertId) => {
    await api.post(`/circles/${circleId}/alerts/${alertId}/resolve`, {});
    loadAlerts();
  };

  const badge = (s) => s === 'active' ? 'danger' : s === 'resolved' ? 'safe' : 'pending';
  return (
    <div className="card">
      <div className="between" style={{ marginBottom: 16 }}>
        <h3>{t('nav.alerts')}</h3>
        <select value={circleId || ''} onChange={(e) => setCircleId(e.target.value)} style={{ width: 'auto' }}>
          {circles.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      {alerts.length === 0 && <p className="dim" style={{ fontSize: 13 }}>{t('common.none')}</p>}
      {alerts.map((a) => (
        <div key={a._id} className="card" style={{ marginBottom: 12, boxShadow: 'none', borderColor: a.status === 'active' ? 'var(--danger)' : 'var(--line)' }}>
          <div className="between">
            <div className="row" style={{ gap: 10 }}>
              <span className={'pill ' + badge(a.status)}><span className="dot" />{t('status.' + (a.status === 'active' ? 'danger' : 'safe'))}</span>
              <b style={{ fontFamily: 'Sora' }}>{a.type === 'sos' ? 'SOS' : 'Check-in'} · {a.triggeredBy?.name || '—'}</b>
            </div>
            <span className="mono dim" style={{ fontSize: 11 }}>{new Date(a.startedAt).toLocaleString()}</span>
          </div>
          {(a.emergencyMessage || a.note) && <p className="dim" style={{ fontSize: 13, marginTop: 8 }}>{a.emergencyMessage || a.note}</p>}
          <div className="row" style={{ gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            {a.locationUrl && <a className="pill pending" href={a.locationUrl} target="_blank" rel="noreferrer">Open location</a>}
            {a.smsBackups?.length > 0 && <span className="pill safe">{a.smsBackups.length} SMS backup</span>}
          </div>
          {a.media?.length > 0 && (
            <div className="row" style={{ gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              {a.media.map((m, i) => (
                <a key={i} className="pill safe" href={(import.meta.env.VITE_SOCKET_URL || '') + m.url} target="_blank" rel="noreferrer">
                  {m.kind === 'video' ? '🎥' : '🎙'} {m.kind}
                </a>
              ))}
            </div>
          )}
          {a.responders?.length > 0 && <div className="dim" style={{ fontSize: 12, marginTop: 8 }}>{a.responders.length} responders</div>}
          {a.status === 'active' && (
            <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => respond(a._id, 'responding')}>Responding</button>
              <button className="btn" onClick={() => respond(a._id, 'arrived')}>Arrived</button>
              <button className="btn primary" onClick={() => respond(a._id, 'safe')}>Safe</button>
              <button className="btn danger" onClick={() => resolve(a._id)}>Resolve</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
