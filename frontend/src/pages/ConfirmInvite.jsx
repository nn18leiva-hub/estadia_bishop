import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function ConfirmInvite() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { t } = useLanguage();
  const email = state?.email || 'user@bishopmartin.edu';
  const name = state?.name || 'New User';

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex items-center justify-center px-sm py-md sm:py-xl">
      <div className="max-w-lg w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-sm sm:p-md shadow-lg flex flex-col items-center text-center gap-md">
        
        {/* Animated Check / Read Mail Icon */}
        <div className="w-24 h-24 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 animate-pulse" />
          <span className="material-symbols-outlined text-on-secondary-container text-[48px] relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
        </div>

        {/* Success message texts */}
        <div className="space-y-xs">
          <h1 className="font-headline-sm text-headline-sm sm:font-headline-lg sm:text-headline-lg text-primary font-bold">{t('invitation.sent')}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            {t('invitation.sent.to')} <strong className="text-on-surface font-semibold">{name}</strong>.
          </p>
          <div className="inline-block bg-surface px-sm py-[4px] rounded-lg border border-outline-variant/20 font-mono text-primary text-[13px] font-semibold">
            {email}
          </div>
        </div>

        {/* Detailed checklist of next steps */}
        <div className="bg-surface border border-outline-variant/15 rounded-xl p-sm text-left w-full space-y-sm">
          <h3 className="font-label-lg text-label-lg text-primary font-bold flex items-center gap-xs border-b border-outline-variant/10 pb-xs">
            <span className="material-symbols-outlined text-[18px]">list_alt</span>
            <span>{t('next.steps')}</span>
          </h3>
          <div className="flex flex-col gap-sm">
            {[
              { icon: 'mail_outline', text: t('invite.step1') },
              { icon: 'password', text: t('invite.step2') },
              { icon: 'admin_panel_settings', text: t('invite.step3') },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-sm">
                <div className="w-6 h-6 rounded-lg bg-primary/5 text-primary flex items-center justify-center flex-shrink-0 mt-[2px] border border-outline-variant/10">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0" }}>{item.icon}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-normal">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-sm w-full pt-xs border-t border-outline-variant/10">
          <button
            onClick={() => navigate('/superadmin/users/invite')}
            className="flex-grow border border-primary text-primary py-xs rounded-xl font-label-lg font-bold hover:bg-primary/5 flex items-center justify-center gap-xs active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>{t('invite.another')}</span>
          </button>
          <button
            onClick={() => navigate('/superadmin/users')}
            className="flex-grow bg-primary text-on-primary py-xs rounded-xl font-label-lg font-bold hover:bg-primary-container flex items-center justify-center gap-xs active:scale-[0.98] transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span>{t('all.users')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
