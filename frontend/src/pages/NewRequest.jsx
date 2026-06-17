import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import Stepper from '../components/Stepper';
import { useLanguage } from '../contexts/LanguageContext';
import { apiFetch } from '../services/api';

/* ── Document Types ─────────────────────────────── */
const DOCUMENT_TYPES = [
  { id: 'transcript', labelKey: 'official.transcript', price: 15, icon: 'description', descKey: 'official.transcript' },
  { id: 'enrollment', labelKey: 'enrollment.letter', price: 5, icon: 'history_edu', descKey: 'enrollment.letter' },
  { id: 'graduation', labelKey: 'graduation.cert', price: 45, icon: 'workspace_premium', descKey: 'graduation.cert' },
  { id: 'deans', labelKey: 'deans.letter', price: 20, icon: 'article', descKey: 'deans.letter' },
  { id: 'diploma', labelKey: 'replacement.diploma', price: 75, icon: 'menu_book', descKey: 'replacement.diploma' },
  { id: 'good_moral', labelKey: 'Good Moral Certificate', price: 10, icon: 'verified', descKey: 'Good Moral Certificate' },
  { id: 'other', labelKey: 'other.special', price: 0, icon: 'help_outline', descKey: 'other.special' },
];

// Past students are loaded dynamically from request history

const DELIVERY_METHODS = [
  { id: 'digital', labelKey: 'digital.delivery', sublabelKey: 'pdf.sec.email', price: 0, icon: 'mark_email_read' },
  { id: 'physical', labelKey: 'physical.copy', sublabelKey: 'pickup.postal', price: 15, icon: 'markunread_mailbox' },
];

const PROCESSING_SPEEDS = [
  { id: 'standard', labelKey: 'std.proc', sublabelKey: 'std.proc.desc', price: 0, icon: 'schedule' },
  { id: 'expedited', labelKey: 'exp.proc', sublabelKey: 'exp.proc.desc', price: 25, icon: 'fast_forward' },
  { id: 'urgent', labelKey: 'urg.proc', sublabelKey: 'urg.proc.desc', price: 50, icon: 'bolt' },
];

