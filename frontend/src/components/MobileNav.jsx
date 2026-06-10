import React from 'react';
import { NavLink } from 'react-router-dom';

const MobileNav = () => {
  const navItems = [
    { to: "/dashboard/parents", label: "Dashboard", icon: "dashboard", end: true },
    { to: "/dashboard/parents/new", label: "Requests", icon: "description" },
    { to: "/dashboard/parents/bank-details", label: "Payments", icon: "wallet" },
    { to: "/profile", label: "Profile", icon: "person" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-base py-sm bg-surface border-t border-outline-variant/20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center gap-1 transition-all duration-150 ${
                isActive 
                ? "bg-primary-container/10 text-primary px-5 py-2 rounded-full" 
                : "text-on-surface-variant hover:text-primary active:scale-90"
              }`
            }
        >
          <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
          <span className="font-label-md text-[10px] uppercase font-bold tracking-tight">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNav;
