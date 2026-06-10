import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';
import StaffHeader from '../components/StaffHeader';
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

export default function StaffRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchReq = async () => {
      try {
        const data = await apiFetch(`/staff/requests/${id}`);
        setReq(data);
        setNotes(data.staff_notes || '');
        setSelectedStatus(data.status || 'pending');
      } catch (_) {}
      setLoading(false);
    };
    fetchReq();
  }, [id]);

  const getStatusLabel = (status) => {
    if (status === 'ready') return t('ready.pickup');
    if (status === 'action') return t('action.required');
    return t(status || 'pending');
  };

  const translateDocType = (docType) => {
    if (docType === 'Official Transcript') return t('official.transcript');
    if (docType === 'Letter of Enrollment' || docType === 'Enrollment Letter') return t('enrollment.letter');
    if (docType === 'Graduation Certificate') return t('graduation.cert');
    if (docType === "Dean's Letter") return t('deans.letter');
    if (docType === 'Replacement Diploma') return t('replacement.diploma');
    if (docType === 'Other/Special Request') return t('other.special');
    return t(docType);
  };

  const updateStatus = async (status, action) => {
    setProcessing(true);
    try {
      await apiFetch(`/staff/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, staff_notes: notes }),
      });
      setSelectedStatus(status);
      setToast(action === 'approve' 
        ? t('toast.approved') 
        : action === 'flag' 
          ? t('toast.flagged') 
          : `${t('toast.status.updated')} ${getStatusLabel(status)}`
      );
      setTimeout(() => { setToast(''); if (action === 'approve' || action === 'flag') navigate('/staff/requests'); }, 2200);
    } catch (_) {}
    setProcessing(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>sync</span>
    </div>
  );

  const initials = (req?.student_name || 'XX').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <StaffSidebar variant="staff" />

      <StaffHeader title={t('request.detail')} showBack={true} backTo="/staff/requests" />

      <main className="md:ml-80 pt-24 pb-24 px-sm md:px-gutter max-w-container-max">
        {!req ? (
          <div className="text-center py-xl">
            <p className="font-body-md text-on-surface-variant">{t('request.not.found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {/* Left: Request Info */}
            <div className="flex flex-col gap-md">
              {/* Student Header */}
              <div className="bg-primary text-on-primary rounded-xl p-md flex items-center gap-md relative overflow-hidden">
                <div className="absolute inset-0 bento-texture" style={{ opacity: 0.1 }} />
                <div className="w-16 h-16 rounded-full bg-on-primary/20 flex items-center justify-center font-bold text-headline-md relative z-10">
                  {initials}
                </div>
                <div className="relative z-10">
                  <h2 className="font-headline-sm text-headline-sm">{req.student_name || '—'}</h2>
                  <p className="font-body-sm opacity-80">{req.grade || '—'} · ID: {req.student_id || '—'}</p>
                  <p className="font-body-sm opacity-70">{t(req.relationship || 'parents').slice(0, -1)}</p>
                </div>
              </div>

              {/* Details */}
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-sm">{t('request.details')}</h3>
                <div className="grid grid-cols-2 gap-sm">
                  {[
                    { label: t('ref'), value: `BM-${req.id}` },
                    { label: t('document.type'), value: translateDocType(req.document_type) },
                    { label: t('delivery'), value: req.delivery_method === 'email' ? t('digital.delivery') : t('physical.pickup') },
                    { label: t('processing'), value: req.processing_speed === 'urgent' ? t('urg.proc') : req.processing_speed === 'expedited' ? t('exp.proc') : t('std.proc') },
                    { label: t('date.submitted'), value: req.created_at ? new Date(req.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-BZ', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                    { label: t('total.fee'), value: req.fee ? `BZD $${Number(req.fee).toFixed(2)}` : '—' },
                    { label: t('status'), value: getStatusLabel(req.status) },
                    { label: t('recipient'), value: req.recipient_email || t('physical.pickup') },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{item.label}</p>
                      <p className="font-body-md text-on-surface capitalize">{item.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Preview */}
              <div className="bg-tertiary-container rounded-xl p-md flex flex-col items-center justify-center gap-sm min-h-[180px] relative overflow-hidden">
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a2a3a 0%, #2c3e50 100%)' }} />
                <div className="relative z-10 flex flex-col items-center gap-sm text-on-tertiary">
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.6 }}>description</span>
                  <p className="font-label-lg text-label-lg opacity-70 text-center">{t('preview.not.available')}</p>
                  <p className="font-body-sm opacity-50 text-center">{translateDocType(req.document_type)}</p>
                </div>
              </div>

              {/* Notes */}
              {req.notes && (
                <div className="bg-surface-container border border-outline-variant/20 rounded-xl p-md">
                  <h3 className="font-label-lg text-label-lg text-on-surface-variant uppercase mb-xs">{t('requester.notes')}</h3>
                  <p className="font-body-md text-on-surface">{req.notes}</p>
                </div>
              )}
            </div>

            {/* Right: Staff Actions */}
            <div className="flex flex-col gap-md">
              {/* Audit Notes */}
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-sm flex items-center gap-xs">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>rate_review</span>
                  {t('reg.audit.notes')}
                </h3>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={6}
                  placeholder={t('audit.notes.placeholder')}
                  className="w-full border border-outline-variant/50 rounded-lg p-sm font-body-md bg-surface resize-none"
                />
                <p className="font-body-sm text-on-surface-variant mt-xs">{t('visible.staff.only')}</p>
              </div>

              {/* Status Update */}
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-sm">{t('update.status')}</h3>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full border border-outline px-sm py-sm font-body-md bg-surface rounded-lg mb-md"
                >
                  {[
                    { v: 'pending', l: t('pending') },
                    { v: 'processing', l: t('processing') },
                    { v: 'ready', l: t('ready.pickup') },
                    { v: 'issued', l: t('issued') },
                    { v: 'action', l: t('action.required') },
                  ].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
                <button
                  disabled={processing || selectedStatus === req.status}
                  onClick={() => updateStatus(selectedStatus, 'update')}
                  className="w-full mb-sm bg-secondary-container text-on-secondary-container py-xs rounded-lg font-label-lg hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-sm transition-all"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  {t('save.status.change')}
                </button>

                <div className="flex flex-col gap-sm">
                  <button
                    disabled={processing}
                    onClick={() => updateStatus('issued', 'approve')}
                    className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container disabled:opacity-60 flex items-center justify-center gap-sm transition-all"
                  >
                    {processing ? (
                      <><span className="material-symbols-outlined animate-spin">sync</span> {t('submitting')}</>
                    ) : (
                      <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {t('approve.release')}</>
                    )}
                  </button>

                  <button
                    disabled={processing}
                    onClick={() => updateStatus('action', 'flag')}
                    className="w-full border border-error text-error py-sm rounded-lg font-label-lg hover:bg-error-container disabled:opacity-60 flex items-center justify-center gap-sm transition-all"
                  >
                    <span className="material-symbols-outlined">flag</span>
                    {t('flag.correction')}
                  </button>
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
                <h3 className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest mb-sm">{t('sla.compliance')}</h3>
                <div className="flex items-center gap-sm">
                  <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
                  <p className="font-body-md text-on-surface">
                    {req.processing_speed === 'urgent' ? t('next.bus.day') : req.processing_speed === 'expedited' ? t('days.2_3') : t('days.5_7')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-tertiary-container text-white px-lg py-sm rounded-full font-label-lg shadow-xl z-50 animate-in fade-in slide-in-from-bottom duration-300">
          {toast}
        </div>
      )}

      <BottomNav variant="staff" />
    </div>
  );
}
