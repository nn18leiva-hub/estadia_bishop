import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';

export default function Profile({ embedded = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={embedded ? '' : 'min-h-screen bg-background text-on-surface'}>
      {!embedded && <TopAppBar showBack />}

      <main className={embedded ? '' : 'pt-24 pb-24 px-sm md:px-gutter max-w-container-max mx-auto'}>
        <div className="mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-primary">{t('my.profile')}</h2>
          <p className="font-body-md text-on-surface-variant mt-xs">{t('profile.desc')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Avatar + Quick Info */}
          <div className="lg:col-span-4 flex flex-col gap-md">
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md flex flex-col items-center gap-md text-center">
              <div className="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center text-headline-lg text-on-primary font-bold shadow-sm">
                {initials}
              </div>
              <div>
                <p className="font-headline-sm text-headline-sm text-on-surface">{user?.name || t('parent.portal')}</p>
                <p className="font-body-sm text-on-surface-variant">{user?.email || '—'}</p>
                <span className="mt-xs inline-block px-sm py-0.5 bg-primary-fixed rounded-full font-label-md text-label-md text-primary capitalize">
                  {user?.role || t('parents').slice(0, -1)}
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-sm">{t('account.info')}</h3>
              {[
                { label: t('member.since'), value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-BZ') : '—' },
                { label: t('email'), value: user?.email || '—' },
                { label: t('role'), value: user?.role || t('parents').slice(0, -1), capitalize: true },
                { label: t('verification'), value: t('active.verified'), green: true },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-xs border-b border-outline-variant/10 last:border-none">
                  <p className="font-label-md text-label-md text-on-surface-variant">{item.label}</p>
                  <p className={`font-body-sm text-body-sm ${item.capitalize ? 'capitalize' : ''} ${item.green ? 'text-secondary font-semibold' : 'text-on-surface'}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-sm border border-error text-error py-sm rounded-lg font-label-lg hover:bg-error-container transition-all"
            >
              <span className="material-symbols-outlined">logout</span>
              {t('sign.out')}
            </button>
          </div>

          {/* Edit Profile */}
          <div className="lg:col-span-8 flex flex-col gap-md">
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-md">{t('edit.profile')}</h3>
              <div className="flex flex-col gap-md">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-lg text-label-lg text-on-surface">{t('full.name')}</label>
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)}
                      className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-lg text-label-lg text-on-surface">{t('phone.number')}</label>
                    <input
                      type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+501 600-0000"
                      className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-label-lg text-on-surface">{t('email.address')}</label>
                  <input
                    type="email" value={user?.email || ''} disabled
                    className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface-container font-body-md opacity-60"
                  />
                  <p className="font-body-sm text-on-surface-variant">{t('email.unchangeable')}</p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSave} disabled={saving}
                    className={`px-lg py-sm rounded-lg font-label-lg shadow-sm flex items-center gap-sm transition-all
                      ${saved ? 'bg-green-700 text-white' : 'bg-primary text-on-primary hover:bg-primary-container disabled:opacity-60'}`}
                  >
                    {saving ? <><span className="material-symbols-outlined animate-spin">sync</span> {t('saving')}</>
                      : saved ? <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {t('saved')}</>
                      : <><span className="material-symbols-outlined">save</span> {t('save.changes')}</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-md flex items-center gap-xs">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock</span>
                {t('security.password')}
              </h3>
              <div className="flex flex-col gap-md">
                <p className="font-body-sm text-on-surface-variant">
                  {t('sec.pw.desc')}
                </p>
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="self-start border border-primary text-primary px-md py-xs rounded-lg font-label-lg hover:bg-primary-fixed/30 transition-all"
                >
                  {t('change.password')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {!embedded && <BottomNav variant="parent" />}
    </div>
  );
}
