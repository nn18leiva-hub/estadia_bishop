import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      // Backend returns: { type: "staff"|"parent"|"past_student", role: "super_admin"|"admin"|"viewer"|undefined }
      const role = result?.role;
      const type = result?.type;

      if (role === 'admin' || role === 'super_admin') {
        navigate('/superadmin');
      } else if (role === 'staff' || role === 'viewer' || type === 'staff') {
        navigate('/staff');
      } else {
        // parent or past_student
        navigate('/dashboard/parents');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      {/* Top brand strip */}
      <header className="flex items-center justify-between px-sm md:px-lg h-16 border-b border-outline-variant/20 bg-surface">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>school</span>
          <span className="font-headline-sm text-headline-sm text-primary font-bold">Bishop Martin</span>
        </div>
        <div className="flex items-center gap-md">
          <span className="text-label-md text-on-surface-variant hidden md:block">
            {t('copyright')}
          </span>
          
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
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-sm py-xl">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-sm overflow-hidden">
            {/* Card top accent */}
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary-container to-secondary" />

            <div className="p-lg">
              {/* Icon + Title */}
              <div className="flex flex-col items-center mb-lg">
                <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center mb-md">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '36px' }}>account_balance</span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-primary text-center">{t('welcome.back')}</h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-center mt-xs">
                  {t('login.subtitle')}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-sm mb-md px-sm py-xs bg-error-container rounded-lg border border-error/20">
                  <span className="material-symbols-outlined text-error text-lg">error</span>
                  <p className="font-body-sm text-body-sm text-on-error-container">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-md">
                {/* Email */}
                <div className="flex flex-col gap-xs">
                  <label htmlFor="email" className="font-label-lg text-label-lg text-on-surface">{t('email.address')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">mail</span>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="guardian@example.com"
                      className="w-full pl-10 pr-4 py-sm border border-outline-variant/50 rounded-lg bg-surface font-body-md text-body-md transition-all placeholder:text-on-surface-variant/50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-xs">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="font-label-lg text-label-lg text-on-surface">{t('password')}</label>
                    <Link to="/forgot-password" className="font-label-md text-label-md text-primary hover:underline">
                      {t('forgot.password')}
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">lock</span>
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-sm border border-outline-variant/50 rounded-lg bg-surface font-body-md text-body-md transition-all placeholder:text-on-surface-variant/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1"
                    >
                      <span className="material-symbols-outlined text-xl">{showPw ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-lg text-label-lg shadow-sm hover:bg-primary-container disabled:opacity-60 flex items-center justify-center gap-sm mt-xs"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-xl animate-spin">sync</span>
                      {t('signing.in')}
                    </>
                  ) : (
                    <>
                      {t('sign.in')}
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-sm my-md">
                <div className="flex-1 h-px bg-outline-variant/30" />
                <span className="font-label-md text-label-md text-on-surface-variant">{t('new.to.bm')}</span>
                <div className="flex-1 h-px bg-outline-variant/30" />
              </div>

              <Link
                to="/register"
                className="block w-full text-center border border-primary text-primary py-sm rounded-lg font-label-lg text-label-lg hover:bg-primary-fixed/40 transition-all"
              >
                {t('create.account')}
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-lg text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {t('having.trouble')}{' '}
              <a href="mailto:registrar@bishopmartin.edu" className="text-primary hover:underline">{t('registrar.office')}</a>
            </p>
            <div className="flex justify-center gap-md mt-sm">
              <a href="#" className="font-label-md text-label-md text-on-surface-variant hover:text-primary">{t('privacy.policy')}</a>
              <a href="#" className="font-label-md text-label-md text-on-surface-variant hover:text-primary">{t('terms.service')}</a>
            </div>
          </div>
        </div>
      </main>

      {/* Institutional footer */}
      <footer className="border-t border-outline-variant/20 px-sm py-md text-center">
        <p className="font-label-md text-label-md text-on-surface-variant">
          © {new Date().getFullYear()} {t('copyright')}
        </p>
      </footer>
    </div>
  );
}
