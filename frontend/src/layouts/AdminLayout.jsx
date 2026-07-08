import React, { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const AdminLayout = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  React.useEffect(() => {
    if (!loading) {
      if (!user) navigate('/login');
      if (user?.type === 'parent' || user?.type === 'past_student') {
        navigate('/dashboard/parents');
      }
    }
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const isSuperAdmin = user?.role === 'super_admin';

  const navItems = isSuperAdmin ? [
    { label: 'Dashboard', icon: 'grid_view', path: '/superadmin' },
    { label: 'Users', icon: 'group', path: '/superadmin/users' },
    { label: 'Settings', icon: 'person', path: '/superadmin/settings' },
  ] : [
    { label: 'Dashboard', icon: 'grid_view', path: '/staff' },
    { label: 'Requests', icon: 'inbox', path: '/staff/requests' },
    { label: 'Settings', icon: 'person', path: '/staff/settings' },
  ];

  const SidebarContent = ({ onLinkClick }) => (
    <>
      {/* Logo / Branding */}
      <div className="flex items-center gap-sm mb-lg px-sm">
        <div className="w-10 h-10 bg-primary flex items-center justify-center rounded flex-shrink-0">
          <span className="material-symbols-outlined text-on-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
        </div>
        <div>
          <h1 className="font-headline-sm text-headline-sm text-primary leading-tight">Bishop Martin</h1>
          <p className="font-label-md text-label-md text-on-surface-variant">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-xs flex-grow">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/staff' && item.path !== '/superadmin' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onLinkClick}
              className={`flex items-center gap-sm px-sm py-[10px] transition-colors duration-150 font-label-lg text-label-lg ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span>{t(item.label.toLowerCase())}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="pt-md border-t border-outline-variant/20 mt-auto">
        <div className="flex items-center gap-sm px-sm py-sm">
          <span className="material-symbols-outlined text-on-surface-variant text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          <div className="flex-grow min-w-0">
            <p className="font-label-lg text-label-lg text-on-surface truncate">{user.full_name || 'Administrator'}</p>
            <p className="font-label-md text-label-md text-on-surface-variant truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-xs hover:bg-surface-container-high rounded-full text-on-surface-variant flex-shrink-0"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
        <p className="font-label-md text-label-md text-on-surface-variant px-sm opacity-50 pb-xs">v1.0.4</p>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background font-body-md text-on-surface overflow-x-hidden">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-screen w-80 bg-surface border-r border-outline-variant/20 flex-col p-md fixed left-0 top-0 bottom-0 z-40">
        <SidebarContent onLinkClick={null} />
      </aside>

      {/* Main Content */}
      <main className="flex-grow md:ml-80 flex flex-col min-h-screen w-full max-w-[100vw] overflow-x-hidden">

        {/* Top App Bar */}
        <header className="flex items-center justify-between px-xs sm:px-sm w-full h-14 sm:h-16 z-30 bg-surface border-b border-outline-variant/20 sticky top-0 md:h-[72px]">
          <div className="flex items-center gap-xs sm:gap-sm min-w-0">
            {/* Hamburger (mobile only) */}
            <button
              className="md:hidden p-[2px] cursor-pointer active:opacity-80 flex-shrink-0"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined text-primary">menu</span>
            </button>
            <span className="font-label-lg text-label-lg font-semibold text-primary sm:font-headline-sm sm:text-headline-sm lg:font-headline-md lg:text-headline-md truncate">
              {isSuperAdmin ? t('superadmin.console') : t('staff.portal')}
            </span>
          </div>
          <div className="flex items-center gap-[4px] sm:gap-xs md:gap-md flex-shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-1 sm:p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
              title={theme === 'light' ? t('dark.mode') : t('light.mode')}
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="flex items-center gap-[2px] sm:gap-xs px-xs sm:px-sm py-[4px] sm:py-[6px] rounded-lg hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md transition-colors uppercase tracking-wider border border-outline-variant/30 font-bold"
              title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">language</span>
              <span className="text-[10px] sm:text-label-md">{language}</span>
            </button>

            <button
              onClick={() => navigate(isSuperAdmin ? '/superadmin/settings' : '/staff/settings')}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-primary-container text-on-primary-container hover:opacity-90 transition-opacity md:w-12 md:h-12"
              title={t('my.profile')}
            >
              <span className="material-symbols-outlined text-[22px] sm:text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-xs sm:p-md md:p-lg flex-grow w-full max-w-[1200px] mx-auto overflow-x-hidden">
          <div key={location.pathname} className="animate-page">
            <Outlet />
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-base py-sm bg-surface border-t border-outline-variant/20">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/staff' && item.path !== '/superadmin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={`mob-${item.path}`}
                to={item.path}
                className={`flex flex-col items-center justify-center active:scale-95 transition-all ${
                  isActive
                    ? 'bg-primary-container text-white rounded-full px-4 py-1'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className="font-label-md text-label-md">{t(item.label.toLowerCase())}</span>
              </Link>
            );
          })}
        </nav>

        {/* Spacer for mobile nav */}
        <div className="h-20 md:hidden" />
      </main>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <aside
            className="w-80 h-full bg-surface p-md flex flex-col gap-base"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-base">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 bg-primary flex items-center justify-center rounded">
                  <span className="material-symbols-outlined text-on-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                </div>
                <h1 className="font-headline-sm text-headline-sm text-primary">Bishop Martin</h1>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-base hover:bg-surface-container-high rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <SidebarContent onLinkClick={() => setIsSidebarOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
