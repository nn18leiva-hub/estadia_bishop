import { Link } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';

export default function RequestSuccess() {
  const { t } = useLanguage();
  const refId = `BM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const copyRef = () => {
    navigator.clipboard.writeText(refId);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <TopAppBar />

      <main className="flex-1 flex items-center justify-center px-sm py-xl">
        <div className="max-w-lg w-full flex flex-col items-center text-center gap-lg">
          {/* Success Icon */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '60px', fontVariationSettings: "'FILL' 1" }}>description</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center border-4 border-background">
              <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-xs">
            <h1 className="font-headline-lg text-headline-lg text-primary">{t('request.submitted')}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              {t('request.submitted.desc')}
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md w-full">
            <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest mb-xs">{t('ref.num')}</p>
            <div className="flex items-center justify-between gap-sm">
              <p className="font-headline-md text-headline-md text-primary font-mono">{refId}</p>
              <button
                onClick={copyRef}
                className="material-symbols-outlined text-primary p-2 hover:bg-primary-fixed/30 rounded transition-colors"
                title="Copy reference"
              >
                content_copy
              </button>
            </div>
            <p className="font-body-sm text-on-surface-variant mt-xs">
              {t('save.ref.desc')}
            </p>
          </div>

          {/* Timeline */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md w-full text-left">
            <h3 className="font-headline-sm text-headline-sm text-primary mb-md">{t('what.next')}</h3>
            <div className="flex flex-col gap-md">
              {[
                { icon: 'payments', label: t('timeline.payment'), desc: t('timeline.payment.desc') },
                { icon: 'manage_search', label: t('timeline.processing'), desc: t('timeline.processing.desc') },
                { icon: 'mark_email_read', label: t('timeline.delivery'), desc: t('timeline.delivery.desc') },
              ].map((step, i) => (
                <div key={step.label} className="flex items-start gap-sm">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>{step.icon}</span>
                  </div>
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface">{step.label}</p>
                    <p className="font-body-sm text-on-surface-variant">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-sm w-full">
            <Link
              to="/dashboard/parents"
              className="flex-1 bg-primary text-on-primary py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container flex items-center justify-center gap-sm transition-all"
            >
              <span className="material-symbols-outlined">dashboard</span>
              {t('return.dashboard')}
            </Link>
            <Link
              to="/dashboard/parents/new"
              className="flex-1 border border-primary text-primary py-sm rounded-lg font-label-lg hover:bg-primary-fixed/30 flex items-center justify-center gap-sm transition-all"
            >
              <span className="material-symbols-outlined">add_circle</span>
              {t('new.request')}
            </Link>
          </div>
        </div>
      </main>

      <BottomNav variant="parent" />
    </div>
  );
}
