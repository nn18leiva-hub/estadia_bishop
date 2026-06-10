import React, { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const SuperAdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState('registry'); // 'registry', 'provision', or 'users'
  const [staffList, setStaffList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [stats, setStats] = useState({ registered: { staff: [], parents: [] }, online: { staff: [], parents: [] } });
  const [dataLoading, setDataLoading] = useState(true);
  
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'admin' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSubTab, setUserSubTab] = useState('parents'); // 'parents' or 'staff'

  // Password Override State
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  const loadData = async () => {
    try {
      const [staffData, userData, statsData] = await Promise.all([
        apiFetch('/superadmin/staff'),
        apiFetch('/superadmin/users'),
        apiFetch('/superadmin/stats')
      ]);
      setStaffList(Array.isArray(staffData) ? staffData : []);
      setUserList(Array.isArray(userData) ? userData : []);
      setStats(statsData || { registered: { staff: [], parents: [] }, online: { staff: [], parents: [] } });
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { 
     if (user && user.role === 'super_admin') loadData(); 
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, userSubTab]);

  if (!user || user.role !== 'super_admin') return null;

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await apiFetch('/superadmin/staff', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setFormData({ full_name: '', email: '', password: '', role: 'admin' });
      setActiveTab('registry');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create staff');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this staff member?')) return;
    try {
      await apiFetch(`/superadmin/staff/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert('Failed to delete staff: ' + err.message);
    }
  };

  const executePasswordOverride = async () => {
     if (newPassword.length < 6) return alert('Temporary password must be 6 characters strictly.');
     setOverrideLoading(true);
     try {
       await apiFetch('/superadmin/override-password', {
         method: 'POST',
         body: JSON.stringify({ targetEmail: overrideTarget.email, newPassword })
       });
       alert(`Successfully overrode password for ${overrideTarget.email}`);
       setOverrideTarget(null);
       setNewPassword('');
     } catch (err) {
       alert('Override Failed: ' + err.message);
     } finally {
       setOverrideLoading(false);
     }
  };

  const filteredStaff = useMemo(() => {
    if (!searchQuery) return staffList;
    const lower = searchQuery.toLowerCase();
    return staffList.filter(s => s.full_name.toLowerCase().includes(lower) || s.email.toLowerCase().includes(lower) || s.role.toLowerCase().includes(lower));
  }, [staffList, searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return userList;
    const lower = searchQuery.toLowerCase();
    return userList.filter(u => u.full_name.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower) || u.user_type.toLowerCase().includes(lower));
  }, [userList, searchQuery]);

  return (
    <div className="flex-grow flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden">
      
      {/* Page Header */}
      <section className="mb-sm sm:mb-lg">
        <h2 className="font-headline-sm text-headline-sm sm:font-headline-lg sm:text-headline-lg text-primary mb-xs">{t('superadmin.console')}</h2>
        <p className="font-body-sm text-body-sm sm:font-body-md sm:text-body-md text-on-surface-variant max-w-2xl">
          {t('sys.governance')}
        </p>
      </section>

      {/* User Count Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[6px] sm:gap-md mb-sm sm:mb-lg">
        {/* Total Users */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 p-[8px] sm:p-md rounded shadow-sm border-l-4 border-l-primary flex flex-col justify-between">
          <div className="flex justify-between items-center mb-[4px] sm:mb-sm">
            <h3 className="font-label-xs text-label-xs sm:font-label-lg sm:text-label-lg text-primary uppercase font-bold tracking-wider">{t('total.users')}</h3>
            <span className="material-symbols-outlined text-primary text-[16px] sm:text-[20px]">group</span>
          </div>
          <p className="font-headline-sm text-headline-sm sm:font-display-md sm:text-display-md text-on-surface leading-none font-bold">{staffList.length + userList.length}</p>
          <p className="font-body-xs text-body-xs text-on-surface-variant mt-[2px] sm:mt-xs hidden sm:block">{t('all.accounts')}</p>
        </div>

        {/* Parents */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 p-[8px] sm:p-md rounded shadow-sm border-l-4 border-l-secondary flex flex-col justify-between">
          <div className="flex justify-between items-center mb-[4px] sm:mb-sm">
            <h3 className="font-label-md text-label-md sm:font-label-lg sm:text-label-lg text-secondary uppercase font-bold tracking-wider">{t('parents')}</h3>
            <span className="material-symbols-outlined text-secondary text-[16px] sm:text-[20px]">family_restroom</span>
          </div>
          <p className="font-headline-sm text-headline-sm sm:font-display-md sm:text-display-md text-on-surface leading-none font-bold">
            {stats.registered.parents.reduce((acc, curr) => acc + parseInt(curr.count), 0)}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-[2px] sm:mt-xs hidden sm:block">{t('registered.parents')}</p>
        </div>

        {/* Staff */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 p-[8px] sm:p-md rounded shadow-sm border-l-4 border-l-green-600 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-[4px] sm:mb-sm">
            <h3 className="font-label-md text-label-md sm:font-label-lg sm:text-label-lg text-green-700 uppercase font-bold tracking-wider">{t('staff')}</h3>
            <span className="material-symbols-outlined text-green-600 text-[16px] sm:text-[20px]">badge</span>
          </div>
          <p className="font-headline-sm text-headline-sm sm:font-display-md sm:text-display-md text-on-surface leading-none font-bold">
            {staffList.filter(s => s.role !== 'super_admin').length}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-[2px] sm:mt-xs hidden sm:block">{t('admins.viewers')}</p>
        </div>

        {/* Super Admins */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 p-[8px] sm:p-md rounded shadow-sm border-l-4 border-l-red-500 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-[4px] sm:mb-sm">
            <h3 className="font-label-md text-label-md sm:font-label-lg sm:text-label-lg text-red-600 uppercase font-bold tracking-wider">{t('super.admins')}</h3>
            <span className="material-symbols-outlined text-red-500 text-[16px] sm:text-[20px]">admin_panel_settings</span>
          </div>
          <p className="font-headline-sm text-headline-sm sm:font-display-md sm:text-display-md text-on-surface leading-none font-bold">
            {staffList.filter(s => s.role === 'super_admin').length}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-[2px] sm:mt-xs hidden sm:block">{t('root.access')}</p>
        </div>
      </div>

      {/* Dynamic Tabs */}
      <div className="flex border-b border-outline-variant/20 gap-xs sm:gap-md mb-sm sm:mb-lg overflow-x-auto">
        <button 
          onClick={() => { setActiveTab('registry'); setSearchQuery(''); }}
          className={`pb-sm font-label-md text-label-md sm:font-label-lg sm:text-label-lg transition-all border-b-2 uppercase tracking-wider whitespace-nowrap ${activeTab === 'registry' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
        >
          {t('staff.registry')}
        </button>
        <button 
          onClick={() => { setActiveTab('provision'); setSearchQuery(''); }}
          className={`pb-sm font-label-md text-label-md sm:font-label-lg sm:text-label-lg transition-all border-b-2 uppercase tracking-wider whitespace-nowrap ${activeTab === 'provision' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
        >
          {t('provision.staff')}
        </button>
        <button 
          onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
          className={`pb-sm font-label-md text-label-md sm:font-label-lg sm:text-label-lg transition-all border-b-2 uppercase tracking-wider whitespace-nowrap ${activeTab === 'users' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-primary'}`}
        >
          {t('public.users')}
        </button>
      </div>

      {/* Search Input Bar */}
      {activeTab !== 'provision' && (
        <div className="bg-surface-container-lowest border border-outline-variant/20 p-xs sm:p-md rounded shadow-sm mb-sm sm:mb-lg">
          <div className="relative flex items-center max-w-md">
            <span className="material-symbols-outlined absolute left-sm text-on-surface-variant">search</span>
            <input 
              className="w-full pl-xl pr-sm py-sm bg-surface-bright border border-outline-variant/40 focus:border-primary focus:ring-0 rounded-lg font-body-md transition-colors" 
              placeholder={activeTab === 'registry' ? t('filter.staff') : t('filter.public')}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* TAB CONTENT: PROVISION */}
      {activeTab === 'provision' && (
        <div className="animate-in fade-in duration-300 max-w-2xl mx-auto w-full">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="relative h-24 bg-primary overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-6 h-full w-full">
                  {[...Array(6)].map((_, i) => <div key={i} className="border-r border-white"></div>)}
                </div>
              </div>
              <div className="relative h-full flex flex-col justify-center px-sm sm:px-lg">
                <h3 className="font-headline-sm text-headline-sm sm:font-headline-lg sm:text-headline-lg text-white">{t('provision.staff.node')}</h3>
                <p className="text-on-primary-container font-label-lg">{t('onboard.staff.member')}</p>
              </div>
            </div>
            
            <form className="p-sm sm:p-lg space-y-sm sm:space-y-md" onSubmit={handleCreateStaff} autoComplete="off">
              {error && <div className="p-sm text-center text-error bg-error-container rounded border border-outline-variant/10 text-xs font-bold">{error}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="space-y-base">
                  <label className="font-label-lg text-on-surface-variant block">{t('full.name')}</label>
                  <input type="text" name="full_name" className="w-full px-md py-sm bg-surface border border-outline-variant rounded hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none font-body-md" value={formData.full_name} onChange={handleChange} required />
                </div>
                <div className="space-y-base">
                  <label className="font-label-lg text-on-surface-variant block">{t('inst.email')}</label>
                  <input type="email" name="email" className="w-full px-md py-sm bg-surface border border-outline-variant rounded hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none font-body-md" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="space-y-base">
                  <label className="font-label-lg text-on-surface-variant block">{t('access.level')}</label>
                  <select name="role" className="w-full py-sm bg-surface border border-outline-variant focus:border-primary focus:ring-0 rounded font-body-md px-sm appearance-none" value={formData.role} onChange={handleChange}>
                    <option value="admin">{t('level.admin')}</option>
                    <option value="viewer">{t('level.viewer')}</option>
                    <option value="super_admin">{t('level.superadmin')}</option>
                  </select>
                </div>
                <div className="space-y-base">
                  <label className="font-label-lg text-on-surface-variant block">{t('temp.password')}</label>
                  <input type="password" name="password" className="w-full px-md py-sm bg-surface border border-outline-variant rounded hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none font-body-md" value={formData.password} onChange={handleChange} required />
                </div>
              </div>

              <div className="pt-md border-t border-outline-variant/20 flex justify-end">
                <button type="submit" className="w-full sm:w-auto px-xl py-sm bg-primary text-white font-label-lg rounded shadow-sm hover:opacity-90 active:scale-95 transition-all" disabled={creating}>
                  {creating ? t('creating.account') : t('deploy.active.account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB CONTENT: REGISTRY */}
      {activeTab === 'registry' && (
        <div className="animate-in fade-in duration-300">
          {/* Mobile View: Cards */}
          <div className="block md:hidden flex flex-col gap-xs">
            {dataLoading ? (
              <div className="p-xl text-center"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>
            ) : filteredStaff.length === 0 ? (
              <div className="p-md bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-center font-body-md text-on-surface-variant">{t('no.staff.nodes')}</div>
            ) : (
              filteredStaff.map(staff => (
                <div 
                  key={`m-${staff.staff_id}`} 
                  className={`bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-xs shadow-sm flex flex-col relative overflow-hidden ${
                    staff.role === 'super_admin' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-primary'
                  }`}
                >
                  <div className="flex justify-between items-start mb-sm">
                    <span className="font-bold text-primary text-base">SVR-{staff.staff_id.toString().padStart(4, '0')}</span>
                    <span className={`font-label-md text-label-md px-[6px] py-[2px] rounded uppercase font-bold text-xs ${
                      staff.role === 'super_admin' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'
                    }`}>
                      {t(staff.role)}
                    </span>
                  </div>
                  <h4 className="font-body-lg text-body-lg text-on-surface mb-base font-bold truncate">{staff.full_name}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-md flex items-center gap-xs min-w-0">
                    <span className="material-symbols-outlined text-[14px] flex-shrink-0">mail</span>
                    <span className="truncate">{staff.email}</span>
                  </p>
                  
                  <div className="flex gap-sm border-t border-outline-variant/10 pt-sm">
                    <button 
                      onClick={() => setOverrideTarget(staff)} 
                      className="flex-grow flex justify-center items-center gap-xs px-sm py-[8px] bg-secondary-container text-on-secondary-container font-label-md text-label-md rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">key</span> {t('password')}
                    </button>
                    {staff.role !== 'super_admin' && (
                      <button 
                        onClick={() => handleDeleteStaff(staff.staff_id)} 
                        className="flex-grow flex justify-center items-center gap-xs px-sm py-[8px] bg-error-container text-on-error-container font-label-md text-label-md rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span> {t('delete')}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-surface-container-lowest border border-outline-variant/10 rounded overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-label-lg text-label-lg uppercase tracking-wider">
                <tr>
                  <th className="p-md">{t('network.id')}</th>
                  <th className="p-md">{t('identity')}</th>
                  <th className="p-md text-center">{t('security.auth')}</th>
                  <th className="p-md text-center">{t('node.termination')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-body-md text-on-surface">
                {dataLoading ? (
                  <tr>
                    <td colSpan={4} className="p-xl text-center">
                      <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-xl text-center text-on-surface-variant font-body-md">
                      {t('no.staff.nodes')}
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map(staff => (
                    <tr key={staff.staff_id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="p-md font-bold text-primary text-base">SVR-{staff.staff_id.toString().padStart(4, '0')}</td>
                      <td className="p-md">
                        <strong className="block text-on-surface font-bold text-base mb-xs">{staff.full_name}</strong>
                        <div className="flex gap-sm items-center">
                          <span className={`font-label-md text-label-md px-[6px] py-[2px] rounded uppercase font-bold text-xs ${
                            staff.role === 'super_admin' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'
                          }`}>
                            {t(staff.role)}
                          </span>
                          <span className="text-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
                            <span className="material-symbols-outlined text-[14px]">mail</span>
                            {staff.email}
                          </span>
                        </div>
                      </td>
                      <td className="p-md text-center">
                        <button 
                          onClick={() => setOverrideTarget(staff)} 
                          className="inline-flex items-center gap-xs px-md py-sm bg-secondary-container text-on-secondary-container font-label-md text-label-md rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">key</span> {t('override.password')}
                        </button>
                      </td>
                      <td className="p-md text-center">
                        {staff.role !== 'super_admin' && (
                          <button 
                            onClick={() => handleDeleteStaff(staff.staff_id)} 
                            className="inline-flex items-center gap-xs px-md py-sm bg-error-container text-on-error-container font-label-md text-label-md rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span> {t('delete.node')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: USERS */}
      {activeTab === 'users' && (
        <div className="animate-in fade-in duration-300">
          
          {/* Sub-tabs for Parents and Staff */}
          <div className="flex gap-sm mb-md p-base bg-surface-container-low rounded-lg border border-outline-variant/20 w-fit">
            <button
              onClick={() => setUserSubTab('parents')}
              className={`px-md py-xs rounded font-label-md text-label-md transition-all ${userSubTab === 'parents' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              {t('parents')}
            </button>
            <button
              onClick={() => setUserSubTab('staff')}
              className={`px-md py-xs rounded font-label-md text-label-md transition-all ${userSubTab === 'staff' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              {t('staff')}
            </button>
          </div>

          {userSubTab === 'parents' ? (
            <>
              {/* Mobile View: Cards */}
              <div className="block md:hidden flex flex-col gap-xs">
                {dataLoading ? (
                  <div className="p-xl text-center"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-md bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-center font-body-md text-on-surface-variant">{t('no.parent.users')}</div>
                ) : (
                  filteredUsers.map(u => (
                    <div 
                      key={`um-${u.id}`} 
                      className={`bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-xs shadow-sm flex flex-col relative overflow-hidden ${
                        u.verified ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gold'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-sm">
                        <span className="font-bold text-primary text-base">USR-{u.id.toString().padStart(4, '0')}</span>
                        <span className={`font-label-md text-label-md px-[6px] py-[2px] rounded uppercase font-bold text-xs ${
                          u.verified ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
                        }`}>
                          {u.verified ? t('verified') : t('unverified')}
                        </span>
                      </div>
                      <h4 className="font-body-lg text-body-lg text-on-surface mb-base font-bold truncate">{u.full_name}</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-md flex items-center gap-xs min-w-0">
                        <span className="material-symbols-outlined text-[14px] flex-shrink-0">mail</span>
                        <span className="truncate">{u.email}</span>
                      </p>
                      
                      <div className="flex gap-sm border-t border-outline-variant/10 pt-sm mt-md">
                        <button 
                          onClick={() => navigate(`/superadmin/users/parent-${u.id}`)} 
                          className="flex-grow flex justify-center items-center gap-xs px-sm py-[8px] bg-primary text-on-primary font-label-md text-label-md rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all font-bold"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span> {t('view.profile')}
                        </button>
                        <button 
                          onClick={() => setOverrideTarget(u)} 
                          className="flex-grow flex justify-center items-center gap-xs px-sm py-[8px] bg-secondary-container text-on-secondary-container font-label-md text-label-md rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">key</span> {t('override')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block bg-surface-container-lowest border border-outline-variant/10 rounded overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-label-lg text-label-lg uppercase tracking-wider">
                    <tr>
                      <th className="p-md">{t('user.id')}</th>
                      <th className="p-md">{t('identity')}</th>
                      <th className="p-md">{t('verification')}</th>
                      <th className="p-md">{t('meta.details')}</th>
                      <th className="p-md text-center">{t('override.password')}</th>
                      <th className="p-md text-center">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-body-md text-on-surface">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={6} className="p-xl text-center">
                          <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-xl text-center text-on-surface-variant font-body-md">
                          {t('no.matching.users')}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-surface-container-low/30 transition-colors">
                          <td className="p-md font-bold text-primary text-base">USR-{u.id.toString().padStart(4, '0')}</td>
                          <td className="p-md">
                            <strong className="block text-on-surface font-bold text-base mb-xs">{u.full_name}</strong>
                            <span className="text-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
                              <span className="material-symbols-outlined text-[14px]">mail</span>
                              {u.email}
                            </span>
                          </td>
                          <td className="p-md">
                            <span className={`font-label-md text-label-md px-[6px] py-[2px] rounded uppercase font-bold text-xs ${
                                u.verified ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'
                              }`}>
                                {u.verified ? t('verified') : t('unverified')}
                              </span>
                          </td>
                          <td className="p-md text-body-sm text-on-surface-variant">
                            <div>{t('dob')}: {u.dob ? new Date(u.dob).toLocaleDateString() : 'N/A'}</div>
                            <div>{t('phone')}: {u.phone || 'N/A'}</div>
                          </td>
                          <td className="p-md text-center">
                            <button 
                              onClick={() => setOverrideTarget(u)} 
                              className="inline-flex items-center gap-xs px-md py-sm bg-secondary-container text-on-secondary-container font-label-md text-label-md rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">key</span> {t('override')}
                            </button>
                          </td>
                          <td className="p-md text-center">
                            <button 
                              onClick={() => navigate(`/superadmin/users/parent-${u.id}`)} 
                              className="inline-flex items-center gap-xs px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all font-bold"
                            >
                              <span className="material-symbols-outlined text-sm">visibility</span> {t('view.profile')}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {/* Mobile View: Cards for Staff */}
              <div className="block md:hidden flex flex-col gap-xs">
                {dataLoading ? (
                  <div className="p-xl text-center"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>
                ) : filteredStaff.length === 0 ? (
                  <div className="p-md bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-center font-body-md text-on-surface-variant">{t('no.staff.nodes')}</div>
                ) : (
                  filteredStaff.map(staff => (
                    <div 
                      key={`um-staff-${staff.staff_id}`} 
                      className={`bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-xs shadow-sm flex flex-col relative overflow-hidden ${
                        staff.role === 'super_admin' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-primary'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-sm">
                        <span className="font-bold text-primary text-base">SVR-{staff.staff_id.toString().padStart(4, '0')}</span>
                        <span className={`font-label-md text-label-md px-[6px] py-[2px] rounded uppercase font-bold text-xs ${
                          staff.role === 'super_admin' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'
                        }`}>
                          {t(staff.role)}
                        </span>
                      </div>
                      <h4 className="font-body-lg text-body-lg text-on-surface mb-base font-bold truncate">{staff.full_name}</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-md flex items-center gap-xs min-w-0">
                        <span className="material-symbols-outlined text-[14px] flex-shrink-0">mail</span>
                        <span className="truncate">{staff.email}</span>
                      </p>
                      
                      <div className="flex gap-sm border-t border-outline-variant/10 pt-sm mt-md">
                        <button 
                          onClick={() => navigate(`/superadmin/users/staff-${staff.staff_id}`)} 
                          className="flex-grow flex justify-center items-center gap-xs px-sm py-[8px] bg-primary text-on-primary font-label-md text-label-md rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all font-bold"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span> {t('view.profile')}
                        </button>
                        <button 
                          onClick={() => setOverrideTarget(staff)} 
                          className="flex-grow flex justify-center items-center gap-xs px-sm py-[8px] bg-secondary-container text-on-secondary-container font-label-md text-label-md rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">key</span> {t('override')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View: Table for Staff */}
              <div className="hidden md:block bg-surface-container-lowest border border-outline-variant/10 rounded overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-label-lg text-label-lg uppercase tracking-wider">
                    <tr>
                      <th className="p-md">{t('network.id')}</th>
                      <th className="p-md">{t('identity')}</th>
                      <th className="p-md text-center">{t('override.password')}</th>
                      <th className="p-md text-center">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-body-md text-on-surface">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={4} className="p-xl text-center">
                          <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                        </td>
                      </tr>
                    ) : filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-xl text-center text-on-surface-variant font-body-md">
                          {t('no.staff.nodes')}
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map(staff => (
                        <tr key={staff.staff_id} className="hover:bg-surface-container-low/30 transition-colors">
                          <td className="p-md font-bold text-primary text-base">SVR-{staff.staff_id.toString().padStart(4, '0')}</td>
                          <td className="p-md">
                            <strong className="block text-on-surface font-bold text-base mb-xs">{staff.full_name}</strong>
                            <div className="flex gap-sm items-center">
                              <span className={`font-label-md text-label-md px-[6px] py-[2px] rounded uppercase font-bold text-xs ${
                                staff.role === 'super_admin' ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'
                              }`}>
                                {t(staff.role)}
                              </span>
                              <span className="text-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs">
                                <span className="material-symbols-outlined text-[14px]">mail</span>
                                {staff.email}
                              </span>
                            </div>
                          </td>
                          <td className="p-md text-center">
                            <button 
                              onClick={() => setOverrideTarget(staff)} 
                              className="inline-flex items-center gap-xs px-md py-sm bg-secondary-container text-on-secondary-container font-label-md text-label-md rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">key</span> {t('override')}
                            </button>
                          </td>
                          <td className="p-md text-center">
                            <button 
                              onClick={() => navigate(`/superadmin/users/staff-${staff.staff_id}`)} 
                              className="inline-flex items-center gap-xs px-md py-sm bg-primary text-on-primary font-label-md text-label-md rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all font-bold"
                            >
                              <span className="material-symbols-outlined text-sm">visibility</span> {t('view.profile')}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
      )}
  
        {/* PASSWORD OVERRIDE MODAL */}
        {overrideTarget && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-md">
            <div className="max-w-[500px] w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-sm overflow-hidden relative animate-in fade-in zoom-in duration-300">
              {/* Header Ornament */}
              <div className="h-1.5 w-full bg-primary-container"></div>
              
              <div className="p-lg md:p-xl space-y-md">
                {/* Branding/Icon Section */}
                <div className="flex flex-col items-center text-center space-y-sm mb-md">
                  <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[40px]">key_off</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">{t('password.override')}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant text-center">
                    {t('force.password.overwrite')} <br /><strong>{overrideTarget.email}</strong>
                  </p>
                </div>
  
                {/* Warning Alert Note */}
                <div className="flex gap-sm p-sm bg-error-container/20 border border-error/10 rounded text-left">
                  <span className="material-symbols-outlined text-error">warning</span>
                  <p className="font-body-sm text-body-sm text-on-error-container font-medium leading-relaxed">
                    {t('override.warning.msg')}
                  </p>
                </div>
  
                {/* Password Input Group */}
                <div className="space-y-base text-left">
                  <label className="font-label-lg text-on-surface-variant block">{t('temp.password.chars')}</label>
                  <input 
                    type="text" 
                    className="w-full px-md py-sm bg-surface border border-outline-variant rounded hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none font-body-md" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="e.g. Temp1234!" 
                  />
                </div>
  
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row-reverse gap-sm pt-md border-t border-outline-variant/10">
                  <button 
                    onClick={executePasswordOverride} 
                    className="bg-primary text-white px-xl py-md font-label-lg text-label-lg rounded hover:bg-primary-container transition-all active:scale-95 shadow-sm flex items-center justify-center gap-sm disabled:opacity-50"
                    disabled={overrideLoading || newPassword.length < 6}
                  >
                    {overrideLoading ? t('executing.reset') : t('execute.override')}
                  </button>
                  <button 
                    onClick={() => { setOverrideTarget(null); setNewPassword(''); }} 
                    className="bg-transparent border border-outline text-primary px-xl py-md font-label-lg text-label-lg rounded hover:bg-surface-container-high transition-all active:scale-95 flex items-center justify-center gap-sm"
                    disabled={overrideLoading}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

    </div>
  );
};

export default SuperAdminDashboard;
