import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function UserManagement() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('staff'); // Default back to 'staff'
  const [statusFilter, setStatusFilter] = useState('');
  const [lastActiveFilter, setLastActiveFilter] = useState('any');
  const [stats, setStats] = useState({ totalStaff: 0, totalParents: 0, activeNow: 0 });

  useEffect(() => { 
    fetchUsers(); 
  }, [search, roleFilter, statusFilter, lastActiveFilter]);

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
      setStats(s || { totalStaff: 0, totalParents: 0, activeNow: 0 });
    } catch (_) {}
    setLoading(false);
  };

  const resetAllFilters = () => {
    setSearch('');
    setStatusFilter('');
    setLastActiveFilter('any');
    setRoleFilter('staff');
  };

  const STATUS_BADGE = {
    active: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200/20',
    pending: 'bg-yellow-100 text-yellow-750 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-200/20',
    deactivated: 'bg-red-100 text-red-750 dark:bg-red-950/40 dark:text-red-400 border border-red-200/20',
  };

  // Client side filtering for last active
  const filteredUsers = users.filter(user => {
    if (lastActiveFilter === 'any') return true;
    if (!user.last_login) return false;
    
    const lastActiveDate = new Date(user.last_login);
    const diffTime = Math.abs(new Date() - lastActiveDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (lastActiveFilter === '7d') return diffDays <= 7;
    if (lastActiveFilter === '30d') return diffDays <= 30;
    if (lastActiveFilter === '6m') return diffDays > 180;
    return true;
  });

  return (
    <div className="animate-in fade-in duration-300 space-y-md">
      
      {/* Header Section */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
        <div>
          <p className="text-primary font-bold tracking-wider uppercase text-[10px] sm:text-xs">Access Directory</p>
          <h2 className="font-headline-sm text-headline-sm sm:font-headline-lg sm:text-headline-lg text-primary">{t('user.mgmt.dir') || 'User Management Directory'}</h2>
          <p className="font-body-sm text-body-sm sm:font-body-md sm:text-body-md text-on-surface-variant max-w-2xl mt-px">
            {t('user.mgmt.subtitle') || 'Search and manage institutional access for staff, parents, and past students.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/superadmin/users/invite')}
          className="inline-flex items-center justify-center gap-xs bg-primary text-on-primary px-md py-[10px] rounded-xl font-label-lg hover:bg-primary-container active:scale-95 transition-all shadow-md font-semibold self-start"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
          <span>{t('invite.new.user') || 'Invite New User'}</span>
        </button>
      </section>

      {/* Bento Grid Insights & Featured Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
        
        {/* Insights Bento Card */}
        <div className="lg:col-span-4 bg-gradient-to-br from-primary to-primary-container text-on-primary p-md flex flex-col justify-between rounded-2xl shadow-sm border border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bento-texture opacity-10 pointer-events-none" />
          
          <div className="relative z-10 space-y-xs">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[24px]">analytics</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-white font-bold">{t('directory.overview') || 'Directory Overview'}</h3>
              <p className="font-body-sm text-[12px] opacity-80 mt-[2px]">{t('directory.overview.desc') || 'Total counts of registered portal profiles'}</p>
            </div>
          </div>
          
          <div className="mt-lg grid grid-cols-2 gap-sm relative z-10">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Staff Members</p>
              <p className="font-headline-sm text-headline-sm text-white font-bold leading-tight mt-[2px]">{loading ? '—' : stats.totalStaff || 0}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Parents &amp; Alumni</p>
              <p className="font-headline-sm text-headline-sm text-white font-bold leading-tight mt-[2px]">{loading ? '—' : stats.totalParents || 0}</p>
            </div>
          </div>
        </div>

        {/* Featured Users Cards (Up to 2 users) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-md">
          {loading ? (
            <div className="sm:col-span-2 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl flex items-center justify-center p-xl shadow-sm">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="sm:col-span-2 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl flex items-center justify-center p-md shadow-sm text-on-surface-variant font-medium">
              No featured users available.
            </div>
          ) : (
            filteredUsers.slice(0, 2).map((user, idx) => {
              const initials = (user.name || '??')
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              
              const formatRelative = (dateString) => {
                if (!dateString) return 'never';
                const d = new Date(dateString);
                return d.toLocaleDateString();
              };

              return (
                <div
                  key={user.id || idx}
                  onClick={() => navigate(`/superadmin/users/${user.id}`)}
                  className="bg-surface-container-lowest border border-outline-variant/15 p-sm flex flex-col justify-between rounded-2xl hover:border-primary transition-all duration-200 hover:shadow-md cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-headline-sm">
                      {initials}
                    </div>
                    <span className={`font-label-md text-label-md px-sm py-[2px] rounded-lg uppercase font-bold text-[10px] ${STATUS_BADGE[user.status] || STATUS_BADGE.pending}`}>
                      {t(user.status || 'pending')}
                    </span>
                  </div>

                  <div className="mt-md">
                    <h4 className="font-body-lg text-body-lg text-on-surface font-bold truncate group-hover:text-primary transition-colors">{user.name || '—'}</h4>
                    <p className="font-label-md text-label-md text-on-surface-variant mt-[2px]">{user.role_title || t(user.role)}</p>
                    <p className="text-[11px] font-mono text-on-surface-variant/75 mt-[4px]">{user.email}</p>
                  </div>

                  <div className="mt-md pt-sm border-t border-outline-variant/10 flex items-center justify-between text-on-surface-variant text-[11px]">
                    <span className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[15px]">history</span>
                      <span>{user.last_login ? `${t('active') || 'Active'} ${formatRelative(user.last_login)}` : t('never')}</span>
                    </span>
                    <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Filters Dashboard Panel */}
      <div className="bg-surface-container-lowest border border-outline-variant/15 p-sm sm:p-md rounded-2xl shadow-sm space-y-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-sm items-end">
          {/* Search */}
          <div className="lg:col-span-4 flex flex-col gap-xs">
            <label className="font-label-lg text-label-lg text-on-surface font-semibold">{t('search.directory')}</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-sm text-on-surface-variant">search</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('search.placeholder.user')}
                className="w-full pl-xl pr-sm py-xs bg-surface border border-outline-variant/35 rounded-xl font-body-md"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-sm p-1 hover:bg-surface-container-low rounded-lg text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Role Toggle Switch Buttons */}
          <div className="lg:col-span-3 flex flex-col gap-xs">
            <label className="font-label-lg text-label-lg text-on-surface font-semibold">{t('user.role') || 'Registry Directory'}</label>
            <div className="flex p-1 bg-surface border border-outline-variant/35 rounded-xl h-[42px] gap-[2px]">
              <button
                type="button"
                onClick={() => setRoleFilter('staff')}
                className={`flex-1 flex items-center justify-center font-label-md text-[13px] rounded-lg transition-all font-bold ${
                  roleFilter === 'staff' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {t('staff') || 'Staff'}
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('parent')}
                className={`flex-1 flex items-center justify-center font-label-md text-[13px] rounded-lg transition-all font-bold ${
                  roleFilter === 'parent' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {t('parents') || 'Parents'}
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="lg:col-span-2 flex flex-col gap-xs">
            <label className="font-label-lg text-label-lg text-on-surface font-semibold">{t('account.status')}</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full py-xs bg-surface border border-outline-variant/35 rounded-xl font-body-md px-sm appearance-none cursor-pointer"
            >
              <option value="">{t('all.statuses')}</option>
              <option value="active">{t('active')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="deactivated">{t('deactivated')}</option>
            </select>
          </div>

          {/* Last Active */}
          <div className="lg:col-span-2 flex flex-col gap-xs">
            <label class="font-label-lg text-label-lg text-on-surface font-semibold">{t('last.active')}</label>
            <select
              value={lastActiveFilter}
              onChange={e => setLastActiveFilter(e.target.value)}
              className="w-full py-xs bg-surface border border-outline-variant/35 rounded-xl font-body-md px-sm appearance-none cursor-pointer"
            >
              <option value="any">{t('any.time')}</option>
              <option value="7d">{t('last.7.days')}</option>
              <option value="30d">{t('last.30.days')}</option>
              <option value="6m">{t('over.6.months')}</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="lg:col-span-1 flex justify-end">
            <button
              onClick={resetAllFilters}
              className="w-full h-[40px] border border-outline-variant/35 text-primary hover:bg-surface-container-low rounded-xl flex items-center justify-center gap-xs font-semibold active:scale-95 transition-all shadow-sm"
              title="Reset Filters"
            >
              <span className="material-symbols-outlined text-[20px]">filter_alt_off</span>
              <span className="lg:hidden text-label-md font-semibold">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Directory Table / Grid Layout */}
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl overflow-hidden shadow-md">
        {/* Table Header Ornament */}
        <div className="bg-surface-container-low px-sm py-sm flex items-center justify-between border-b border-outline-variant/20">
          <span className="font-label-lg text-label-lg text-on-surface font-bold flex items-center gap-xs">
            <span className="material-symbols-outlined text-[18px] text-primary">menu_book</span>
            <span>{t('full.directory') || 'Full Directory'}</span>
          </span>
          <span className="text-[11px] font-semibold text-on-surface-variant bg-surface px-sm py-[3px] rounded-lg border border-outline-variant/20 font-mono">
            {filteredUsers.length} Users Found
          </span>
        </div>

        {/* Directory Body */}
        {loading ? (
          <div className="p-xl text-center">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant font-medium">
            {t('no.users')}
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {filteredUsers.map((user, idx) => {
              const initials = (user.name || '??')
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              
              const formatRelative = (dateString) => {
                if (!dateString) return 'never';
                const d = new Date(dateString);
                return d.toLocaleDateString();
              };

              return (
                <div 
                  key={user.id || idx}
                  className="p-sm sm:p-md flex items-center hover:bg-surface-container-low/25 transition-colors cursor-pointer group" 
                  onClick={() => navigate(`/superadmin/users/${user.id}`)}
                >
                  <div className="flex-grow flex md:grid md:grid-cols-4 items-center justify-between gap-sm md:gap-md min-w-0">
                    
                    <div className="flex items-center gap-sm flex-grow min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-primary/10 flex-shrink-0">{initials}</div>
                      <div className="min-w-0 flex-grow">
                        <p className="font-label-lg text-label-lg text-on-surface group-hover:text-primary transition-colors font-bold truncate">{user.name}</p>
                        <p className="font-body-sm text-[12px] text-on-surface-variant truncate">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="hidden md:block">
                      <p className="font-label-md text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Access Role</p>
                      <p className="font-body-md text-sm font-semibold text-on-surface mt-[2px]">{user.role_title || t(user.role)}</p>
                    </div>
                    
                    <div className="hidden md:block">
                      <p className="font-label-md text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Last Activity</p>
                      <p className={`font-body-md text-sm font-semibold text-on-surface mt-[2px] ${user.status === 'pending' ? 'text-red-500' : ''}`}>
                        {user.last_login ? formatRelative(user.last_login) : 'Never active'}
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0 flex justify-end">
                      <button className="p-xs hover:bg-surface border border-transparent hover:border-outline-variant/30 rounded-xl transition-all text-on-surface-variant">
                        <span className="material-symbols-outlined text-[20px]">{user.status === 'pending' ? 'how_to_reg' : 'chevron_right'}</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
