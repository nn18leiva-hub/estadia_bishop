import { Link } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';

export default function VerificationSubmitted() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <TopAppBar />

      <main className="flex-1 flex items-center justify-center px-sm py-xl">
        <div className="max-w-lg w-full flex flex-col items-center text-center gap-lg">
          {/* Icon */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: '56px', fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
            </div>
          </div>

          {/* Text */}
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">{t('verification.submitted')}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
              {t('ver.submitted.desc')}
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md w-full text-left">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-md">{t('what.expect')}</h3>
            <div className="flex flex-col gap-sm">
              {[
                { icon: 'schedule', label: t('expect.review'), body: t('expect.review.desc') },
                { icon: 'mark_email_read', label: t('expect.confirm'), body: t('expect.confirm.desc') },
                { icon: 'lock', label: t('expect.security'), body: t('expect.security.desc') },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-sm">
                  <span className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5" style={{ fontSize: '20px' }}>{item.icon}</span>
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface">{item.label}</p>
                    <p className="font-body-sm text-on-surface-variant">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-sm bg-secondary-container/40 px-md py-sm rounded-full border border-secondary/20">
            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>pending</span>
            <span className="font-label-lg text-label-lg text-secondary">{t('pending.admin.review')}</span>
          </div>

          <Link
            to="/dashboard/parents"
            className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container flex items-center justify-center gap-sm transition-all"
          >
            <span className="material-symbols-outlined">dashboard</span>
            {t('return.dashboard')}
          </Link>
        </div>
      </main>

      <BottomNav variant="parent" />
    </div>
  );
}
