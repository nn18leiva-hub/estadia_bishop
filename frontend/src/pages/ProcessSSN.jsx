import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import { useLanguage } from '../contexts/LanguageContext';

export default function ProcessSSN() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const stages = [
    t('stage.receiving'),
    t('stage.extracting'),
    t('stage.crossref'),
    t('stage.finalizing'),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate('/dashboard/parents/verification-submitted'), 600);
          return 100;
        }
        return p + 2;
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setStage(Math.min(Math.floor(progress / 25), 3));
  }, [progress]);

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <TopAppBar />

      <main className="flex-1 flex items-center justify-center px-sm">
        <div className="max-w-md w-full flex flex-col items-center text-center gap-lg">
          {/* Animated Icon */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary animate-pulse" style={{ fontSize: '56px' }}>verified_user</span>
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>

          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary">{t('processing.verification')}</h1>
            <p className="font-body-md text-on-surface-variant mt-xs">{stages[stage]}</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant">{progress}% {t('percent.complete')}</p>

          <p className="font-body-sm text-on-surface-variant opacity-70 max-w-sm">
            {t('process.stay.desc')}
          </p>
        </div>
      </main>
    </div>
  );
}
