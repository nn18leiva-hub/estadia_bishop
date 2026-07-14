import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';
import StaffHeader from '../components/StaffHeader';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const METRICS = [
  { icon: 'pending_actions', label: 'pending.requests', value: '—', color: 'text-primary-container', badge: '+12%', badgeClass: 'bg-error-container text-on-error-container' },
  { icon: 'timer', label: 'avg.lead.time', value: '—', color: 'text-secondary', badge: 'Stable', badgeClass: 'text-secondary' },
  { icon: 'verified', label: 'issued.today', value: '—', color: 'text-tertiary', badge: '98% Goal', badgeClass: 'text-on-tertiary-container' },
  { icon: 'emergency_home', label: 'high.urgency', value: '—', color: 'text-error', badge: 'URGENT', badgeClass: 'bg-error text-on-error', urgent: true },
];

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [stats, setStats] = useState({ pending: '—', avgLeadTime: '—', issuedToday: '—', urgentCount: '—' });
  const [urgentQueue, setUrgentQueue] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, q] = await Promise.all([
          apiFetch('/staff/stats'),
          apiFetch('/staff/queue?limit=5&sortBy=urgency'),
        ]);
        setStats({
          pending: s.pending ?? '—',
          avgLeadTime: s.avgLeadTime ? `${s.avgLeadTime} ${t('days')}` : '—',
          issuedToday: s.issuedToday ?? '—',
          urgentCount: s.urgent ?? '—',
        });
        setUrgentQueue(Array.isArray(q) ? q : q.requests || []);
      } catch (_) {}
      setLoading(false);
    };
    fetchData();
  }, [t]);
 
  const metricValues = [stats.pending, stats.avgLeadTime, stats.issuedToday, stats.urgentCount];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <StaffSidebar variant="staff" />

      <StaffHeader showQueueButton={true} />

      <main className="md:ml-80 pt-24 pb-20 px-sm md:px-gutter max-w-container-max">
        {/* Header */}
        <div className="mb-lg border-b border-outline-variant pb-md flex flex-col md:flex-row md:items-end justify-between gap-sm">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">{t('admin.overview')}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t('registrar.control.panel')} · {new Date().toLocaleDateString(language === 'es' ? 'es-BZ' : 'en-BZ', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter mb-xl">
          {METRICS.map((m, i) => (
            <div 
              key={m.label} 
              className={`bg-surface-container-lowest p-md border border-outline-variant/20 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between ${
                m.urgent ? 'border-l-4 border-l-error' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-sm">
                <span className={`material-symbols-outlined ${m.color}`} style={{ fontSize: '28px' }}>{m.icon}</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${m.badgeClass}`}>{t(m.badge)}</span>
              </div>
              <div>
                <p className="text-label-md text-on-surface-variant font-semibold tracking-wide mb-xs">{t(m.label)}</p>
                <p className={`text-headline-lg font-headline-lg font-bold tracking-tight ${m.urgent ? 'text-error' : 'text-primary'}`}>
                  {loading ? '...' : metricValues[i]}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Urgency Queue + Right Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Queue */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined">priority_high</span>
                {t('urgency.queue')}
              </h3>
              <button
                onClick={() => navigate('/staff/requests')}
                className="text-label-lg text-primary font-bold hover:underline"
              >
                {t('view.all.queue')}
              </button>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm">
              {/* Mobile View: Cards */}
              <div className="block md:hidden divide-y divide-outline-variant/10">
                {loading ? (
                  <div className="flex items-center justify-center py-lg">
                    <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '32px' }}>sync</span>
                  </div>
                ) : urgentQueue.length === 0 ? (
                  [
                    { ref: 'BM-77291', type: t('official.transcript'), requester: 'Global Alumni Assoc.', note: 'LITIGATION PRIORITY', sla: 'EXPIRED', slaClass: 'bg-error-container text-on-error-container border border-error/20' },
                    { ref: 'BM-88120', type: t('degree.verification'), requester: 'Standard Chartered', note: 'EMPLOYMENT CHECK', sla: '2H LEFT', slaClass: 'bg-secondary-container text-on-secondary-container border border-secondary/20' },
                    { ref: 'BM-91223', type: t('enrollment.letter'), requester: 'Home Office (UK)', note: 'VISA EXPEDITE', sla: '4H LEFT', slaClass: 'bg-secondary-container text-on-secondary-container border border-secondary/20' },
                  ].map((row) => (
                    <div 
                      key={row.ref} 
                      className="p-md flex flex-col gap-xs hover:bg-surface-container-high transition-colors cursor-pointer"
                      onClick={() => navigate('/staff/requests')}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-primary font-body-md text-nowrap truncate max-w-[180px]">{row.type}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${row.slaClass}`}>{t(row.sla)}</span>
                      </div>
                      <div className="flex justify-between items-center text-label-md text-on-surface-variant">
                        <span className="truncate max-w-[150px]">{row.requester}</span>
                        <span>Ref: {row.ref}</span>
                      </div>
                      <p className="text-[10px] text-error font-semibold">{t(row.note)}</p>
                    </div>
                  ))
                ) : (
                  urgentQueue.map((req, i) => (
                    <div 
                      key={req.id || i} 
                      className="p-md flex flex-col gap-xs hover:bg-surface-container-high transition-colors cursor-pointer"
                      onClick={() => navigate(`/staff/requests/${req.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-primary font-body-md text-nowrap truncate max-w-[180px]">{req.document_type}</span>
                        <span className="bg-error-container text-on-error-container text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-error/20">{t(req.status)}</span>
                      </div>
                      <div className="flex justify-between items-center text-label-md text-on-surface-variant">
                        <span className="truncate max-w-[150px]">{req.student_name}</span>
                        <span>Ref: BM-{req.id}</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-semibold">{t(req.processing_speed)}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View: Grid Table */}
              <div className="hidden md:block">
                {/* Header */}
                <div className="grid grid-cols-6 bg-surface-container px-md py-sm text-label-md text-on-surface-variant font-bold border-b border-outline-variant">
                  <div className="col-span-2">{t('document.type').toUpperCase()}</div>
                  <div className="col-span-2">{t('requester').toUpperCase()}</div>
                  <div>{t('sla.status').toUpperCase()}</div>
                  <div className="text-right">{t('action').toUpperCase()}</div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-lg">
                    <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '32px' }}>sync</span>
                  </div>
                ) : urgentQueue.length === 0 ? (
                  /* Placeholder rows when no API data */
                  [
                    { ref: 'BM-77291', type: t('official.transcript'), requester: 'Global Alumni Assoc.', note: 'LITIGATION PRIORITY', sla: 'EXPIRED', slaClass: 'bg-error-container text-on-error-container border border-error/20' },
                    { ref: 'BM-88120', type: t('degree.verification'), requester: 'Standard Chartered', note: 'EMPLOYMENT CHECK', sla: '2H LEFT', slaClass: 'bg-secondary-container text-on-secondary-container border border-secondary/20' },
                    { ref: 'BM-91223', type: t('enrollment.letter'), requester: 'Home Office (UK)', note: 'VISA EXPEDITE', sla: '4H LEFT', slaClass: 'bg-secondary-container text-on-secondary-container border border-secondary/20' },
                  ].map((row) => (
                    <div
                      key={row.ref}
                      className="grid grid-cols-6 px-md py-md border-b border-outline-variant/10 items-center transition-all hover:bg-surface-container-high hover:translate-x-1 cursor-pointer duration-300 relative group before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                      onClick={() => navigate('/staff/requests')}
                    >
                      <div className="col-span-2 flex flex-col">
                        <span className="font-body-md font-semibold text-on-surface">{row.type}</span>
                        <span className="text-label-md text-on-surface-variant">{t('ref')}: {row.ref}</span>
                      </div>
                      <div className="col-span-2">
                        <p className="font-body-sm text-on-surface">{row.requester}</p>
                        <p className="text-[10px] text-error font-semibold uppercase">{t(row.note)}</p>
                      </div>
                      <div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${row.slaClass}`}>{t(row.sla)}</span>
                      </div>
                      <div className="text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/staff/requests'); }}
                          className="material-symbols-outlined text-primary hover:bg-primary/10 rounded-full p-2 active:scale-95 transition-all"
                        >
                          visibility
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  urgentQueue.map((req) => (
                    <div
                      key={req.id}
                      className="grid grid-cols-6 px-md py-md border-b border-outline-variant/10 items-center transition-all hover:bg-surface-container-high hover:translate-x-1 cursor-pointer duration-300 relative group before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:opacity-0 hover:before:opacity-100 before:transition-opacity"
                      onClick={() => navigate(`/staff/requests/${req.id}`)}
                    >
                      <div className="col-span-2 flex flex-col">
                        <span className="font-body-md font-semibold text-on-surface">{req.document_type}</span>
                        <span className="text-label-md text-on-surface-variant">{t('ref')}: BM-{req.id}</span>
                      </div>
                      <div className="col-span-2">
                        <p className="font-body-sm text-on-surface">{req.student_name}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase font-semibold">{t(req.processing_speed)}</p>
                      </div>
                      <div>
                        <span className="bg-error-container text-on-error-container text-[11px] px-sm py-1 rounded-full font-semibold border border-error/20">
                          {t(req.status)}
                        </span>
                      </div>
                      <div className="text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/staff/requests/${req.id}`); }}
                          className="material-symbols-outlined text-primary hover:bg-primary/10 rounded-full p-2 active:scale-95 transition-all"
                        >
                          visibility
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Insights */}
          <div className="flex flex-col gap-md">
            <div className="bg-primary text-on-primary rounded-xl p-md relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute inset-0 bento-texture" style={{ opacity: 0.1 }} />
              <div className="relative z-10">
                <span className="material-symbols-outlined mb-sm" style={{ fontSize: '32px', opacity: 0.8 }}>analytics</span>
                <h3 className="font-headline-sm text-headline-sm font-bold">{t('quick.actions')}</h3>
                <div className="flex flex-col gap-sm mt-md">
                  {[
                    { label: t('process.next.queue'), icon: 'arrow_forward', to: '/staff/requests' },
                    { label: t('pending.payments'), icon: 'payments', to: '/staff/payments' },
                  ].map(action => (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.to)}
                      className="flex items-center justify-between gap-sm bg-on-primary/10 hover:bg-on-primary/20 px-md py-sm rounded-xl font-label-lg transition-all text-left font-semibold active:scale-98"
                    >
                      <span>{action.label}</span>
                      <span className="material-symbols-outlined text-sm">{action.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md shadow-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-sm font-bold">{t('system.status')}</h3>
              {[
                { label: t('document.portal'), status: t('online'), ok: true },
                { label: t('payment.gateway'), status: t('online'), ok: true },
                { label: t('email.notifications'), status: t('online'), ok: true },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center py-xs border-b border-outline-variant/10 last:border-none">
                  <span className="font-body-sm text-on-surface-variant font-medium">{s.label}</span>
                  <span className={`flex items-center gap-xs font-label-md text-label-md ${s.ok ? 'text-secondary' : 'text-error'}`}>
                    <span className={`w-2 h-2 rounded-full ${s.ok ? 'bg-secondary' : 'bg-error'}`} />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <BottomNav variant="staff" />
    </div>
  );
}
