import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import bishopLogo from '../assets/bishop_martin_logo.png';

export default function StaffHeader({ title = 'staff.portal', showQueueButton = false, showBack = false, backTo = null }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  return (
    <header className="fixed top-0 left-0 md:left-80 right-0 z-50 bg-surface border-b border-outline-variant/30 h-16 flex items-center justify-between px-sm md:px-gutter">
      <div className="flex items-center gap-xs text-nowrap min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="p-2 hover:bg-surface-container-high rounded-full transition-colors mr-xs"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
        )}
        {!showBack && <img src={bishopLogo} alt="Bishop Martin" className="w-7 h-7 object-contain rounded-full hidden md:block" />}
        <h1 className="font-headline-sm text-headline-sm font-bold text-primary truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none">{t(title)}</h1>
      </div>
      <div className="flex items-center gap-xs sm:gap-md flex-shrink-0">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
          title={theme === 'light' ? t('dark.mode') : t('light.mode')}
          aria-label="Toggle theme"
        >
          <span className="material-symbols-outlined">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>

        {/* Language Toggle */}
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
          className="flex items-center gap-xs px-sm py-[6px] rounded-lg hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md transition-colors uppercase tracking-wider border border-outline-variant/30 font-bold"
          title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
        >
          <span className="material-symbols-outlined text-[18px]">language</span>
          <span>{language}</span>
        </button>

        {showQueueButton && (
          <button
            type="button"
            onClick={() => navigate('/staff/requests')}
            className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full"
            title="View Requests Queue"
          >
            pending_actions
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high text-primary transition-colors"
          title={t('my.profile')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>account_circle</span>
        </button>
      </div>
    </header>
  );
}
