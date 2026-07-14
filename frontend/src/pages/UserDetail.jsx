import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const ALL_PERMISSIONS = [
  { id: 'view_requests', label: 'View All Requests', group: 'Requests' },
  { id: 'manage_requests', label: 'Process & Update Requests', group: 'Requests' },
  { id: 'approve_documents', label: 'Approve & Release Documents', group: 'Requests' },
  { id: 'view_payments', label: 'View Payment Records', group: 'Payments' },
  { id: 'verify_payments', label: 'Verify Bank Transfers', group: 'Payments' },
  { id: 'view_users', label: 'View User Directory', group: 'Administration' },
  { id: 'manage_users', label: 'Create & Edit Users', group: 'Administration' },
  { id: 'manage_permissions', label: 'Manage Permissions', group: 'Administration' },
  { id: 'view_verifications', label: 'View ID Verifications', group: 'Verification' },
  { id: 'approve_verifications', label: 'Approve ID Verifications', group: 'Verification' },
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
      setTimeout(() => navigate('/superadmin/users/success'), 1200);
    } catch (_) {}
    setSaving(false);
  };

  const initials = (user?.full_name || user?.name || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '40px' }}>sync</span>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      {/* Back Button */}
      <button
        onClick={() => navigate('/superadmin/users')}
        className="inline-flex items-center gap-xs text-primary hover:underline mb-md font-semibold font-label-lg cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        {t('back.to.users')}
      </button>

      {!user ? (
        <p className="text-on-surface-variant">{t('user.not.found')}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg max-w-container-max">
          {/* Left: Profile */}
          <div className="lg:col-span-4 flex flex-col gap-md">
            {/* Profile Card */}
            <div className="bg-primary text-on-primary rounded-xl p-md flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bento-texture" style={{ opacity: 0.1 }} />
              <div className="relative z-10 flex flex-col items-center gap-sm">
                <div className="w-20 h-20 rounded-full bg-on-primary/20 flex items-center justify-center text-headline-lg font-bold">{initials}</div>
                <div>
                  <h2 className="font-headline-md text-headline-md">{user.name}</h2>
                  <p className="font-body-sm opacity-80 capitalize">{t(user.role)}</p>
                  <p className="font-body-sm opacity-60 mt-xs">{user.email}</p>
                </div>
                <span className={`px-md py-0.5 rounded-full font-label-md text-label-md mt-xs capitalize
                  ${user.status === 'active' ? 'bg-secondary-container text-on-secondary-container' : 'bg-on-primary/20'}`}>
                  {t(user.status || 'active')}
                </span>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-md">{t('account.info')}</h3>
              {[
                { label: t('user.id'), value: user.id },
                { label: t('email.address'), value: user.email },
                { label: t('phone'), value: user.phone || '—' },
                { label: t('role'), value: t(user.role) },
                { label: t('last.login'), value: user.last_login ? new Date(user.last_login).toLocaleDateString('en-BZ') : t('never') },
                { label: t('member.since'), value: user.created_at ? new Date(user.created_at).toLocaleDateString('en-BZ') : '—' },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-xs border-b border-outline-variant/10 last:border-none">
                  <p className="font-label-md text-label-md text-on-surface-variant">{item.label}</p>
                  <p className="font-body-sm text-on-surface">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Danger Zone */}
            <div className="bg-error-container border border-error/20 rounded-xl p-md">
              <h3 className="font-label-lg text-label-lg text-error uppercase tracking-widest mb-sm">{t('danger.zone')}</h3>
              <button className="w-full border border-error text-error py-xs rounded-lg font-label-lg hover:bg-error-container transition-all">
                {t('deactivate.account')}
              </button>
            </div>
          </div>

          {/* Right: Permissions */}
          <div className="lg:col-span-8 flex flex-col gap-md">
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-md flex items-center gap-xs">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>admin_panel_settings</span>
                {t('portal.permissions')}
              </h3>

              {user.role === 'parent' ? (
                <div className="py-lg text-center text-on-surface-variant font-body-md max-w-md mx-auto space-y-md">
                  <span className="material-symbols-outlined text-[48px] text-primary block" style={{ fontVariationSettings: "'FILL' 0" }}>account_box</span>
                  <p>{t('parent.permissions.na')}</p>
                </div>
              ) : (
                GROUPS.map(group => (
                  <div key={group} className="mb-md">
                    <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest mb-sm">{t(group.toLowerCase())}</p>
                    <div className="flex flex-col gap-xs">
                      {ALL_PERMISSIONS.filter(p => p.group === group).map(perm => (
                        <label key={perm.id} className="flex items-center gap-md p-sm rounded-lg hover:bg-surface-container-low cursor-pointer group transition-colors">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                            ${permissions.includes(perm.id) ? 'bg-primary border-primary' : 'border-outline-variant group-hover:border-primary'}`}>
                            {permissions.includes(perm.id) && (
                              <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '14px' }}>check</span>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={permissions.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                          />
                          <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">{t(perm.id)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}

              <div className="flex justify-end gap-sm mt-lg pt-md border-t border-outline-variant/20">
                <button
                  onClick={() => navigate('/superadmin/users')}
                  className="px-lg py-sm font-label-lg text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all"
                >
                  {user.role === 'parent' ? t('back') : t('cancel')}
                </button>
                {user.role !== 'parent' && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-lg py-sm font-label-lg rounded-lg shadow-sm transition-all flex items-center gap-sm
                      ${saved ? 'bg-green-700 text-white' : 'bg-primary text-on-primary hover:bg-primary-container disabled:opacity-60'}`}
                  >
                    {saving ? (
                      <><span className="material-symbols-outlined animate-spin">sync</span> {t('saving')}</>
                    ) : saved ? (
                      <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {t('saved')}</>
                    ) : (
                      <>{t('save.permissions')} <span className="material-symbols-outlined">save</span></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
