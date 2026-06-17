import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';

export default function BankDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId, fee, docLabel } = location.state || {};
  const [toast, setToast] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    if (!requestId) {
      navigate('/dashboard/parents');
    }
  }, [requestId, navigate]);

  const ACCOUNT_DETAILS = [
    { label: t('bank.name'), value: 'Belize Bank Limited', copy: false },
    { label: t('account.holder'), value: 'Bishop Martin Academy – Registrar', copy: false },
    { label: t('account.number'), value: '1234-5678-9012', copy: true, copyValue: '123456789012' },
    { label: t('branch.swift'), value: 'BZLIBRLI', copy: true, copyValue: 'BZLIBRLI' },
  ];

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast(`${label} ${t('copied')}`);
      setTimeout(() => setToast(''), 2200);
    });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopAppBar showBack />

      <main className="max-w-container-max mx-auto px-sm md:px-lg py-lg min-h-[calc(100vh-128px)] pt-24">
        {/* Header */}
        <div className="mb-lg">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-xs text-primary font-label-lg mb-sm hover:opacity-80 transition-all font-semibold"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
            {t('back.request.summary')}
          </button>
          <h1 className="font-headline-lg text-headline-lg text-primary">{t('complete.payment')}</h1>
          <p className="font-body-md text-on-surface-variant max-w-2xl mt-xs">
            {t('payment.instructions')}
          </p>
        </div>

        {/* Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left: Bank Details & Steps */}
          <div className="lg:col-span-8 space-y-gutter">
            {/* Bank Details Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-md">
              <div className="flex items-center gap-sm mb-md">
                <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">account_balance</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-primary">{t('bank.transfer.details')}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-md gap-x-lg">
                {ACCOUNT_DETAILS.map((detail, idx) => (
                  <div
                    key={detail.label}
                    className={`${idx < ACCOUNT_DETAILS.length - 2 ? 'md:border-b border-outline-variant/20 pb-md' : ''} ${idx % 2 === 0 ? 'md:border-r md:pr-lg border-outline-variant/20' : ''}`}
                  >
                    <p className="font-label-md text-label-md text-on-surface-variant mb-xs uppercase">{detail.label}</p>
                    <div className="flex items-center justify-between gap-sm">
                      <p className="font-headline-sm text-headline-sm text-on-surface font-mono tracking-wider">{detail.value}</p>
                      {detail.copy && (
                        <button
                          onClick={() => copyToClipboard(detail.copyValue, detail.label)}
                          className="material-symbols-outlined text-primary p-2 hover:bg-primary-fixed/30 rounded transition-colors flex-shrink-0"
                          title={`Copy ${detail.label}`}
                        >
                          content_copy
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reference memo */}
              <div className="mt-lg p-sm bg-surface-container rounded border-l-4 border-primary">
                <div className="flex gap-sm">
                  <span className="material-symbols-outlined text-primary">info</span>
                  <div>
                    <p className="font-label-lg text-label-lg text-primary">{t('req.ref.memo')}</p>
                    <p className="font-body-md text-on-surface-variant">
                      {t('ref.memo.desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-md">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-lg">{t('next.steps')}</h3>
              <div className="space-y-md">
                {[
                  { num: 1, active: true, title: t('step.initiate'), body: t('step.initiate.desc') },
                  { num: 2, active: false, title: t('step.upload'), body: t('step.upload.desc') },
                  { num: 3, active: false, title: t('step.verify'), body: t('step.verify.desc') },
                ].map(step => (
                  <div key={step.num} className={`flex gap-md ${!step.active ? 'opacity-50' : ''}`}>
                    <div className={`flex-none w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold
                      ${step.active ? 'border-primary text-primary' : 'border-outline-variant text-outline'}`}>
                      {step.num}
                    </div>
                    <div>
                      <p className="font-label-lg text-label-lg text-on-surface">{step.title}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Summary & Action */}
          <div className="lg:col-span-4 space-y-gutter">
            {/* Order Summary */}
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl overflow-hidden">
              <div className="p-md border-b border-outline-variant/20 bg-surface-container-high">
                <h2 className="font-headline-sm text-headline-sm text-primary">{t('request.summary')}</h2>
              </div>
              <div className="p-md space-y-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface">{docLabel || t('document')}</p>
                    <p className="font-body-sm text-on-surface-variant">{t('document.type')}</p>
                  </div>
                  <p className="font-body-md text-on-surface font-semibold">{fee ? `BZD $${Number(fee).toFixed(2)}` : 'BZD $—'}</p>
                </div>
                {requestId && (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-label-lg text-label-lg text-on-surface">{t('ref') || 'Reference'}</p>
                    </div>
                    <p className="font-body-md text-on-surface font-mono font-semibold">BM-{requestId}</p>
                  </div>
                )}
                <div className="pt-md border-t border-outline-variant/20 mt-md flex justify-between items-center">
                  <p className="font-headline-sm text-headline-sm text-on-surface">{t('total.due')}</p>
                  <p className="font-headline-md text-headline-md text-primary font-bold">{fee ? `BZD $${Number(fee).toFixed(2)}` : 'BZD $—'}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/dashboard/parents/upload-receipt', {
                state: { requestId, fee, docLabel }
              })}
              className="w-full bg-primary text-white py-4 rounded-xl font-label-lg text-lg shadow-sm hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-sm"
            >
              {t('confirm.initiated')}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <p className="text-center font-body-sm text-on-surface-variant px-md">
              {t('confirm.initiated.desc')}
            </p>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-tertiary-container text-white px-lg py-sm rounded-full font-label-lg shadow-xl border border-white/10 z-50 animate-fade-in">
          {toast}
        </div>
      )}

      <BottomNav variant="parent" />
    </div>
  );
}
