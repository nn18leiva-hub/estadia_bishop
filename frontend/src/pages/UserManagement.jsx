import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function UserManagement() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('staff');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({ totalStaff: 0, totalParents: 0, activeNow: 0 });

  useEffect(() => { fetchUsers(); }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: roleFilter });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const [data, s] = await Promise.all([
        apiFetch(`/admin/users?${params}`),
        apiFetch('/admin/users/stats'),
      ]);
      setUsers(Array.isArray(data) ? data : data.users || []);
      setStats(s);
    } catch (_) {}
    setLoading(false);
  };

  const STATUS_BADGE = {
    active: 'bg-secondary-container text-on-secondary-container',
    pending: 'bg-surface-container-high text-on-surface-variant',
    deactivated: 'bg-error-container text-on-error-container',
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <section className="mb-lg">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-xs">{t('user.mgmt.dir')}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          {t('user.mgmt.subtitle')}
        </p>
        <div className="mt-md">
          <button
            onClick={() => navigate('/superadmin/users/invite')}
            className="inline-flex items-center gap-xs bg-primary text-on-primary px-md py-sm rounded font-label-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
            {t('invite.new.user')}
          </button>
        </div>
      </section>

      {/* Search & Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 p-md rounded shadow-sm mb-lg">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-md items-end">
          {/* Search */}
          <div className="md:col-span-5">
            <label className="block font-label-lg text-label-lg text-on-surface mb-xs">{t('search.directory')}</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-sm text-on-surface-variant">search</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('search.placeholder.user')}
                className="w-full pl-xl pr-sm py-sm bg-surface-bright border border-outline-variant/40 rounded-lg font-body-md transition-colors"
              />
            </div>
          </div>

          {/* Role Toggle */}
          <div className="md:col-span-3">
            <label className="block font-label-lg text-label-lg text-on-surface mb-xs">{t('user.role')}</label>
            <div className="flex p-base bg-surface-container-low rounded-lg border border-outline-variant/20 h-[42px]">
              {['staff', 'parent'].map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`flex-1 flex items-center justify-center font-label-md text-label-md rounded-lg transition-all capitalize
                    ${roleFilter === role ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {role === 'staff' ? t('staff') : t('parents')}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <label className="block font-label-lg text-label-lg text-on-surface mb-xs">{t('account.status')}</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-sm bg-surface-bright border border-outline-variant/40 rounded-lg font-body-md appearance-none px-sm"
            >
              <option value="">{t('all.statuses')}</option>
              <option value="active">{t('active')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="deactivated">{t('deactivated')}</option>
            </select>
          </div>

          {/* Last Active */}
          <div className="md:col-span-2">
            <label className="block font-label-lg text-label-lg text-on-surface mb-xs">{t('last.active')}</label>
            <select className="w-full py-sm bg-surface-bright border border-outline-variant/40 rounded-lg font-body-md appearance-none px-sm">
              <option>{t('any.time')}</option>
              <option>{t('last.7.days')}</option>
              <option>{t('last.30.days')}</option>
              <option>{t('over.6.months')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
        {/* Directory Insights */}
        <div className="md:col-span-4 bg-primary text-on-primary p-md flex flex-col justify-between rounded border border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bento-texture" style={{ opacity: 0.1 }} />
          <div className="relative z-10">
            <span className="material-symbols-outlined text-4xl mb-sm" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            <h3 className="font-headline-md text-headline-md">{t('directory.insights')}</h3>
            <p className="font-body-sm opacity-80 mt-xs">{t('directory.insights.desc')}</p>
          </div>
          <div className="mt-lg grid grid-cols-2 gap-sm relative z-10">
            <div>
              <p className="font-label-md text-label-md opacity-70">{t('total.staff')}</p>
              <p className="font-display-lg text-display-lg leading-tight">{loading ? '—' : stats.totalStaff || 0}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md opacity-70">{t('active.now')}</p>
              <p className="font-display-lg text-display-lg leading-tight">{loading ? '—' : stats.activeNow || 0}</p>
            </div>
          </div>
        </div>

        {/* User Cards */}
        {loading ? (
          <div className="md:col-span-8 flex items-center justify-center py-xl">
            <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '40px' }}>sync</span>
          </div>
        ) : users.slice(0, 2).map((user, i) => (
          <div
            key={user.id || i}
            className="md:col-span-4 bg-surface-container-lowest border border-outline-variant/20 p-md flex flex-col rounded hover:border-primary transition-all group cursor-pointer"
            onClick={() => navigate(`/superadmin/users/${user.id}`)}
          >
            <div className="flex justify-between items-start mb-md">
              <div className="w-12 h-12 rounded bg-primary-container flex items-center justify-center text-on-primary font-bold text-headline-sm">
                {(user.name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className={`font-label-md text-label-md px-base py-px rounded ${STATUS_BADGE[user.status] || STATUS_BADGE.pending}`}>
                {t(user.status || 'pending')}
              </span>
            </div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface">{user.name || '—'}</h4>
            <p className="font-label-md text-label-md text-on-surface-variant mb-md">{user.role_title || t(user.role)} · ID: {user.id}</p>
            <div className="mt-auto flex items-center gap-xs text-on-surface-variant">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
              <span className="font-body-sm text-body-sm">
                {user.last_login ? `${t('active')} ${formatRelative(user.last_login)}` : t('never')}
              </span>
            </div>
          </div>
        ))}

        {/* Full Directory Table */}
        <div className="md:col-span-12 bg-surface-container-lowest border border-outline-variant/10 rounded overflow-hidden">
          <div className="bg-surface-container-low px-md py-xs flex items-center justify-between border-b border-outline-variant/20">
            <span className="font-label-lg text-label-lg text-on-surface">{t('full.directory')}</span>
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setRoleFilter('staff'); }}
              className="text-primary font-label-md text-label-md flex items-center gap-xs hover:underline"
            >
              {t('reset.filters')} <span className="material-symbols-outlined text-sm">filter_alt_off</span>
            </button>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {loading ? (
              <div className="p-md text-center text-on-surface-variant">{t('loading')}</div>
            ) : users.length === 0 ? (
              <div className="p-md text-center text-on-surface-variant">{t('no.users')}</div>
            ) : (
              users.map((user, i) => (
                <div
                  key={user.id || i}
                  className="p-md flex items-center hover:bg-surface-container-low/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/superadmin/users/${user.id}`)}
                >
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-md items-center">
                    <div className="flex items-center gap-md">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold">
                        {(user.name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-label-lg text-label-lg text-on-surface">{user.name || '—'}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{user.email || '—'}</p>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <p className="font-label-md text-label-md text-on-surface-variant">{t('role')}</p>
                      <p className="font-body-md text-body-md capitalize">{t(user.role) || '—'}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="font-label-md text-label-md text-on-surface-variant">{t('last.login')}</p>
                      <p className={`font-body-md text-body-md ${!user.last_login ? 'text-error' : ''}`}>
                        {user.last_login ? new Date(user.last_login).toLocaleDateString('en-BZ') : t('pending.verification')}
                      </p>
                    </div>
                    <div className="flex justify-end gap-sm">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/superadmin/users/${user.id}`); }}
                        className="p-base hover:bg-surface-container-high rounded transition-colors text-on-surface-variant"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/superadmin/users/${user.id}`); }}
                        className="p-base hover:bg-surface-container-high rounded transition-colors text-on-surface-variant"
                        title={t('more.options')}
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRelative(dateStr) {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString('en-BZ');
}
