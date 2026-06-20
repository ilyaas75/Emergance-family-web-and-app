import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const SECTIONS = [
  ['dashboard', 'Dashboard'],
  ['users', 'Users'],
  ['alerts', 'Alerts'],
  ['circles', 'Families & Couples'],
  ['gps', 'GPS Tracking'],
  ['contacts', 'Contacts'],
  ['reports', 'Reports'],
  ['logs', 'Activity Logs'],
  ['settings', 'Settings'],
];

function AdminStat({ label, value, hint, tone = 'safe' }) {
  return (
    <div className={`admin-stat admin-stat-${tone}`}>
      <span className="eyebrow">{label}</span>
      <b>{value}</b>
      <small>{hint}</small>
    </div>
  );
}

function MiniBars({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.count || 0));
  return (
    <div className="admin-bars">
      {data.map((item) => (
        <div className="admin-bar" key={item._id || item.label}>
          <span>{item._id || item.label}</span>
          <div><i style={{ width: `${Math.max(8, ((item.count || 0) / max) * 100)}%` }} /></div>
          <b>{item.count || 0}</b>
        </div>
      ))}
    </div>
  );
}

function Empty({ label = 'No data available' }) {
  return <p className="dim" style={{ fontSize: 13 }}>{label}</p>;
}

export default function Admin() {
  const [active, setActive] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: null,
    users: [],
    circles: [],
    alerts: [],
    locations: [],
    contacts: [],
    reports: null,
    logs: [],
    settings: null,
  });

  const load = async () => {
    setLoading(true);
    const [overview, users, circles, alerts, locations, contacts, reports, logs, settings] = await Promise.all([
      api.get('/admin/overview'),
      api.get('/admin/users'),
      api.get('/admin/circles'),
      api.get('/admin/alerts'),
      api.get('/admin/locations'),
      api.get('/admin/contacts'),
      api.get('/admin/reports'),
      api.get('/admin/activity-logs'),
      api.get('/admin/settings'),
    ]);
    setData({
      overview: overview.data.data,
      users: users.data.data,
      circles: circles.data.data,
      alerts: alerts.data.data,
      locations: locations.data.data,
      contacts: contacts.data.data,
      reports: reports.data.data,
      logs: logs.data.data,
      settings: settings.data.data,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totals = data.overview?.totals || {};
  const activeAlerts = data.alerts.filter((a) => a.status === 'active');
  const admins = data.users.filter((u) => u.role === 'admin').length;
  const inactiveUsers = data.users.filter((u) => !u.isActive).length;
  const recentLocations = data.locations.slice(0, 8);
  const incidentRows = data.reports?.incidents || [];
  const callRows = data.reports?.calls || [];
  const reportSummary = useMemo(() => ([
    { label: 'Incident reports', count: incidentRows.length },
    { label: 'Emergency call/SMS reports', count: callRows.length },
    { label: 'Location reports', count: data.reports?.locations?.length || 0 },
  ]), [incidentRows.length, callRows.length, data.reports]);

  const exportCsv = async (type) => {
    const response = await api.get(`/admin/exports/${type}`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateUser = async (user, patch) => {
    await api.patch(`/admin/users/${user._id}`, patch);
    load();
  };

  const updateAlert = async (alert, status) => {
    await api.patch(`/admin/alerts/${alert._id}`, { status });
    load();
  };

  if (loading) return <div className="card"><div className="spin" /></div>;

  return (
    <div className="admin-shell">
      <section className="admin-hero">
        <div>
          <div className="eyebrow">System administration</div>
          <h1>Admin Control Panel</h1>
          <p className="dim">Manage users, alerts, families, GPS tracking, contacts, reports, settings, permissions, notifications, and audit logs.</p>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => exportCsv('users')}>Export Users CSV</button>
          <button className="btn" onClick={() => exportCsv('alerts')}>Export Alerts CSV</button>
          <button className="btn primary" onClick={load}>Refresh</button>
        </div>
      </section>

      <div className="admin-tabs">
        {SECTIONS.map(([key, label]) => (
          <button key={key} className={active === key ? 'active' : ''} onClick={() => setActive(key)}>{label}</button>
        ))}
      </div>

      {active === 'dashboard' && (
        <div className="col" style={{ gap: 18 }}>
          <div className="admin-stats-grid">
            <AdminStat label="Users" value={totals.users || 0} hint={`${totals.activeUsers || 0} active`} />
            <AdminStat label="Active alerts" value={totals.activeAlerts || 0} hint="Live emergency incidents" tone={totals.activeAlerts ? 'danger' : 'safe'} />
            <AdminStat label="Families/Couples" value={totals.circles || 0} hint="Managed circles" />
            <AdminStat label="GPS records" value={totals.locations || 0} hint="Latest shared locations" tone="pending" />
            <AdminStat label="Admins" value={admins} hint="Role management" tone="pending" />
            <AdminStat label="Inactive users" value={inactiveUsers} hint="Security review" tone={inactiveUsers ? 'danger' : 'safe'} />
          </div>

          <div className="admin-grid-2">
            <div className="card">
              <h3 style={{ marginBottom: 14 }}>Alert statistics</h3>
              <MiniBars data={data.overview?.alertStats || []} />
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 14 }}>User statistics</h3>
              <MiniBars data={data.overview?.userStats || []} />
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Recent emergency alerts</h3>
            {data.overview?.recentAlerts?.length ? data.overview.recentAlerts.map((a) => (
              <div className="admin-row" key={a._id}>
                <span className={'pill ' + (a.status === 'active' ? 'danger' : 'safe')}><span className="dot" />{a.status}</span>
                <b>{a.triggeredBy?.name || 'Unknown user'}</b>
                <span className="dim">{a.circle?.name || 'No circle'}</span>
                <span className="mono dim">{new Date(a.startedAt).toLocaleString()}</span>
              </div>
            )) : <Empty />}
          </div>
        </div>
      )}

      {active === 'users' && (
        <div className="card admin-table-card">
          <div className="between" style={{ marginBottom: 14 }}><h3>User Management</h3><button className="btn" onClick={() => exportCsv('users')}>CSV</button></div>
          <div className="admin-table">
            <div className="admin-table-head"><span>Name</span><span>Phone</span><span>Role</span><span>Status</span><span>Actions</span></div>
            {data.users.map((u) => (
              <div className="admin-table-row" key={u._id}>
                <span><b>{u.name}</b><small>{u.email || 'No email'}</small></span>
                <span>{u.phone}</span>
                <span className={'pill ' + (u.role === 'admin' ? 'pending' : 'safe')}>{u.role}</span>
                <span className={'pill ' + (u.isActive ? 'safe' : 'danger')}>{u.isActive ? 'active' : 'disabled'}</span>
                <span className="row">
                  <button className="btn ghost" onClick={() => updateUser(u, { role: u.role === 'admin' ? 'member' : 'admin' })}>{u.role === 'admin' ? 'Make member' : 'Make admin'}</button>
                  <button className="btn ghost" onClick={() => updateUser(u, { isActive: !u.isActive })}>{u.isActive ? 'Disable' : 'Enable'}</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === 'alerts' && (
        <div className="card admin-table-card">
          <div className="between" style={{ marginBottom: 14 }}><h3>Emergency Alert Management</h3><button className="btn" onClick={() => exportCsv('alerts')}>CSV</button></div>
          <div className="admin-table alerts">
            <div className="admin-table-head"><span>User</span><span>Circle</span><span>Status</span><span>Message</span><span>Actions</span></div>
            {data.alerts.map((a) => (
              <div className="admin-table-row" key={a._id}>
                <span><b>{a.triggeredBy?.name || 'Unknown'}</b><small>{new Date(a.startedAt).toLocaleString()}</small></span>
                <span>{a.circle?.name || '-'}</span>
                <span className={'pill ' + (a.status === 'active' ? 'danger' : a.status === 'resolved' ? 'safe' : 'pending')}>{a.status}</span>
                <span className="dim">{a.emergencyMessage || a.note || 'SOS alert'}</span>
                <span className="row">
                  <button className="btn ghost" onClick={() => updateAlert(a, 'resolved')}>Resolve</button>
                  <button className="btn ghost" onClick={() => updateAlert(a, 'cancelled')}>Cancel</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === 'circles' && (
        <div className="card admin-table-card">
          <h3 style={{ marginBottom: 14 }}>Family and Couples Management</h3>
          <div className="admin-card-grid">
            {data.circles.map((c) => (
              <div className="admin-mini-card" key={c._id}>
                <span className="pill safe">{c.type}</span>
                <h3>{c.name}</h3>
                <p className="dim">Owner: {c.owner?.name || 'Unknown'}</p>
                <p className="mono dim">Invite: {c.inviteCode}</p>
                <b>{c.members?.length || 0} members</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === 'gps' && (
        <div className="card admin-table-card">
          <div className="between" style={{ marginBottom: 14 }}><h3>GPS Tracking Monitoring</h3><button className="btn" onClick={() => exportCsv('locations')}>CSV</button></div>
          <div className="admin-table gps">
            <div className="admin-table-head"><span>User</span><span>Circle</span><span>Coordinates</span><span>Movement</span><span>Updated</span></div>
            {recentLocations.map((l) => (
              <div className="admin-table-row" key={l._id}>
                <span><b>{l.user?.name || 'Unknown'}</b><small>{l.user?.phone}</small></span>
                <span>{l.circle?.name || '-'}</span>
                <span className="mono">{l.geo?.coordinates?.[1]?.toFixed?.(5)}, {l.geo?.coordinates?.[0]?.toFixed?.(5)}</span>
                <span>{l.speed || 0} km/h · ±{l.accuracy || 0}m</span>
                <span className="mono dim">{new Date(l.recordedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === 'contacts' && (
        <div className="card admin-table-card">
          <h3 style={{ marginBottom: 14 }}>Emergency Contact Management</h3>
          <div className="admin-table contacts">
            <div className="admin-table-head"><span>User</span><span>Contact</span><span>Relation</span><span>Phone</span></div>
            {data.contacts.map((c, i) => (
              <div className="admin-table-row" key={`${c.user?._id}-${c.phone}-${i}`}>
                <span>{c.user?.name}</span><span><b>{c.name}</b></span><span>{c.relation || '-'}</span><span>{c.phone}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === 'reports' && (
        <div className="col" style={{ gap: 18 }}>
          <div className="admin-stats-grid">
            {reportSummary.map((r) => <AdminStat key={r.label} label={r.label} value={r.count} hint="Available for review/export" tone="pending" />)}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Incident Reports</h3>
            {incidentRows.slice(0, 12).map((a) => (
              <div className="admin-row" key={a._id}>
                <span className={'pill ' + (a.status === 'active' ? 'danger' : 'safe')}>{a.status}</span>
                <b>{a.triggeredBy?.name || 'Unknown'}</b>
                <span className="dim">{a.circle?.name || 'No circle'}</span>
                <span className="mono dim">{new Date(a.startedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === 'logs' && (
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Activity, Audit and Security Logs</h3>
          {data.logs.map((log, i) => (
            <div className="history-item" key={`${log.type}-${log.at}-${i}`}>
              <span className="pill pending">{log.type}</span>
              <div><b>{log.message}</b><div className="mono dim">{new Date(log.at).toLocaleString()}</div></div>
            </div>
          ))}
        </div>
      )}

      {active === 'settings' && (
        <div className="admin-grid-2">
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>System Settings</h3>
            {Object.entries(data.settings || {}).map(([key, value]) => (
              <div className="between" key={key} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <b>{key}</b><span className="pill safe">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Role and Permission Management</h3>
            <p className="dim" style={{ fontSize: 13, lineHeight: 1.7 }}>Admins can view all operational data, update user roles, disable accounts, resolve incidents, export reports, and monitor GPS activity. Members can only access their own safety circles.</p>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Notification Management</h3>
            <p className="dim" style={{ fontSize: 13, lineHeight: 1.7 }}>Realtime Socket.IO alerts, browser notifications, and SMS backup tracking are enabled for emergency incidents.</p>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Data Export</h3>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => exportCsv('users')}>Users CSV</button>
              <button className="btn" onClick={() => exportCsv('alerts')}>Alerts CSV</button>
              <button className="btn" onClick={() => exportCsv('locations')}>Locations CSV</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
