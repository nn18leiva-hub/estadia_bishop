import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ className = "" }) => {
  const { user, logout } = useAuth();

  const getHomeLink = () => {
    if (user?.role === 'super_admin') return '/superadmin';
    if (user?.type === 'staff') return '/staff';
    return '/dashboard/parents';
  };

  const navLinks = [
    { to: "/dashboard/parents", label: "Dashboard", icon: "dashboard", end: true },
    { to: "/dashboard/parents/bank-details", label: "Payments", icon: "wallet" },
    { to: "/profile", label: "Account Setting", icon: "person" },
    { to: "/help", label: "Help Center", icon: "help_center" },
  ];

  return (
    <aside className={`w-[260px] h-[calc(100vh-64px)] fixed left-0 top-16 bg-surface border-r border-outline-variant/20 p-md flex flex-col z-40 ${className}`}>
      <nav className="flex-grow space-y-xs">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => 
              `flex items-center gap-md p-sm rounded-xl transition-all font-label-lg text-label-lg ${
                isActive 
                ? "bg-primary-container/10 text-primary border border-secondary/20 shadow-sm" 
                : "text-on-surface-variant hover:bg-surface-container-high"
              }`
            }
          >
            <span className="material-symbols-outlined">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="pt-md border-t border-outline-variant/20">
        <div className="flex items-center gap-md p-sm mb-sm bg-surface-container-low rounded-xl">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold">
             {user?.full_name?.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-on-surface font-semibold truncate">{user?.full_name}</p>
            <p className="text-xs text-on-surface-variant opacity-70 uppercase tracking-tighter truncate">{user?.type?.replace('_', ' ')}</p>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-md p-sm rounded-xl text-error font-label-lg text-label-lg hover:bg-error-container/10 transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Disconnect</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
