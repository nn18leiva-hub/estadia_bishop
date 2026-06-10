import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const STATUS_STYLES = {
  pending: 'bg-surface-container-high text-on-surface-variant',
  processing: 'bg-secondary-container text-on-secondary-container',
  ready: 'bg-tertiary-fixed text-on-tertiary-fixed',
  issued: 'bg-secondary-container/60 text-on-secondary-container',
  cancelled: 'bg-error-container text-on-error-container',
  action: 'bg-error-container text-on-error-container',
};

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/requests/${id}`)
      .then(data => setReq(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const getStatusLabel = (status) => {
    if (status === 'ready') return t('ready.pickup');
    if (status === 'action') return t('action.required');
    return t(status || 'pending');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>sync</span>
    </div>
  );

  if (!req) return (
    <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-md">
      <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '64px' }}>search_off</span>
      <p className="font-body-lg text-on-surface-variant">{t('request.not.found')}</p>
      <button onClick={() => navigate('/dashboard/parents')} className="text-primary font-label-lg hover:underline">
        {t('return.dashboard')}
      </button>
    </div>
  );

  const STEPS = [
    { icon: 'receipt_long', label: t('submitted'), done: true },
    { icon: 'payments', label: t('payment.verified'), done: ['processing', 'ready', 'issued'].includes(req.status) },
    { icon: 'manage_search', label: t('processing'), done: ['ready', 'issued'].includes(req.status) },
    { icon: req.delivery_method === 'email' ? 'mark_email_read' : 'local_shipping', label: req.status === 'issued' ? t('delivered') : t('delivery'), done: req.status === 'issued' },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopAppBar showBack backTo="/dashboard/parents/history" title={t('request.detail')} />

      <main className="pt-24 pb-24 px-sm md:px-gutter max-w-container-max mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left */}
          <div className="lg:col-span-7 flex flex-col gap-md">
            {/* Header */}
            <div className="bg-primary text-on-primary rounded-xl p-md flex items-start justify-between relative overflow-hidden">
              <div className="absolute inset-0 bento-texture" style={{ opacity: 0.1 }} />
              <div className="relative z-10">
                <p className="font-label-lg opacity-70 uppercase tracking-widest mb-xs">{t('ref.num')}</p>
                <h1 className="font-headline-lg text-headline-lg">BM-{String(req.id).padStart(5, '0')}</h1>
                <p className="font-body-sm opacity-80 mt-xs">{req.document_type}</p>
              </div>
              <span className={`relative z-10 text-label-md px-sm py-0.5 rounded-full font-semibold capitalize ${STATUS_STYLES[req.status] || STATUS_STYLES.pending}`}>
                {getStatusLabel(req.status)}
              </span>
            </div>

            {/* Progress Tracker */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-md">{t('request.progress')}</h2>
              <div className="flex items-center justify-between">
                {STEPS.map((step, i) => (
                  <div key={step.label} className="flex-1 flex flex-col items-center gap-xs relative">
                    {i < STEPS.length - 1 && (
                      <div className={`absolute top-5 left-1/2 w-full h-0.5 ${STEPS[i + 1].done ? 'bg-primary' : 'bg-outline-variant'}`} />
                    )}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${step.done ? 'bg-primary text-on-primary' : 'bg-surface-container border-2 border-outline-variant text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: step.done ? "'FILL' 1" : "'FILL' 0" }}>{step.icon}</span>
                    </div>
                    <p className={`font-label-md text-label-md text-center ${step.done ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>{step.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-md">{t('request.details')}</h2>
              <div className="grid grid-cols-2 gap-md">
                {[
                  { label: t('student.name'), value: req.student_name },
                  { label: t('grade.year'), value: req.grade },
                  { label: t('document.type'), value: req.document_type },
                  { label: t('delivery.method'), value: req.delivery_method === 'email' ? t('digital.delivery') : t('physical.pickup') },
                  { label: t('processing.speed'), value: req.processing_speed === 'urgent' ? t('urg.proc') : req.processing_speed === 'expedited' ? t('exp.proc') : t('std.proc') },
                  { label: t('recipient'), value: req.recipient_email || t('physical.pickup') },
                  { label: t('date.submitted'), value: req.created_at ? new Date(req.created_at).toLocaleDateString('en-BZ', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                  { label: t('total.fee'), value: req.fee ? `BZD $${Number(req.fee).toFixed(2)}` : '—' },
                ].map(item => (
                  <div key={item.label}>
                    <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{item.label}</p>
                    <p className="font-body-md text-on-surface capitalize">{item.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-5 flex flex-col gap-md">
            {/* Action Required Banner */}
            {req.status === 'action' && (
              <div className="bg-error-container border border-error/30 rounded-xl p-md flex flex-col gap-sm">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  <p className="font-headline-sm text-headline-sm text-error">{t('action.required')}</p>
                </div>
                <p className="font-body-sm text-on-error-container">
                  {t('flagged.msg')}
                </p>
                <a
                  href="mailto:registrar@bishopmartin.edu"
                  className="flex items-center gap-xs text-error font-label-lg hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">mail</span>
                  {t('contact.registrar')}
                </a>
              </div>
            )}

            {/* Ready Banner */}
            {req.status === 'ready' && (
              <div className="bg-secondary-container border border-outline-variant/20 rounded-xl p-md flex flex-col gap-sm">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <p className="font-headline-sm text-headline-sm text-on-secondary-container">{t('ready.pickup')}</p>
                </div>
                <p className="font-body-sm text-on-secondary-container">
                  {t('ready.pickup.msg')}
                </p>
              </div>
            )}

            {/* Payment Info */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-md flex items-center gap-xs">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>payments</span>
                {t('payment.summary')}
              </h2>
              <div className="flex justify-between items-center py-xs border-b border-outline-variant/10">
                <p className="font-body-sm text-on-surface-variant">{t('doc.fee')}</p>
                <p className="font-body-md text-on-surface">{req.fee ? `BZD $${Number(req.fee).toFixed(2)}` : '—'}</p>
              </div>
              <div className="flex justify-between items-center py-xs">
                <p className="font-label-lg text-label-lg text-primary font-bold">{t('total.paid')}</p>
                <p className="font-body-md text-primary font-bold">{req.fee ? `BZD $${Number(req.fee).toFixed(2)}` : '—'}</p>
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-primary text-on-primary rounded-xl p-md relative overflow-hidden">
              <div className="absolute inset-0 bento-texture" style={{ opacity: 0.1 }} />
              <div className="relative z-10">
                <span className="material-symbols-outlined mb-xs" style={{ fontSize: '28px', opacity: 0.8 }}>support_agent</span>
                <h3 className="font-headline-sm text-headline-sm mb-xs">{t('need.help')}</h3>
                <p className="font-body-sm opacity-80 mb-md">{t('office.hours.desc')}</p>
                <div className="flex flex-col gap-xs">
                  <a href="mailto:registrar@bishopmartin.edu" className="flex items-center gap-xs bg-on-primary/10 hover:bg-on-primary/20 px-sm py-xs rounded-lg font-label-lg transition-all">
                    <span className="material-symbols-outlined text-sm">mail</span>
                    {t('email.us')}
                  </a>
                  <a href="tel:+5012345678" className="flex items-center gap-xs bg-on-primary/10 hover:bg-on-primary/20 px-sm py-xs rounded-lg font-label-lg transition-all">
                    <span className="material-symbols-outlined text-sm">phone</span>
                    {t('call.us')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav variant="parent" />
    </div>
  );
}
