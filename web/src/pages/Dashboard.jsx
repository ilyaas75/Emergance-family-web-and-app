import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useI18n } from '../i18n/index.jsx';
import { useAuth } from '../store/auth.jsx';
import MapView from '../components/MapView.jsx';
import SosButton from '../components/SosButton.jsx';
import Recorder from '../components/Recorder.jsx';

const EMERGENCY_NUMBERS = [
  { label: 'Emergency', phone: '112', tone: 'danger' },
  { label: 'Police', phone: '999', tone: 'pending' },
  { label: 'Ambulance', phone: '997', tone: 'safe' },
  { label: 'Fire', phone: '998', tone: 'danger' },
];

function directionLabel(heading) {
  if (heading == null) return 'Unknown direction';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(heading / 45) % 8];
}

function StatCard({ label, value, hint, tone = 'safe' }) {
  return (
    <div className={`dash-stat dash-stat-${tone}`}>
      <div className="dash-stat-glow" />
      <div className="eyebrow">{label}</div>
      <div className="dash-stat-value">{value}</div>
      <div className="dim" style={{ fontSize: 12 }}>{hint}</div>
    </div>
  );
}

function SafetyRing({ safe, total }) {
  const pct = total ? Math.round((safe / total) * 100) : 100;
  const r = 44;
  const circ = 2 * Math.PI * r;
  return (
    <div className="chart-card">
      <div className="between" style={{ marginBottom: 10 }}>
        <h3>Safety score</h3>
        <span className="pill safe"><span className="dot" />Live</span>
      </div>
      <div className="ring-wrap">
        <svg viewBox="0 0 120 120" className="ring-chart">
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line2)" strokeWidth="12" />
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} />
        </svg>
        <div className="ring-label"><b>{pct}%</b><span>safe</span></div>
      </div>
    </div>
  );
}

