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

      {/* Compact Directory Overview Banner */}
      <div className="bg-gradient-to-r from-primary via-primary to-primary-container text-on-primary px-sm sm:px-md py-xs sm:py-sm rounded-xl shadow-sm border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-xs sm:gap-sm relative overflow-hidden">
        <div className="flex items-center gap-xs sm:gap-sm">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">analytics</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-body-md sm:text-body-lg text-white font-bold leading-tight">
              {t('directory.overview') || 'Directory Overview'}
            </h3>
            <p className="text-[11px] text-white/80 leading-tight mt-[1px]">
              {t('directory.overview.desc') || 'Total counts of registered portal profiles'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-sm sm:gap-md bg-black/15 px-sm py-[6px] rounded-lg border border-white/10 text-white self-stretch sm:self-auto justify-around">
          <div className="text-center px-xs">
            <p className="text-[9px] uppercase font-bold tracking-wider text-white/70">Staff Members</p>
            <p className="text-body-md font-bold text-white leading-none mt-0.5">{loading ? '—' : stats.totalStaff || 0}</p>
          </div>
          <div className="h-5 w-px bg-white/20" />
          <div className="text-center px-xs">
            <p className="text-[9px] uppercase font-bold tracking-wider text-white/70">Parents &amp; Alumni</p>
            <p className="text-body-md font-bold text-white leading-none mt-0.5">{loading ? '—' : stats.totalParents || 0}</p>
          </div>
          <div className="h-5 w-px bg-white/20" />
          <div className="text-center px-xs">
            <p className="text-[9px] uppercase font-bold tracking-wider text-white/70">Students</p>
            <p className="text-body-md font-bold text-white leading-none mt-0.5">{loading ? '—' : stats.totalStudents || 5}</p>
          </div>
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
                className={`flex-1 flex items-center justify-center font-label-md text-[12px] sm:text-[13px] rounded-lg transition-all font-bold ${
                  roleFilter === 'staff' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {t('staff') || 'Staff'}
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('parent')}
                className={`flex-1 flex items-center justify-center font-label-md text-[12px] sm:text-[13px] rounded-lg transition-all font-bold ${
                  roleFilter === 'parent' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {t('parents') || 'Parents'}
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('student')}
                className={`flex-1 flex items-center justify-center font-label-md text-[12px] sm:text-[13px] rounded-lg transition-all font-bold ${
                  roleFilter === 'student' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {t('students') || 'Students'}
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
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-primary/15 flex-shrink-0">{initials}</div>
                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center gap-xs">
                          <p className="font-label-lg text-label-lg text-on-surface group-hover:text-primary transition-colors font-bold truncate">{user.name}</p>
                          {user.student_code && (
                            <span className="px-xs py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold border border-primary/20">
                              {user.student_code}
                            </span>
                          )}
                        </div>
                        <p className="font-body-sm text-[12px] text-on-surface-variant truncate">
                          {user.role === 'student' ? `Parent: ${user.email}` : user.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="hidden md:block">
                      <p className="font-label-md text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                        {user.role === 'student' ? 'Class / Grade' : 'Access Role'}
                      </p>
                      <p className="font-body-md text-sm font-semibold text-primary mt-[2px]">
                        {user.role === 'student' ? (user.class_grade || 'N/A') : (user.role_title || t(user.role))}
                      </p>
                    </div>
                    
                    <div className="hidden md:block">
                      <p className="font-label-md text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                        {user.role === 'student' ? 'Homeroom Teacher' : 'Last Activity'}
                      </p>
                      <p className={`font-body-md text-sm font-semibold text-on-surface mt-[2px] ${user.status === 'pending' ? 'text-red-500' : ''}`}>
                        {user.role === 'student' ? (user.homeroom_teacher || 'N/A') : (user.last_login ? formatRelative(user.last_login) : 'Never active')}
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
