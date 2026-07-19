import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const ALL_PERMISSIONS = [
  { id: 'view_requests', label: 'View All Requests', group: 'Requests', desc: 'Allows the user to view list and details of all student requests.' },
  { id: 'manage_requests', label: 'Process & Update Requests', group: 'Requests', desc: 'Allows the operator to prepare, issue, and flag request forms.' },
  { id: 'approve_documents', label: 'Approve & Release Documents', group: 'Requests', desc: 'Administrative authority to sign off on prepared documents.' },
  { id: 'view_payments', label: 'View Payment Records', group: 'Payments', desc: 'Permits viewing the bank transfer payments ledger.' },
  { id: 'verify_payments', label: 'Verify Bank Transfers', group: 'Payments', desc: 'Enables checking uploaded receipt images and marking payments verified.' },
  { id: 'view_users', label: 'View User Directory', group: 'Administration', desc: 'Allows viewing staff and parent profiles in the user directory.' },
  { id: 'manage_users', label: 'Create & Edit Users', group: 'Administration', desc: 'Gives rights to create, delete, and modify user account details.' },
  { id: 'manage_permissions', label: 'Manage Permissions', group: 'Administration', desc: 'Allows editing granular security permission sets.' },
  { id: 'view_verifications', label: 'View ID Verifications', group: 'Verification', desc: 'Access to look at parent identity document uploads.' },
  { id: 'approve_verifications', label: 'Approve ID Verifications', group: 'Verification', desc: 'Enables verifying and validating parent identities in the system.' },
];

const GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState('Requests');

  useEffect(() => {
    apiFetch(`/admin/users/${id}`)
      .then(data => {
        if (data) {
          setUser(data);
          setPermissions(data.permissions || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const togglePermission = (permId) => {
    setPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/admin/users/${id}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ permissions }),
      });
      setSaved(true);
      setTimeout(() => navigate('/superadmin/users/success'), 1000);
    } catch (_) {}
    setSaving(false);
  };

  const handleDeactivate = () => {
    if (deactivating) return;
    const confirmMsg = user.status === 'active' 
      ? 'Are you sure you want to deactivate this account? The user will be logged out immediately and blocked from access.'
      : 'Are you sure you want to reactivate this account?';
    if (!window.confirm(confirmMsg)) return;

    setDeactivating(true);
    // Simulating deactivation API call or mock state change
    setTimeout(() => {
      setUser(prev => ({
        ...prev,
        status: prev.status === 'active' ? 'deactivated' : 'active'
      }));
      setDeactivating(false);
      alert(user.status === 'active' ? 'Account successfully deactivated.' : 'Account successfully reactivated.');
    }, 800);
  };

  const initials = (user?.full_name || user?.name || '??')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '40px' }}>sync</span>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300 space-y-sm">
      
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/superadmin/users')}
          className="inline-flex items-center gap-xs text-primary hover:underline font-semibold font-label-lg cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>{t('back.to.users')}</span>
        </button>
      </div>

      {!user ? (
        <div className="p-xl bg-surface-container-lowest border border-outline-variant/20 rounded-2xl text-center text-on-surface-variant font-medium">
          {t('user.not.found')}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
          
          {/* LEFT COLUMN: Profile Header, Info list, and Danger zone */}
          <div className="lg:col-span-4 flex flex-col gap-md">
            
            {/* Elegant Profile Header Card */}
            <div className="bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-2xl p-md flex flex-col items-center text-center relative overflow-hidden shadow-md">
              <div className="absolute inset-0 bento-texture opacity-10 pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center gap-sm">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-display-lg font-bold shadow-md border border-white/20">
                  {initials}
                </div>
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-white font-bold leading-tight">{user.name}</h2>
                  <p className="font-body-sm text-[12px] opacity-80 capitalize mt-[2px] tracking-wide font-semibold">{t(user.role)}</p>
                  <p className="text-[11px] font-mono opacity-60 mt-base">{user.email}</p>
                </div>
                <span className={`px-md py-[4px] rounded-lg font-label-md text-label-md mt-xs capitalize font-bold border text-[10px] ${
                  user.status === 'active' ? 'bg-secondary-container text-on-secondary-container border-secondary/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                  {t(user.status || 'active')}
                </span>
              </div>
            </div>

            {/* Account Info Details List */}
            <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-sm sm:p-md shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-sm border-b border-outline-variant/10 pb-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px]">badge</span>
                <span>{t('account.info')}</span>
              </h3>
              <div className="space-y-sm">
                {[
                  { icon: 'fingerprint', label: t('user.id'), value: user.id },
                  { icon: 'alternate_email', label: t('email.address'), value: user.email },
                  { icon: 'call', label: t('phone'), value: user.phone || '—' },
                  { icon: 'admin_panel_settings', label: t('role'), value: t(user.role), capitalize: true },
                  { icon: 'login', label: t('last.login'), value: user.last_login ? new Date(user.last_login).toLocaleString('en-BZ') : t('never') },
                  { icon: 'calendar_today', label: t('member.since'), value: user.created_at ? new Date(user.created_at).toLocaleDateString('en-BZ') : '—' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-sm py-xs border-b border-outline-variant/5 last:border-none">
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-on-surface-variant/80 border border-outline-variant/10">
                      <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-label-md text-label-md text-on-surface-variant font-medium text-[11px] opacity-75">{item.label}</p>
                      <p className={`font-body-sm text-body-sm truncate font-semibold text-on-surface ${item.capitalize ? 'capitalize' : ''}`}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone Controls */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-sm sm:p-md shadow-sm space-y-sm">
              <div>
                <h3 className="font-label-lg text-label-lg text-red-600 uppercase tracking-widest font-bold flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[18px]">gavel</span>
                  <span>{t('danger.zone')}</span>
                </h3>
                <p className="text-[10px] text-on-surface-variant mt-[2px] leading-relaxed">
                  Perform system deactivation or temporary status suspension for this specific user.
                </p>
              </div>
              <button 
                onClick={handleDeactivate}
                disabled={deactivating}
                className={`w-full py-xs rounded-xl font-label-lg font-bold border transition-all active:scale-[0.98] ${
                  user.status === 'active' 
                    ? 'border-red-500 text-red-500 hover:bg-red-500/10'
                    : 'border-green-600 text-green-700 hover:bg-green-600/10'
                }`}
              >
                {deactivating ? 'Updating Status...' : (user.status === 'active' ? t('deactivate.account') : 'Reactivate Account')}
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: Granular Permission Switch Matrices & Timeline logs */}
          <div className="lg:col-span-8 flex flex-col gap-md">
            
            {/* Portal Permissions Config box */}
            <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-sm sm:p-md shadow-md">
              <div className="flex justify-between items-center mb-md border-b border-outline-variant/15 pb-xs">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                  <span>{t('portal.permissions')}</span>
                </h3>
                {user.role !== 'parent' && (
                  <span className="text-[11px] font-semibold text-primary bg-primary/5 px-sm py-[3px] rounded-lg border border-outline-variant/20 font-mono">
                    {permissions.length} Active Rules
                  </span>
                )}
              </div>

              {user.role === 'parent' ? (
                <div className="py-xl text-center text-on-surface-variant font-body-md max-w-md mx-auto space-y-sm">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[32px]">account_box</span>
                  </div>
                  <p className="font-bold text-on-surface text-base">Client Authorization</p>
                  <p className="text-sm">{t('parent.permissions.na')}</p>
                </div>
              ) : (
                <div className="space-y-md">
                  
                  {/* Category Selection Tabs (Accordion style) */}
                  <div className="flex bg-surface p-[3px] border border-outline-variant/35 rounded-xl gap-[2px]">
                    {GROUPS.map(group => (
                      <button
                        key={group}
                        type="button"
                        onClick={() => setActiveAccordion(group)}
                        className={`flex-1 py-[6px] text-center font-label-md text-[12px] font-bold rounded-lg transition-all ${
                          activeAccordion === group ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>

                  {/* List of switches in current selected category */}
                  <div className="space-y-sm animate-in fade-in duration-200">
                    {ALL_PERMISSIONS.filter(p => p.group === activeAccordion).map(perm => {
                      const isChecked = permissions.includes(perm.id);
                      return (
                        <div 
                          key={perm.id} 
                          onClick={() => togglePermission(perm.id)}
                          className="flex items-start gap-sm p-sm rounded-xl hover:bg-surface-container-low cursor-pointer border border-outline-variant/5 hover:border-outline-variant/25 transition-all group"
                        >
                          {/* Custom IOS Styled Toggle Switch */}
                          <div className="relative mt-base">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="sr-only"
                            />
                            <div className={`w-10 h-6 rounded-full transition-colors duration-200 border border-outline-variant/10 ${isChecked ? 'bg-primary' : 'bg-surface-container-high'}`} />
                            <div className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-md transition-transform duration-200 ${isChecked ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>

                          <div className="flex-grow min-w-0">
                            <p className="font-label-lg text-label-lg font-bold text-on-surface group-hover:text-primary transition-colors">{perm.label}</p>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed mt-[2px] font-medium">{perm.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Form actions */}
                  <div className="flex justify-end gap-sm mt-lg pt-md border-t border-outline-variant/15">
                    <button
                      onClick={() => navigate('/superadmin/users')}
                      className="px-lg py-xs font-label-lg text-on-surface-variant hover:bg-surface-container-high rounded-xl border border-transparent font-bold transition-all active:scale-95"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`px-lg py-xs font-label-lg rounded-xl shadow-md transition-all font-bold flex items-center gap-xs active:scale-95 ${
                        saved ? 'bg-green-700 text-white' : 'bg-primary text-on-primary hover:bg-primary-container'
                      }`}
                    >
                      {saving ? (
                        <><span className="material-symbols-outlined animate-spin text-sm">sync</span> <span>{t('saving')}</span></>
                      ) : saved ? (
                        <><span className="material-symbols-outlined text-sm">check_circle</span> <span>{t('saved')}</span></>
                      ) : (
                        <><span className="material-symbols-outlined text-sm">save</span> <span>{t('save.permissions')}</span></>
                      )}
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Custom User Logs timeline (Only for staff nodes) */}
            {user.role !== 'parent' && (
              <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-sm sm:p-md shadow-sm space-y-sm">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold border-b border-outline-variant/10 pb-xs flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[20px]">history</span>
                  <span>User Activity Timeline</span>
                </h3>
                
                <div className="relative border-l border-outline-variant/35 pl-md ml-xs py-xs space-y-md text-left">
                  {/* Timeline Node 1 */}
                  <div className="relative">
                    <span className="absolute -left-[29px] top-px w-5.5 h-5.5 rounded-full bg-primary/10 border border-primary flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                    </span>
                    <p className="font-label-lg text-label-lg font-bold text-on-surface">Signed into console session</p>
                    <p className="text-[10px] text-on-surface-variant">Auth Method: Institutional MFA / IP: 190.23.41.112</p>
                    <span className="text-[10px] text-on-surface-variant font-medium opacity-70 block mt-[2px]">2 hours ago</span>
                  </div>

                  {/* Timeline Node 2 */}
                  <div className="relative">
                    <span className="absolute -left-[29px] top-px w-5.5 h-5.5 rounded-full bg-primary/10 border border-primary flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[12px] font-bold">article</span>
                    </span>
                    <p className="font-label-lg text-label-lg font-bold text-on-surface">Updated request #BM-1024 status</p>
                    <p className="text-[10px] text-on-surface-variant">Modified fields: Status &rarr; Ready for Pickup</p>
                    <span className="text-[10px] text-on-surface-variant font-medium opacity-70 block mt-[2px]">3 days ago</span>
                  </div>

                  {/* Timeline Node 3 */}
                  <div className="relative">
                    <span className="absolute -left-[29px] top-px w-5.5 h-5.5 rounded-full bg-primary/10 border border-primary flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[12px] font-bold">add_card</span>
                    </span>
                    <p className="font-label-lg text-label-lg font-bold text-on-surface">Created verification entry SVR-{user.id.toString().replace('staff-','')}</p>
                    <p className="text-[10px] text-on-surface-variant">Initial database sync and role assignment initialized</p>
                    <span className="text-[10px] text-on-surface-variant font-medium opacity-70 block mt-[2px]">1 week ago</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
