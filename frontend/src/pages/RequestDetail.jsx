import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const STATUS_STYLES = {
  pending: 'bg-surface-container-high text-on-surface-variant',
  pending_verification: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-500/20',
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
  const { user } = useAuth();
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
    if (status === 'pending_verification') return t('pending_verification') || 'Pending Identity Verification';
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

  const isForm = req.document_type === 'lateness_form' || req.document_type === 'absence_form';
  
  let formDataObj = {};
  if (req && req.form_data) {
    if (typeof req.form_data === 'string') {
      try { formDataObj = JSON.parse(req.form_data); } catch(e){}
    } else if (typeof req.form_data === 'object'){
      formDataObj = req.form_data;
    }
  }

  const translateDocType = (docType) => {
    if (docType === 'Official Transcript') return t('official.transcript');
    if (docType === 'Letter of Enrollment' || docType === 'Enrollment Letter') return t('enrollment.letter');
    if (docType === 'Graduation Certificate') return t('graduation.cert');
    if (docType === "Dean's Letter") return t('deans.letter');
    if (docType === 'Replacement Diploma') return t('replacement.diploma');
    if (docType === 'Other/Special Request') return t('other.special');
    return t(docType);
  };

  const getFormStatusLabel = (status) => {
    if (status === 'approved' || status === 'ready' || status === 'issued') return t('status.excused') || 'Excused';
    if (status === 'cancelled' || status === 'action') return t('status.unexcused') || 'Unexcused';
    return t('status.filed.pending') || 'Filed - Pending Review';
  };

  const getFormStatusStyle = (status) => {
    if (status === 'approved' || status === 'ready' || status === 'issued') return 'bg-emerald-100 text-emerald-800 border border-emerald-500/20';
    if (status === 'cancelled' || status === 'action') return 'bg-error-container text-on-error-container border border-error/20';
    return 'bg-surface-container-high text-on-surface-variant border border-outline-variant/20';
  };

  const STEPS = isForm ? [
    { icon: 'assignment_turned_in', label: t('status.filed') || 'Filed', done: true },
    { icon: 'rate_review', label: t('status.reviewed') || 'Reviewed', done: ['approved', 'ready', 'issued', 'cancelled', 'action'].includes(req.status) },
    { icon: 'gavel', label: (req.status === 'cancelled' || req.status === 'action') ? (t('status.unexcused') || 'Unexcused') : (t('status.excused') || 'Excused'), done: ['approved', 'ready', 'issued', 'cancelled', 'action'].includes(req.status) },
  ] : [
    { icon: 'receipt_long', label: t('submitted'), done: true },
    { icon: 'payments', label: t('payment.verified'), done: ['processing', 'ready', 'issued'].includes(req.status) },
    { icon: 'manage_search', label: t('processing'), done: ['ready', 'issued'].includes(req.status) },
    { icon: req.delivery_method === 'email' ? 'mark_email_read' : 'local_shipping', label: req.status === 'issued' ? t('delivered') : t('delivery'), done: req.status === 'issued' },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopAppBar showBack backTo="/dashboard/parents/history" title={isForm ? (t('form.details') || 'Form Details') : t('request.detail')} />

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
                <p className="font-body-sm opacity-80 mt-xs">{translateDocType(req.document_type)}</p>
              </div>
              <span className={`relative z-10 text-label-md px-sm py-0.5 rounded-full font-semibold capitalize ${isForm ? getFormStatusStyle(req.status) : (STATUS_STYLES[req.status] || STATUS_STYLES.pending)}`}>
                {isForm ? getFormStatusLabel(req.status) : getStatusLabel(req.status)}
              </span>
            </div>

            {/* Progress Tracker */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <h2 className="font-headline-sm text-headline-sm text-primary mb-md">{isForm ? (t('filing.progress') || 'Filing Progress') : t('request.progress')}</h2>
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
              <h2 className="font-headline-sm text-headline-sm text-primary mb-md">{isForm ? (t('form.details') || 'Form Details') : t('request.details')}</h2>
              {isForm ? (
                <div className="grid grid-cols-2 gap-md">
                  {[
                    { label: t('student.name'), value: req.student_name },
                    { label: t('class.grade') || t('grade.year'), value: formDataObj.class },
                    { label: t('relationship'), value: t('rel.' + (formDataObj.relationship || '').toLowerCase().replace(' ', '')) || formDataObj.relationship },
                    { label: t('date.of.return'), value: formDataObj.date_of_return },
                    { label: t('dates.of.absence.lateness'), value: formDataObj.dates_of_absence_or_lateness },
                    req.document_type === 'absence_form' && { label: t('num.days.absent'), value: formDataObj.number_of_days_absent },
                    { label: t('home.room.teacher'), value: formDataObj.home_room_teacher },
                    { label: t('reason'), value: t('reason.' + formDataObj.reason_category) || formDataObj.reason_category },
                    { label: t('date.submitted'), value: req.created_at ? new Date(req.created_at).toLocaleDateString('en-BZ', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                  ].filter(Boolean).map(item => (
                    <div key={item.label} className={item.label === t('reason') ? 'col-span-2' : ''}>
                      <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{item.label}</p>
                      <p className="font-body-md text-on-surface capitalize">{item.value || '—'}</p>
                    </div>
                  ))}
                  {formDataObj.reason_details && (
                    <div className="col-span-2 border-t border-outline-variant/10 pt-sm mt-xs">
                      <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{t('specify.details') || 'Details'}</p>
                      <p className="font-body-md text-on-surface">{formDataObj.reason_details}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-md">
                  {[
                    { label: t('student.name'), value: req.student_name },
                    { label: t('grade.year'), value: req.grade },
                    { label: t('document.type'), value: translateDocType(req.document_type) },
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
              )}
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-5 flex flex-col gap-md">
            {/* Download Document Card */}
            {req.generated_file_path && (
              <div className="bg-primary text-on-primary rounded-xl p-md relative overflow-hidden flex flex-col gap-sm shadow-md" style={{ background: 'linear-gradient(135deg, var(--md-sys-color-primary, #1e3a8a) 0%, var(--md-sys-color-primary-container, #3b82f6) 100%)' }}>
                <div className="absolute inset-0 bento-texture opacity-10" />
                <div className="relative z-10 flex items-start gap-sm">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>
                    {req.delivery_method === 'emailed' ? 'verified_user' : 'info'}
                  </span>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-white">
                      {req.delivery_method === 'emailed' 
                        ? (t('academic.doc.ready') || 'Academic Document Ready')
                        : (t('reference.digital.copy') || 'Reference Digital Copy')}
                    </h3>
                    <p className="font-body-sm text-white opacity-80 mt-xxs">
                      {req.delivery_method === 'emailed'
                        ? (t('download.desc') || 'Your requested document has been issued by the institution. You can download the official copy below.')
                        : (t('reference.copy.disclaimer') || 'This is a reference copy. Please collect the official physical document.')}
                    </p>
                  </div>
                </div>
                
                <div className="relative z-10 mt-xs border-t border-white/20 pt-sm flex justify-between items-center gap-sm">
                  <div className="min-w-0">
                    <p className="font-label-md text-white font-semibold truncate">
                      {req.generated_file_path.split('/').pop()}
                    </p>
                    <p className="font-body-xs text-white opacity-60">
                      {req.delivery_method === 'emailed'
                        ? (t('official.digital.copy') || 'Official Digital Copy')
                        : (t('reference.digital.copy') || 'Reference Digital Copy')}
                    </p>
                  </div>
                  <a
                    href={`/${req.generated_file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-xs px-md py-xs bg-white text-primary hover:bg-surface-container font-label-lg rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    {t('download') || 'Download'}
                  </a>
                </div>
              </div>
            )}

            {/* Pending Identity Verification Banner */}
            {req.status === 'pending_verification' && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 rounded-xl p-md flex flex-col gap-sm">
                <div className="flex gap-sm items-start">
                  <span className="material-symbols-outlined text-amber-700 dark:text-amber-400 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>hourglass_empty</span>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-amber-800 dark:text-amber-300 font-semibold">{t('pending.verification') || 'Pending Identity Verification'}</h3>
                    <p className="font-body-sm text-on-surface-variant mt-xs">
                      {user?.ssn_card_image_path
                        ? t('ver.submitted.desc') || 'Your identity document has been received and is pending review. Once verified, this request will automatically proceed to processing.'
                        : t('id.ver.desc') || 'This request is paused because your identity has not been verified yet. Please upload your SSN or ID document to proceed.'}
                    </p>
                  </div>
                </div>
                {!user?.ssn_card_image_path && (
                  <button
                    onClick={() => navigate('/dashboard/parents/upload-ssn')}
                    className="bg-primary text-on-primary hover:brightness-110 px-md py-xs rounded-lg font-label-lg w-fit font-bold"
                  >
                    {t('upload.id.doc') || 'Upload ID Document'}
                  </button>
                )}
              </div>
            )}

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

            {/* Payment Info / Filing Summary */}
            {isForm ? (
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
                <h2 className="font-headline-sm text-headline-sm text-primary mb-md flex items-center gap-xs">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>info</span>
                  {t('filing.summary') || 'Filing Summary'}
                </h2>
                <div className="flex justify-between items-center py-xs border-b border-outline-variant/10">
                  <p className="font-body-sm text-on-surface-variant">{t('type') || 'Filing Type'}</p>
                  <p className="font-body-md text-on-surface">{translateDocType(req.document_type)}</p>
                </div>
                <div className="flex justify-between items-center py-xs border-b border-outline-variant/10">
                  <p className="font-body-sm text-on-surface-variant">{t('status') || 'Status'}</p>
                  <span className={`text-label-md px-sm py-0.5 rounded-full font-semibold capitalize ${getFormStatusStyle(req.status)}`}>
                    {getFormStatusLabel(req.status)}
                  </span>
                </div>
                <p className="font-body-sm text-on-surface-variant mt-md opacity-80">
                  {t('form.submission.notice') || 'This form has been submitted electronically directly to school records. No processing fee or payment is required.'}
                </p>
              </div>
            ) : (
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
                  <p className="font-label-lg text-label-lg text-primary font-bold">{req.payment_verified ? t('total.paid') : t('total.due')}</p>
                  <p className="font-body-md text-primary font-bold">{req.fee ? `BZD $${Number(req.fee).toFixed(2)}` : '—'}</p>
                </div>

                {req.requires_payment && !req.payment_id && (
                  <button
                    onClick={() => navigate('/dashboard/parents/bank-details', {
                      state: { requestId: req.id, fee: req.fee, docLabel: req.document_type }
                    })}
                    className="w-full mt-md bg-primary text-on-primary py-xs rounded-lg font-label-lg shadow-sm hover:bg-primary-container flex items-center justify-center gap-sm transition-all"
                  >
                    <span className="material-symbols-outlined">payments</span>
                    {t('pay.now') || 'Pay Now'}
                  </button>
                )}

                {req.requires_payment && req.payment_id && !req.payment_verified && (
                  <div className="mt-md p-xs bg-surface-container rounded border-l-4 border-amber-600 flex items-center gap-xs">
                    <span className="material-symbols-outlined text-amber-600">hourglass_empty</span>
                    <p className="font-body-sm text-on-surface-variant">{t('payment.pending.verification') || 'Payment uploaded. Pending verification.'}</p>
                  </div>
                )}

                {req.requires_payment && req.payment_verified && (
                  <div className="mt-md p-xs bg-surface-container rounded border-l-4 border-green-700 flex items-center gap-xs">
                    <span className="material-symbols-outlined text-green-700">check_circle</span>
                    <p className="font-body-sm text-green-700 font-semibold">{t('payment.verified') || 'Payment verified.'}</p>
                  </div>
                )}
              </div>
            )}

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
