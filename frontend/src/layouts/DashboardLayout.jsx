import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayout = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen pb-24 md:pb-0">
      {/* TopAppBar Component - 1:1 Implementation */}
      <header className="bg-surface dark:bg-surface-dim flex items-center justify-between px-sm w-full h-16 z-50 border-b border-outline-variant/20 sticky top-0">
        <div className="flex items-center gap-sm">
          <button className="material-symbols-outlined text-primary dark:text-primary-fixed-dim cursor-pointer active:opacity-80 p-2 hover:bg-surface-container-high transition-colors rounded-full">menu</button>
          <h1 className="font-headline-sm text-headline-sm font-semibold text-primary truncate hidden sm:block">Bishop Martin Parent Portal</h1>
          <h1 className="font-label-lg text-label-lg font-semibold text-primary sm:hidden">BM Portal</h1>
        </div>
        <div className="flex items-center gap-sm">
          <button className="material-symbols-outlined text-primary dark:text-primary-fixed-dim cursor-pointer active:opacity-80 p-2 hover:bg-surface-container-high transition-colors rounded-full" aria-label="Back" onClick={() => navigate(-1)}>arrow_back</button>
          <div className="hidden md:flex gap-md px-md">
            <Link to="/dashboard/parents" className="font-label-lg text-label-lg text-primary cursor-pointer">Overview</Link>
            <Link to="/help" className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary cursor-pointer transition-colors">Support</Link>
          </div>
          <Link to="/profile" className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold overflow-hidden cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined text-on-primary text-2xl">account_circle</span>
          </Link>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-gutter py-lg">
        <Outlet />
      </main>

      {/* BottomNavBar Component (Mobile Only) - 1:1 Implementation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-base py-sm bg-surface dark:bg-surface-dim border-t border-outline-variant/20">
        <button 
          className="flex flex-col items-center justify-center bg-primary-container text-on-primary rounded-full px-4 py-1 active:scale-95 transition-transform duration-150" 
          onClick={() => navigate('/dashboard/parents')}
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-md text-label-md">Dashboard</span>
        </button>
        <button 
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary active:scale-95 transition-transform duration-150" 
          onClick={() => navigate('/dashboard/parents/new')}
        >
          <span className="material-symbols-outlined">description</span>
          <span className="font-label-md text-label-md">Requests</span>
        </button>
        <button 
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary active:scale-95 transition-transform duration-150" 
          onClick={() => navigate('/profile')}
        >
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-md text-label-md">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default DashboardLayout;
