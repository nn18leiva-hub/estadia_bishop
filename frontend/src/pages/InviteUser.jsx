import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function InviteUser() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'staff', department: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, val) => setForm(f => ({ ...f, [k]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await apiFetch('/admin/users/invite', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      navigate('/superadmin/users/invite/confirm', { state: { email: form.email, name: form.name } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const rolesConfig = [
    {
      role: 'viewer',
      title: 'Viewer',
      subtitle: t('level.viewer') || 'Viewer (Read-only)',
      icon: 'visibility',
      desc: 'Can read lists, audit logs, and analytics, but cannot update request status, verify payments, or change configurations.',
      color: 'border-secondary/20 hover:border-secondary text-secondary bg-secondary/5',
      activeColor: 'border-secondary bg-secondary/10 text-secondary ring-2 ring-secondary/25'
    },
    {
      role: 'staff',
      title: 'Staff',
      subtitle: t('level.staff') || 'Staff (Administrative)',
      icon: 'engineering',
      desc: 'Standard system operator. Can view requests, update statuses, upload issued documents, and verify bank transfer receipts.',
      color: 'border-primary/20 hover:border-primary text-primary bg-primary/5',
      activeColor: 'border-primary bg-primary/10 text-primary ring-2 ring-primary/25'
    },
    {
      role: 'admin',
      title: 'Admin',
      subtitle: t('level.superadmin') || 'Admin (Root Control)',
      icon: 'admin_panel_settings',
      desc: 'System administrator. Full access to provision staff, perform database overrides, manage pricing catalog, and delete nodes.',
      color: 'border-red-500/20 hover:border-red-500 text-red-600 bg-red-500/5',
      activeColor: 'border-red-500 bg-red-500/10 text-red-600 ring-2 ring-red-500/25'
    }
  ];

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

      <div className="max-w-3xl mx-auto space-y-sm">
        
        {/* Header Title */}
        <div>
          <p className="text-primary font-bold tracking-wider uppercase text-[10px] sm:text-xs">Security Control</p>
          <h2 className="font-headline-sm text-headline-sm sm:font-headline-lg sm:text-headline-lg text-primary">{t('invite.user.title')}</h2>
          <p className="font-body-sm text-body-sm sm:font-body-md sm:text-body-md text-on-surface-variant max-w-2xl mt-px">
            {t('invite.user.subtitle')}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-sm px-sm py-xs bg-error-container/30 rounded-xl border border-error/20">
            <span className="material-symbols-outlined text-error text-[20px]">error</span>
            <p className="font-body-sm text-on-error-container font-semibold">{error}</p>
          </div>
        )}

        {/* Invitation Form */}
        <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-sm sm:p-md flex flex-col gap-md shadow-md">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm sm:gap-md">
            
            {/* Full Name */}
            <div className="flex flex-col gap-xs">
              <label htmlFor="inv-name" className="font-label-lg text-label-lg text-on-surface font-semibold">{t('full.name.label')}</label>
              <input
                id="inv-name" 
                type="text" 
                required
                value={form.name} 
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Dr. Elena Sterling"
                className="w-full px-sm py-xs bg-surface border border-outline-variant/35 rounded-xl font-body-md"
              />
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-xs">
              <label htmlFor="inv-email" className="font-label-lg text-label-lg text-on-surface font-semibold">{t('email.address.label')}</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-sm text-on-surface-variant text-[20px]">mail</span>
                <input
                  id="inv-email" 
                  type="email" 
                  required
                  value={form.email} 
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="staff@bishopmartin.edu"
                  className="w-full pl-xl pr-sm py-xs bg-surface border border-outline-variant/35 rounded-xl font-body-md"
                />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm sm:gap-md">
            
            {/* Phone Number */}
            <div className="flex flex-col gap-xs">
              <label htmlFor="inv-phone" className="font-label-lg text-label-lg text-on-surface font-semibold">{t('phone.number.label')}</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-sm text-on-surface-variant text-[20px]">call</span>
                <input
                  id="inv-phone" 
                  type="tel"
                  value={form.phone} 
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="+501 600-0000"
                  className="w-full pl-xl pr-sm py-xs bg-surface border border-outline-variant/35 rounded-xl font-body-md"
                />
              </div>
            </div>

            {/* Department */}
            <div className="flex flex-col gap-xs">
              <label htmlFor="inv-dept" className="font-label-lg text-label-lg text-on-surface font-semibold">{t('dept.title.label')}</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-sm text-on-surface-variant text-[20px]">school</span>
                <input
                  id="inv-dept" 
                  type="text"
                  value={form.department} 
                  onChange={(e) => setField('department', e.target.value)}
                  placeholder="e.g. Head of Registrar Office"
                  className="w-full pl-xl pr-sm py-xs bg-surface border border-outline-variant/35 rounded-xl font-body-md"
                />
              </div>
            </div>

          </div>

          {/* Interactive Role Cards Selection */}
          <div className="flex flex-col gap-xs pt-xs border-t border-outline-variant/15">
            <label className="font-label-lg text-label-lg text-on-surface font-semibold">{t('portal.role.label')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm mt-xs">
              {rolesConfig.map((roleOpt) => {
                const isActive = form.role === roleOpt.role;
                return (
                  <div
                    key={roleOpt.role}
                    onClick={() => setField('role', roleOpt.role)}
                    className={`p-sm border rounded-2xl cursor-pointer text-left flex flex-col justify-between h-full gap-sm transition-all duration-200 ${
                      isActive ? roleOpt.activeColor : 'bg-surface-container-lowest border-outline-variant/35 hover:bg-surface-container-low hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`p-xs rounded-xl ${isActive ? 'bg-white' : 'bg-surface'} flex`}>
                        <span className="material-symbols-outlined text-[20px]">{roleOpt.icon}</span>
                      </div>
                      {isActive && (
                        <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </div>
                    <div>
                      <p className="font-label-lg text-[13px] font-bold text-on-surface">{roleOpt.title}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium mt-[2px] leading-normal">{roleOpt.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/15 mt-sm">
            <button
              type="button"
              onClick={() => navigate('/superadmin/users')}
              className="px-lg py-xs font-label-lg text-on-surface-variant hover:bg-surface-container-high rounded-xl border border-transparent font-bold transition-all active:scale-95"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-lg py-xs bg-primary text-on-primary font-label-lg rounded-xl shadow-md hover:bg-primary-container disabled:opacity-50 flex items-center gap-xs font-bold transition-all active:scale-95"
            >
              {sending ? (
                <><span className="material-symbols-outlined animate-spin text-sm">sync</span> <span>{t('sending.invitation')}</span></>
              ) : (
                <><span className="material-symbols-outlined text-sm">send</span> <span>{t('send.invitation')}</span></>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
