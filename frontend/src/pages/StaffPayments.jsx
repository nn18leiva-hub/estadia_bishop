import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';
import StaffHeader from '../components/StaffHeader';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function StaffPayments() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/staff/payments')
      .then(data => setPayments(Array.isArray(data) ? data : data.payments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const verifyPayment = async (id) => {
    try {
      await apiFetch(`/staff/payments/${id}/verify`, { method: 'PATCH' });
      setPayments(prev => prev.map(p => p.id === id ? { ...p, payment_status: 'verified' } : p));
    } catch (_) {}
  };

  const handleViewReceipt = (p) => {
    if (p.receipt_image_path) {
      window.open(`/${p.receipt_image_path}`, '_blank');
    } else {
      navigate(`/staff/requests/${p.request_id || p.id}`);
    }
  };

  const STATUS_BADGE = {
    pending: 'bg-surface-container-high text-on-surface-variant',
    verified: 'bg-secondary-container text-on-secondary-container',
    rejected: 'bg-error-container text-on-error-container',
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <StaffSidebar variant="staff" />

      <StaffHeader />

      <main className="md:ml-80 pt-24 pb-24 px-sm md:px-gutter max-w-container-max">
        <div className="mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-primary">{t('pending.payments.queue')}</h2>
          <p className="font-body-md text-on-surface-variant mt-xs">
            {t('payments.queue.desc')}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-xl">
            <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '40px' }}>sync</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-xl gap-md text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: '64px', opacity: 0.3 }}>payments</span>
            <p className="font-body-lg text-body-lg">{t('no.pending.payments')}</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 overflow-hidden rounded-xl shadow-sm">
            {/* Mobile View: Card List */}
            <div className="block md:hidden divide-y divide-outline-variant/10">
              {payments.map((p, i) => (
                <div key={p.id || i} className="p-md flex flex-col gap-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-label-lg text-on-surface font-bold">{p.parent_name || p.student_name || '—'}</p>
                      <p className="font-body-sm text-on-surface-variant">Req: BM-{p.request_id || p.id}</p>
                    </div>
                    <span className={`text-label-md px-sm py-0.5 rounded-full font-semibold capitalize ${STATUS_BADGE[p.payment_status] || STATUS_BADGE.pending}`}>
                      {t(p.payment_status || 'pending')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-b border-outline-variant/10 py-xs my-xs">
                    <span className="font-body-sm text-on-surface-variant">{t('amount')}: <strong className="text-on-surface font-semibold">BZD ${p.amount ? Number(p.amount).toFixed(2) : '—'}</strong></span>
                    <span className="font-mono text-body-sm text-on-surface-variant">Ref: {p.reference || '—'}</span>
                  </div>
                  
                  {/* Receipt Preview */}
                  {p.receipt_image_path && (
                    <div className="w-full h-32 border border-outline-variant/20 rounded-lg overflow-hidden relative bg-surface-container-low mb-xs">
                      {p.receipt_image_path.toLowerCase().endsWith('.pdf') ? (
                        <iframe
                          src={`/${p.receipt_image_path}#toolbar=0`}
                          title="Receipt Preview"
                          className="w-full h-full border-none"
                        />
                      ) : (
                        <img
                          src={`/${p.receipt_image_path}`}
                          alt="Receipt Preview"
                          className="w-full h-full object-contain cursor-pointer"
                          onClick={() => window.open(`/${p.receipt_image_path}`, '_blank')}
                        />
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-base">
                    <span className="font-body-sm text-on-surface-variant">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-BZ', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                    <div className="flex gap-sm">
                      <button
                        onClick={() => verifyPayment(p.id)}
                        disabled={p.payment_status === 'verified'}
                        className="inline-flex items-center gap-xs px-md py-sm bg-primary text-on-primary font-label-lg rounded hover:opacity-90 disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span> {t('verify')}
                      </button>
                      <button
                        onClick={() => handleViewReceipt(p)}
                        className="inline-flex items-center gap-xs px-md py-sm bg-secondary-container text-on-secondary-container font-label-lg rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span> {t('view.receipt')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <table className="hidden md:table w-full text-left">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant">
                  {[t('submitted'), t('requester'), t('amount'), t('ref'), t('receipt') || 'Receipt', t('status'), t('actions')].map((h, i) => (
                    <th key={h} className={`px-sm py-md font-label-lg text-label-lg uppercase tracking-wider ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {payments.map((p, i) => (
                  <tr key={p.id || i} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-sm py-md font-body-sm text-on-surface-variant">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-BZ', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-sm py-md">
                      <p className="font-label-lg text-on-surface font-bold">{p.parent_name || p.student_name || '—'}</p>
                      <p className="font-body-sm text-on-surface-variant">Req: BM-{p.request_id || p.id}</p>
                    </td>
                    <td className="px-sm py-md font-body-md text-on-surface font-semibold">
                      {p.amount ? `BZD $${Number(p.amount).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-sm py-md font-mono text-body-sm text-on-surface-variant">
                      {p.reference || '—'}
                    </td>
                    <td className="px-sm py-md">
                      {p.receipt_image_path ? (
                        <div className="w-12 h-12 border border-outline-variant/30 rounded overflow-hidden cursor-pointer hover:border-primary transition-all bg-surface-container-low flex items-center justify-center">
                          {p.receipt_image_path.toLowerCase().endsWith('.pdf') ? (
                            <span className="material-symbols-outlined text-[32px] text-on-surface-variant h-full flex items-center justify-center">picture_as_pdf</span>
                          ) : (
                            <img
                              src={`/${p.receipt_image_path}`}
                              alt="Receipt Thumbnail"
                              className="w-full h-full object-cover"
                              onClick={() => window.open(`/${p.receipt_image_path}`, '_blank')}
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-sm py-md">
                      <span className={`text-label-md px-sm py-0.5 rounded-full font-semibold capitalize ${STATUS_BADGE[p.payment_status] || STATUS_BADGE.pending}`}>
                        {t(p.payment_status || 'pending')}
                      </span>
                    </td>
                    <td className="px-sm py-md text-right">
                      <div className="flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => verifyPayment(p.id)}
                          disabled={p.payment_status === 'verified'}
                          className="p-2 hover:text-primary transition-colors disabled:opacity-30"
                          title={t('verify.payment')}
                        >
                          <span className="material-symbols-outlined">check_circle</span>
                        </button>
                        <button 
                          onClick={() => handleViewReceipt(p)}
                          className="p-2 hover:text-primary transition-colors" 
                          title={t('view.receipt')}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <BottomNav variant="staff" />
    </div>
  );
}