function AlertTrend({ alerts }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const counts = days.map((day) => alerts.filter((a) => {
    const started = new Date(a.startedAt);
    return started >= day && started < new Date(day.getTime() + 86400000);
  }).length);
  const max = Math.max(1, ...counts);
  return (
    <div className="chart-card">
      <div className="between" style={{ marginBottom: 14 }}>
        <h3>Alert analytics</h3>
        <span className="mono dim" style={{ fontSize: 11 }}>7 days</span>
      </div>
      <div className="bar-chart">
        {counts.map((count, i) => (
          <div className="bar-item" key={days[i].toISOString()}>
            <div className="bar-track"><div className="bar-fill" style={{ height: `${Math.max(8, (count / max) * 100)}%` }} /></div>
            <span>{days[i].toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const lastGpsSent = useRef(0);
  const [circles, setCircles] = useState([]);
  const [circleId, setCircleId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberHistory, setMemberHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [currentGps, setCurrentGps] = useState(null);
  const [gpsState, setGpsState] = useState({ status: 'waiting', error: '' });

  useEffect(() => { api.get('/circles/mine').then(({ data }) => {
    setCircles(data.data); if (data.data[0]) setCircleId(data.data[0]._id);
  }); }, []);

  const load = async () => {
    if (!circleId) return;
    const [{ data: locData }, { data: activityData }, { data: activeData }, { data: historyData }] = await Promise.all([
      api.get(`/circles/${circleId}/locations`),
      api.get(`/circles/${circleId}/locations/activity`),
      api.get(`/circles/${circleId}/alerts?status=active`),
      api.get(`/circles/${circleId}/alerts`),
    ]);
    const activeUserIds = new Set(activeData.data.map((a) => a.triggeredBy?._id || a.triggeredBy).filter(Boolean));
    setLocations(locData.data.map((l) => {
      const id = l.user?._id || l._id;
      return { id, name: l.user?.name, lng: l.geo?.coordinates?.[0], lat: l.geo?.coordinates?.[1], battery: l.battery, accuracy: l.accuracy, speed: l.speed, heading: l.heading, moving: l.moving, at: l.recordedAt, status: activeUserIds.has(id) ? 'danger' : 'safe' };
    }));
    setActivity(activityData.data);
    if (!selectedMemberId && locData.data[0]) setSelectedMemberId(locData.data[0].user?._id || locData.data[0].user || '');
    setAlerts(activeData.data);
    setAlertHistory(historyData.data);
  };
  useEffect(() => { load(); }, [circleId]);

  useEffect(() => {
    if (!circleId || !selectedMemberId) { setMemberHistory([]); return; }
    api.get(`/circles/${circleId}/locations/history`, { params: { userId: selectedMemberId, limit: 80 } })
      .then(({ data }) => setMemberHistory(data.data))
      .catch(() => setMemberHistory([]));
  }, [circleId, selectedMemberId]);

  // live socket updates
  useEffect(() => {
    const s = getSocket(); if (!s || !circleId) return;
    s.emit('circle:join', circleId);
    const onLoc = (d) => setLocations((prev) => {
      const i = prev.findIndex((m) => m.id === d.user); const item = { id: d.user, name: d.name, lng: d.lng, lat: d.lat, battery: d.battery, accuracy: d.accuracy, speed: d.speed, heading: d.heading, moving: d.moving, at: d.at, status: prev[i]?.status === 'danger' ? 'danger' : 'safe' };
      if (i >= 0) { const c = [...prev]; c[i] = { ...c[i], ...item }; return c; } return [...prev, item];
    });
    const onAlert = () => load();
    s.on('location:update', onLoc); s.on('alert:new', onAlert); s.on('alert:update', onAlert);
    return () => { s.off('location:update', onLoc); s.off('alert:new', onAlert); s.off('alert:update', onAlert); };
  }, [circleId]);

  const triggerSos = async () => {
    if (!circleId) return;
    let coords = currentGps ? { lng: currentGps.lng, lat: currentGps.lat } : {};
    try { const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
      coords = { lng: pos.coords.longitude, lat: pos.coords.latitude }; } catch (e) {}
    const { data } = await api.post(`/circles/${circleId}/alerts`, { type: 'sos', note: t('sos.defaultMessage'), ...coords });
    setActiveAlert(data.data); load();
  };
  const resolve = async () => { if (!activeAlert) return; await api.post(`/circles/${circleId}/alerts/${activeAlert._id}/resolve`, {}); setActiveAlert(null); load(); };

  useEffect(() => {
    if (!circleId || !user) return;
    if (!navigator.geolocation) {
      setGpsState({ status: 'unsupported', error: 'GPS is not supported on this device.' });
      return;
    }
    setGpsState({ status: 'tracking', error: '' });
    const watchId = navigator.geolocation.watchPosition(async (pos) => {
      const nextGps = {
        id: user._id,
        name: user.name,
        lng: pos.coords.longitude,
        lat: pos.coords.latitude,
        accuracy: Math.round(pos.coords.accuracy || 0),
        speed: pos.coords.speed != null ? Math.round(pos.coords.speed * 3.6) : 0,
        heading: pos.coords.heading != null ? Math.round(pos.coords.heading) : undefined,
        moving: (pos.coords.speed || 0) > 0.5,
        at: new Date().toISOString(),
        status: activeAlert ? 'danger' : 'safe',
      };
      setCurrentGps(nextGps);
      setLocations((prev) => {
        const i = prev.findIndex((m) => m.id === user._id);
        if (i >= 0) { const copy = [...prev]; copy[i] = { ...copy[i], ...nextGps }; return copy; }
        return [...prev, nextGps];
      });
      try {
        const now = Date.now();
        if (now - lastGpsSent.current < 3000) return;
        lastGpsSent.current = now;
        await api.post(`/circles/${circleId}/location`, {
          lng: nextGps.lng,
          lat: nextGps.lat,
          accuracy: nextGps.accuracy,
          speed: nextGps.speed,
          heading: nextGps.heading,
          moving: nextGps.moving,
        });
        setGpsState({ status: 'tracking', error: '' });
      } catch (e) {
        setGpsState({ status: 'sync-error', error: 'GPS found, but live sync failed.' });
      }
    }, (err) => {
      setGpsState({ status: 'error', error: err.message || 'Allow location access to enable live GPS tracking.' });
    }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeAlert, circleId, user]);

  const allSafe = useMemo(() => alerts.length === 0, [alerts]);
  const selectedCircle = circles.find((circle) => circle._id === circleId);
  const safeCount = locations.filter((m) => m.status !== 'danger').length;
  const movingCount = locations.filter((m) => m.moving).length;
  const avgBattery = locations.length
    ? Math.round(locations.reduce((sum, m) => sum + (m.battery ?? 0), 0) / locations.filter((m) => m.battery != null).length || 0)
    : 0;
  const personalContacts = (user?.emergencyContacts || []).filter((contact) => contact.name && contact.phone);
  const recentAlerts = alertHistory.slice(0, 4);
  const gpsPill = gpsState.status === 'tracking' ? 'safe' : gpsState.status === 'waiting' ? 'pending' : 'danger';
  const selectedMember = locations.find((m) => m.id === selectedMemberId) || locations[0];
  const selectedActivity = activity.find((item) => (item.user?._id || item.user) === (selectedMember?.id || selectedMemberId));
  const visitedLocations = selectedActivity?.visited || memberHistory.map((h) => ({
    lat: h.geo?.coordinates?.[1],
    lng: h.geo?.coordinates?.[0],
    accuracy: h.accuracy,
    speed: h.speed,
    heading: h.heading,
    moving: h.moving,
    recordedAt: h.recordedAt,
  }));
  const memberTrail = memberHistory
    .slice()
    .reverse()
    .map((h) => ({ lng: h.geo?.coordinates?.[0], lat: h.geo?.coordinates?.[1] }))
    .filter((point) => point.lng != null && point.lat != null);

  if (circles.length === 0) return (
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <h3>{t('dash.noCircle')}</h3>
      <Link to="/circles" className="btn primary" style={{ marginTop: 14, display: 'inline-flex' }}>{t('dash.createCircle')}</Link>
    </div>
  );

  return (
    <div className="dashboard-modern">
      <section className="dash-hero">
        <div>
          <div className="eyebrow">Emergency command center</div>
          <h1>{selectedCircle?.name || t('appName')}</h1>
          <p className="dim">Monitor family safety, live locations, active alerts, and emergency response from one beautiful dashboard.</p>
        </div>
        <div className="dash-hero-actions">
          <select value={circleId || ''} onChange={(e) => setCircleId(e.target.value)}>
            {circles.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <Link to="/profile" className="btn">Manage profile</Link>
        </div>
      </section>

      <section className="dash-stats-grid">
        <StatCard label="Active alerts" value={alerts.length} hint={allSafe ? 'No current emergency' : 'Needs immediate attention'} tone={allSafe ? 'safe' : 'danger'} />
        <StatCard label="Tracked members" value={locations.length} hint={`${safeCount} currently marked safe`} tone="safe" />
        <StatCard label="Moving now" value={movingCount} hint="Live movement signals" tone="pending" />
        <StatCard label="Avg battery" value={`${avgBattery}%`} hint="From shared devices" tone={avgBattery < 25 ? 'danger' : 'safe'} />
        <StatCard label="GPS accuracy" value={currentGps ? `${currentGps.accuracy}m` : '--'} hint={gpsState.status === 'tracking' ? 'Live tracking enabled' : 'Waiting for GPS permission'} tone={gpsPill} />
      </section>

      <section className="dash-main-grid">
        <div className="col" style={{ gap: 18 }}>
          <div className="card dash-map-card">
            <div className="between" style={{ marginBottom: 12 }}>
              <div>
                <h3>{t('dash.liveMap')}</h3>
                <p className="dim" style={{ fontSize: 12 }}>Real-time family and couple location tracking</p>
              </div>
              <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span className={'pill ' + gpsPill}><span className="dot" />GPS {gpsState.status}</span>
                <span className={'pill ' + (allSafe ? 'safe' : 'danger')}><span className="dot" />{allSafe ? t('dash.allSafe') : t('dash.activeAlerts')}</span>
              </div>
            </div>
            <MapView members={locations} trail={memberTrail} height={420} />
            <div className="gps-panel">
              <div>
                <div className="eyebrow">Current GPS</div>
                <b>{currentGps ? `${currentGps.lat.toFixed(5)}, ${currentGps.lng.toFixed(5)}` : 'Waiting for location permission'}</b>
                {gpsState.error && <p className="err">{gpsState.error}</p>}
              </div>
              <div className="gps-metrics">
                <span><b>{currentGps?.accuracy ?? '--'}m</b><small>Accuracy</small></span>
                <span><b>{currentGps?.speed ?? 0} km/h</b><small>Speed</small></span>
                <span><b>{currentGps?.heading != null ? `${currentGps.heading}°` : '--'}</b><small>Heading</small></span>
                <span><b>{currentGps?.at ? new Date(currentGps.at).toLocaleTimeString() : '--'}</b><small>Updated</small></span>
              </div>
            </div>
          </div>

          <div className="dash-chart-grid">
            <SafetyRing safe={safeCount} total={locations.length} />
            <AlertTrend alerts={alertHistory} />
          </div>

          <div className="card">
            <div className="between" style={{ marginBottom: 12 }}>
              <h3>{t('common.members')} monitoring</h3>
              <span className="mono dim" style={{ fontSize: 11 }}>{locations.length} online</span>
            </div>
            {locations.length === 0 && <p className="dim" style={{ fontSize: 13 }}>{t('common.none')}</p>}
            <div className="member-grid">
              {locations.map((m) => (
                <button className={'member-card member-card-btn' + (selectedMemberId === m.id ? ' active' : '')} key={m.id} onClick={() => setSelectedMemberId(m.id)}>
                  <div className="row">
                    <div className="av" style={{ width: 40, height: 40, background: m.status === 'danger' ? 'var(--danger)' : 'var(--azure)' }}>{(m.name || '?').slice(0, 1)}</div>
                    <div>
                      <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 13 }}>{m.name || 'Unknown'}</div>
                      <div className="mono" style={{ fontSize: 10, color: m.status === 'danger' ? 'var(--danger)' : 'var(--amber)' }}>
                        {m.status === 'danger' ? t('status.danger') : m.moving ? `${t('status.moving')} · ${m.speed || 0} km/h` : t('status.safe')}
                      </div>
                      <div className="mono dim" style={{ fontSize: 10 }}>
                        {m.accuracy != null ? `GPS ±${m.accuracy}m` : 'GPS pending'}{m.heading != null ? ` · ${m.heading}°` : ''}
                      </div>
                    </div>
                  </div>
                  <span className={'pill ' + (m.status || 'safe')}><span className="dot" />{m.battery != null ? m.battery + '%' : t('status.safe')}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="between" style={{ marginBottom: 12 }}>
              <div>
                <h3>Family activity monitor</h3>
                <p className="dim" style={{ fontSize: 12 }}>Current status, movement direction, and recent visited locations.</p>
              </div>
              {selectedMember && <span className="pill pending">{selectedMember.name || 'Selected member'}</span>}
            </div>
            {!selectedMember && <p className="dim" style={{ fontSize: 13 }}>{t('common.none')}</p>}
            {selectedMember && (
              <>
                <div className="activity-grid">
                  <div className="activity-card">
                    <span>Status</span>
                    <b>{selectedMember.status === 'danger' ? 'Emergency' : selectedMember.moving ? 'Moving' : 'Stationary'}</b>
                    <small>{selectedMember.at ? `Last update ${new Date(selectedMember.at).toLocaleTimeString()}` : 'Waiting for update'}</small>
                  </div>
                  <div className="activity-card">
                    <span>Movement</span>
                    <b>{selectedMember.speed || 0} km/h</b>
                    <small>{selectedMember.moving ? 'Currently moving' : 'No movement detected'}</small>
                  </div>
                  <div className="activity-card">
                    <span>Going direction</span>
                    <b>{directionLabel(selectedMember.heading)}</b>
                    <small>{selectedMember.heading != null ? `${selectedMember.heading} degrees` : 'Heading unavailable'}</small>
                  </div>
                  <div className="activity-card">
                    <span>Visited points</span>
                    <b>{visitedLocations.length}</b>
                    <small>Recent GPS records</small>
                  </div>
                </div>

                <div className="visited-list">
                  <div className="between" style={{ margin: '16px 0 8px' }}>
                    <div className="eyebrow">Visited locations</div>
                    <span className="mono dim" style={{ fontSize: 11 }}>latest first</span>
                  </div>
                  {visitedLocations.length === 0 && <p className="dim" style={{ fontSize: 13 }}>No visited locations recorded yet.</p>}
                  {visitedLocations.slice(0, 8).map((point, i) => (
                    <a
                      className="visited-item"
                      href={`https://maps.google.com/?q=${point.lat},${point.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      key={`${point.recordedAt}-${i}`}
                    >
                      <span className={'pill ' + (point.moving ? 'pending' : 'safe')}><span className="dot" />{point.moving ? 'Moving' : 'Stopped'}</span>
                      <div>
                        <b>{point.lat?.toFixed?.(5)}, {point.lng?.toFixed?.(5)}</b>
                        <small>{new Date(point.recordedAt).toLocaleString()} · {point.speed || 0} km/h · ±{point.accuracy || 0}m · {directionLabel(point.heading)}</small>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <aside className="col" style={{ gap: 18 }}>
          <div className="card col sos-panel" style={{ alignItems: 'center', gap: 16, paddingTop: 26 }}>
            {!activeAlert ? <SosButton onTrigger={triggerSos} /> : (
              <div className="col" style={{ gap: 14, width: '100%', alignItems: 'center' }}>
                <span className="pill danger"><span className="dot" />{t('sos.sent')}</span>
                <Recorder circleId={circleId} alertId={activeAlert._id} onUploaded={load} />
                <button className="btn primary block" onClick={resolve}>{t('sos.imSafe')}</button>
              </div>
            )}
          </div>

          <div className="card">
            <div className="between" style={{ marginBottom: 12 }}>
              <h3>Emergency call</h3>
              <span className="pill danger"><span className="dot" />Quick dial</span>
            </div>
            {personalContacts.length > 0 && (
              <>
                <div className="eyebrow" style={{ marginBottom: 10 }}>Family contacts</div>
                <div className="call-grid" style={{ marginBottom: 14 }}>
                  {personalContacts.map((contact) => (
                    <a className="call-card call-contact" href={`tel:${contact.phone}`} key={`${contact.name}-${contact.phone}`}>
                      <span>{contact.relation || 'Emergency contact'}</span>
                      <b>{contact.name}</b>
                      <small>{contact.phone}</small>
                    </a>
                  ))}
                </div>
              </>
            )}
            {personalContacts.length === 0 && (
              <p className="dim" style={{ fontSize: 12, marginBottom: 12 }}>Add your father or family phone number in Profile to call them from here.</p>
            )}
            <div className="eyebrow" style={{ marginBottom: 10 }}>Public emergency numbers</div>
            <div className="call-grid">
              {EMERGENCY_NUMBERS.map((item) => (
                <a className={`call-card call-${item.tone}`} href={`tel:${item.phone}`} key={item.phone}>
                  <span>{item.label}</span>
                  <b>{item.phone}</b>
                </a>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="between" style={{ marginBottom: 12 }}>
              <h3>Alerts overview</h3>
              <Link to="/alerts" className="pill pending">View all</Link>
            </div>
            {alerts.length === 0 && <p className="dim" style={{ fontSize: 13 }}>{t('dash.everyoneChecked')}</p>}
            {alerts.map((a) => (
              <div className="alert-mini" key={a._id}>
                <span className="pill danger"><span className="dot" />SOS</span>
                <div>
                  <b>{a.triggeredBy?.name || 'Emergency alert'}</b>
                  <p className="dim">{a.emergencyMessage || a.note || t('sos.defaultMessage')}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="between" style={{ marginBottom: 12 }}>
              <h3>Notification history</h3>
              <span className="mono dim" style={{ fontSize: 11 }}>{alertHistory.length} total</span>
            </div>
            {recentAlerts.length === 0 && <p className="dim" style={{ fontSize: 13 }}>{t('common.none')}</p>}
            {recentAlerts.map((a) => (
              <div className="history-item" key={a._id}>
                <span className={'pill ' + (a.status === 'active' ? 'danger' : a.status === 'resolved' ? 'safe' : 'pending')}><span className="dot" />{a.status}</span>
                <div>
                  <b>{a.type === 'sos' ? 'SOS alert' : 'Check-in'}</b>
                  <div className="mono dim">{new Date(a.startedAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
