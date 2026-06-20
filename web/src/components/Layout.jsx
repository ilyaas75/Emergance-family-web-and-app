import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { connectSocket } from '../lib/socket';
import { useI18n } from '../i18n/index.jsx';
import { useAuth } from '../store/auth.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>,
  circles: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="9" r="4"/><circle cx="17" cy="15" r="4"/></svg>,
  alerts: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>,
  admin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-5"/></svg>,
};

export default function Layout() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const items = [ ['/', 'dashboard'], ['/circles', 'circles'], ['/alerts', 'alerts'], ['/profile', 'profile'] ];
  if (user?.role === 'admin') items.push(['/admin', 'admin']);
  const initials = (user?.name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();
    let circleIds = [];
    const notify = (payload) => {
      if (payload.byId === user._id || !('Notification' in window)) return;
      const show = () => new Notification(`${payload.by || t('appName')} SOS`, {
        body: payload.message || t('sos.defaultMessage'),
        tag: `alert-${payload.alertId}`,
      });
      if (Notification.permission === 'granted') show();
      else if (Notification.permission === 'default') Notification.requestPermission().then((permission) => { if (permission === 'granted') show(); });
    };
    api.get('/circles/mine').then(({ data }) => {
      circleIds = data.data.map((circle) => circle._id);
      circleIds.forEach((id) => socket.emit('circle:join', id));
    });
    socket.on('alert:new', notify);
    return () => {
      circleIds.forEach((id) => socket.emit('circle:leave', id));
      socket.off('alert:new', notify);
    };
  }, [user, t]);

  return (
    <div className="shell">
      <aside className="side">
        <div className="row" style={{ marginBottom: 18, padding: '0 6px' }}>
          <div className="logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2l8 3v6c0 5-3.4 8.5-8 11-4.6-2.5-8-6-8-11V5l8-3z" stroke="#06121c" strokeWidth="1.6"/><path d="M8.5 12l2.3 2.3L15.5 9.6" stroke="#06121c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div><div style={{ fontFamily: 'Sora', fontWeight: 800 }}>{t('appName')}</div></div>
        </div>
        {items.map(([to, key]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
            {icons[key]} {key === 'admin' ? 'Admin' : t('nav.' + key)}
          </NavLink>
        ))}
        <div className="grow" />
        <div className="nav-item" onClick={async () => { await logout(); nav('/login'); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>
          {t('nav.logout')}
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <div className="eyebrow">{t('tagline')}</div>
          <div className="row">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="av" style={{ width: 38, height: 38, background: 'var(--azure)' }}>{initials}</div>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
