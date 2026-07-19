import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import Stepper from '../components/Stepper';
import { useLanguage } from '../contexts/LanguageContext';
import { apiFetch } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { setIdFile as storeIdFile } from '../services/fileStore';

/* ── Document Types ─────────────────────────────── */
const DOCUMENT_TYPES = [
  { id: 'lateness_form', labelKey: 'lateness.form', price: 0, icon: 'schedule', descKey: 'lateness.form.desc' },
  { id: 'absence_form', labelKey: 'absence.form', price: 0, icon: 'event_busy', descKey: 'absence.form.desc' },
  { id: 'transcript', labelKey: 'official.transcript', price: 15, icon: 'description', descKey: 'official.transcript' },
  { id: 'enrollment', labelKey: 'enrollment.letter', price: 10, icon: 'history_edu', descKey: 'enrollment.letter' },
];

// Past students are loaded dynamically from request history

const DELIVERY_METHODS = [
  { id: 'digital', labelKey: 'digital.delivery', sublabelKey: 'pdf.sec.email', price: 0, icon: 'mark_email_read' },
  { id: 'physical', labelKey: 'physical.copy', sublabelKey: 'pickup.postal', price: 15, icon: 'markunread_mailbox' },
];

const PROCESSING_SPEEDS = [
  { id: 'standard', labelKey: 'std.proc', sublabelKey: 'std.proc.desc', price: 0, icon: 'schedule' },
  { id: 'expedited', labelKey: 'exp.proc', sublabelKey: 'exp.proc.desc', price: 10, icon: 'fast_forward' },
  { id: 'urgent', labelKey: 'urg.proc', sublabelKey: 'urg.proc.desc', price: 20, icon: 'bolt' },
];

