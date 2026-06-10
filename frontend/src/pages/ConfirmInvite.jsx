import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function ConfirmInvite() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { t } = useLanguage();
  const email = state?.email || 'user@bishopmartin.edu';
  const name = state?.name || 'New User';

  return (
    <div className="animate-in fade-in duration-500 flex items-center justify-center px-sm py-xl">
      <div className="max-w-lg w-full flex flex-col items-center text-center gap-lg">
        {/* Icon */}
        <div className="w-28 h-28 rounded-full bg-secondary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: '56px', fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
        </div>

        {/* Text */}
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">{t('invitation.sent')}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
            {t('invitation.sent.to')} <strong>{name}</strong>.
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            <span className="font-mono text-primary">{email}</span>
          </p>
        </div>

        {/* Info */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md w-full text-left">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-md">{t('next.steps')}</h3>
          <div className="flex flex-col gap-sm">
            {[
              { icon: 'mail', text: t('invite.step1') },
              { icon: 'password', text: t('invite.step2') },
              { icon: 'admin_panel_settings', text: t('invite.step3') },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5" style={{ fontSize: '20px' }}>{item.icon}</span>
                <p className="font-body-sm text-on-surface-variant">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-sm w-full">
          <button
            onClick={() => navigate('/superadmin/users/invite')}
            className="flex-1 border border-primary text-primary py-sm rounded-lg font-label-lg hover:bg-primary-fixed/30 flex items-center justify-center gap-sm transition-all"
          >
            <span className="material-symbols-outlined">person_add</span>
            {t('invite.another')}
          </button>
          <button
            onClick={() => navigate('/superadmin/users')}
            className="flex-1 bg-primary text-on-primary py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container flex items-center justify-center gap-sm transition-all"
          >
            <span className="material-symbols-outlined">group</span>
            {t('all.users')}
          </button>
        </div>
      </div>
    </div>
  );
}
