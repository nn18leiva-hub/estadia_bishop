import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import bishopLogo from '../assets/bishop_martin_logo.png';

const AdminLayout = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/login');
      if (user?.type === 'parent' || user?.type === 'past_student') {
        navigate('/dashboard/parents');
      }
    }
  }, [user, loading, navigate]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading || !user) return null;

  const isSuperAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const navItems = isSuperAdmin ? [
    { label: 'Dashboard', icon: 'grid_view', path: '/superadmin' },
    { label: 'Users', icon: 'group', path: '/superadmin/users' },
    { label: 'Pricing', icon: 'payments', path: '/superadmin/pricing' },
    { label: 'Settings', icon: 'person', path: '/superadmin/settings' },
  ] : [
    { label: 'Dashboard', icon: 'grid_view', path: '/staff' },
    { label: 'Requests', icon: 'inbox', path: '/staff/requests' },
    { label: 'Settings', icon: 'person', path: '/staff/settings' },
  ];

  const initials = (user.full_name || user.name || 'Admin')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const SidebarContent = ({ onLinkClick }) => (
    <div className="flex flex-col h-full">
      {/* Logo / Branding */}
      <div className="flex items-center gap-sm mb-lg px-sm">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-outline-variant/30 flex-shrink-0 overflow-hidden shadow-sm">
          <img src={bishopLogo} alt="BMHS Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-headline-sm text-headline-sm text-primary font-bold leading-tight">Bishop Martin</h1>
          <p className="font-label-md text-label-md text-on-surface-variant font-semibold uppercase tracking-widest text-[9px] opacity-80">
            {isSuperAdmin ? t('super.admin') : t('staff.access')}
          </p>
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
              className={`flex items-center gap-sm px-sm py-[12px] transition-all duration-200 rounded-xl font-label-lg text-label-lg relative group ${
                isActive
                  ? 'bg-primary/5 text-primary font-bold border-l-4 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'
                }`}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span>{t(item.label.toLowerCase())}</span>
              {isActive && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="pt-md border-t border-outline-variant/20 mt-auto">
        <div className="flex items-center gap-sm px-sm py-xs">
          <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-body-lg shadow-sm border border-outline-variant/20 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-grow min-w-0">
            <p className="font-label-lg text-label-lg text-on-surface truncate font-semibold">{user.full_name || 'Administrator'}</p>
            <p className="font-label-md text-label-md text-on-surface-variant truncate text-[11px] opacity-75">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-xs hover:bg-error-container hover:text-error rounded-xl text-on-surface-variant flex-shrink-0 transition-colors duration-150"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
        <div className="flex justify-between items-center px-sm mt-sm">
          <p className="font-label-md text-label-md text-on-surface-variant opacity-40 text-[10px]">Portal v2.0.0</p>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" title="System Connected" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background font-body-md text-on-surface overflow-x-hidden">
      
      {/* Desktop Sidebar (Floating panel aesthetics) */}
      <aside className="hidden md:flex h-screen w-80 bg-surface border-r border-outline-variant/20 flex-col p-md fixed left-0 top-0 bottom-0 z-40">
        <div className="h-full bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-sm shadow-sm flex flex-col">
          <SidebarContent onLinkClick={null} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow md:ml-80 flex flex-col min-h-screen w-full max-w-[100vw] overflow-x-hidden">
        
        {/* Top App Bar (Header) */}
        <header className="flex items-center justify-between px-sm w-full h-16 z-30 bg-surface/85 backdrop-blur-md border-b border-outline-variant/20 sticky top-0 md:h-[72px]">
          <div className="flex items-center gap-xs min-w-0">
            {/* Hamburger Button (Mobile only) */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-surface-container-high active:scale-95 transition-all text-primary flex-shrink-0"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation drawer"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            
            {/* Title / Portal Name */}
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm sm:font-headline-md sm:text-headline-md text-primary font-bold leading-tight truncate">
                {isSuperAdmin ? t('superadmin.console') : t('staff.portal')}
              </span>
            </div>
          </div>

          {/* Right Header actions */}
          <div className="flex items-center gap-xs sm:gap-sm flex-shrink-0">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-all duration-200 active:scale-95 border border-outline-variant/10"
              title={theme === 'light' ? t('dark.mode') : t('light.mode')}
              aria-label="Toggle visual theme"
            >
              <span className="material-symbols-outlined text-[22px] transition-transform duration-300 hover:rotate-45">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            {/* Language Selection */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="flex items-center gap-xs px-sm py-[7px] rounded-xl hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md transition-all active:scale-95 uppercase tracking-wider border border-outline-variant/20 font-bold bg-surface-container-lowest/50"
              title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
            >
              <span className="material-symbols-outlined text-[18px]">language</span>
              <span className="text-[11px] font-semibold">{language}</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-primary-container text-on-primary-container hover:opacity-95 active:scale-95 transition-all shadow-sm border border-outline-variant/10"
                title={t('my.profile')}
              >
                <span className="material-symbols-outlined text-[24px] sm:text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-xs w-56 rounded-xl bg-surface-container-lowest border border-outline-variant/35 shadow-lg py-xs z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-sm py-xs border-b border-outline-variant/10">
                    <p className="font-label-lg text-label-lg text-on-surface font-bold truncate">{user.full_name || 'Admin User'}</p>
                    <p className="text-label-md text-on-surface-variant truncate text-[11px] opacity-75">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(isSuperAdmin ? '/superadmin/settings' : '/staff/settings');
                    }}
                    className="w-full text-left px-sm py-sm hover:bg-surface-container-low transition-colors text-on-surface font-body-sm flex items-center gap-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                    <span>{t('my.profile')}</span>
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-sm py-sm hover:bg-error-container/30 hover:text-error transition-colors text-on-surface font-body-sm flex items-center gap-sm border-t border-outline-variant/10"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>{t('sign.out')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Grid */}
        <div className="p-sm md:p-md lg:p-lg flex-grow w-full max-w-[1200px] mx-auto overflow-x-hidden pb-20">
          <div key={location.pathname} className="animate-page">
            <Outlet />
          </div>
        </div>

        {/* Mobile Bottom Navigation (Visible on small screens) */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-sm py-xs bg-surface/90 backdrop-blur-md border-t border-outline-variant/20 shadow-lg pb-safe">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/staff' && item.path !== '/superadmin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={`mob-${item.path}`}
                to={item.path}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'text-primary font-bold bg-primary/5'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] font-semibold mt-[2px]">{t(item.label.toLowerCase())}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Navigation Drawer Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm transition-all duration-300"
            onClick={() => setIsSidebarOpen(false)}
          >
            <aside
              className="w-80 h-full bg-surface p-md flex flex-col gap-base animate-in slide-in-from-left duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-sm border-b border-outline-variant/10 pb-sm">
                <div className="flex items-center gap-xs">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-outline-variant/30 overflow-hidden flex-shrink-0">
                    <img src={bishopLogo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <h1 className="font-headline-sm text-headline-sm text-primary font-bold">Bishop Martin</h1>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-xl hover:bg-surface-container-high transition-colors text-on-surface-variant"
                  aria-label="Close drawer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-xs no-scrollbar">
                <SidebarContent onLinkClick={() => setIsSidebarOpen(false)} />
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminLayout;
