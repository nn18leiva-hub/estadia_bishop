import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';
import StaffHeader from '../components/StaffHeader';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function StaffVerification() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/staff/verifications')
      .then(data => setItems(Array.isArray(data) ? data : data.verifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateVerification = async (id, status) => {
    try {
      await apiFetch(`/staff/verifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    } catch (_) {}
  };

  const STATUS_BADGE = {
    pending: 'bg-surface-container-high text-on-surface-variant',
    approved: 'bg-secondary-container text-on-secondary-container',
    rejected: 'bg-error-container text-on-error-container',
    reviewing: 'bg-primary-fixed text-primary',
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <StaffSidebar variant="staff" />

      <StaffHeader />

      <main className="md:ml-80 pt-24 pb-24 px-sm md:px-gutter max-w-container-max">
        <div className="mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-primary">{t('id.verification.queue')}</h2>
          <p className="font-body-md text-on-surface-variant mt-xs">
            {t('review.id.docs.desc')}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-xl">
            <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '40px' }}>sync</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-xl gap-md text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: '64px', opacity: 0.3 }}>verified_user</span>
            <p className="font-body-lg text-body-lg">{t('no.pending.verifications')}</p>
            <p className="font-body-sm">{t('all.id.docs.reviewed')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
            {items.map(item => (
              <div key={item.id} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md flex flex-col gap-md hover:border-primary/40 transition-all">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-sm">
                    <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center font-bold text-headline-sm text-on-primary">
                      {(item.name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-label-lg text-label-lg text-on-surface">{item.name || t('unknown')}</p>
                      <p className="font-body-sm text-on-surface-variant">{item.email || '—'}</p>
                    </div>
                  </div>
                  <span className={`text-label-md px-sm py-0.5 rounded-full font-semibold ${STATUS_BADGE[item.status] || STATUS_BADGE.pending}`}>
                    {t(item.status || 'pending')}
                  </span>
                </div>

                {/* Document Type */}
                <div className="bg-surface-container rounded-lg p-sm flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>badge</span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface-variant">{t('document.type')}</p>
                    <p className="font-body-md text-on-surface">{item.doc_type ? t(item.doc_type.toLowerCase()) : t('government.id')}</p>
                  </div>
                </div>

                {/* Submitted */}
                <div className="flex items-center gap-xs text-on-surface-variant">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                  <span className="font-body-sm text-body-sm">
                    {t('submitted')} {item.created_at ? new Date(item.created_at).toLocaleDateString('en-BZ', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </span>
                </div>

                {/* Actions */}
                {item.status === 'pending' || item.status === 'reviewing' ? (
                  <div className="flex gap-sm mt-auto">
                    <button
                      onClick={() => updateVerification(item.id, 'approved')}
                      className="flex-1 bg-primary text-on-primary py-xs rounded-lg font-label-lg hover:bg-primary-container transition-all flex items-center justify-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-sm">check</span> {t('approve')}
                    </button>
                    <button
                      onClick={() => updateVerification(item.id, 'rejected')}
                      className="flex-1 border border-error text-error py-xs rounded-lg font-label-lg hover:bg-error-container transition-all flex items-center justify-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-sm">close</span> {t('reject')}
                    </button>
                  </div>
                ) : (
                  <div className="mt-auto flex items-center gap-xs text-on-surface-variant">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
                      {item.status === 'approved' ? 'check_circle' : 'cancel'}
                    </span>
                    <span className="font-label-lg text-label-lg">
                      {t(item.status)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav variant="staff" />
    </div>
  );
}
