import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const STATUS_STYLES = {
  pending: 'bg-surface-container-high text-on-surface-variant',
  pending_verification: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-500/20',
  processing: 'bg-secondary-container text-on-secondary-container',
  ready: 'bg-tertiary-fixed text-on-tertiary-fixed',
  issued: 'bg-secondary-container/60 text-on-secondary-container',
  cancelled: 'bg-error-container text-on-error-container',
  action: 'bg-error-container text-on-error-container',
};

const STATUS_LABELS = {
  pending: 'Pending',
  pending_verification: 'Pending Identity Verification',
  processing: 'Processing',
  ready: 'Ready for Pickup',
  issued: 'Issued',
  cancelled: 'Cancelled',
  action: 'Action Required',
};

const DOC_ICON = {
  'Official Transcript': 'description',
  'Enrollment Letter': 'history_edu',
  'Graduation Certificate': 'workspace_premium',
  "Dean's Letter": 'article',
  'Replacement Diploma': 'menu_book',
  'Good Moral Certificate': 'verified',
  // DB keys
  'transcript': 'description',
  'enrollment': 'history_edu',
  'graduation': 'workspace_premium',
  'deans': 'article',
  'diploma': 'menu_book',
  'good_moral': 'verified',
  'lateness_form': 'schedule',
  'absence_form': 'event_busy',
};

export default function RequestHistory() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch('/requests/my-requests')
      .then(data => setRequests(Array.isArray(data) ? data : data.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  const filtered = requests.filter(r => {
    const q = search.toLowerCase();
    // Backend returns: document_type_name, student_full_name, request_id
    const docType = r.document_type_name || r.document_type || '';
    const studentName = r.student_full_name || r.student_name || '';
    const id = String(r.request_id || r.id || '');
    const matchesSearch = !q || docType.toLowerCase().includes(q) || studentName.toLowerCase().includes(q) || id.includes(q);
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopAppBar showBack backTo="/dashboard/parents" title={t('my.requests')} />

      <main className="pt-24 pb-24 px-sm md:px-gutter max-w-container-max mx-auto">
        <div className="mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-primary">{t('request.history')}</h2>
          <p className="font-body-md text-on-surface-variant mt-xs">{t('all.requests.desc')}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-sm mb-md items-center">
          <div className="relative flex-grow max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('search.requests')}
              className="w-full pl-10 pr-4 py-xs border border-outline-variant/50 rounded-lg bg-surface font-body-md"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
          >
            <option value="">{t('all.statuses')}</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {getStatusLabel(v)}
              </option>
            ))}
          </select>
          <button
            onClick={() => navigate('/dashboard/parents/new')}
            className="ml-auto flex items-center gap-xs bg-primary text-on-primary px-md py-xs rounded-lg font-label-lg hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            {t('new.request')}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-xl">
            <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '40px' }}>sync</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-xl gap-md text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontSize: '64px', opacity: 0.3 }}>inbox</span>
            <p className="font-body-lg text-body-lg">{requests.length === 0 ? t('no.requests.yet') : t('no.matching.requests')}</p>
            <button
              onClick={() => navigate('/dashboard/parents/new')}
              className="flex items-center gap-xs text-primary hover:underline font-label-lg"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {t('make.first.request')}
            </button>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm">
            <div className="hidden md:grid grid-cols-12 px-sm py-xs bg-surface-container border-b border-outline-variant/20 text-label-md text-on-surface-variant uppercase tracking-wider font-bold">
              <div className="col-span-1">{t('ref')}</div>
              <div className="col-span-4">{t('document')}</div>
              <div className="col-span-3">{t('submitted')}</div>
              <div className="col-span-2">{t('fee')}</div>
              <div className="col-span-2 text-right">{t('status')}</div>
            </div>
            <div className="divide-y divide-outline-variant/10">
              {filtered.map((req, i) => {
                const docType = req.document_type_name || req.document_type || '';
                const studentName = req.student_full_name || req.student_name || '—';
                const reqId = req.request_id || req.id;
                const submittedDate = req.request_date || req.created_at;
                return (
                <div
                  key={reqId || i}
                  className="grid grid-cols-1 md:grid-cols-12 px-sm py-sm items-center hover:bg-secondary-container/10 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/dashboard/parents/request/${reqId}`)}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'inset 4px 0 0 var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div className="col-span-1 font-body-sm text-on-surface-variant">
                    #{String(reqId || i + 1).padStart(4, '0')}
                  </div>
                  <div className="col-span-4 flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>
                      {DOC_ICON[docType] || 'description'}
                    </span>
                    <div>
                      <p className="font-body-md font-semibold text-on-surface">{translateDocType(docType)}</p>
                      <p className="font-body-sm text-on-surface-variant">{studentName}</p>
                    </div>
                  </div>
                  <div className="col-span-3 font-body-sm text-on-surface-variant">
                    {submittedDate ? new Date(submittedDate).toLocaleDateString('en-BZ', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </div>
                  <div className="col-span-2 font-body-md font-semibold">
                    {req.fee ? `BZD $${Number(req.fee).toFixed(2)}` : '—'}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <span className={`text-label-md px-sm py-0.5 rounded-full font-semibold ${STATUS_STYLES[req.status] || STATUS_STYLES.pending}`}>
                      {getStatusLabel(req.status)}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <BottomNav variant="parent" />
    </div>
  );
}
