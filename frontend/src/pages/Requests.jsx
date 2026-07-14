import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';
import StaffHeader from '../components/StaffHeader';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const STATUS_OPTS = ['pending', 'pending_verification', 'processing', 'ready_for_pickup', 'completed', 'action', 'denied'];
const STATUS_LABELS = {
  pending: 'Pending',
  pending_verification: 'Pending ID Verification',
  processing: 'Processing',
  ready: 'Ready for Pickup',
  ready_for_pickup: 'Ready for Pickup',
  issued: 'Completed/Issued',
  completed: 'Completed/Issued',
  action: 'Action Required',
  cancelled: 'Cancelled/Denied',
  denied: 'Cancelled/Denied',
};
const STATUS_COLORS = {
  pending: 'bg-surface-container-high text-on-surface-variant border border-outline-variant/20',
  pending_verification: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-500/20',
  processing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-500/20',
  ready: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-500/20',
  ready_for_pickup: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-500/20',
  issued: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-500/20',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-500/20',
  action: 'bg-error-container text-on-error-container border border-error/20',
  cancelled: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/20',
  denied: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/20',
};

export default function Requests() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const getStatusLabel = (s) => t(s === 'action' ? 'action.required' : s);

  const translateDocType = (type) => {
    if (!type) return '—';
    if (type === "Dean's Letter") return t('deans.letter');
    if (type === "Letter of Enrollment") return t('enrollment.letter');
    const key = type.toLowerCase().replace(/\s+/g, '.');
    return t(key);
  };
  const [search, setSearch] = useState('');
  const [docFilter, setDocFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 10;

  useEffect(() => { fetchRequests(); }, [page, search, docFilter, statusFilter]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, docFilter, statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PER_PAGE });
      if (search) params.set('search', search);
      if (docFilter) params.set('documentType', docFilter);
      if (statusFilter) params.set('status', statusFilter);
      const data = await apiFetch(`/staff/requests?${params}`);
      setRequests(Array.isArray(data) ? data : data.requests || []);
      setTotal(data.total || 0);
    } catch (_) {}
    setLoading(false);
  };

  const [updatingId, setUpdatingId] = useState(null);

  const updateStatus = async (id, status) => {
    const prevRequests = [...requests];
    // Optimistic update
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    setUpdatingId(id);
    try {
      await apiFetch(`/staff/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error('Status update failed:', err);
      setRequests(prevRequests);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    return !q || r.student_name?.toLowerCase().includes(q) || r.id?.toString().includes(q) || r.document_type?.toLowerCase().includes(q);
  });

  const AVATAR_COLORS = ['bg-tertiary-fixed text-on-tertiary-fixed', 'bg-primary-fixed text-on-primary-fixed', 'bg-secondary-fixed text-on-secondary-fixed', 'bg-surface-container-highest text-on-surface-variant'];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <StaffSidebar variant="staff" />

      <StaffHeader />

      <main className="md:ml-80 pt-16 pb-24">
        {/* Alert bar */}
        <div className="bg-surface-container-low border-b border-outline-variant px-sm md:px-gutter py-2">
          <div className="flex items-center gap-xs text-on-surface-variant font-label-lg max-w-container-max mx-auto">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>pending_actions</span>
            <span>{total > 0 ? `${total} ${t('requests.in.queue')}` : t('loading.queue')}</span>
          </div>
        </div>

        <div className="max-w-full overflow-x-hidden p-sm md:p-gutter">
          {/* Page Header */}
          <section className="flex flex-col md:flex-row md:items-end justify-between mb-lg gap-md px-sm md:px-0">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary mb-xs">{t('request.management')}</h2>
              <p className="text-on-surface-variant font-body-md max-w-2xl">
                {t('requests.subtitle')}
              </p>
            </div>
            <button
              onClick={() => {
                const csv = [
                  [t('ref'), t('student'), t('document'), t('date'), t('status')],
                  ...filtered.map(r => [
                    `BM-${r.id}`,
                    r.student_name || '',
                    r.document_type || '',
                    r.created_at ? new Date(r.created_at).toLocaleDateString('en-BZ') : '',
                    r.status || 'pending',
                  ])
                ].map(row => row.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `requests-export-${Date.now()}.csv`;
                a.click();
              }}
              className="bg-primary hover:bg-primary-container text-on-primary px-md py-sm rounded-xl transition-all flex items-center gap-xs font-label-lg shadow-sm self-start font-semibold active:scale-95"
            >
              <span className="material-symbols-outlined">download</span>
              {t('export.queue')}
            </button>
          </section>

          {/* Filter Bar */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 p-md mb-md flex flex-col gap-sm w-full overflow-hidden rounded-xl shadow-sm">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-sm border border-outline-variant/40 bg-surface-container/50 focus:border-primary text-body-md outline-none transition-colors rounded-xl focus:ring-1 focus:ring-primary/20"
                placeholder={t('search.placeholder')}
              />
            </div>
            <div className="flex gap-sm flex-wrap">
              <select
                value={docFilter}
                onChange={e => { setDocFilter(e.target.value); setPage(1); }}
                className="bg-surface border border-outline-variant/40 px-md py-sm font-label-md focus:border-primary outline-none rounded-xl flex-1 min-w-0 text-on-surface focus:ring-1 focus:ring-primary/20"
              >
                <option value="">{t('all.doc.types')}</option>
                <option value="Official Transcript">{t('official.transcript')}</option>
                <option value="Enrollment Letter">{t('enrollment.letter')}</option>
                <option value="Graduation Certificate">{t('graduation.cert')}</option>
                <option value="Replacement Diploma">{t('replacement.diploma')}</option>
              </select>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-surface border border-outline-variant/40 px-md py-sm font-label-md focus:border-primary outline-none rounded-xl flex-1 min-w-0 text-on-surface focus:ring-1 focus:ring-primary/20"
              >
                <option value="">{t('status.all')}</option>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
              </select>
            </div>
          </div>

          {/* Table / List Container */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-sm overflow-hidden">
            {/* Mobile View: Compact Cards */}
            <div className="block md:hidden divide-y divide-outline-variant/10">
              {loading ? (
                <div className="flex items-center justify-center py-lg">
                  <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '32px' }}>sync</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-xl text-on-surface-variant font-body-md">
                  {t('no.matching.requests')}
                </div>
              ) : (
                filtered.map((req, i) => {
                  const initials = (req.student_name || 'XX').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <div
                      key={req.id || i}
                      className="p-md flex flex-col gap-xs hover:bg-surface-container-low transition-colors cursor-pointer"
                      onClick={() => navigate(`/staff/requests/${req.id}`)}
                    >
                      <div className="flex justify-between items-start gap-xs">
                        <div className="flex items-center gap-sm min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-label-md flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-label-lg text-on-surface font-bold truncate">{req.student_name || '—'}</p>
                            <p className="font-body-xs text-on-surface-variant truncate">{req.grade || '—'}</p>
                          </div>
                        </div>
                        <span className="font-body-xs text-on-surface-variant flex-shrink-0">
                          {req.created_at ? new Date(req.created_at).toLocaleDateString('en-BZ', { month: 'short', day: 'numeric' }) : '—'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-xs">
                        <div className="min-w-0 pr-xs">
                          <p className="font-body-sm text-on-surface font-semibold truncate">{translateDocType(req.document_type)}</p>
                          <p className="text-[10px] text-on-surface-variant">Ref: BM-{req.id}</p>
                        </div>
                        
                        <div onClick={e => e.stopPropagation()} className="flex-shrink-0">
                          {(!req.parent_verified || (req.requires_payment && !req.payment_verified)) ? (
                            <div 
                              className="flex items-center gap-xxs px-sm py-0.5 rounded-full border border-outline-variant/30 bg-surface-container-high text-on-surface-variant font-label-md text-[10px] cursor-not-allowed select-none" 
                              title="Locked"
                            >
                              <span className="material-symbols-outlined text-[12px] text-on-surface-variant">lock</span>
                              <span>{getStatusLabel(req.status)}</span>
                            </div>
                          ) : (
                            <select
                              value={req.status || 'pending'}
                              disabled={updatingId === req.id}
                              onChange={e => { e.stopPropagation(); updateStatus(req.id, e.target.value); }}
                              onClick={e => e.stopPropagation()}
                              className={`border font-label-md text-[10px] px-sm py-0.5 rounded-full cursor-pointer outline-none focus:ring-1 focus:ring-primary/20 transition-all ${
                                STATUS_COLORS[req.status] || STATUS_COLORS.pending
                              } ${updatingId === req.id ? 'opacity-60 cursor-wait' : ''}`}
                            >
                              {STATUS_OPTS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop View: Table */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface border-b border-outline-variant">
                  <th className="px-md py-md font-label-lg text-label-lg uppercase tracking-wider">{t('date.received')}</th>
                  <th className="px-md py-md font-label-lg text-label-lg uppercase tracking-wider">{t('student.details')}</th>
                  <th className="px-md py-md font-label-lg text-label-lg uppercase tracking-wider">{t('document.type')}</th>
                  <th className="px-md py-md font-label-lg text-label-lg uppercase tracking-wider">{t('status')}</th>
                  <th className="px-md py-md font-label-lg text-label-lg uppercase tracking-wider text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-xl">
                    <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '32px' }}>sync</span>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-xl text-on-surface-variant font-body-md">
                    {t('no.matching.requests')}
                  </td></tr>
                ) : (
                  filtered.map((req, i) => {
                    const initials = (req.student_name || 'XX').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <tr
                        key={req.id || i}
                        className="hover:bg-surface-container-low transition-colors group cursor-pointer"
                        onClick={() => navigate(`/staff/requests/${req.id}`)}
                      >
                        <td className="px-md py-md">
                          <p className="font-body-md text-on-surface font-semibold">{req.created_at ? new Date(req.created_at).toLocaleDateString('en-BZ', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
                          <p className="font-body-sm text-on-surface-variant">Ref: BM-{req.id}</p>
                        </td>
                        <td className="px-md py-md">
                          <div className="flex items-center gap-sm">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-label-md ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                              {initials}
                            </div>
                            <div>
                              <p className="font-label-lg text-on-surface font-bold">{req.student_name || '—'}</p>
                              <p className="font-body-sm text-on-surface-variant">{req.grade || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-md py-md">
                          <span className="font-body-md text-on-surface font-semibold">{translateDocType(req.document_type)}</span>
                        </td>
                        <td className="px-md py-md" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-xs relative">
                            {(!req.parent_verified || (req.requires_payment && !req.payment_verified)) ? (
                              <div 
                                className="flex items-center gap-xxs px-sm py-1 rounded-full border border-outline-variant/30 bg-surface-container-high text-on-surface-variant font-label-md text-xs cursor-not-allowed select-none" 
                                title="Locked: Requester ID or Payment verification pending"
                              >
                                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">lock</span>
                                <span>{getStatusLabel(req.status)}</span>
                              </div>
                            ) : (
                              <>
                                <select
                                  value={req.status || 'pending'}
                                  disabled={updatingId === req.id}
                                  onChange={e => { e.stopPropagation(); updateStatus(req.id, e.target.value); }}
                                  onClick={e => e.stopPropagation()}
                                  className={`border font-label-md text-xs px-sm py-1 rounded-full cursor-pointer outline-none focus:ring-1 focus:ring-primary/20 transition-all ${
                                    STATUS_COLORS[req.status] || STATUS_COLORS.pending
                                  } ${updatingId === req.id ? 'opacity-60 cursor-wait' : ''}`}
                                >
                                  {STATUS_OPTS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                                </select>
                                {updatingId === req.id && (
                                  <span className="material-symbols-outlined animate-spin text-primary absolute -right-6 top-1/2 -translate-y-1/2" style={{ fontSize: '14px' }}>sync</span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-md py-md text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-xs">
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`/staff/requests/${req.id}`); }}
                              className="flex items-center gap-xs px-sm py-1 bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant/30 rounded-xl font-label-md transition-all active:scale-95 font-semibold"
                              title="Open detail"
                            >
                              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                              {t('view') || 'Details'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > PER_PAGE && (
            <div className="mt-md flex justify-between items-center px-sm flex-col gap-md md:flex-row">
              <p className="text-on-surface-variant font-body-sm font-medium">
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total} requests
              </p>
              <div className="flex gap-xs">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 border border-outline-variant/30 hover:bg-surface-container-high transition-colors disabled:opacity-40 rounded-xl bg-surface-container-lowest">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {[...Array(Math.ceil(total / PER_PAGE))].slice(0, 5).map((_, i) => (
                  <button key={i + 1} onClick={() => setPage(i + 1)}
                    className={`px-4 py-2 border font-label-md rounded-xl transition-colors
                      ${page === i + 1 ? 'border-primary bg-primary text-on-primary font-bold shadow-sm' : 'border-outline-variant/30 hover:bg-surface-container-high bg-surface-container-lowest'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / PER_PAGE)}
                  className="p-2 border border-outline-variant/30 hover:bg-surface-container-high transition-colors disabled:opacity-40 rounded-xl bg-surface-container-lowest">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav variant="staff" />
    </div>
  );
}
