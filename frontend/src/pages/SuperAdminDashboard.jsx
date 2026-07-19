import React, { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState('registry'); // 'registry', 'provision', 'users'
  const [staffList, setStaffList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [stats, setStats] = useState({ registered: { staff: [], parents: [] }, online: { staff: [], parents: [] } });
  const [dataLoading, setDataLoading] = useState(true);
  
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'admin' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Password Override State
  const [overrideTargetEmail, setOverrideTargetEmail] = useState('');
  const [overridePassword, setOverridePassword] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);



  const loadData = async () => {
    setDataLoading(true);
    try {
      const [staffData, userData, statsData] = await Promise.all([
        apiFetch('/superadmin/staff').catch(() => []),
        apiFetch('/superadmin/users').catch(() => []),
        apiFetch('/superadmin/stats').catch(() => ({ registered: { staff: [], parents: [] }, online: { staff: [], parents: [] } }))
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
    if (user && (user.role === 'admin' || user.role === 'super_admin')) loadData(); 
  }, [user]);

  const filteredStaff = useMemo(() => {
    if (!searchQuery) return staffList;
    const lower = searchQuery.toLowerCase();
    return staffList.filter(s => 
      s.full_name?.toLowerCase().includes(lower) || 
      s.email?.toLowerCase().includes(lower) || 
      s.role?.toLowerCase().includes(lower)
    );
  }, [staffList, searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return userList;
    const lower = searchQuery.toLowerCase();
    return userList.filter(u => 
      u.full_name?.toLowerCase().includes(lower) || 
      u.email?.toLowerCase().includes(lower)
    );
  }, [userList, searchQuery]);

  const onlineParents = useMemo(() => {
    return stats?.online?.parents?.reduce((acc, curr) => acc + parseInt(curr.count || 0), 0) || 0;
  }, [stats]);

  const onlineStaff = useMemo(() => {
    return stats?.online?.staff?.reduce((acc, curr) => acc + parseInt(curr.count || 0), 0) || 0;
  }, [stats]);

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return null;

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
      alert('Staff user provisioned successfully!');
      setFormData({ full_name: '', email: '', password: '', role: 'admin' });
      setActiveTab('registry');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create staff');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStaff = async (id, email) => {
    if (!window.confirm(`Are you sure you want to permanently delete this staff member (${email})?`)) return;
    try {
      await apiFetch(`/superadmin/staff/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert('Failed to delete staff: ' + err.message);
    }
  };

  const executePasswordOverride = async () => {
    if (!overrideTargetEmail) return alert('Please enter user email address.');
    if (overridePassword.length < 6) return alert('Temporary password must be at least 6 characters.');
    setOverrideLoading(true);
    try {
      await apiFetch('/superadmin/override-password', {
        method: 'POST',
        body: JSON.stringify({ targetEmail: overrideTargetEmail, newPassword: overridePassword })
      });
      alert(`Successfully overrode password for ${overrideTargetEmail}`);

      setShowOverrideModal(false);
      setOverrideTargetEmail('');
      setOverridePassword('');
      setShowPassword(false);
    } catch (err) {
      alert('Override Failed: ' + err.message);
    } finally {
      setOverrideLoading(false);
    }
  };

  const triggerDirectReset = (email) => {
    setOverrideTargetEmail(email);
    setOverridePassword('');
    setShowOverrideModal(true);
  };

  return (
    <div className="flex-grow flex flex-col w-full animate-in fade-in duration-300 space-y-md">
      
      {/* Dashboard Top Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
        <div>
          <p className="text-primary font-bold tracking-wider uppercase text-[10px] sm:text-xs">Console Controls</p>
          <h2 className="font-headline-sm text-headline-sm sm:font-headline-lg sm:text-headline-lg text-primary font-bold">{t('admin.overview') || 'Administrative Overview'}</h2>
          <p className="font-body-sm text-body-sm sm:font-body-md sm:text-body-md text-on-surface-variant max-w-2xl mt-px">
            {t('sys.governance') || 'High-level system governance, server registry state, and central onboarding tools.'}
          </p>
        </div>
        <button
          onClick={loadData}
          className="self-start sm:self-center px-sm py-[8px] bg-surface-container-lowest hover:bg-surface-container-low text-primary border border-outline-variant/35 rounded-xl font-label-md flex items-center gap-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">sync</span>
          <span>Sync Data</span>
        </button>
      </section>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
        {/* Registered Parents */}
        <div className="bg-surface-container-lowest border border-outline-variant/15 p-sm sm:p-md rounded-2xl shadow-sm border-l-4 border-l-primary flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-xs">
            <h3 className="font-label-lg text-label-lg text-primary uppercase font-bold tracking-wider">Parents &amp; Alumni</h3>
            <div className="p-[6px] rounded-lg bg-primary/5 text-primary">
              <span className="material-symbols-outlined text-[20px] flex">family_restroom</span>
            </div>
          </div>
          <p className="font-headline-sm text-headline-sm sm:font-display-md sm:text-display-md leading-none font-bold text-on-surface mt-sm">
            {dataLoading ? '—' : userList.length}
          </p>
          <div className="mt-md pt-sm border-t border-outline-variant/10 flex justify-between items-center">
            <span className="text-[11px] text-on-surface-variant font-medium">Registered public accounts</span>
            <button onClick={() => setActiveTab('users')} className="text-xs text-primary font-bold hover:underline">View List</button>
          </div>
        </div>

        {/* Staff Members */}
        <div className="bg-surface-container-lowest border border-outline-variant/15 p-sm sm:p-md rounded-2xl shadow-sm border-l-4 border-l-secondary flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-xs">
            <h3 className="font-label-lg text-label-lg text-secondary uppercase font-bold tracking-wider">Staff Members</h3>
            <div className="p-[6px] rounded-lg bg-secondary/5 text-secondary">
              <span className="material-symbols-outlined text-[20px] flex">badge</span>
            </div>
          </div>
          <p className="font-headline-sm text-headline-sm sm:font-display-md sm:text-display-md leading-none font-bold text-on-surface mt-sm">
            {dataLoading ? '—' : staffList.length}
          </p>
          <div className="mt-md pt-sm border-t border-outline-variant/10 flex justify-between items-center">
            <span className="text-[11px] text-on-surface-variant font-medium">Active administrative users</span>
            <button onClick={() => setActiveTab('registry')} className="text-xs text-secondary font-bold hover:underline">View Registry</button>
          </div>
        </div>

        {/* Portal Configuration */}
        <div className="bg-surface-container-lowest border border-outline-variant/15 p-sm sm:p-md rounded-2xl shadow-sm border-l-4 border-l-green-600 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-xs">
            <h3 className="font-label-lg text-label-lg text-green-700 uppercase font-bold tracking-wider">Document Pricing</h3>
            <div className="p-[6px] rounded-lg bg-green-50 text-green-600">
              <span className="material-symbols-outlined text-[20px] flex">payments</span>
            </div>
          </div>
          <p className="text-[11px] text-on-surface-variant font-medium leading-normal mb-sm mt-xs">
            Configure request processing fees for official transcripts, diplomas, and enrollment letters.
          </p>
          <div className="pt-sm border-t border-outline-variant/10 flex justify-end">
            <button onClick={() => navigate('/superadmin/pricing')} className="px-sm py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all">
              Manage Pricing
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/20 gap-sm sm:gap-md mb-xs overflow-x-auto">
        <button 
          onClick={() => { setActiveTab('registry'); setSearchQuery(''); }}
          className={`pb-xs px-xs font-label-md text-label-md sm:font-label-lg sm:text-label-lg transition-all border-b-2 uppercase tracking-wider font-bold whitespace-nowrap ${
            activeTab === 'registry' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          {t('staff.registry') || 'Staff Registry'}
        </button>
        <button 
          onClick={() => { setActiveTab('provision'); setSearchQuery(''); }}
          className={`pb-xs px-xs font-label-md text-label-md sm:font-label-lg sm:text-label-lg transition-all border-b-2 uppercase tracking-wider font-bold whitespace-nowrap ${
            activeTab === 'provision' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          {t('provision.staff') || 'Provision Staff'}
        </button>
        <button 
          onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
          className={`pb-xs px-xs font-label-md text-label-md sm:font-label-lg sm:text-label-lg transition-all border-b-2 uppercase tracking-wider font-bold whitespace-nowrap ${
            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          {t('public.users') || 'Public Users'}
        </button>
      </div>

      {/* Search Bar for Registry & Users */}
      {activeTab !== 'provision' && (
        <div className="bg-surface-container-lowest border border-outline-variant/15 p-xs sm:p-sm rounded-2xl shadow-sm">
          <div className="relative flex items-center max-w-md">
            <span className="material-symbols-outlined absolute left-sm text-on-surface-variant">search</span>
            <input 
              className="w-full pl-xl pr-sm py-xs bg-surface border border-outline-variant/35 focus:border-primary rounded-xl font-body-md transition-colors" 
              placeholder={activeTab === 'registry' ? (t('filter.staff') || 'Filter staff members...') : (t('filter.public') || 'Filter public parent users...')}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-sm p-1 hover:bg-surface-container-low rounded-lg text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: REGISTRY */}
      {activeTab === 'registry' && (
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          {dataLoading ? (
            <div className="p-xl text-center"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-md text-center font-body-sm text-on-surface-variant font-medium">No staff matches search.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-sm min-w-[600px]">
                <thead className="bg-surface-container-low border-b border-outline-variant/15 text-on-surface-variant font-label-md uppercase tracking-wider">
                  <tr>
                    <th className="p-sm">ID</th>
                    <th className="p-sm">Identity</th>
                    <th className="p-sm">Access Level</th>
                    <th className="p-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredStaff.map(s => {
                    const roleTitle = s.role === 'admin' || s.role === 'super_admin' ? 'System Administrator' : (s.role === 'viewer' ? 'Read-only Viewer' : 'Staff Operator');
                    const roleColor = s.role === 'super_admin' ? 'bg-red-500/5 text-red-600' : 'bg-primary/5 text-primary';
                    const isSelf = s.email === user?.email;

                    return (
                      <tr key={s.staff_id} className="hover:bg-surface-container-low/20 transition-colors">
                        <td className="p-sm font-mono font-bold text-primary">STF-{String(s.staff_id).padStart(4, '0')}</td>
                        <td className="p-sm">
                          <p className="font-bold text-on-surface">{s.full_name}</p>
                          <p className="text-[11px] text-on-surface-variant">{s.email}</p>
                        </td>
                        <td className="p-sm">
                          <span className={`px-xs py-[2px] rounded text-[10px] uppercase font-bold ${roleColor}`}>{roleTitle}</span>
                        </td>
                        <td className="p-sm text-right space-x-xs">
                          <button onClick={() => triggerDirectReset(s.email)} className="px-xs py-xs bg-secondary/5 text-secondary border border-secondary/20 hover:bg-secondary/10 rounded-lg text-[11px] font-bold">Reset Password</button>
                          <button onClick={() => navigate(`/superadmin/users/staff-${s.staff_id}`)} className="px-xs py-xs bg-primary/5 text-primary border border-primary/20 hover:bg-primary/10 rounded-lg text-[11px] font-bold">Permissions</button>
                          {!isSelf && (
                            <button onClick={() => handleDeleteStaff(s.staff_id, s.email)} className="px-xs py-xs bg-error-container/40 text-error hover:bg-error-container/60 rounded-lg text-[11px] font-bold">Remove</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PUBLIC USERS (No toggles - strictly parent/student accounts) */}
      {activeTab === 'users' && (
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          {dataLoading ? (
            <div className="p-xl text-center"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-md text-center font-body-sm text-on-surface-variant font-medium">No public users discovered.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-sm min-w-[650px]">
                <thead className="bg-surface-container-low border-b border-outline-variant/15 text-on-surface-variant font-label-md uppercase tracking-wider">
                  <tr>
                    <th className="p-sm">User ID</th>
                    <th className="p-sm">Identity</th>
                    <th className="p-sm">Verification</th>
                    <th className="p-sm">Meta Details</th>
                    <th className="p-sm text-center">Override Password</th>
                    <th className="p-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredUsers.map(u => {
                    const statusText = u.verified === false ? 'Unverified' : 'Verified';
                    const statusColor = u.verified === false ? 'bg-error-container text-on-error-container border border-error/20' : 'bg-green-100 text-green-700 border border-green-200/20';

                    return (
                      <tr key={u.parent_id || u.id} className="hover:bg-surface-container-low/20 transition-colors">
                        <td className="p-sm font-mono font-bold text-primary">USR-{String(u.parent_id || u.id).padStart(4, '0')}</td>
                        <td className="p-sm">
                          <p className="font-bold text-on-surface">{u.full_name}</p>
                          <p className="text-[11px] text-on-surface-variant">{u.email}</p>
                        </td>
                        <td className="p-sm">
                          <span className={`px-xs py-[2px] rounded text-[10px] uppercase font-bold border ${statusColor}`}>{statusText}</span>
                        </td>
                        <td className="p-sm">
                          <div className="text-[11px] text-on-surface-variant leading-relaxed">
                            <p>Date of Birth: {u.dob ? new Date(u.dob).toLocaleDateString() : 'N/A'}</p>
                            <p>Phone: {u.phone || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="p-sm text-center">
                          <button onClick={() => triggerDirectReset(u.email)} className="px-sm py-xs bg-secondary-container text-on-secondary-container hover:opacity-95 rounded-xl text-[11px] font-bold border border-outline-variant/20 shadow-sm">
                            Override
                          </button>
                        </td>
                        <td className="p-sm text-right">
                          <button onClick={() => navigate(`/superadmin/users/parent-${u.parent_id || u.id}`)} className="px-sm py-xs bg-primary text-on-primary hover:bg-primary-container rounded-xl text-[11px] font-bold shadow-sm">
                            View Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PROVISION */}
      {activeTab === 'provision' && (
        <div className="max-w-2xl mx-auto w-full animate-in fade-in duration-300">
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl shadow-md overflow-hidden">
            <div className="relative h-24 bg-primary overflow-hidden flex flex-col justify-center px-md sm:px-lg">
              <div className="absolute inset-0 bento-texture opacity-10" />
              <p className="text-white font-bold tracking-wider uppercase text-[10px]">Access Control</p>
              <h3 className="font-headline-sm text-headline-sm text-white font-bold">Provision New Staff Node</h3>
              <p className="text-white/80 text-[11px] mt-base">Onboard a new administrative operator or viewer into the security loop.</p>
            </div>

            <form className="p-sm sm:p-md flex flex-col gap-sm" onSubmit={handleCreateStaff} autoComplete="off">
              {error && (
                <div className="p-sm text-center text-error bg-error-container/30 rounded-xl border border-error/20 text-xs font-bold flex items-center justify-center gap-xs">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{error}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-on-surface font-semibold text-[13px]">{t('full.name')}</label>
                  <input 
                    type="text" 
                    name="full_name" 
                    placeholder="e.g. Arthur Vance"
                    className="w-full px-sm py-xs bg-surface border border-outline-variant/35 rounded-xl font-body-md focus:ring-2 focus:ring-primary/20 outline-none" 
                    value={formData.full_name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-on-surface font-semibold text-[13px]">{t('inst.email')}</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-sm text-on-surface-variant text-[20px]">mail</span>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="a.vance@bishopmartin.edu"
                      className="w-full pl-xl pr-sm py-xs bg-surface border border-outline-variant/35 rounded-xl font-body-md focus:ring-2 focus:ring-primary/20 outline-none" 
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                  />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-on-surface font-semibold text-[13px]">{t('access.level')}</label>
                  <select 
                    name="role" 
                    className="w-full py-xs px-sm bg-surface border border-outline-variant/35 rounded-xl font-body-md outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer" 
                    value={formData.role} 
                    onChange={handleChange}
                  >
                    <option value="admin">Level 3: Admin (Operator)</option>
                    <option value="viewer">Level 2: Viewer (Read-only)</option>
                    <option value="super_admin">Level 4: Super Admin (System root)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-on-surface font-semibold text-[13px]">{t('temp.password')}</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-sm text-on-surface-variant text-[20px]">password</span>
                    <input 
                      type="password" 
                      name="password" 
                      placeholder="••••••••"
                      className="w-full pl-xl pr-sm py-xs bg-surface border border-outline-variant/35 rounded-xl font-body-md focus:ring-2 focus:ring-primary/20 outline-none" 
                      value={formData.password} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-md border-t border-outline-variant/10 flex justify-end gap-sm mt-xs">
                <button 
                  type="submit" 
                  className="w-full sm:w-auto px-lg py-xs bg-primary text-on-primary font-label-lg font-bold rounded-xl shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-xs cursor-pointer"
                  disabled={creating}
                >
                  {creating ? (
                    <><span className="material-symbols-outlined animate-spin text-sm">sync</span> <span>Deploying...</span></>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">deployed_code</span> <span>Deploy Node Account</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* PASSWORD OVERRIDE MODAL */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-sm animate-in fade-in duration-200">
          <div className="max-w-[450px] w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="h-1.5 w-full bg-red-600"></div>
            <div className="p-sm sm:p-md flex flex-col gap-sm text-center">
              
              <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
              </div>
              
              <div className="space-y-[4px]">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{t('password.override') || 'Credential Override'}</h3>
                <p className="font-body-sm text-[12px] text-on-surface-variant leading-relaxed">
                  Forcefully overwrite active account password credentials.
                </p>
              </div>

              <div className="flex gap-sm p-xs bg-red-500/5 border border-red-500/15 rounded-xl text-left">
                <span className="material-symbols-outlined text-red-600 flex-shrink-0 mt-[2px] text-[18px]">warning</span>
                <p className="font-body-sm text-[10px] text-red-600 font-semibold leading-normal">
                  {t('override.warning.msg') || 'This forcefully modifies security records in PostgreSQL. The user will be signed out from all active sessions and must update their password immediately.'}
                </p>
              </div>

              <div className="text-left space-y-sm">
                <div className="space-y-xs">
                  <label className="font-label-lg text-on-surface font-bold text-[13px]">User Email Address</label>
                  <input
                    type="email" 
                    placeholder="e.g. staff@bmhs.edu.bz" 
                    className="w-full px-sm py-xs bg-surface border border-outline-variant/35 rounded-xl font-body-md focus:ring-2 focus:ring-primary/20 outline-none"
                    value={overrideTargetEmail}
                    onChange={e => setOverrideTargetEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-xs">
                  <label className="font-label-lg text-on-surface font-bold text-[13px]">{t('temp.password.chars') || 'Temporary Password (min. 6 chars)'}</label>
                  <div className="relative flex items-center">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="w-full px-sm py-xs pr-xl bg-surface border border-outline-variant/35 focus:ring-2 focus:ring-primary/20 outline-none rounded-xl font-body-md" 
                      value={overridePassword} 
                      onChange={e => setOverridePassword(e.target.value)} 
                      placeholder="e.g. Temp1234!" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-on-surface-variant hover:text-primary transition-colors flex"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row-reverse gap-xs pt-sm border-t border-outline-variant/10 mt-xs">
                <button 
                  onClick={executePasswordOverride} 
                  className="flex-grow bg-red-600 text-on-primary py-xs rounded-xl font-label-lg font-bold hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-xs cursor-pointer"
                  disabled={overrideLoading || overridePassword.length < 6 || !overrideTargetEmail}
                >
                  {overrideLoading ? t('executing.reset') : t('execute.override')}
                </button>
                <button 
                  onClick={() => { setShowOverrideModal(false); setOverrideTargetEmail(''); setOverridePassword(''); setShowPassword(false); }} 
                  className="flex-grow bg-transparent border border-outline text-primary py-xs rounded-xl font-label-lg font-bold hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer"
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
