import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';
import StaffHeader from '../components/StaffHeader';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const STATUS_OPTS = ['pending', 'pending_verification', 'processing', 'ready_for_pickup', 'completed', 'action', 'denied'];

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

const PENDING_STATUSES = ['pending', 'pending_verification', 'processing', 'ready', 'ready_for_pickup', 'action'];

export default function Requests() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDocTab, setActiveDocTab] = useState('all');
  const [statusSubTab, setStatusSubTab] = useState('pending'); // 'pending' | 'completed' | 'all'
  const [docTypes, setDocTypes] = useState([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('all'); // 'all' | 'today' | '7days' | '30days' | 'custom'
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 25;

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    if (preset === 'today') {
      const dateStr = today.toISOString().split('T')[0];
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (preset === '7days') {
      const past = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === '30days') {
      const past = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
    setPage(1);
  };

  const getStatusLabel = (s) => t(s === 'action' ? 'action.required' : s);

  const translateDocType = (type) => {
    if (!type) return '—';
    if (type === "Dean's Letter" || type === 'deans') return t('deans.letter');
    if (type === "Letter of Enrollment" || type === 'enrollment') return t('enrollment.letter');
    if (type === "Official Transcript" || type === 'transcript') return t('official.transcript');
    if (type === "Graduation Certificate" || type === 'graduation') return t('graduation.cert');
    if (type === "Replacement Diploma" || type === 'diploma') return t('diploma');
    if (type === "Good Moral Certificate" || type === 'good_moral') return t('good_moral');
    if (type === "Lateness Form" || type === 'lateness_form') return t('lateness.form');
    if (type === "Absence Form" || type === 'absence_form') return t('absence.form');
    const key = type.toLowerCase().replace(/\s+/g, '.');
    return t(key);
  };

  useEffect(() => {
    apiFetch('/requests/document-types')
      .then(data => {
        if (Array.isArray(data)) setDocTypes(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [page, activeDocTab, statusSubTab, search, startDate, endDate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, activeDocTab, statusSubTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PER_PAGE });
      if (search) params.set('search', search);
      if (activeDocTab && activeDocTab !== 'all') params.set('documentType', activeDocTab);
      if (statusSubTab && statusSubTab !== 'all') params.set('status', statusSubTab);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const data = await apiFetch(`/staff/requests?${params}`);
      setRequests(Array.isArray(data) ? data : data.requests || []);
      setTotal(data.total || 0);
    } catch (_) {}
    setLoading(false);
  };

  const [updatingId, setUpdatingId] = useState(null);
  const [denialConfirmTarget, setDenialConfirmTarget] = useState(null);

  const executeStatusUpdate = async (id, status) => {
    const prevRequests = [...requests];
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
      setDenialConfirmTarget(null);
    }
  };

  const updateStatus = async (id, status) => {
    if (status === 'denied' || status === 'cancelled') {
      setDenialConfirmTarget({ id, status });
      return;
    }
    await executeStatusUpdate(id, status);
  };

  const isPendingStatus = (status) => PENDING_STATUSES.includes(status);

  // Client side search and date filter
  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      r.student_name?.toLowerCase().includes(q) ||
      r.id?.toString().includes(q) ||
      r.document_type?.toLowerCase().includes(q);

    let matchesDate = true;
    if (r.created_at) {
      const reqDate = new Date(r.created_at);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (reqDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (reqDate > end) matchesDate = false;
      }
    }
    return matchesSearch && matchesDate;
  });

  const pendingRequests = filtered.filter(r => isPendingStatus(r.status));
  const completedRequests = filtered.filter(r => !isPendingStatus(r.status));

  // Tab options matching screenshot style
  const tabOptions = [
    { id: 'all', label: t('all.types') },
    ...(docTypes.length > 0
      ? docTypes.map(dt => ({
          id: dt.name,
          label: translateDocType(dt.name),
        }))
      : [
          { id: 'lateness_form', label: t('lateness.form') },
          { id: 'absence_form', label: t('absence.form') },
          { id: 'transcript', label: t('official.transcript') },
        ])
  ];

  const AVATAR_COLORS = [
    'bg-tertiary-fixed text-on-tertiary-fixed',
    'bg-primary-fixed text-on-primary-fixed',
    'bg-secondary-fixed text-on-secondary-fixed',
    'bg-surface-container-highest text-on-surface-variant'
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <StaffSidebar variant="staff" />
      <StaffHeader />

      <main className="md:ml-80 pt-16 pb-24">
        {/* Top summary alert bar */}
        <div className="bg-surface-container-low border-b border-outline-variant px-sm md:px-gutter py-2">
          <div className="flex items-center justify-between max-w-container-max mx-auto text-on-surface-variant font-label-lg">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>pending_actions</span>
              <span>{total > 0 ? `${total} ${t('requests.in.queue')}` : t('loading.queue')}</span>
            </div>
            <div className="flex gap-md text-xs font-semibold">
              <span className="text-amber-700 dark:text-amber-400">⏳ {pendingRequests.length} {t('pending.requests')}</span>
              <span className="text-green-700 dark:text-green-400">✅ {completedRequests.length} {t('completed.requests')}</span>
            </div>
          </div>
        </div>

        <div className="max-w-full overflow-x-hidden p-sm md:p-gutter">
          {/* Header section with CSV Export */}
          <section className="flex flex-col md:flex-row md:items-end justify-between mb-md gap-md">
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
                    `BM-${String(r.id).padStart(4, '0')}`,
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
              className="bg-primary hover:bg-primary-container text-on-primary px-md py-sm rounded-xl transition-all flex items-center gap-xs font-label-lg shadow-sm self-start font-semibold active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {t('export.queue')}
            </button>
          </section>

          {/* REQUEST TYPE TABS BAR (Design matching image underline tabs) */}
          <div className="flex border-b border-outline-variant/20 gap-xs sm:gap-md overflow-x-auto pb-0 mb-md scrollbar-none">
            {tabOptions.map(tab => {
              const isActive = activeDocTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveDocTab(tab.id);
                    setPage(1);
                  }}
                  className={`pb-xs px-xs font-label-md text-label-md sm:font-label-lg sm:text-label-lg transition-all border-b-2 uppercase tracking-wider font-bold whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* SEARCH BAR & STATUS SUB-TABS (Matching image search bar container) */}
          <div className="bg-surface-container-lowest border border-outline-variant/15 p-xs sm:p-sm rounded-2xl shadow-sm mb-md flex flex-col md:flex-row justify-between items-stretch md:items-center gap-md">
            {/* Search Input Box */}
            <div className="relative flex items-center w-full md:max-w-md">
              <span className="material-symbols-outlined absolute left-sm text-on-surface-variant text-[20px]">search</span>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-xl pr-sm py-xs bg-surface border border-outline-variant/35 focus:border-primary rounded-xl font-body-md outline-none transition-colors text-on-surface"
                placeholder={t('search.placeholder')}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-sm p-1 hover:bg-surface-container-low rounded-lg text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Status Sub-Tabs: PENDING | COMPLETED | ALL STATUSES */}
            <div className="flex items-center gap-xs sm:gap-md border-t md:border-t-0 border-outline-variant/15 pt-xs md:pt-0 overflow-x-auto">
              <button
                onClick={() => { setStatusSubTab('pending'); setPage(1); }}
                className={`pb-xs px-2 font-label-md text-label-md transition-all border-b-2 uppercase tracking-wider font-bold whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  statusSubTab === 'pending'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                <span>{t('pending.requests')}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                  {pendingRequests.length}
                </span>
              </button>

              <button
                onClick={() => { setStatusSubTab('completed'); setPage(1); }}
                className={`pb-xs px-2 font-label-md text-label-md transition-all border-b-2 uppercase tracking-wider font-bold whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  statusSubTab === 'completed'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                <span>{t('completed.requests')}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-green-500/20 text-green-700 dark:text-green-300 font-bold">
                  {completedRequests.length}
                </span>
              </button>

              <button
                onClick={() => { setStatusSubTab('all'); setPage(1); }}
                className={`pb-xs px-2 font-label-md text-label-md transition-all border-b-2 uppercase tracking-wider font-bold whitespace-nowrap cursor-pointer ${
                  statusSubTab === 'all'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                <span>{t('all.statuses')}</span>
              </button>
            </div>
          </div>

          {/* DATE FILTER BAR */}
          <div className="bg-surface-container-lowest border border-outline-variant/15 p-xs sm:p-sm rounded-2xl shadow-sm mb-md flex flex-col md:flex-row items-start md:items-center justify-between gap-md">
            <div className="flex flex-wrap items-center gap-xs">
              <div className="flex items-center gap-xs text-on-surface-variant font-bold uppercase tracking-wider text-xs mr-xs">
                <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                <span>{t('filter.by.date') || 'Date Filter'}:</span>
              </div>
              {[
                { id: 'all', label: t('all.time') || 'All Time' },
                { id: 'today', label: t('today') || 'Today' },
                { id: '7days', label: t('last.7.days') || 'Last 7 Days' },
                { id: '30days', label: t('last.30.days') || 'Last 30 Days' },
                { id: 'custom', label: t('custom.range') || 'Custom' },
              ].map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleDatePresetChange(preset.id)}
                  className={`px-sm py-1 rounded-xl font-label-md font-semibold transition-all cursor-pointer ${
                    datePreset === preset.id
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-xs w-full md:w-auto">
              <div className="flex items-center gap-xs bg-surface border border-outline-variant/30 rounded-xl px-xs py-1">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase">{t('from.date') || 'From'}:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                    setPage(1);
                  }}
                  className="bg-transparent text-on-surface font-body-sm outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-xs bg-surface border border-outline-variant/30 rounded-xl px-xs py-1">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase">{t('to.date') || 'To'}:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                    setPage(1);
                  }}
                  className="bg-transparent text-on-surface font-body-sm outline-none cursor-pointer"
                />
              </div>

              {(startDate || endDate || search || datePreset !== 'all') && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setDatePreset('all');
                    setSearch('');
                    setPage(1);
                  }}
                  className="px-xs py-1 hover:bg-error-container/20 text-error rounded-xl font-label-sm flex items-center gap-0.5 cursor-pointer font-bold"
                  title="Clear filters"
                >
                  <span className="material-symbols-outlined text-[16px]">clear_all</span>
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* REQUESTS LISTINGS */}
          {statusSubTab === 'pending' && (
            <RequestRegistryTable
              title={t('pending.queue')}
              items={pendingRequests}
              loading={loading}
              updatingId={updatingId}
              updateStatus={updateStatus}
              getStatusLabel={getStatusLabel}
              translateDocType={translateDocType}
              STATUS_OPTS={STATUS_OPTS}
              STATUS_COLORS={STATUS_COLORS}
              AVATAR_COLORS={AVATAR_COLORS}
              navigate={navigate}
              t={t}
              emptyText={t('no.matching.requests')}
            />
          )}

          {statusSubTab === 'completed' && (
            <RequestRegistryTable
              title={t('completed.history')}
              items={completedRequests}
              loading={loading}
              updatingId={updatingId}
              updateStatus={updateStatus}
              getStatusLabel={getStatusLabel}
              translateDocType={translateDocType}
              STATUS_OPTS={STATUS_OPTS}
              STATUS_COLORS={STATUS_COLORS}
              AVATAR_COLORS={AVATAR_COLORS}
              navigate={navigate}
              t={t}
              emptyText={t('no.matching.requests')}
            />
          )}

          {statusSubTab === 'all' && (
            <div className="space-y-lg">
              <RequestRegistryTable
                title={t('pending.queue')}
                items={pendingRequests}
                loading={loading}
                updatingId={updatingId}
                updateStatus={updateStatus}
                getStatusLabel={getStatusLabel}
                translateDocType={translateDocType}
                STATUS_OPTS={STATUS_OPTS}
                STATUS_COLORS={STATUS_COLORS}
                AVATAR_COLORS={AVATAR_COLORS}
                navigate={navigate}
                t={t}
                emptyText={t('no.matching.requests')}
              />

              <RequestRegistryTable
                title={t('completed.history')}
                items={completedRequests}
                loading={loading}
                updatingId={updatingId}
                updateStatus={updateStatus}
                getStatusLabel={getStatusLabel}
                translateDocType={translateDocType}
                STATUS_OPTS={STATUS_OPTS}
                STATUS_COLORS={STATUS_COLORS}
                AVATAR_COLORS={AVATAR_COLORS}
                navigate={navigate}
                t={t}
                emptyText={t('no.matching.requests')}
              />
            </div>
          )}

          {/* Pagination controls */}
          {total > PER_PAGE && (
            <div className="mt-md flex justify-between items-center px-sm flex-col gap-md md:flex-row">
              <p className="text-on-surface-variant font-body-sm font-medium">
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total} requests
              </p>
              <div className="flex gap-xs">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-outline-variant/30 hover:bg-surface-container-high transition-colors disabled:opacity-40 rounded-xl bg-surface-container-lowest cursor-pointer"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {[...Array(Math.ceil(total / PER_PAGE))].slice(0, 5).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-4 py-2 border font-label-md rounded-xl transition-colors cursor-pointer ${
                      page === i + 1
                        ? 'border-primary bg-primary text-on-primary font-bold shadow-sm'
                        : 'border-outline-variant/30 hover:bg-surface-container-high bg-surface-container-lowest'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / PER_PAGE)}
                  className="p-2 border border-outline-variant/30 hover:bg-surface-container-high transition-colors disabled:opacity-40 rounded-xl bg-surface-container-lowest cursor-pointer"
                >
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

function RequestRegistryTable({
  title,
  items,
  loading,
  updatingId,
  updateStatus,
  getStatusLabel,
  translateDocType,
  STATUS_OPTS,
  STATUS_COLORS,
  AVATAR_COLORS,
  navigate,
  t,
  emptyText,
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200 mb-md">
      {/* Table section header */}
      <div className="px-md py-sm border-b border-outline-variant/15 bg-surface-container-low flex items-center justify-between">
        <span className="font-label-lg uppercase tracking-wider font-bold text-on-surface">{title}</span>
        <span className="px-sm py-0.5 rounded-full text-xs font-bold bg-surface-container-high text-on-surface-variant">
          {items.length} {items.length === 1 ? 'request' : 'requests'}
        </span>
      </div>

      {/* Desktop view matching screenshot table structure */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-body-sm min-w-[600px]">
          <thead className="bg-surface-container-low border-b border-outline-variant/15 text-on-surface-variant font-label-md uppercase tracking-wider">
            <tr>
              <th className="p-sm">ID</th>
              <th className="p-sm">Identity</th>
              <th className="p-sm">Document Type</th>
              <th className="p-sm">Status</th>
              <th className="p-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-md text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-md text-center text-on-surface-variant font-body-md">
                  {emptyText}
                </td>
              </tr>
            ) : (
              items.map((req, i) => {
                const initials = (req.student_name || 'XX').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const formattedId = `BM-${String(req.id).padStart(4, '0')}`;
                return (
                  <tr
                    key={req.id || i}
                    className="hover:bg-surface-container-low transition-colors cursor-pointer"
                    onClick={() => navigate(`/staff/requests/${req.id}`)}
                  >
                    <td className="p-sm font-bold font-mono text-primary text-body-md">
                      {formattedId}
                    </td>
                    <td className="p-sm">
                      <div className="flex items-center gap-sm">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-label-md flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-label-lg text-on-surface font-bold">{req.student_name || '—'}</p>
                          <p className="font-body-xs text-on-surface-variant">{req.grade || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-sm font-semibold text-on-surface">
                      {translateDocType(req.document_type)}
                    </td>
                    <td className="p-sm" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-xs">
                        {(req.requires_payment && !req.payment_verified) ? (
                          <div
                            className="flex items-center gap-xxs px-sm py-1 rounded-full border border-outline-variant/30 bg-surface-container-high text-on-surface-variant font-label-md text-xs cursor-not-allowed select-none"
                            title="Locked: Requester ID or Payment verification pending"
                          >
                            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">lock</span>
                            <span>{getStatusLabel(req.status)}</span>
                          </div>
                        ) : (
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
                        )}
                      </div>
                    </td>
                    <td className="p-sm text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/staff/requests/${req.id}`); }}
                        className="px-sm py-1 border border-outline-variant/30 rounded-xl font-label-md hover:bg-surface-container-high text-primary font-semibold transition-all active:scale-95 cursor-pointer"
                      >
                        {t('view') || 'Details'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="md:hidden divide-y divide-outline-variant/10">
        {loading ? (
          <div className="p-md text-center">
            <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-md text-center text-on-surface-variant font-body-md">
            {emptyText}
          </div>
        ) : (
          items.map((req, i) => {
            const initials = (req.student_name || 'XX').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const formattedId = `BM-${String(req.id).padStart(4, '0')}`;
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
                  <span className="font-mono font-bold text-primary text-xs flex-shrink-0">
                    {formattedId}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-xs">
                  <div className="min-w-0 pr-xs">
                    <p className="font-body-sm text-on-surface font-semibold text-wrap">{translateDocType(req.document_type)}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString('en-BZ') : ''}
                    </p>
                  </div>

                  <div onClick={e => e.stopPropagation()} className="flex-shrink-0">
                    {(req.requires_payment && !req.payment_verified) ? (
                      <div
                        className="flex items-center gap-xxs px-sm py-0.5 rounded-full border border-outline-variant/30 bg-surface-container-high text-on-surface-variant font-label-md text-[10px] cursor-not-allowed select-none"
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
      {/* Denial Confirmation Modal */}
      {denialConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-md animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl p-lg max-w-md w-full shadow-2xl flex flex-col gap-md">
            <div className="flex items-center gap-sm text-error">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-error" style={{ fontSize: '24px' }}>warning</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Confirm Request Denial</h3>
                <p className="font-body-xs text-on-surface-variant">Avoid accidental rejection</p>
              </div>
            </div>

            <p className="font-body-md text-on-surface-variant">
              Are you sure you want to decline request <strong className="text-on-surface font-bold">BM-{denialConfirmTarget.id}</strong>? An automated notification will be sent to the requester.
            </p>

            <div className="flex items-center justify-end gap-sm pt-xs border-t border-outline-variant/15">
              <button
                type="button"
                onClick={() => setDenialConfirmTarget(null)}
                className="px-md py-sm rounded-xl font-label-md hover:bg-surface-container-high text-on-surface-variant transition-colors font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeStatusUpdate(denialConfirmTarget.id, denialConfirmTarget.status)}
                className="px-md py-sm rounded-xl bg-error text-on-error font-label-md hover:bg-error/90 transition-all font-bold shadow-sm cursor-pointer"
              >
                Yes, Decline Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
