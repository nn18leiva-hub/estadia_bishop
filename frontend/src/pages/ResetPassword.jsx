import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import bishopLogo from '../assets/bishop_martin_logo.png';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError(t('pw.mismatch'));
    setLoading(true);
    setError('');
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, token: code, newPassword: password }),
      });
      navigate('/login', { state: { message: t('permissions.success.msg') || 'Password reset successfully!' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const mismatch = confirm && password !== confirm;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      {/* Top brand strip */}
      <header className="flex items-center justify-between px-sm md:px-lg h-16 border-b border-outline-variant/20 bg-surface">
        <div className="flex items-center gap-xs">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-outline-variant/30 flex-shrink-0 overflow-hidden shadow-sm">
            <img src={bishopLogo} alt="Bishop Martin" className="w-full h-full object-contain" />
          </div>
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
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary-container to-secondary" />
            <div className="p-lg flex flex-col items-center text-center gap-md">
              <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>key</span>
              </div>
              <div>
                <h1 className="font-headline-lg text-headline-lg text-primary">{t('create.new.pw')}</h1>
                <p className="font-body-sm text-on-surface-variant mt-xs">{t('strong.pw.desc')}</p>
              </div>
              {error && (
                <div className="w-full flex items-center gap-sm px-sm py-xs bg-error-container rounded-lg">
                  <span className="material-symbols-outlined text-error text-lg">error</span>
                  <p className="font-body-sm text-on-error-container">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-md text-left">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-label-lg text-on-surface">{t('email.address') || 'Email Address'}</label>
                  <input
                    type="email" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="guardian@example.com"
                    className="border border-outline-variant/50 rounded-lg px-sm py-sm bg-surface font-body-md w-full disabled:opacity-60"
                    disabled={!!location.state?.email}
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-label-lg text-on-surface">{t('verification.code') || 'Verification Code (6 Digits)'}</label>
                  <input
                    type="text" required maxLength={6} pattern="\d{6}"
                    value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="border border-outline-variant/50 rounded-lg px-sm py-sm bg-surface font-body-md w-full tracking-widest text-center text-lg font-bold"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-label-lg text-on-surface">{t('new.password')}</label>
                  <input
                    type="password" required minLength={8}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="border border-outline-variant/50 rounded-lg px-sm py-sm bg-surface font-body-md w-full"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-label-lg text-on-surface">{t('confirm.password')}</label>
                  <input
                    type="password" required
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className={`border rounded-lg px-sm py-sm bg-surface font-body-md w-full ${mismatch ? 'border-error' : 'border-outline-variant/50'}`}
                  />
                  {mismatch && <p className="font-label-md text-error">{t('pw.mismatch')}</p>}
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container disabled:opacity-60 flex items-center justify-center gap-sm"
                >
                  {loading ? <><span className="material-symbols-outlined animate-spin">sync</span> {t('resetting')}</>
                    : <><span className="material-symbols-outlined">check_circle</span> {t('reset.password')}</>}
                </button>
                <p className="text-center font-body-sm text-on-surface-variant">
                  <Link to="/login" className="text-primary hover:underline font-semibold">{t('back.signin')}</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
