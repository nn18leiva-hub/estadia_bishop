import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';
import StaffHeader from '../components/StaffHeader';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const STATUS_OPTS = ['pending', 'processing', 'ready', 'issued', 'action'];
const STATUS_LABELS = { pending: 'Pending', processing: 'Processing', ready: 'Ready for Pickup', issued: 'Issued', action: 'Action Required' };

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

  const updateStatus = async (id, status) => {
    try {
      await apiFetch(`/staff/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (_) {}
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
          <section className="flex flex-col md:flex-row md:items-end justify-between mb-lg gap-md">
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
              className="bg-primary hover:bg-primary-container text-white px-md py-sm rounded transition-all flex items-center gap-xs font-label-lg shadow-sm self-start"
            >
              <span className="material-symbols-outlined">download</span>
              {t('export.queue')}
            </button>
          </section>

          {/* Filter Bar */}
          <div className="bg-surface-container-lowest border border-outline-variant p-sm mb-md flex flex-wrap items-center gap-md w-full overflow-hidden rounded">
            <div className="relative flex-grow min-w-[240px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-outline bg-transparent focus:border-primary text-body-md outline-none transition-colors rounded"
                placeholder={t('search.placeholder')}
              />
            </div>
            <div className="flex gap-sm flex-wrap">
              <select
                value={docFilter}
                onChange={e => { setDocFilter(e.target.value); setPage(1); }}
                className="bg-transparent border border-outline px-md py-2 font-label-md focus:border-primary outline-none rounded"
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
                className="bg-transparent border border-outline px-md py-2 font-label-md focus:border-primary outline-none rounded"
              >
                <option value="">{t('status.all')}</option>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface-container-lowest border border-outline-variant overflow-x-auto rounded">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group">
                <tr className="bg-surface-container text-on-surface border-b border-outline-variant">
                  <th className="px-sm py-md font-label-lg text-label-lg uppercase tracking-wider">{t('date.received')}</th>
                  <th className="px-sm py-md font-label-lg text-label-lg uppercase tracking-wider">{t('student.details')}</th>
                  <th className="px-sm py-md font-label-lg text-label-lg uppercase tracking-wider">{t('document.type')}</th>
                  <th className="px-sm py-md font-label-lg text-label-lg uppercase tracking-wider">{t('status')}</th>
                  <th className="px-sm py-md font-label-lg text-label-lg uppercase tracking-wider text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
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
                        className="hover:bg-surface-container-low transition-colors group flex flex-col md:table-row p-4 md:p-0 border-b md:border-b-0 cursor-pointer"
                        onClick={() => navigate(`/staff/requests/${req.id}`)}
                      >
                        <td className="px-0 md:px-sm py-1 md:py-md block md:table-cell">
                          <p className="font-body-md text-on-surface">{req.created_at ? new Date(req.created_at).toLocaleDateString('en-BZ', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
                          <p className="font-body-sm text-on-surface-variant">Ref: BM-{req.id}</p>
                        </td>
                        <td className="px-sm py-md block md:table-cell">
                          <div className="flex items-center gap-sm">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-label-md ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                              {initials}
                            </div>
                            <div>
                              <p className="font-label-lg text-on-surface">{req.student_name || '—'}</p>
                              <p className="font-body-sm text-on-surface-variant">{req.grade || '—'} | ID: {req.student_id || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-sm py-md block md:table-cell">
                          <span className="font-body-md text-on-surface">{translateDocType(req.document_type)}</span>
                        </td>
                        <td className="px-sm py-md block md:table-cell">
                          <select
                            value={req.status || 'pending'}
                            onChange={e => updateStatus(req.id, e.target.value)}
                            className="bg-transparent border border-outline px-xs py-1 font-label-md focus:border-primary text-primary outline-none rounded-lg cursor-pointer w-full max-w-[160px]"
                          >
                            {STATUS_OPTS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                          </select>
                        </td>
                        <td className="px-sm py-md text-right block md:table-cell">
                          <div className="flex justify-end gap-xs opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => navigate(`/staff/requests/${req.id}`)} className="p-2 hover:text-primary transition-colors" title="Review">
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                            <button onClick={() => updateStatus(req.id, 'issued')} className="p-2 hover:text-primary transition-colors" title="Approve">
                              <span className="material-symbols-outlined">check_circle</span>
                            </button>
                            <button onClick={() => updateStatus(req.id, 'action')} className="p-2 hover:text-error transition-colors" title="Flag">
                              <span className="material-symbols-outlined">cancel</span>
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
              <p className="text-on-surface-variant font-body-sm">
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total} requests
              </p>
              <div className="flex gap-xs">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 border border-outline hover:bg-surface-container-high transition-colors disabled:opacity-40 rounded">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {[...Array(Math.ceil(total / PER_PAGE))].slice(0, 5).map((_, i) => (
                  <button key={i + 1} onClick={() => setPage(i + 1)}
                    className={`px-4 py-2 border font-label-md rounded transition-colors
                      ${page === i + 1 ? 'border-primary bg-primary text-on-primary' : 'border-outline hover:bg-surface-container-high'}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / PER_PAGE)}
                  className="p-2 border border-outline hover:bg-surface-container-high transition-colors disabled:opacity-40 rounded">
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
