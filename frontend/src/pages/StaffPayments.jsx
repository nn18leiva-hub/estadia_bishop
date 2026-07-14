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
    pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-500/20',
    verified: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-500/20',
    rejected: 'bg-error-container text-on-error-container border border-error/20',
  };

  const pendingCount = payments.filter(p => p.payment_status !== 'verified').length;
  const verifiedCount = payments.filter(p => p.payment_status === 'verified').length;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <StaffSidebar variant="staff" />

      <StaffHeader title="pending.payments.queue" />

      <main className="md:ml-80 pt-24 pb-24 px-sm md:px-gutter max-w-container-max">
        {/* Title Header */}
        <div className="mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-primary">{t('pending.payments.queue')}</h2>
          <p className="font-body-md text-on-surface-variant mt-xs">
            {t('payments.queue.desc')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mb-lg max-w-3xl">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md flex items-center gap-md shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">pending</span>
            </div>
            <div>
              <p className="text-label-md text-on-surface-variant font-medium">{t('pending.verification') || 'Pending Verification'}</p>
              <p className="text-headline-md font-headline-md text-on-surface font-bold">
                {loading ? '...' : pendingCount}
              </p>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md flex items-center gap-md shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">check_circle</span>
            </div>
            <div>
              <p className="text-label-md text-on-surface-variant font-medium">{t('verified') || 'Verified Payments'}</p>
              <p className="text-headline-md font-headline-md text-on-surface font-bold">
                {loading ? '...' : verifiedCount}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-xl">
            <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '40px' }}>sync</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-xl gap-md text-on-surface-variant bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-sm">
            <span className="material-symbols-outlined" style={{ fontSize: '64px', opacity: 0.3 }}>payments</span>
            <p className="font-body-lg text-body-lg font-semibold">{t('no.pending.payments')}</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/20 overflow-hidden rounded-xl shadow-sm">
            {/* Mobile View: Card List */}
            <div className="block md:hidden divide-y divide-outline-variant/10">
              {payments.map((p, i) => (
                <div key={p.id || i} className="p-md flex flex-col gap-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-label-lg text-on-surface font-bold">{p.parent_name || p.student_name || '—'}</p>
                      <p className="font-body-sm text-on-surface-variant">Req: BM-{p.request_id || p.id}</p>
                    </div>
                    <span className={`text-[11px] px-sm py-1 rounded-full font-semibold capitalize border ${STATUS_BADGE[p.payment_status] || STATUS_BADGE.pending}`}>
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

                  <div className="flex justify-between items-center border-t border-outline-variant/10 pt-xs mt-xs">
                    <span className="font-body-sm text-on-surface-variant font-medium">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-BZ', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                  </div>

                  <div className="flex gap-sm mt-sm">
                    <button
                      onClick={() => verifyPayment(p.id)}
                      disabled={p.payment_status === 'verified'}
                      className="flex-1 flex items-center justify-center gap-xs py-2 bg-primary text-on-primary font-label-md rounded-xl hover:bg-primary-container disabled:opacity-40 transition-all font-semibold active:scale-95 text-xs text-nowrap"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      {t('verify')}
                    </button>
                    <button
                      onClick={() => handleViewReceipt(p)}
                      className="flex-1 flex items-center justify-center gap-xs py-2 bg-surface-container-high text-primary font-label-md rounded-xl border border-outline-variant/30 hover:bg-surface-container-highest active:scale-95 transition-all font-semibold text-xs text-nowrap"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      {t('view') || 'View'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <table className="hidden md:table w-full text-left">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant">
                  {[t('submitted'), t('requester'), t('amount'), t('ref'), t('receipt') || 'Receipt', t('status'), t('actions')].map((h, i) => (
                    <th key={h} className={`px-md py-md font-label-lg text-label-lg uppercase tracking-wider ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {payments.map((p, i) => (
                  <tr key={p.id || i} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-md py-md font-body-sm text-on-surface-variant">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-BZ', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-md py-md">
                      <p className="font-label-lg text-on-surface font-bold">{p.parent_name || p.student_name || '—'}</p>
                      <p className="font-body-sm text-on-surface-variant">Req: BM-{p.request_id || p.id}</p>
                    </td>
                    <td className="px-md py-md font-body-md text-on-surface font-semibold">
                      {p.amount ? `BZD $${Number(p.amount).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-md py-md font-mono text-body-sm text-on-surface-variant">
                      {p.reference || '—'}
                    </td>
                    <td className="px-md py-md">
                      {p.receipt_image_path ? (
                        <div className="w-12 h-12 border border-outline-variant/30 rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-all bg-surface-container-low flex items-center justify-center">
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
                    <td className="px-md py-md">
                      <span className={`text-[11px] px-sm py-1 rounded-full font-semibold capitalize border ${STATUS_BADGE[p.payment_status] || STATUS_BADGE.pending}`}>
                        {t(p.payment_status || 'pending')}
                      </span>
                    </td>
                    <td className="px-md py-md text-right">
                      <div className="flex justify-end gap-xs">
                        <button
                          onClick={() => verifyPayment(p.id)}
                          disabled={p.payment_status === 'verified'}
                          className="flex items-center gap-xs px-sm py-1.5 bg-primary text-on-primary rounded-xl font-label-md shadow-sm hover:bg-primary-container disabled:opacity-40 transition-all font-semibold active:scale-95 disabled:pointer-events-none"
                          title={t('verify.payment')}
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          {t('verify')}
                        </button>
                        <button 
                          onClick={() => handleViewReceipt(p)}
                          className="flex items-center gap-xs px-sm py-1.5 bg-surface-container-high text-primary rounded-xl font-label-md border border-outline-variant/30 hover:bg-surface-container-highest transition-all font-semibold active:scale-95" 
                          title={t('view.receipt')}
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          {t('view')}
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
