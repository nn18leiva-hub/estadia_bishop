import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function ComingSoon() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-on-surface px-sm">
      <div className="flex flex-col items-center text-center gap-lg max-w-sm">
        <div className="w-24 h-24 rounded-full bg-primary-fixed flex items-center justify-center">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '48px' }}>construction</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary">{t('coming.soon')}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t('under.development')}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-lg font-label-lg hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          {t('go.back')}
        </button>
      </div>
    </div>
  );
}
