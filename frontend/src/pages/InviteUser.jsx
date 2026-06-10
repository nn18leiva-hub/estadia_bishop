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

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

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

      <div className="max-w-2xl">
        <div className="mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-primary">{t('invite.user.title')}</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            {t('invite.user.subtitle')}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-sm mb-md px-sm py-xs bg-error-container rounded-lg border border-error/20">
            <span className="material-symbols-outlined text-error">error</span>
            <p className="font-body-sm text-on-error-container">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md flex flex-col gap-md shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label htmlFor="inv-name" className="font-label-lg text-label-lg text-on-surface">{t('full.name.label')}</label>
              <input
                id="inv-name" type="text" required
                value={form.name} onChange={set('name')}
                placeholder="e.g. Dr. Elena Sterling"
                className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label htmlFor="inv-email" className="font-label-lg text-label-lg text-on-surface">{t('email.address.label')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">mail</span>
                <input
                  id="inv-email" type="email" required
                  value={form.email} onChange={set('email')}
                  placeholder="staff@bishopmartin.edu"
                  className="w-full pl-10 pr-4 py-xs border border-outline-variant/50 rounded-lg bg-surface font-body-md"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label htmlFor="inv-phone" className="font-label-lg text-label-lg text-on-surface">{t('phone.number.label')}</label>
              <input
                id="inv-phone" type="tel"
                value={form.phone} onChange={set('phone')}
                placeholder="+501 600-0000"
                className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label htmlFor="inv-role" className="font-label-lg text-label-lg text-on-surface">{t('portal.role.label')}</label>
              <select
                id="inv-role" value={form.role} onChange={set('role')}
                className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
              >
                <option value="staff">{t('staff.registrar')}</option>
                <option value="admin">{t('administrator')}</option>
                <option value="superadmin">{t('super.admin')}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label htmlFor="inv-dept" className="font-label-lg text-label-lg text-on-surface">{t('dept.title.label')}</label>
            <input
              id="inv-dept" type="text"
              value={form.department} onChange={set('department')}
              placeholder="e.g. Head of Registrar"
              className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
            />
          </div>

          {/* Role Info */}
          <div className="bg-surface-container rounded-lg p-sm border border-outline-variant/10 flex gap-sm">
            <span className="material-symbols-outlined text-primary flex-shrink-0">info</span>
            <p className="font-body-sm text-on-surface-variant">
              {t('role.info.text')}
            </p>
          </div>

          <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => navigate('/superadmin/users')}
              className="px-lg py-sm font-label-lg text-on-surface-variant hover:bg-surface-container-high rounded-lg"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-lg py-sm bg-primary text-on-primary font-label-lg rounded-lg shadow-sm hover:bg-primary-container disabled:opacity-60 flex items-center gap-sm transition-all"
            >
              {sending ? (
                <><span className="material-symbols-outlined animate-spin">sync</span> {t('sending.invitation')}</>
              ) : (
                <><span className="material-symbols-outlined">send</span> {t('send.invitation')}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