export default function NewRequest() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [savedStudents, setSavedStudents] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [documentTypes, setDocumentTypes] = useState(DOCUMENT_TYPES);

  // Load document type prices from backend
  useEffect(() => {
    apiFetch('/requests/document-types')
      .then(data => {
        if (Array.isArray(data)) {
          setDocumentTypes(prev => prev.map(dt => {
            const dbMatch = data.find(dbDt => dbDt.name === dt.id);
            if (dbMatch && dbMatch.base_price !== undefined) {
              return { ...dt, price: parseFloat(dbMatch.base_price) };
            }
            return dt;
          }));
        }
      })
      .catch(err => console.error('Error fetching live prices:', err));
  }, []);

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
              // All fields needed to pre-fill step 3
              name:         req.student_full_name || '',
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
  const [studentForm, setStudentForm] = useState({ fullName: '', dob: '', grade: '', relationship: 'Parent' });
  const [delivery, setDelivery] = useState('digital');
  const [processing, setProcessing] = useState('standard');
  const [notes, setNotes] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState('');

  const handleIdFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdFile(file);
      // Persist immediately to sessionStorage (survives iOS context resets)
      await storeIdFile(file);
      if (file.type.startsWith('image/')) {
        setIdPreview(URL.createObjectURL(file));
      } else {
        setIdPreview('');
      }
    }
  };

  // Absence/Lateness Form state
  const [dateOfReturn, setDateOfReturn] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [datesOfAbsenceOrLateness, setDatesOfAbsenceOrLateness] = useState('');
  const [numberOfDaysAbsent, setNumberOfDaysAbsent] = useState('');
  const [reasonCategory, setReasonCategory] = useState('sickness');
  const [reasonDetails, setReasonDetails] = useState('');
  const [homeRoomTeacher, setHomeRoomTeacher] = useState('');

  // Dropdown states for Class/Grade initials/number
  const [classLevel, setClassLevel] = useState('');
  const [classNumber, setClassNumber] = useState('');

  // Calendar states for Date(s) of Absence / Lateness
  const [startDateOfAbsence, setStartDateOfAbsence] = useState('');
  const [endDateOfAbsence, setEndDateOfAbsence] = useState('');
  const [dateOfLateness, setDateOfLateness] = useState('');

  // Handle class level/number updates
  const handleClassLevelChange = (level) => {
    setClassLevel(level);
    const newGrade = level && classNumber ? level + classNumber : '';
    setClassGrade(newGrade);
    setStudentForm(f => ({ ...f, grade: newGrade }));
  };
  const handleClassNumberChange = (num) => {
    setClassNumber(num);
    const newGrade = classLevel && num ? classLevel + num : '';
    setClassGrade(newGrade);
    setStudentForm(f => ({ ...f, grade: newGrade }));
  };

  // Prefill Class / Grade in sub-form if available in studentForm
  useEffect(() => {
    if (studentForm.grade) {
      setClassGrade(studentForm.grade);
      const match = studentForm.grade.match(/^(Sr|F|S|J)(\d+)$/i);
      if (match) {
        setClassLevel(match[1]);
        setClassNumber(match[2]);
      } else {
        setClassLevel('');
        setClassNumber('');
      }
    } else {
      setClassGrade('');
      setClassLevel('');
      setClassNumber('');
    }
  }, [studentForm.grade]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Sync datesOfAbsenceOrLateness string
  useEffect(() => {
    if (selectedDoc === 'absence_form') {
      if (startDateOfAbsence && endDateOfAbsence) {
        if (startDateOfAbsence === endDateOfAbsence) {
          setDatesOfAbsenceOrLateness(startDateOfAbsence);
        } else {
          setDatesOfAbsenceOrLateness(`${startDateOfAbsence} to ${endDateOfAbsence}`);
        }
      } else if (startDateOfAbsence) {
        setDatesOfAbsenceOrLateness(startDateOfAbsence);
      } else {
        setDatesOfAbsenceOrLateness('');
      }
    } else if (selectedDoc === 'lateness_form') {
      setDatesOfAbsenceOrLateness(dateOfLateness);
    }
  }, [startDateOfAbsence, endDateOfAbsence, dateOfLateness, selectedDoc]);

  // Auto-calculate days absent
  useEffect(() => {
    if (selectedDoc === 'absence_form' && startDateOfAbsence && endDateOfAbsence) {
      const start = new Date(startDateOfAbsence);
      const end = new Date(endDateOfAbsence);
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setNumberOfDaysAbsent(diffDays.toString());
      } else {
        setNumberOfDaysAbsent('');
      }
    } else {
      setNumberOfDaysAbsent('');
    }
  }, [startDateOfAbsence, endDateOfAbsence, selectedDoc]);

  // When a saved student is picked, populate ALL form fields
  const selectSavedStudent = (s) => {
    if (selectedStudent?.name === s.name) {
      // Deselect — clear the form
      setSelectedStudent(null);
      setStudentForm({ fullName: '', dob: '', grade: '', relationship: 'Parent' });
    } else {
      setSelectedStudent(s);
      setStudentForm({
        fullName:     s.name,
        dob:          s.dob,
        grade:        s.grade,
        relationship: s.relationship,
      });
    }
  };

  const doc = documentTypes.find(d => d.id === selectedDoc);
  const deliveryItem = DELIVERY_METHODS.find(d => d.id === delivery);
  const processingItem = PROCESSING_SPEEDS.find(p => p.id === processing);
  const totalFee = (doc?.price || 0) + (deliveryItem?.price || 0) + (processingItem?.price || 0);

  const setStudentField = (k) => (e) => setStudentForm(f => ({ ...f, [k]: e.target.value }));

  const canProceed = () => {
    if (step === 1) return !!selectedDoc;
    if (step === 2) return !!idFile;
    if (step === 3) {
      const studentOk = selectedStudent !== null || (studentForm.fullName && studentForm.grade);
      if (!studentOk) return false;

      if (selectedDoc === 'lateness_form') {
        return !!dateOfReturn && !!studentForm.grade && !!datesOfAbsenceOrLateness && !!reasonCategory && !!reasonDetails && !!homeRoomTeacher;
      }
      if (selectedDoc === 'absence_form') {
        return !!dateOfReturn && !!studentForm.grade && !!datesOfAbsenceOrLateness && !!numberOfDaysAbsent && !!reasonCategory && !!reasonDetails && !!homeRoomTeacher;
      }
      return true;
    }
    if (step === 4) return !!delivery && !!processing;
    return true;
  };

  const isForm = selectedDoc === 'lateness_form' || selectedDoc === 'absence_form';

  const handleNext = () => {
    if (isForm && step === 3) {
      setStep(5); // Skip Step 4 and go straight to Step 5 (Review)
    } else if (step < 5) {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (isForm && step === 5) {
      setStep(3); // Skip Step 4 when going back
    } else if (step > 1) {
      setStep(s => s - 1);
    } else {
      navigate('/dashboard/parents');
    }
  };

  const handleNavigateToSign = async () => {
    // Persist the uploaded ID file so DigitalSignature can attach it to the request
    if (idFile) {
      await storeIdFile(idFile);
    }

    const customFormData = {
      dob: studentForm.dob,
      relationship: studentForm.relationship
    };

    if (selectedDoc === 'lateness_form' || selectedDoc === 'absence_form') {
      customFormData.date_of_return = dateOfReturn;
      customFormData.class = classGrade;
      customFormData.dates_of_absence_or_lateness = datesOfAbsenceOrLateness;
      if (selectedDoc === 'absence_form') {
        customFormData.number_of_days_absent = numberOfDaysAbsent;
      }
      customFormData.reason_category = reasonCategory;
      customFormData.reason_details = reasonDetails;
      customFormData.home_room_teacher = homeRoomTeacher;
    }

    const body = {
      document_type_name: selectedDoc,
      student_full_name: studentForm.fullName,
      student_graduation_year_or_years_attended: studentForm.grade,
      delivery_method: delivery,
      processing_speed: processing,
      recipient_email: recipientEmail,
      fee: totalFee,
      notes,
      form_data: JSON.stringify(customFormData),
    };
    navigate('/dashboard/parents/sign', {
      state: { requestData: body, fee: totalFee, docLabel: t(doc?.labelKey) }
    });
  };

  // Store idFile in the module-level store before navigating (File objects cannot
  // survive serialization through React Router's History API state).
  const safeNavigateToSign = async () => {
    await storeIdFile(idFile);
    handleNavigateToSign();
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopAppBar showBack backTo="/dashboard/parents" />

      <main className="pt-16 pb-28 md:pb-16 px-sm md:px-gutter max-w-container-max mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-xs font-label-md text-label-md text-on-surface-variant py-md">
          <span>{t('dashboard')}</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-primary font-semibold">{t('new.doc.request')}</span>
        </nav>

        {/* Stepper */}
        <div className="mb-lg px-xs">
          <Stepper steps={isForm ? [
            { label: 'Document', icon: 'description' },
            { label: 'Identity', icon: 'badge' },
            { label: 'Form Details', icon: 'assignment' },
            { label: 'Review', icon: 'fact_check' }
          ] : [
            { label: 'Document', icon: 'description' },
            { label: 'Identity', icon: 'badge' },
            { label: 'Student', icon: 'person' },
            { label: 'Delivery', icon: 'local_shipping' },
            { label: 'Review', icon: 'fact_check' }
          ]} currentStep={isForm ? (step === 5 ? 4 : step) : step} />
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
              {documentTypes.filter(d => {
                // Past students may only request transcripts
                const userType = user?.type || user?.user_type;
                if (userType === 'past_student') return d.id === 'transcript';
                return true;
              }).map(d => (
                <button
                   key={d.id}
                  onClick={() => {
                    setSelectedDoc(d.id);
                  }}
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
                    <p className={`font-label-lg text-label-lg ${(d.id === 'lateness_form' || d.id === 'absence_form') ? 'text-primary font-bold' : d.price === 0 ? 'text-on-surface-variant' : 'text-primary font-bold'}`}>
                      {(d.id === 'lateness_form' || d.id === 'absence_form') ? (t('digital.submission.no.fee') || 'No Fee') : d.price === 0 ? t('other.special') : `BZD $${d.price}.00`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Step 2: Identity Verification ── */}
        {step === 2 && (
          <section className="max-w-2xl mx-auto">
            <div className="mb-md text-center">
              <h2 className="font-headline-lg text-headline-lg text-primary">{t('identity.verification') || 'Identity Verification'}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
                {t('id.required.desc') || 'Please upload a clear copy of your government-issued ID or SSN card. This is required to process this specific document request.'}
              </p>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg flex flex-col items-center gap-md shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bento-texture opacity-[0.02]" />
              
              <div className="w-16 h-16 rounded-full bg-primary-container text-primary flex items-center justify-center relative z-10 mb-xs">
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>badge</span>
              </div>

              {/* Drag and Drop Zone */}
              <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/50 hover:border-primary/50 bg-surface-container-low/40 hover:bg-surface-container-low/80 rounded-xl p-lg cursor-pointer transition-all gap-sm relative z-10">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleIdFileChange}
                  className="hidden"
                />
                <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
                <div className="text-center">
                  <p className="font-label-lg text-on-surface font-semibold">
                    {idFile ? t('change.file') || 'Replace Uploaded ID' : t('upload.id.doc') || 'Click or drag file to upload'}
                  </p>
                  <p className="font-body-sm text-on-surface-variant mt-xs">
                    {t('supported.formats') || 'Supported formats: PNG, JPG, PDF (max 10MB)'}
                  </p>
                </div>
              </label>

              {/* Preview Zone */}
              {idFile && (
                <div className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl p-md flex flex-col gap-sm relative z-10 animate-in fade-in duration-200">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary">task</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-label-lg text-on-surface font-semibold truncate">{idFile.name}</p>
                      <p className="font-body-xs text-on-surface-variant">{(idFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => { setIdFile(null); setIdPreview(''); }}
                      className="p-1 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>

                  {idPreview && (
                    <div className="w-full h-48 border border-outline-variant/20 rounded-lg overflow-hidden relative bg-white">
                      <img
                        src={idPreview}
                        alt="ID Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  {idFile.type === 'application/pdf' && (
                    <div className="p-sm bg-surface-container border border-outline-variant/20 rounded-lg flex items-center gap-sm">
                      <span className="material-symbols-outlined text-error">picture_as_pdf</span>
                      <span className="font-label-md text-on-surface-variant">{t('pdf.uploaded') || 'PDF Document Uploaded'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Step 3: Student Info ── */}
        {step === 3 && (
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
                  <label className="font-label-lg text-label-lg text-on-surface">{t('manual.grade') || 'Class / Grade'} *</label>
                  <div className="grid grid-cols-2 gap-xs">
                    <select
                      required
                      value={classLevel}
                      onChange={e => handleClassLevelChange(e.target.value)}
                      className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md bg-transparent"
                    >
                      <option value="">{t('select.level') || 'Level'}</option>
                      <option value="F">F (Freshman)</option>
                      <option value="S">S (Sophomore)</option>
                      <option value="J">J (Junior)</option>
                      <option value="Sr">Sr (Senior)</option>
                    </select>
                    <select
                      required
                      value={classNumber}
                      onChange={e => handleClassNumberChange(e.target.value)}
                      className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md bg-transparent"
                    >
                      <option value="">{t('select.number') || 'Number'}</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </div>
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

            {/* Custom fields for Lateness and Absence forms */}
            {(selectedDoc === 'lateness_form' || selectedDoc === 'absence_form') && (
              <div className="mt-md bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md flex flex-col gap-md">
                <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>assignment</span>
                  {selectedDoc === 'lateness_form' ? t('lateness.form') : t('absence.form')} {t('details') || 'Details'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-lg text-label-lg text-on-surface">{t('date.of.return')} *</label>
                    <input
                      type="date"
                      required
                      value={dateOfReturn}
                      onChange={e => setDateOfReturn(e.target.value)}
                      className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
                    />
                  </div>

                  {/* Class / Grade is unified in the Student Details section above */}

                  {selectedDoc === 'absence_form' ? (
                    <>
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-lg text-label-lg text-on-surface">{t('start.date.absence') || 'Start Date'} *</label>
                        <input
                          type="date"
                          required
                          value={startDateOfAbsence}
                          onChange={e => setStartDateOfAbsence(e.target.value)}
                          className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
                        />
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="font-label-lg text-label-lg text-on-surface">{t('end.date.absence') || 'End Date'} *</label>
                        <input
                          type="date"
                          required
                          value={endDateOfAbsence}
                          min={startDateOfAbsence}
                          onChange={e => setEndDateOfAbsence(e.target.value)}
                          className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg text-label-lg text-on-surface">{t('date.of.lateness') || 'Date of Lateness'} *</label>
                      <input
                        type="date"
                        required
                        value={dateOfLateness}
                        onChange={e => setDateOfLateness(e.target.value)}
                        className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
                      />
                    </div>
                  )}

                  {selectedDoc === 'absence_form' && (
                    <div className="flex flex-col gap-xs">
                      <label className="font-label-lg text-label-lg text-on-surface">{t('num.days.absent')} *</label>
                      <input
                        type="number"
                        required
                        readOnly
                        value={numberOfDaysAbsent}
                        className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface-container-low text-on-surface-variant font-body-md cursor-not-allowed"
                        placeholder="Calculated automatically..."
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-lg text-label-lg text-on-surface">{t('home.room.teacher')} *</label>
                  <input
                    type="text"
                    required
                    value={homeRoomTeacher}
                    onChange={e => setHomeRoomTeacher(e.target.value)}
                    placeholder="e.g. Mr. Smith"
                    className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
                  />
                </div>

                <div className="flex flex-col gap-sm border-t border-outline-variant/20 pt-md">
                  <label className="font-label-lg text-label-lg text-on-surface uppercase tracking-widest text-primary">
                    {t('reason.absence.lateness') || 'Reason for Absence or Lateness'} *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                    {[
                      { key: 'sickness', label: t('reason.sickness') },
                      { key: 'traffic', label: t('reason.traffic') },
                      { key: 'medical', label: t('reason.medical') },
                      { key: 'dental', label: t('reason.dental') },
                      { key: 'funeral', label: t('reason.funeral') },
                      { key: 'other', label: t('reason.other') },
                    ].map(r => (
                      <label key={r.key} className="flex items-center gap-xs cursor-pointer p-xs hover:bg-surface-container rounded-lg border border-outline-variant/30">
                        <input
                          type="radio"
                          name="reasonCategory"
                          value={r.key}
                          checked={reasonCategory === r.key}
                          onChange={e => setReasonCategory(e.target.value)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="font-body-sm text-on-surface text-xs leading-none">{r.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-col gap-xs mt-sm">
                    <label className="font-label-lg text-label-lg text-on-surface">
                      {reasonCategory === 'sickness' || reasonCategory === 'traffic'
                        ? t('specify.details') + ' *'
                        : (reasonCategory === 'medical' || reasonCategory === 'dental' || reasonCategory === 'funeral')
                        ? (t('reason.details.time') || 'Dismissal / Return Time') + ' *'
                        : (t('reason.details.specify') || 'Specify Reason') + ' *'
                      }
                    </label>
                    <input
                      type="text"
                      required
                      value={reasonDetails}
                      onChange={e => setReasonDetails(e.target.value)}
                      placeholder={
                        reasonCategory === 'sickness' || reasonCategory === 'traffic'
                          ? "Specify details (e.g. Flu, Car broke down)..."
                          : (reasonCategory === 'medical' || reasonCategory === 'dental' || reasonCategory === 'funeral')
                          ? "e.g. Dismissal 10:00 AM, Return 11:30 AM..."
                          : "Specify the reason..."
                      }
                      className="border border-outline-variant/50 rounded-lg px-sm py-xs bg-surface font-body-md"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Step 4: Delivery & Speed ── */}
        {step === 4 && (
          <section className="max-w-3xl">
            {(selectedDoc === 'lateness_form' || selectedDoc === 'absence_form') ? (
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-lg flex flex-col gap-md max-w-2xl mx-auto text-center items-center shadow-sm">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '56px' }}>forward_to_inbox</span>
                <h3 className="font-headline-md text-headline-md text-primary">{t('auto.submission.delivery') || 'Digital Submission'}</h3>
                <p className="font-body-md text-on-surface-variant">
                  {t('auto.submission.delivery.desc') || 'This form will be submitted digitally directly to the high school administration records. You do not need to choose a delivery method or pay any processing fees.'}
                </p>
                <div className="w-full border-t border-outline-variant/20 pt-md flex justify-between items-center">
                  <p className="font-label-lg text-on-surface-variant">{t('base.fee')}</p>
                  <p className="font-label-lg text-primary font-bold">{t('FREE') || 'FREE'}</p>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </section>
        )}

        {/* ── Step 5: Review ── */}
        {step === 5 && (
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

              {/* Student & Form Details */}
              <div className="p-md border-b border-outline-variant/20">
                <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest mb-sm">{t('student.details')}</p>
                <div className="grid grid-cols-2 gap-sm mb-md">
                  <div><p className="font-label-md text-label-md text-on-surface-variant">{t('student.name')}</p><p className="font-body-md text-body-md">{selectedStudent?.name || studentForm.fullName}</p></div>
                  <div><p className="font-label-md text-label-md text-on-surface-variant">{t('class.grade') || t('grade.year')}</p><p className="font-body-md text-body-md">{selectedStudent?.grade || studentForm.grade}</p></div>
                  <div><p className="font-label-md text-label-md text-on-surface-variant">{t('relationship')}</p><p className="font-body-md text-body-md">{t('rel.' + studentForm.relationship.toLowerCase().replace(' ', '')) || studentForm.relationship}</p></div>
                </div>

                {(selectedDoc === 'lateness_form' || selectedDoc === 'absence_form') && (
                  <>
                    <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest mb-sm border-t border-outline-variant/20 pt-md">{t('form.details') || 'Form Details'}</p>
                    <div className="grid grid-cols-2 gap-sm">
                      <div><p className="font-label-md text-label-md text-on-surface-variant">{t('date.of.return')}</p><p className="font-body-md text-body-md">{dateOfReturn}</p></div>
                      <div><p className="font-label-md text-label-md text-on-surface-variant">{t('dates.of.absence.lateness')}</p><p className="font-body-md text-body-md">{datesOfAbsenceOrLateness}</p></div>
                      {selectedDoc === 'absence_form' && (
                        <div><p className="font-label-md text-label-md text-on-surface-variant">{t('num.days.absent')}</p><p className="font-body-md text-body-md">{numberOfDaysAbsent}</p></div>
                      )}
                      <div><p className="font-label-md text-label-md text-on-surface-variant">{t('home.room.teacher')}</p><p className="font-body-md text-body-md">{homeRoomTeacher}</p></div>
                      <div><p className="font-label-md text-label-md text-on-surface-variant">{t('reason')}</p><p className="font-body-md text-body-md font-semibold text-primary">{t('reason.' + reasonCategory) || reasonCategory}</p></div>
                      <div className="col-span-2"><p className="font-label-md text-label-md text-on-surface-variant">{t('specify.details')}</p><p className="font-body-md text-body-md">{reasonDetails}</p></div>
                    </div>
                  </>
                )}
              </div>

              {/* Total */}
              {isForm ? (
                <div className="p-md bg-surface-container border-l-4 border-primary">
                  <div className="flex gap-sm">
                    <span className="material-symbols-outlined text-primary">forward_to_inbox</span>
                    <div>
                      <p className="font-body-md text-on-surface font-semibold">
                        {t('digital.submission.no.fee') || 'Direct Digital Submission (No Fee)'}
                      </p>
                      <p className="font-body-sm text-on-surface-variant mt-xs">
                        {t('form.submission.notice') || 'This form has been submitted electronically directly to school records. No processing fee or payment is required.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-md bg-surface-container">
                  <div className="flex justify-between items-center">
                    <p className="font-headline-sm text-headline-sm text-on-surface">{t('total.due')}</p>
                    <p className="font-headline-md text-headline-md text-primary font-bold">
                      BZD ${totalFee}.00
                    </p>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                    <>{t('processing.speed')}: <span className="font-semibold">{t(processingItem?.labelKey)}</span></>
                  </p>
                </div>
              )}
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

        {/* Floating Action Navigation Buttons */}
        <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 flex flex-col gap-xs items-end">
          {/* Back button */}
          <button
            onClick={handleBack}
            className={`flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest text-primary w-10 h-10 rounded-full shadow-md transition-all active:scale-95 border border-outline-variant/30 cursor-pointer transform duration-300 ${
              step > 1
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
            }`}
            title={t('back')}
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>

          {/* Continue / Submit button */}
          <button
            onClick={step < 5 ? handleNext : safeNavigateToSign}
            className={`flex items-center gap-xs bg-primary text-on-primary h-12 px-5 rounded-full font-label-lg shadow-lg hover:bg-primary-container active:scale-95 font-semibold transition-all duration-300 transform ${
              canProceed() 
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
                : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
            }`}
            title={step < 5 ? t('continue') : t('submit.request')}
          >
            <span>{step < 5 ? t('continue') : t('submit.request')}</span>
            <span className="material-symbols-outlined text-[18px]">
              {step < 5 ? 'arrow_forward' : 'draw'}
            </span>
          </button>
        </div>
      </main>

      <BottomNav variant="parent" />
    </div>
  );
}
