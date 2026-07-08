import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';

const STATUS_STYLES = {
  pending:    'bg-surface-container-high text-on-surface-variant',
  pending_verification: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-500/20',
  processing: 'bg-secondary-container text-on-secondary-container',
  ready:      'bg-tertiary-fixed text-on-tertiary-fixed',
  issued:     'bg-secondary-container/60 text-on-secondary-container',
  cancelled:  'bg-error-container text-on-error-container',
};

const STATUS_LABELS = {
  pending: 'Pending',
  pending_verification: 'Pending Identity Verification',
  processing: 'Processing',
  ready: 'Ready for Pickup',
  issued: 'Issued',
  cancelled: 'Cancelled',
};

const DOC_ICON = {
  'Official Transcript': 'description',
  'Enrollment Letter': 'history_edu',
  'Graduation Certificate': 'workspace_premium',
  'Dean\'s Letter': 'article',
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

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const translateDocType = (docType) => {
    if (docType === 'Official Transcript') return t('official.transcript');
    if (docType === 'Letter of Enrollment' || docType === 'Enrollment Letter') return t('enrollment.letter');
    if (docType === 'Graduation Certificate') return t('graduation.cert');
    if (docType === "Dean's Letter") return t('deans.letter');
    if (docType === 'Replacement Diploma') return t('replacement.diploma');
    if (docType === 'Other/Special Request') return t('other.special');
    return t(docType);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await apiFetch('/requests');
      setRequests(Array.isArray(data) ? data : data.requests || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'Parent';

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopAppBar />

      <main className="pt-16 pb-24 md:pb-10 px-sm md:px-gutter max-w-container-max mx-auto">
        {/* Hero Header */}
        <section className="py-lg border-b border-outline-variant/30 mb-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-sm">
            <div>
              <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest mb-xs">
                {t('parent.portal')}
              </p>
              <h2 className="font-headline-lg text-headline-lg text-primary">
                {t('good.' + getTimeOfDay())}, {firstName}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                {t('parent.dashboard.subtitle')}
              </p>
            </div>
            <Link
              to="/dashboard/parents/new"
              className="flex items-center gap-sm bg-primary text-on-primary px-md py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container transition-all self-start md:self-auto"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
              {t('new.request')}
            </Link>
          </div>
        </section>

        {/* SSN Warning Banner */}
        {user && !user.verified && (
          <div className="mb-md bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 rounded-xl p-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
            <div className="flex gap-sm items-start">
              <span className="material-symbols-outlined text-amber-700 dark:text-amber-400 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <div>
                <h4 className="font-label-lg text-amber-800 dark:text-amber-300 font-semibold font-bold">
                  {user.ssn_card_image_path ? t('pending.admin.review') || 'Identity Verification Pending' : t('id.verification.required') || 'Identity Verification Required'}
                </h4>
                <p className="font-body-sm text-on-surface-variant">
                  {user.ssn_card_image_path
                    ? t('ver.submitted.desc') || 'Your identity document is being reviewed. Document requests will be processed after approval.'
                    : t('id.ver.desc') || 'Please upload your SSN or identity document. All document requests will remain locked until your identity is verified.'}
                </p>
              </div>
            </div>
            {!user.ssn_card_image_path && (
              <button
                onClick={() => navigate('/dashboard/parents/upload-ssn')}
                className="bg-primary text-on-primary hover:brightness-110 px-md py-xs rounded-lg font-label-lg whitespace-nowrap self-stretch sm:self-auto text-center font-bold"
              >
                {t('upload.id.doc') || 'Upload ID'}
              </button>
            )}
          </div>
        )}

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

          {/* Left: Quick Actions */}
          <aside className="lg:col-span-4 flex flex-col gap-gutter">
            {/* Identity Status */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <div className="flex items-center gap-xs mb-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>verified_user</span>
                <h3 className="font-headline-sm text-headline-sm text-primary">{t('identity.status')}</h3>
              </div>
              {user?.verified ? (
                <div className="flex items-center gap-sm p-sm bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-500/20">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-green-700 dark:text-green-300" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <div>
                    <p className="font-label-lg text-label-lg text-green-700 dark:text-green-300 font-semibold">{t('identity.verified')}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{t('verification.active')}</p>
                  </div>
                </div>
              ) : user?.ssn_card_image_path ? (
                <div className="flex items-center gap-sm p-sm bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-500/20">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-amber-700 dark:text-amber-300" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>hourglass_empty</span>
                  </div>
                  <div>
                    <p className="font-label-lg text-label-lg text-amber-700 dark:text-amber-300 font-semibold">{t('pending.verification') || 'Pending Review'}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{t('expect.review.desc') || 'Under review (1–2 business days)'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-sm p-sm bg-error-container/30 rounded-lg border border-error/20">
                  <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-error" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>warning</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-label-lg text-label-lg text-error font-semibold">{t('identity.unverified')}</p>
                    <button
                      onClick={() => navigate('/dashboard/parents/upload-ssn')}
                      className="text-primary hover:underline font-label-md text-label-md mt-0.5 block text-left font-semibold"
                    >
                      {t('upload.id.doc') || 'Upload SSN Card'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-md">{t('quick.actions')}</h3>
              <div className="flex flex-col gap-xs">
                <Link
                  to="/dashboard/parents/new"
                  className="flex items-center gap-md px-sm py-sm rounded-lg hover:bg-secondary-container/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '20px' }}>add_circle</span>
                  </div>
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface font-semibold group-hover:text-primary transition-colors">{t('request.doc')}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{t('request.doc.desc')}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant ml-auto group-hover:text-primary transition-colors">chevron_right</span>
                </Link>

                <Link
                  to="/dashboard/parents/upload-ssn"
                  className="flex items-center gap-md px-sm py-sm rounded-lg hover:bg-secondary-container/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: '20px' }}>badge</span>
                  </div>
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface font-semibold group-hover:text-primary transition-colors">{t('identity.verification')}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{t('upload.id.desc')}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant ml-auto group-hover:text-primary transition-colors">chevron_right</span>
                </Link>

                <a
                  href="mailto:registrar@bishopmartin.edu"
                  className="flex items-center gap-md px-sm py-sm rounded-lg hover:bg-secondary-container/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-tertiary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontSize: '20px' }}>support_agent</span>
                  </div>
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface font-semibold group-hover:text-primary transition-colors">{t('registrar.support')}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{t('email.office')}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant ml-auto group-hover:text-primary transition-colors">chevron_right</span>
                </a>
              </div>
            </div>

            {/* Administrative Resources */}
            <div className="bg-primary text-on-primary rounded-xl p-md relative overflow-hidden">
              <div className="absolute inset-0 bento-texture" style={{ opacity: 0.1 }} />
              <div className="relative z-10">
                <span className="material-symbols-outlined mb-sm" style={{ fontSize: '32px', opacity: 0.8 }}>info</span>
                <h3 className="font-headline-sm text-headline-sm mb-xs">{t('need.help')}</h3>
                <p className="font-body-sm text-body-sm opacity-80 mb-md">
                  {t('office.hours.desc')}
                </p>
                <a
                  href="tel:+5012345678"
                  className="inline-flex items-center gap-xs bg-on-primary/10 hover:bg-on-primary/20 px-sm py-xs rounded-lg font-label-lg transition-all"
                >
                  <span className="material-symbols-outlined text-sm">phone</span>
                  {t('call.registrar')}
                </a>
              </div>
            </div>
          </aside>

          {/* Right: Requests Table */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="flex items-center justify-between mb-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>pending_actions</span>
                {t('my.document.requests')}
              </h3>
              <Link
                to="/dashboard/parents/history"
                className="font-label-md text-label-md text-primary hover:underline flex items-center gap-xs"
              >
                {t('view.all')}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm flex-1">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-12 px-sm py-xs bg-surface-container border-b border-outline-variant/20 text-label-md text-on-surface-variant uppercase tracking-wider font-bold">
                <div className="col-span-1">{t('ref')}</div>
                <div className="col-span-4">{t('document')}</div>
                <div className="col-span-3">{t('date')}</div>
                <div className="col-span-2">{t('amount')}</div>
                <div className="col-span-2 text-right">{t('status')}</div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-xl">
                  <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '36px' }}>sync</span>
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-xl gap-sm text-on-surface-variant">
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4 }}>inbox</span>
                  <p className="font-body-md text-body-md">{t('no.requests.yet')}</p>
                  <Link
                    to="/dashboard/parents/new"
                    className="font-label-lg text-label-lg text-primary hover:underline flex items-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    {t('make.first.request')}
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/10">
                  {requests.map((req, i) => (
                    <div
                      key={req.id || i}
                      className="content-stripe grid grid-cols-1 md:grid-cols-12 px-sm py-sm items-center hover:bg-secondary-container/10 transition-colors cursor-pointer group"
                      style={{}}
                      onClick={() => navigate(`/dashboard/parents/request/${req.id}`)}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = 'inset 4px 0 0 var(--color-primary)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <div className="col-span-1 font-body-sm text-on-surface-variant">
                        #{String(req.id || i + 1).padStart(4, '0')}
                      </div>
                      <div className="col-span-4 flex items-center gap-sm">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>
                          {DOC_ICON[req.document_type] || 'description'}
                        </span>
                        <div>
                          <p className="font-body-md text-body-md font-semibold text-on-surface">{translateDocType(req.document_type)}</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{req.student_name || '—'}</p>
                        </div>
                      </div>
                      <div className="col-span-3 font-body-sm text-on-surface-variant">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString('en-BZ', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </div>
                      <div className="col-span-2 font-body-md text-on-surface font-semibold">
                        {req.fee ? `BZD $${Number(req.fee).toFixed(2)}` : '—'}
                      </div>
                      <div className="col-span-2 flex justify-start md:justify-end">
                        <span className={`text-label-md px-sm py-0.5 rounded-full font-semibold ${STATUS_STYLES[req.status] || STATUS_STYLES.pending}`}>
                          {t(req.status || 'pending')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <BottomNav variant="parent" />
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
