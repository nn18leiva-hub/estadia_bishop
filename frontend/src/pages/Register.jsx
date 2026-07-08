import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', terms: false,
    userType: 'parent', dob: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError(t('pw.mismatch'));
    if (!form.terms) return setError(t('err.agree.terms') || 'Please agree to the Terms of Service to continue.');

    // Validate past student has dob
    if (form.userType === 'past_student' && !form.dob) {
      return setError(t('dob.required.err'));
    }

    // Validate past student age limit
    if (form.userType === 'past_student') {
      const birthDate = new Date(form.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        return setError(t('past.student.age.error'));
      }
    }

    setError('');
    setLoading(true);
    try {
      await register({
        full_name: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        user_type: form.userType,
        dob: form.dob || (form.userType === 'parent' ? '1990-01-01' : '')
      });
      
      // Auto login user after registration
      await login(form.email, form.password);
      navigate('/dashboard/parents');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwMismatch = form.confirmPassword && form.password !== form.confirmPassword;

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

      {/* Main Container */}
      <div className="flex flex-1">
        {/* Left Form Panel */}
        <div className="flex-1 flex flex-col justify-between px-sm md:px-xl py-lg max-w-2xl mx-auto w-full">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-xs">{t('create.account')}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
              {t('parent.dashboard.subtitle')}
            </p>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-sm mb-md px-sm py-xs bg-error-container rounded-lg border border-error/20">
                <span className="material-symbols-outlined text-error text-lg">error</span>
                <p className="font-body-sm text-on-error-container">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              {/* Account Type Toggle */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-lg text-label-lg text-on-surface">{t('i.am.a')}</label>
                <div className="flex p-1 bg-surface-container-low rounded-xl border border-outline-variant/30 gap-1">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, userType: 'parent' }))}
                    className={`flex-1 flex items-center justify-center gap-xs font-label-md text-label-md py-2 rounded-lg transition-all ${
                      form.userType === 'parent'
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">family_restroom</span>
                    {t('parent.guardian')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, userType: 'past_student' }))}
                    className={`flex-1 flex items-center justify-center gap-xs font-label-md text-label-md py-2 rounded-lg transition-all ${
                      form.userType === 'past_student'
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">school</span>
                    {t('past.student')}
                  </button>
                </div>
                {form.userType === 'past_student' && (
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant flex items-center gap-xs text-amber-600 dark:text-amber-400">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    {t('past.student.age.error')}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label htmlFor="fullName" className="font-label-lg text-label-lg text-on-surface">{t('full.name')}</label>
                  <input
                    id="fullName" type="text" required
                    value={form.fullName} onChange={set('fullName')}
                    placeholder="e.g. Maria Santos"
                    className="border border-outline-variant/50 rounded-lg px-sm py-sm bg-surface font-body-md"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label htmlFor="phone" className="font-label-lg text-label-lg text-on-surface">{t('phone.number')}</label>
                  <input
                    id="phone" type="tel"
                    value={form.phone} onChange={set('phone')}
                    placeholder="+501 600-0000"
                    className="border border-outline-variant/50 rounded-lg px-sm py-sm bg-surface font-body-md"
                  />
                </div>
              </div>

              {/* Email & Date of Birth */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label htmlFor="email" className="font-label-lg text-label-lg text-on-surface">{t('email.address')}</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">mail</span>
                    <input
                      id="email" type="email" required autoComplete="email"
                      value={form.email} onChange={set('email')}
                      placeholder="guardian@example.com"
                      className="w-full pl-10 pr-4 py-sm border border-outline-variant/50 rounded-lg bg-surface font-body-md"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-xs">
                  <label htmlFor="dob" className="font-label-lg text-label-lg text-on-surface">
                    {t('dob')} {form.userType === 'parent' && <span className="text-on-surface-variant opacity-60 font-label-md">({t('dob.required.note')})</span>}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">cake</span>
                    <input
                      id="dob" type="date"
                      required={form.userType === 'past_student'}
                      value={form.dob} onChange={set('dob')}
                      className="w-full pl-10 pr-4 py-sm border border-outline-variant/50 rounded-lg bg-surface font-body-md"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label htmlFor="password" className="font-label-lg text-label-lg text-on-surface">{t('password')}</label>
                  <div className="relative">
                    <input
                      id="password" type={showPw ? 'text' : 'password'} required
                      value={form.password} onChange={set('password')}
                      placeholder="Min. 8 characters"
                      className="w-full px-sm pr-10 py-sm border border-outline-variant/50 rounded-lg bg-surface font-body-md"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary">
                      <span className="material-symbols-outlined text-xl">{showPw ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-xs">
                  <label htmlFor="confirmPassword" className="font-label-lg text-label-lg text-on-surface">{t('confirm.password')}</label>
                  <input
                    id="confirmPassword" type="password" required
                    value={form.confirmPassword} onChange={set('confirmPassword')}
                    placeholder="Repeat password"
                    className={`px-sm py-sm border rounded-lg bg-surface font-body-md w-full
                      ${pwMismatch ? 'border-error' : 'border-outline-variant/50'}`}
                  />
                  {pwMismatch && (
                    <p className="font-label-md text-label-md text-error flex items-center gap-xs mt-1">
                      <span className="material-symbols-outlined text-sm">warning</span>{t('pw.mismatch')}
                    </p>
                  )}
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-sm cursor-pointer group">
                <input
                  type="checkbox" checked={form.terms} onChange={set('terms')}
                  className="mt-1 w-4 h-4 rounded border-outline text-primary focus:ring-primary cursor-pointer animate-none"
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                  {t('legal.agree')}
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container disabled:opacity-60 flex items-center justify-center gap-sm mt-xs"
              >
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin">sync</span> {t('creating.account')}</>
                ) : (
                  <>{t('create.account')} <span className="material-symbols-outlined">arrow_forward</span></>
                )}
              </button>

              <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
                {t('welcome.back') + '? ' /* or similar */ }
                <Link to="/login" className="text-primary font-semibold hover:underline">{t('sign.in')}</Link>
              </p>
            </form>
          </div>

          <footer className="pt-lg border-t border-outline-variant/20 mt-lg">
            <p className="font-label-md text-label-md text-on-surface-variant text-center">
              © {new Date().getFullYear()} {t('copyright')}
            </p>
          </footer>
        </div>

        {/* Right decorative panel — desktop only */}
        <div className="hidden lg:flex flex-col items-center justify-center w-96 bg-primary min-h-screen relative overflow-hidden flex-shrink-0">
          {/* Subtle texture */}
          <div className="absolute inset-0 bento-texture" style={{ opacity: 0.08 }} />
          <div className="relative z-10 flex flex-col items-center text-center px-lg gap-lg text-on-primary">
            <span className="material-symbols-outlined text-on-primary/80" style={{ fontSize: '80px' }}>school</span>
            <h2 className="font-headline-lg text-headline-lg text-on-primary">Bishop Martin Academy</h2>
            <p className="font-body-md text-body-md text-on-primary/70 max-w-xs">
              {t('login.subtitle')}
            </p>
            <div className="flex flex-col gap-sm w-full mt-md">
              {[t('official.transcript'), t('enrollment.letter'), t('graduation.cert'), t('replacement.diploma')].map(item => (
                <div key={item} className="flex items-center gap-sm text-on-primary/90">
                  <span className="material-symbols-outlined text-secondary-container" style={{ fontSize: '20px' }}>check_circle</span>
                  <span className="font-body-sm text-body-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
