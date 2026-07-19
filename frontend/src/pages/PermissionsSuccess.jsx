import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function PermissionsSuccess() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex items-center justify-center px-sm py-md sm:py-xl">
      <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-sm sm:p-md shadow-lg flex flex-col items-center text-center gap-md">
        
        {/* Animated Check / Lock Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center border-4 border-white shadow-md">
            <span className="material-symbols-outlined text-[16px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
          </div>
        </div>

        {/* Success texts */}
        <div className="space-y-xs">
          <h1 className="font-headline-sm text-headline-sm sm:font-headline-lg sm:text-headline-lg text-primary font-bold">{t('permissions.updated')}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mx-auto leading-relaxed">
            {t('permissions.success.msg')}
          </p>
        </div>

        {/* Audits Summary Details Card */}
        <div className="bg-surface border border-outline-variant/15 rounded-xl p-sm w-full text-left space-y-sm">
          <h3 className="font-label-lg text-label-lg text-primary font-bold flex items-center gap-xs border-b border-outline-variant/10 pb-xs">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span>Security Audits Applied</span>
          </h3>
          <div className="flex flex-col gap-sm">
            {[
              { icon: 'check_circle', text: t('changes.applied') },
              { icon: 'check_circle', text: t('user.notified.email') },
              { icon: 'check_circle', text: t('audit.log.updated') },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary text-[20px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant font-medium leading-normal">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-sm w-full pt-xs border-t border-outline-variant/10">
          <button
            onClick={() => navigate(-2)}
            className="flex-grow border border-primary text-primary py-xs rounded-xl font-label-lg font-bold hover:bg-primary/5 flex items-center justify-center gap-xs active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
            <span>{t('back.to.user')}</span>
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
