import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import bishopLogo from '../assets/bishop_martin_logo.png';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      {/* Top brand strip */}
      <header className="flex items-center justify-between px-sm md:px-lg h-16 border-b border-outline-variant/20 bg-surface">
        <div className="flex items-center gap-xs">
          <img src={bishopLogo} alt="Bishop Martin" className="w-8 h-8 object-contain rounded-full" />
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

      <main className="flex-grow flex items-center justify-center px-sm py-xl">
        <div className="w-full max-w-md">
          <Link to="/login" className="flex items-center gap-xs text-primary mb-xl hover:opacity-80 font-semibold">
            <span className="material-symbols-outlined">arrow_back</span>
            {t('back.signin')}
          </Link>

          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary-container to-secondary" />
            <div className="p-lg flex flex-col items-center text-center gap-md">
              {!sent ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>lock_reset</span>
                  </div>
                  <div>
                    <h1 className="font-headline-lg text-headline-lg text-primary">{t('reset.password')}</h1>
                    <p className="font-body-sm text-on-surface-variant mt-xs">
                      {t('reset.pw.desc')}
                    </p>
                  </div>
                  {error && (
                    <div className="w-full flex items-center gap-sm px-sm py-xs bg-error-container rounded-lg border border-error/20">
                      <span className="material-symbols-outlined text-error text-lg">error</span>
                      <p className="font-body-sm text-on-error-container">{error}</p>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="w-full flex flex-col gap-md">
                    <div className="flex flex-col gap-xs text-left">
                      <label htmlFor="fp-email" className="font-label-lg text-label-lg text-on-surface">{t('email.address')}</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">mail</span>
                        <input
                          id="fp-email" type="email" required
                          value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="guardian@example.com"
                          className="w-full pl-10 pr-4 py-sm border border-outline-variant/50 rounded-lg bg-surface font-body-md"
                        />
                      </div>
                    </div>
                    <button
                      type="submit" disabled={loading}
                      className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container disabled:opacity-60 flex items-center justify-center gap-sm"
                    >
                      {loading ? <><span className="material-symbols-outlined animate-spin">sync</span> {t('sending.invitation')}</>
                        : <><span className="material-symbols-outlined">send</span> {t('send.reset.link')}</>}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
                  </div>
                  <div>
                    <h1 className="font-headline-lg text-headline-lg text-primary">{t('check.email')}</h1>
                    <p className="font-body-sm text-on-surface-variant mt-xs">
                      {t('reset.link.sent')} <strong>{email}</strong>. {t('check.inbox.desc')}
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container flex items-center justify-center gap-sm"
                  >
                    <span className="material-symbols-outlined">login</span>
                    {t('back.signin')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
