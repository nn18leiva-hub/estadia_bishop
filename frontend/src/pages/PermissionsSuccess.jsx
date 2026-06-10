import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function PermissionsSuccess() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="animate-in fade-in duration-500 flex items-center justify-center px-sm py-xl">
      <div className="max-w-md w-full flex flex-col items-center text-center gap-lg">
        {/* Icon */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '56px', fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center border-4 border-background">
            <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
        </div>

        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">{t('permissions.updated')}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
            {t('permissions.success.msg')}
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md w-full flex flex-col gap-sm">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <p className="font-body-sm text-on-surface-variant">{t('changes.applied')}</p>
          </div>
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <p className="font-body-sm text-on-surface-variant">{t('user.notified.email')}</p>
          </div>
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <p className="font-body-sm text-on-surface-variant">{t('audit.log.updated')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-sm w-full">
          <button
            onClick={() => navigate(-2)}
            className="flex-1 border border-primary text-primary py-sm rounded-lg font-label-lg hover:bg-primary-fixed/30 flex items-center justify-center gap-sm"
          >
            <span className="material-symbols-outlined">person</span>
            {t('back.to.user')}
          </button>
          <button
            onClick={() => navigate('/superadmin/users')}
            className="flex-1 bg-primary text-on-primary py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container flex items-center justify-center gap-sm"
          >
            <span className="material-symbols-outlined">group</span>
            {t('all.users')}
          </button>
        </div>
      </div>
    </div>
  );
}
