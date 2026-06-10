import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const PARENT_TABS = [
  { icon: 'dashboard', label: 'Dashboard', to: '/dashboard/parents' },
  { icon: 'description', label: 'Requests', to: '/dashboard/parents/history' },
  { icon: 'verified_user', label: 'Verify', to: '/dashboard/parents/upload-ssn' },
  { icon: 'person', label: 'Profile', to: '/profile' },
];

const STAFF_TABS = [
  { icon: 'grid_view', label: 'Hub', to: '/staff' },
  { icon: 'pending_actions', label: 'Requests', to: '/staff/requests' },
  { icon: 'verified_user', label: 'Verification', to: '/staff/verification' },
  { icon: 'payments', label: 'Payments', to: '/staff/payments' },
  { icon: 'history', label: 'History', to: '/staff/history' },
];

export default function BottomNav({ variant = 'parent' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const tabs = variant === 'staff' ? STAFF_TABS : PARENT_TABS;

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 bg-surface border-t border-outline-variant h-20 pb-safe px-4 flex justify-around items-center">
      {tabs.map((tab) => {
        const isActive = pathname === tab.to || pathname.startsWith(tab.to + '/');
        return (
          <button
            key={tab.to}
            onClick={() => navigate(tab.to)}
            className={`flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform px-2 py-1 rounded-full
              ${isActive
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:text-primary'
              }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{tab.icon}</span>
            <span className="text-[10px] font-semibold tracking-wide">{t(tab.label.toLowerCase())}</span>
          </button>
        );
      })}
    </nav>
  );
}
