import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import bishopLogo from '../assets/bishop_martin_logo.png';

const STAFF_NAV = [
  { icon: 'dashboard', label: 'Dashboard', to: '/staff' },
  { icon: 'rule', label: 'Queue', to: '/staff/requests' },
  { icon: 'payments', label: 'Payments', to: '/staff/payments' },
  { icon: 'settings', label: 'Settings', to: '/staff/settings' },
];

const ADMIN_NAV = [
  { icon: 'grid_view', label: 'Dashboard', to: '/superadmin' },
  { icon: 'group', label: 'Users', to: '/superadmin/users' },
  { icon: 'settings', label: 'Settings', to: '/superadmin/settings' },
];

export default function StaffSidebar({ variant = 'staff' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const navItems = variant === 'admin' ? ADMIN_NAV : STAFF_NAV;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (user?.full_name || user?.name)
    ? (user.full_name || user.name).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SM';

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-80 bg-surface-container-low border-r border-outline-variant/30 flex-col pt-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-xs px-sm h-16 border-b border-outline-variant/30">
        <img src={bishopLogo} alt="Bishop Martin" className="w-9 h-9 object-contain rounded-full" />
        <div>
          <p className="font-headline-sm text-headline-sm text-primary font-bold leading-tight">Bishop Martin</p>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
            {variant === 'admin' ? 'Admin Portal' : 'Staff Portal'}
          </p>
        </div>
      </div>

      {/* User Card */}
      <div className="px-sm py-md border-b border-outline-variant/20">
        <div className="flex items-center gap-sm p-sm bg-surface-container-lowest rounded-xl border border-outline-variant/30">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-headline-sm flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-body-md text-body-md font-semibold text-primary truncate">
              {user?.full_name || user?.name || 'Staff Member'}
            </p>
            <p className="text-label-md text-on-surface-variant truncate">
              {user?.email || 'Registrar Office'}
            </p>
            <span className="text-[10px] uppercase tracking-widest text-on-tertiary-container font-bold">
              {variant === 'admin' ? t('super.admin') : t('staff.access')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1 px-xs py-sm gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/staff' || item.to === '/superadmin'}
            className={({ isActive }) =>
              `flex items-center gap-md px-sm py-3 rounded-r-full font-semibold transition-all
              ${isActive
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-body-md text-body-md">{t(item.label.toLowerCase())}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-sm py-md border-t border-outline-variant/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-sm text-on-surface-variant hover:text-error transition-colors w-full px-sm py-2 rounded-lg hover:bg-error-container/30"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span className="font-label-lg text-label-lg">{t('sign.out')}</span>
        </button>
      </div>
    </aside>
  );
}
