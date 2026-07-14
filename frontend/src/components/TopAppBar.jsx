import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiFetch } from '../services/api';
import bishopLogo from '../assets/bishop_martin_logo.png';

export default function TopAppBar({ showBack = false, backTo = null, title = 'Bishop Martin Parent Portal', showNotifications = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [notifications, setNotifications] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isParent = user && (user.type === 'parent' || user.type === 'past_student' || user.user_type === 'parent' || user.user_type === 'past_student');

  const fetchNotifications = async () => {
    try {
      if (isParent) {
        const data = await apiFetch('/parent/notifications');
        setNotifications(data || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications every 15 seconds
    let interval;
    if (isParent) {
      interval = setInterval(fetchNotifications, 15000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/parent/notifications/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await apiFetch(`/parent/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

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
            <img src={bishopLogo} alt="Bishop Martin" className="w-8 h-8 object-contain rounded-full" />
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

          {/* Notification Bell (Only for Parents) */}
          {isParent && (
            <div className="relative">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant relative transition-colors cursor-pointer"
                title={t('notifications')}
                aria-label="View notifications"
              >
                <span className="material-symbols-outlined text-[24px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-error text-on-error font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse border border-surface">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}

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

      {/* Notifications Sliding Drawer */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-surface-container-lowest z-50 shadow-2xl border-l border-outline-variant/20 flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-md border-b border-outline-variant/20 bg-surface-container-low">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">notifications</span>
            <h2 className="font-headline-sm text-headline-sm font-bold text-primary">{t('notifications')}</h2>
          </div>
          <button 
            onClick={() => setDrawerOpen(false)}
            className="p-1 hover:bg-surface-container-high rounded-full cursor-pointer text-on-surface-variant flex items-center justify-center"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Action Header */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="flex justify-end px-md py-xs border-b border-outline-variant/10 bg-surface-container-lowest flex-shrink-0">
            <button 
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">done_all</span>
              {t('mark.all.read')}
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/10">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant p-md">
              <span className="material-symbols-outlined text-[48px] opacity-40 mb-xs">notifications_off</span>
              <p className="font-body-md font-semibold">{t('no.notifications')}</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.notification_id}
                className={`p-md transition-colors flex flex-col gap-1 cursor-pointer hover:bg-surface-container-highest ${
                  !n.read ? 'bg-primary-container/10 border-l-4 border-primary' : 'bg-surface-container-lowest'
                }`}
                onClick={() => !n.read && handleMarkRead(n.notification_id)}
              >
                <div className="flex justify-between items-start gap-xs">
                  <span className={`font-body-md font-bold ${!n.read ? 'text-primary' : 'text-on-surface'}`}>
                    {n.title}
                  </span>
                  {!n.read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {n.message}
                </p>
                <span className="text-[10px] text-outline font-semibold uppercase tracking-wider mt-1 block">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </header>
  );
}