export default function NewRequest() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [savedStudents, setSavedStudents] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load real student history from past requests
  useEffect(() => {
    apiFetch('/requests/my-requests')
      .then(data => {
        const list = Array.isArray(data) ? data : data.requests || [];
        // Deduplicate by student name — keep most recent entry per student
        const seen = new Map();
        list.forEach(req => {
          const key = req.student_full_name?.toLowerCase();
          if (key && !seen.has(key)) {
            seen.set(key, {
              // All fields needed to pre-fill step 2
              name:         req.student_full_name || '',
              studentId:    req.student_bemis_id || '',
              grade:        req.student_graduation_year_or_years_attended || '',
              dob:          req.form_data?.dob || '',
              relationship: req.form_data?.relationship || 'Parent',
              requestDate:  req.request_date,
            });
          }
        });
        setSavedStudents([...seen.values()]);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  // Form state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({ fullName: '', studentId: '', dob: '', grade: '', relationship: 'Parent' });
  const [delivery, setDelivery] = useState('digital');
  const [processing, setProcessing] = useState('standard');
  const [notes, setNotes] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  // When a saved student is picked, populate ALL form fields
  const selectSavedStudent = (s) => {
    if (selectedStudent?.name === s.name) {
      // Deselect — clear the form
      setSelectedStudent(null);
      setStudentForm({ fullName: '', studentId: '', dob: '', grade: '', relationship: 'Parent' });
    } else {
      setSelectedStudent(s);
      setStudentForm({
        fullName:     s.name,
        studentId:    s.studentId,
        dob:          s.dob,
        grade:        s.grade,
        relationship: s.relationship,
      });
    }
  };

  const doc = DOCUMENT_TYPES.find(d => d.id === selectedDoc);
  const deliveryItem = DELIVERY_METHODS.find(d => d.id === delivery);
  const processingItem = PROCESSING_SPEEDS.find(p => p.id === processing);
  const totalFee = (doc?.price || 0) + (deliveryItem?.price || 0) + (processingItem?.price || 0);

  const setStudentField = (k) => (e) => setStudentForm(f => ({ ...f, [k]: e.target.value }));

  const canProceed = () => {
    if (step === 1) return !!selectedDoc;
    if (step === 2) return selectedStudent !== null || (studentForm.fullName && studentForm.studentId);
    if (step === 3) return !!delivery && !!processing;
    return true;
  };

  const handleNext = () => {
    if (step < 4) setStep(s => s + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
    else navigate('/dashboard/parents');
  };

  const handleNavigateToSign = () => {
    const body = {
      document_type_name: selectedDoc,
      student_full_name: studentForm.fullName,
      student_bemis_id: studentForm.studentId || '',
      student_graduation_year_or_years_attended: studentForm.grade,
      delivery_method: delivery,
      processing_speed: processing,
      recipient_email: recipientEmail,
      fee: totalFee,
      notes,
      // Store dob + relationship inside form_data so they can be re-populated next time
      form_data: JSON.stringify({ dob: studentForm.dob, relationship: studentForm.relationship }),
    };
    navigate('/dashboard/parents/sign', {
      state: { requestData: body, fee: totalFee, docLabel: t(doc?.labelKey) }
    });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopAppBar showBack backTo="/dashboard/parents" />

      <main className="pt-16 pb-24 md:pb-10 px-sm md:px-gutter max-w-container-max mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-xs font-label-md text-label-md text-on-surface-variant py-md">
          <span>{t('dashboard')}</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-primary font-semibold">{t('new.doc.request')}</span>
        </nav>

        {/* Stepper */}
        <div className="mb-lg px-xs">
          <Stepper currentStep={step} />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-sm mb-md px-sm py-xs bg-error-container rounded-lg border border-error/20 max-w-2xl mx-auto">
            <span className="material-symbols-outlined text-error">error</span>
            <p className="font-body-sm text-on-error-container">{error}</p>
          </div>
        )}

        {/* ── Step 1: Document Selection ── */}
        {step === 1 && (
          <section>
            <div className="mb-md">
              <h2 className="font-headline-lg text-headline-lg text-primary">{t('select.doc.type')}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs">{t('choose.doc.desc')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {DOCUMENT_TYPES.map(d => (
                <button
                   key={d.id}
                  onClick={() => setSelectedDoc(d.id)}
                  className={`text-left p-md rounded-xl border-2 transition-all flex flex-col gap-sm relative
                    ${selectedDoc === d.id
                      ? 'border-primary bg-primary-fixed/30 shadow-md'
                      : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40 hover:shadow-sm'
                    }`}
                >
                  {selectedDoc === d.id && (
                    <span className="absolute top-3 right-3 material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>check_circle</span>
                  )}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center
                    ${selectedDoc === d.id ? 'bg-primary text-on-primary' : 'bg-surface-container text-primary'}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{d.icon}</span>
                  </div>
                  <div>
                    <p className="font-headline-sm text-headline-sm text-on-surface">{t(d.labelKey)}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">{d.id === 'good_moral' ? t('verification.active') : t(d.descKey)}</p>
                  </div>
                  <div className="mt-auto pt-sm border-t border-outline-variant/20">
                    <p className={`font-label-lg text-label-lg ${d.price === 0 ? 'text-on-surface-variant' : 'text-primary font-bold'}`}>
                      {d.price === 0 ? t('other.special') : `BZD $${d.price}.00`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Step 2: Student Info ── */}
        {step === 2 && (
          <section className="max-w-2xl">
            <div className="mb-md">
              <h2 className="font-headline-lg text-headline-lg text-primary">{t('student.info')}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs">{t('choose.doc.desc')}</p>
            </div>

            {/* Past Students from Request History */}
            {loadingHistory ? (
              <div className="mb-md flex gap-sm">
                {[1,2].map(i => (
                  <div key={i} className="flex-shrink-0 w-56 h-20 rounded-xl border border-outline-variant/20 bg-surface-container animate-pulse" />
                ))}
              </div>
            ) : savedStudents.length > 0 && (
              <div className="mb-md">
                <p className="font-label-lg text-label-lg text-on-surface mb-sm flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>history</span>
                  {t('saved.students')}
                  <span className="font-body-sm text-on-surface-variant text-xs ml-auto">Tap to auto-fill</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                  {savedStudents.map((s, idx) => {
                    const isSelected = selectedStudent?.name === s.name;
                    const initials = s.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <button
                        key={idx}
                        onClick={() => selectSavedStudent(s)}
                        className={`text-left p-sm rounded-xl border-2 transition-all flex flex-col gap-xs relative
                          ${isSelected
                            ? 'border-primary bg-primary-fixed/20 shadow-sm'
                            : 'border-outline-variant/30 hover:border-primary/40 hover:shadow-sm bg-surface-container-lowest'
                          }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 material-symbols-outlined text-primary" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        )}
                        <div className="flex items-center gap-sm">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-label-lg flex-shrink-0
                            ${isSelected ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary-container'}`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-label-lg text-on-surface truncate">{s.name}</p>
                            <p className="font-body-sm text-on-surface-variant text-xs">{s.relationship}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-xs pt-xs border-t border-outline-variant/10">
                          {s.studentId && (
                            <div>
                              <p className="font-label-md text-on-surface-variant" style={{ fontSize: '10px' }}>STUDENT ID</p>
                              <p className="font-body-sm text-on-surface text-xs truncate">{s.studentId}</p>
                            </div>
                          )}
                          {s.grade && (
                            <div>
                              <p className="font-label-md text-on-surface-variant" style={{ fontSize: '10px' }}>GRADE / YEAR</p>
                              <p className="font-body-sm text-on-surface text-xs truncate">{s.grade}</p>
                            </div>
                          )}
                          {s.dob && (
                            <div>
                              <p className="font-label-md text-on-surface-variant" style={{ fontSize: '10px' }}>DATE OF BIRTH</p>
                              <p className="font-body-sm text-on-surface text-xs">{new Date(s.dob).toLocaleDateString('en-BZ')}</p>
                            </div>
                          )}
                          {s.requestDate && (
                            <div>
                              <p className="font-label-md text-on-surface-variant" style={{ fontSize: '10px' }}>LAST REQUEST</p>
                              <p className="font-body-sm text-on-surface text-xs">{new Date(s.requestDate).toLocaleDateString('en-BZ', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md flex flex-col gap-md">
              <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest flex items-center gap-xs">
                {selectedStudent ? (
                  <><span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>edit</span> {t('or.manual.override')}</>
                ) : t('student.details')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-label-lg text-on-surface">{t('manual.fullName')}</label>
                  <input
                    type="text" required
                    value={studentForm.fullName}
                    onChange={setStudentField('fullName')}
                    placeholder="Student's full name"
                    className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-label-lg text-on-surface">{t('manual.studentId')}</label>
                  <input
                    type="text"
                    value={studentForm.studentId}
                    onChange={setStudentField('studentId')}
                    placeholder="e.g. BM-2024-0021"
                    className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-label-lg text-on-surface">{t('manual.dob')}</label>
                  <input
                    type="date"
                    value={studentForm.dob}
                    onChange={setStudentField('dob')}
                    className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-label-lg text-on-surface">{t('manual.grade')}</label>
                  <input
                    type="text"
                    value={studentForm.grade}
                    onChange={setStudentField('grade')}
                    placeholder="e.g. Year 11 or Class of 2022"
                    className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-lg text-label-lg text-on-surface">{t('manual.relationship')}</label>
                <select
                  value={studentForm.relationship}
                  onChange={setStudentField('relationship')}
                  className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md bg-transparent"
                >
                  <option value="Parent">{t('rel.parent')}</option>
                  <option value="Legal Guardian">{t('rel.guardian')}</option>
                  <option value="Self (Alumni)">{t('rel.self')}</option>
                  <option value="Authorized Representative">{t('rel.rep')}</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* ── Step 3: Delivery & Speed ── */}
        {step === 3 && (
          <section className="max-w-3xl">
            <div className="mb-md">
              <h2 className="font-headline-lg text-headline-lg text-primary">{t('delivery.processing')}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs">{t('choose.del.desc')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
              <div className="lg:col-span-2 flex flex-col gap-md">
                {/* Delivery Method */}
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-md">{t('delivery.method')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                    {DELIVERY_METHODS.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setDelivery(d.id)}
                        className={`flex items-center gap-sm p-sm rounded-xl border-2 text-left transition-all
                          ${delivery === d.id ? 'border-primary bg-primary-fixed/20' : 'border-outline-variant/30 hover:border-primary/40'}`}
                      >
                        <span className={`material-symbols-outlined ${delivery === d.id ? 'text-primary' : 'text-on-surface-variant'}`}>{d.icon}</span>
                        <div>
                          <p className="font-label-lg text-label-lg text-on-surface">{t(d.labelKey)}</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{t(d.sublabelKey)}</p>
                          <p className={`font-label-lg mt-xs ${d.price === 0 ? 'text-on-surface-variant' : 'text-primary font-bold'}`}>
                            {d.price === 0 ? t('FREE') : `+BZD $${d.price}`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Processing Speed */}
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-md">{t('processing.speed')}</h3>
                  <div className="flex flex-col gap-sm">
                    {PROCESSING_SPEEDS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setProcessing(p.id)}
                        className={`flex items-center gap-md p-sm rounded-xl border-2 text-left transition-all
                          ${processing === p.id ? 'border-primary bg-primary-fixed/20' : 'border-outline-variant/30 hover:border-primary/40'}`}
                      >
                        <span className={`material-symbols-outlined ${processing === p.id ? 'text-primary' : 'text-on-surface-variant'}`}>{p.icon}</span>
                        <div className="flex-1">
                          <p className="font-label-lg text-label-lg text-on-surface">{t(p.labelKey)}</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{t(p.sublabelKey)}</p>
                        </div>
                        <p className={`font-label-lg font-bold ${p.price === 0 ? 'text-on-surface-variant' : 'text-primary'}`}>
                          {p.price === 0 ? t('FREE') : `+BZD $${p.price}`}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Info */}
                {delivery === 'digital' && (
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-lg text-label-lg text-on-surface">{t('where.send')}</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      placeholder="Where should we send the document?"
                      className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-label-lg text-on-surface">{t('special.instructions')}</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Any special notes for the Registrar's Office..."
                    className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md resize-none"
                  />
                </div>
              </div>

              {/* Fee Breakdown Sidebar */}
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md h-fit sticky top-20">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-md flex items-center gap-xs">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>receipt_long</span>
                  {t('fee.breakdown')}
                </h3>
                <div className="flex flex-col gap-sm">
                  <div className="flex justify-between items-center">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{t(doc?.labelKey)}</p>
                    <p className="font-label-lg text-label-lg text-on-surface">BZD ${doc?.price}.00</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{t('delivery')}</p>
                    <p className="font-label-lg text-label-lg text-on-surface">
                      {deliveryItem?.price === 0 ? t('free') : `BZD $${deliveryItem?.price}`}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{t('processing')}</p>
                    <p className="font-label-lg text-label-lg text-on-surface">
                      {processingItem?.price === 0 ? t('free') : `BZD $${processingItem?.price}`}
                    </p>
                  </div>
                  <div className="border-t border-outline-variant/30 pt-sm mt-sm flex justify-between items-center">
                    <p className="font-headline-sm text-headline-sm text-on-surface">Total</p>
                    <p className="font-headline-md text-headline-md text-primary font-bold">BZD ${totalFee}.00</p>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-md opacity-70">
                  {t('confirm.initiated.desc')}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <section className="max-w-2xl">
            <div className="mb-md">
              <h2 className="font-headline-lg text-headline-lg text-primary">{t('review.submit')}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs">{t('review.desc')}</p>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm">
              {/* Document */}
              <div className="p-md border-b border-outline-variant/20">
                <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest mb-sm">{t('doc.requested')}</p>
                <div className="flex items-center gap-md">
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-primary">{doc?.icon}</span>
                  </div>
                  <div>
                    <p className="font-headline-sm text-headline-sm text-on-surface">{t(doc?.labelKey)}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{t(doc?.descKey)}</p>
                  </div>
                </div>
              </div>

              {/* Student */}
              <div className="p-md border-b border-outline-variant/20">
                <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest mb-sm">{t('student.details')}</p>
                <div className="grid grid-cols-2 gap-sm">
                  <div><p className="font-label-md text-label-md text-on-surface-variant">{t('student.name')}</p><p className="font-body-md text-body-md">{selectedStudent?.name || studentForm.fullName}</p></div>
                  <div><p className="font-label-md text-label-md text-on-surface-variant">{t('grade.year')}</p><p className="font-body-md text-body-md">{selectedStudent?.grade || studentForm.grade}</p></div>
                  <div><p className="font-label-md text-label-md text-on-surface-variant">{t('relationship')}</p><p className="font-body-md text-body-md">{t('rel.' + studentForm.relationship.toLowerCase().replace(' ', '')) || studentForm.relationship}</p></div>
                  <div><p className="font-label-md text-label-md text-on-surface-variant">{t('delivery')}</p><p className="font-body-md text-body-md capitalize">{t(delivery + '.delivery') || delivery}</p></div>
                </div>
              </div>

              {/* Total */}
              <div className="p-md bg-surface-container">
                <div className="flex justify-between items-center">
                  <p className="font-headline-sm text-headline-sm text-on-surface">{t('total.due')}</p>
                  <p className="font-headline-md text-headline-md text-primary font-bold">BZD ${totalFee}.00</p>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                  {t('processing.speed')}: <span className="font-semibold">{t(processingItem?.labelKey)}</span>
                </p>
              </div>
            </div>

            <div className="mt-md p-sm bg-surface-container rounded-lg border-l-4 border-primary">
              <div className="flex gap-sm">
                <span className="material-symbols-outlined text-primary">info</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {t('legal.agree')}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-lg max-w-3xl">
          <button
            onClick={handleBack}
            className="flex items-center gap-xs text-primary hover:opacity-80 font-label-lg text-label-lg px-md py-sm rounded-lg hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            {step === 1 ? t('cancel') : t('back')}
          </button>

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container disabled:opacity-40 transition-all font-semibold"
            >
              {t('continue')}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleNavigateToSign}
              className="flex items-center gap-xs bg-primary text-on-primary px-lg py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container transition-all font-semibold"
            >
              {t('submit.request')} <span className="material-symbols-outlined">draw</span>
            </button>
          )}
        </div>
      </main>

      <BottomNav variant="parent" />
    </div>
  );
}
