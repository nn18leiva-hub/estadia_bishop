import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function TopAppBar({ showBack = false, backTo = null, title = 'Bishop Martin Parent Portal', showNotifications = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  // Smart "home" navigation based on who is logged in
  const homeRoute = () => {
    const role = user?.role || user?.type;
    if (role === 'staff' || role === 'registrar') return '/staff';
    if (role === 'superadmin' || role === 'admin' || role === 'super_admin') return '/superadmin/users';
    return '/dashboard/parents';
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface border-b border-outline-variant/30 h-16">
      <div className="flex justify-between items-center px-sm md:px-gutter max-w-container-max mx-auto h-full">
        {/* Left */}
        <div className="flex items-center gap-xs">
          {showBack && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-primary font-semibold text-sm hover:opacity-80 mr-xs"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
              <span className="hidden sm:inline">{t('back')}</span>
            </button>
          )}
          <button
            onClick={() => navigate(homeRoute())}
            className="flex items-center gap-xs cursor-pointer active:opacity-80 hover:opacity-80 transition-opacity"
            aria-label="Go to dashboard"
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>school</span>
            <h1 className="font-headline-md text-headline-md font-bold text-primary hidden sm:block">{t(title)}</h1>
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-xs sm:gap-md flex-shrink-0">
          {/* Theme Toggle */}
          <button
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
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="flex items-center gap-xs px-sm py-[6px] rounded-lg hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md transition-colors uppercase tracking-wider border border-outline-variant/30 font-bold"
            title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
          >
            <span className="material-symbols-outlined text-[18px]">language</span>
            <span>{language}</span>
          </button>

          {showNotifications && (
            <button
              onClick={() => navigate('/dashboard/parents/new')}
              className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full cursor-pointer"
              aria-label="New request"
              title={t('new.request')}
            >
              add_circle
            </button>
          )}
          <button
            className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high text-primary transition-colors"
            onClick={() => navigate('/profile')}
            aria-label="My profile"
            title={t('my.profile')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>account_circle</span>
          </button>
        </div>
      </div>
    </header>
  );
}
