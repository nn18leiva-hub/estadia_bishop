import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';
import StaffHeader from '../components/StaffHeader';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const STATUS_STYLES = {
  pending: 'bg-surface-container-high text-on-surface-variant',
  pending_verification: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-500/20',
  processing: 'bg-secondary-container text-on-secondary-container',
  ready: 'bg-tertiary-fixed text-on-tertiary-fixed',
  ready_for_pickup: 'bg-tertiary-fixed text-on-tertiary-fixed',
  issued: 'bg-secondary-container/60 text-on-secondary-container',
  completed: 'bg-secondary-container/60 text-on-secondary-container',
  cancelled: 'bg-error-container text-on-error-container',
  denied: 'bg-error-container text-on-error-container',
  action: 'bg-error-container text-on-error-container',
};

export default function StaffRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState('');
  const [showStaffLockModal, setShowStaffLockModal] = useState(false);

  const [selectedDocFile, setSelectedDocFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleDocFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setUploadError(t('err.file.too.large') || 'File size exceeds the 20MB limit.');
        setSelectedDocFile(null);
      } else {
        setUploadError('');
        setSelectedDocFile(file);
      }
    }
  };

  const handleDocUpload = async () => {
    if (!selectedDocFile) return;
    setUploadingDoc(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('document_file', selectedDocFile);
      
      const data = await apiFetch(`/staff/requests/${id}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const isDigital = req?.delivery_method === 'emailed';
      setReq(prev => ({
        ...prev,
        generated_file_path: data.generated_file_path,
        status: isDigital ? 'issued' : prev.status
      }));
      if (isDigital) {
        setSelectedStatus('issued');
        setToast(t('toast.doc.uploaded') || 'Document uploaded and status updated to Issued.');
      } else {
        setToast(t('toast.doc.uploaded.physical') || 'Document uploaded successfully for archiving.');
      }
      setSelectedDocFile(null);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setUploadError(err.message || 'Error uploading document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  useEffect(() => {
    const fetchReq = async () => {
      try {
        const data = await apiFetch(`/staff/requests/${id}`);
        setReq(data);
        setNotes(data.staff_notes || '');
        let initialStatus = data.status || 'pending';
        if (initialStatus === 'ready_for_pickup') initialStatus = 'ready';
        if (initialStatus === 'completed') initialStatus = 'issued';
        if (initialStatus === 'denied') initialStatus = 'action';
        setSelectedStatus(initialStatus);
      } catch (_) {}
      setLoading(false);
    };
    fetchReq();
  }, [id]);

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

  const updateStatus = async (status, action) => {
    setProcessing(true);
    try {
      await apiFetch(`/staff/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, staff_notes: notes }),
      });
      let nextStatus = status;
      if (nextStatus === 'ready') nextStatus = 'ready_for_pickup';
      if (nextStatus === 'issued') nextStatus = 'completed';
      if (nextStatus === 'cancelled') nextStatus = 'denied';

      setSelectedStatus(status);
      setReq(prev => ({ ...prev, status: nextStatus, staff_notes: notes }));
      setToast(action === 'approve' 
        ? t('toast.approved') 
        : action === 'flag' 
          ? t('toast.flagged') 
          : `${t('toast.status.updated')} ${getStatusLabel(status)}`
      );
      setTimeout(() => { setToast(''); if (action === 'approve' || action === 'flag') navigate('/staff/requests'); }, 2200);
    } catch (_) {}
    setProcessing(false);
  };
  const handleVerifyId = async (status) => {
    setProcessing(true);
    try {
      await apiFetch(`/staff/verifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setReq(prev => ({
        ...prev,
        parent_verified: status === 'approved',
        status: status === 'approved' ? (prev.requires_payment && !prev.payment_verified ? 'pending' : 'processing') : 'denied'
      }));
      setToast(status === 'approved' ? 'Request ID verified successfully.' : 'Request ID verification rejected.');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.message || 'Error updating ID verification status.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>sync</span>
    </div>
  );

  const initials = (req?.student_name || 'XX').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <StaffSidebar variant="staff" />

      <StaffHeader title={t('request.detail')} showBack={true} backTo="/staff/requests" />

      <main className="md:ml-80 pt-24 pb-24 px-sm md:px-gutter max-w-container-max">
        {!req ? (
          <div className="text-center py-xl">
            <p className="font-body-md text-on-surface-variant">{t('request.not.found')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {/* Left: Request Info */}
            <div className="flex flex-col gap-md">
              {/* Student Header */}
              <div className="bg-primary text-on-primary rounded-xl p-md flex items-center gap-md relative overflow-hidden">
                <div className="absolute inset-0 bento-texture" style={{ opacity: 0.1 }} />
                <div className="w-16 h-16 rounded-full bg-on-primary/20 flex items-center justify-center font-bold text-headline-md relative z-10">
                  {initials}
                </div>
                <div className="relative z-10">
                  <h2 className="font-headline-sm text-headline-sm">{req.student_name || '—'}</h2>
                  <p className="font-body-sm opacity-80">{req.grade || '—'}</p>
                  <p className="font-body-sm opacity-70">{t(req.relationship || 'parents').slice(0, -1)}</p>
                </div>
              </div>

              {/* Details */}
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-sm">{t('request.details')}</h3>
                <div className="grid grid-cols-2 gap-sm">
                  {[
                    { label: t('ref'), value: `BM-${req.id}` },
                    { label: t('document.type'), value: translateDocType(req.document_type) },
                    { label: t('delivery'), value: req.delivery_method === 'email' ? t('digital.delivery') : t('physical.pickup') },
                    { label: t('processing'), value: req.processing_speed === 'urgent' ? t('urg.proc') : req.processing_speed === 'expedited' ? t('exp.proc') : t('std.proc') },
                    { label: t('date.submitted'), value: req.created_at ? new Date(req.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-BZ', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                    { label: t('total.fee'), value: req.fee ? `BZD $${Number(req.fee).toFixed(2)}` : '—' },
                    { label: t('status'), value: getStatusLabel(req.status) },
                    { label: t('recipient'), value: req.recipient_email || t('physical.pickup') },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{item.label}</p>
                      <p className="font-body-md text-on-surface capitalize">{item.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Identity Verification Card */}
              {req.ssn_card_image_path && (
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-sm flex items-center gap-xs">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>badge</span>
                    {t('identity.verification') || 'Identity Verification'}
                  </h3>
                  <div className="flex flex-col gap-xs">
                    <div className="flex justify-between items-center py-xs border-b border-outline-variant/10">
                      <p className="font-body-sm text-on-surface-variant">{t('status') || 'Status'}</p>
                      <span className={`text-label-md px-sm py-0.5 rounded-full font-semibold capitalize ${
                        req.parent_verified ? 'bg-secondary-container text-on-secondary-container' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.parent_verified ? t('verified') || 'Verified' : t('pending') || 'Pending Review'}
                      </span>
                    </div>

                    {!req.parent_verified && (
                      <div className="flex gap-sm mt-sm">
                        <button
                          onClick={() => handleVerifyId('approved')}
                          disabled={processing}
                          className="flex-1 bg-primary text-on-primary py-xs rounded-lg font-label-md hover:bg-primary-container shadow-sm transition-colors flex items-center justify-center gap-xs"
                        >
                          <span className="material-symbols-outlined text-sm">how_to_reg</span>
                          Approve ID
                        </button>
                        <button
                          onClick={() => handleVerifyId('rejected')}
                          disabled={processing}
                          className="flex-1 border border-error text-error py-xs rounded-lg font-label-md hover:bg-error-container transition-colors flex items-center justify-center gap-xs"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                          Reject ID
                        </button>
                      </div>
                    )}

                    <div className="mt-md flex flex-col gap-sm">
                      <a
                        href={`/${req.ssn_card_image_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-secondary-container text-on-secondary-container py-xs rounded-lg font-label-lg hover:opacity-90 flex items-center justify-center gap-sm transition-all"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                        {t('view.id.doc') || 'View Full ID Document'}
                      </a>
                      
                      {/* Inline ID Preview */}
                      <div className="w-full h-40 border border-outline-variant/20 rounded-lg overflow-hidden relative bg-surface-container-low">
                        {req.ssn_card_image_path.toLowerCase().endsWith('.pdf') ? (
                          <iframe
                            src={`/${req.ssn_card_image_path}#toolbar=0`}
                            title="ID Preview"
                            className="w-full h-full border-none"
                          />
                        ) : (
                          <img
                            src={`/${req.ssn_card_image_path}`}
                            alt="ID Preview"
                            className="w-full h-full object-contain cursor-pointer"
                            onClick={() => window.open(`/${req.ssn_card_image_path}`, '_blank')}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {req.requires_payment && (
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-sm flex items-center gap-xs">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>payments</span>
                    {t('payment.summary') || 'Payment Summary'}
                  </h3>
                  <div className="flex flex-col gap-xs">
                    <div className="flex justify-between items-center py-xs border-b border-outline-variant/10">
                      <p className="font-body-sm text-on-surface-variant">{t('status') || 'Status'}</p>
                      <span className={`text-label-md px-sm py-0.5 rounded-full font-semibold capitalize ${
                        req.payment_verified ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {req.payment_verified ? t('verified') || 'Verified' : t('pending') || 'Pending Verification'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-xs border-b border-outline-variant/10">
                      <p className="font-body-sm text-on-surface-variant">{t('ref') || 'Reference'}</p>
                      <p className="font-mono text-body-sm text-on-surface">{req.transfer_reference || '—'}</p>
                    </div>
                    <div className="flex justify-between items-center py-xs border-b border-outline-variant/10">
                      <p className="font-body-sm text-on-surface-variant">{t('date') || 'Date'}</p>
                      <p className="font-body-md text-on-surface">
                        {req.payment_date ? new Date(req.payment_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-BZ', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                      </p>
                    </div>
                    {req.receipt_image_path && (
                      <div className="mt-md flex flex-col gap-sm">
                        <a
                          href={`/${req.receipt_image_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-secondary-container text-on-secondary-container py-xs rounded-lg font-label-lg hover:opacity-90 flex items-center justify-center gap-sm transition-all"
                        >
                          <span className="material-symbols-outlined">receipt_long</span>
                          {t('view.receipt') || 'View Receipt'}
                        </a>
                        {/* Inline Receipt Preview */}
                        <div className="w-full h-40 border border-outline-variant/20 rounded-lg overflow-hidden relative bg-surface-container-low">
                          {req.receipt_image_path.toLowerCase().endsWith('.pdf') ? (
                            <iframe
                              src={`/${req.receipt_image_path}#toolbar=0`}
                              title="Receipt Preview"
                              className="w-full h-full border-none"
                            />
                          ) : (
                            <img
                              src={`/${req.receipt_image_path}`}
                              alt="Receipt Preview"
                              className="w-full h-full object-contain cursor-pointer"
                              onClick={() => window.open(`/${req.receipt_image_path}`, '_blank')}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Document Preview (Only shown when a document is uploaded) */}
              {req.generated_file_path && (
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md flex flex-col gap-sm">
                  <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-xs">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>preview</span>
                    {t('document.preview') || 'Document Preview'}
                  </h3>
                  <div className="w-full h-80 border border-outline-variant/20 rounded-lg overflow-hidden relative bg-surface-container-low">
                    {req.generated_file_path.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={`/${req.generated_file_path}#toolbar=0`}
                        title="Document Preview"
                        className="w-full h-full border-none"
                      />
                    ) : (
                      <img
                        src={`/${req.generated_file_path}`}
                        alt="Document Preview"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {req.notes && (
                <div className="bg-surface-container border border-outline-variant/20 rounded-xl p-md">
                  <h3 className="font-label-lg text-label-lg text-on-surface-variant uppercase mb-xs">{t('requester.notes')}</h3>
                  <p className="font-body-md text-on-surface">{req.notes}</p>
                </div>
              )}
            </div>

            {/* Right: Staff Actions */}
            <div className="flex flex-col gap-md">
              {/* Audit Notes */}
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-sm flex items-center gap-xs">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>rate_review</span>
                  {t('reg.audit.notes')}
                </h3>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={6}
                  placeholder={t('audit.notes.placeholder')}
                  className="w-full border border-outline-variant/50 rounded-lg p-sm font-body-md bg-surface resize-none"
                />
                <p className="font-body-sm text-on-surface-variant mt-xs">{t('visible.staff.only')}</p>
              </div>

              {/* Status Update */}
              <div className={`bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md relative ${
                req && (!req.parent_verified || (req.requires_payment && !req.payment_verified)) ? 'opacity-60' : ''
              }`}>
                {req && (!req.parent_verified || (req.requires_payment && !req.payment_verified)) && (
                  <div 
                    className="absolute inset-0 z-10 cursor-not-allowed" 
                    onClick={(e) => { e.stopPropagation(); setShowStaffLockModal(true); }}
                  />
                )}
                <h3 className="font-headline-sm text-headline-sm text-primary mb-sm">{t('update.status')}</h3>
                <select
                  disabled={processing || (req && (!req.parent_verified || (req.requires_payment && !req.payment_verified)))}
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full border border-outline px-sm py-sm font-body-md bg-surface rounded-lg mb-md disabled:opacity-50 disabled:bg-surface-container-low disabled:cursor-not-allowed"
                >
                  {[
                    { v: 'pending', l: t('pending') },
                    { v: 'processing', l: t('processing') },
                    { v: 'ready', l: t('ready.pickup') },
                    { v: 'issued', l: t('issued') },
                    { v: 'action', l: t('action.required') },
                  ].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
                <button
                  disabled={processing || selectedStatus === req.status || (req && (!req.parent_verified || (req.requires_payment && !req.payment_verified)))}
                  onClick={() => updateStatus(selectedStatus, 'update')}
                  className="w-full mb-sm bg-secondary-container text-on-secondary-container py-xs rounded-lg font-label-lg hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-sm transition-all"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  {t('save.status.change')}
                </button>

                <div className="flex flex-col gap-sm">
                  <button
                    disabled={processing || (req && (!req.parent_verified || (req.requires_payment && !req.payment_verified)))}
                    onClick={() => updateStatus('issued', 'approve')}
                    className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container disabled:opacity-60 flex items-center justify-center gap-sm transition-all"
                  >
                    {processing ? (
                      <><span className="material-symbols-outlined animate-spin">sync</span> {t('submitting')}</>
                    ) : (
                      <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {t('approve.release')}</>
                    )}
                  </button>

                  <button
                    disabled={processing || (req && (!req.parent_verified || (req.requires_payment && !req.payment_verified)))}
                    onClick={() => updateStatus('action', 'flag')}
                    className="w-full border border-error text-error py-sm rounded-lg font-label-lg hover:bg-error-container disabled:opacity-60 flex items-center justify-center gap-sm transition-all"
                  >
                    <span className="material-symbols-outlined">flag</span>
                    {t('flag.correction')}
                  </button>
                </div>
              </div>

              {/* Document Upload Zone */}
              <div className={`bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md relative ${
                req && (!req.parent_verified || (req.requires_payment && !req.payment_verified)) ? 'opacity-60' : ''
              }`}>
                {req && (!req.parent_verified || (req.requires_payment && !req.payment_verified)) && (
                  <div 
                    className="absolute inset-0 z-10 cursor-not-allowed" 
                    onClick={(e) => { e.stopPropagation(); setShowStaffLockModal(true); }}
                  />
                )}
                <h3 className="font-headline-sm text-headline-sm text-primary mb-sm flex items-center gap-xs">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
                  {t('upload.document') || 'Upload Final Document'}
                </h3>
                
                {req.generated_file_path ? (
                  <div className="flex flex-col gap-sm">
                    <div className="p-sm bg-secondary-container/20 border border-secondary/20 rounded-lg flex items-center gap-sm">
                      <span className="material-symbols-outlined text-secondary" style={{ fontSize: '32px' }}>task</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-lg text-on-surface font-semibold truncate">
                          {req.generated_file_path.split('/').pop()}
                        </p>
                        <p className="font-body-xs text-on-surface-variant">
                          {t('document.issued') || 'Document Issued'}
                        </p>
                      </div>
                      <a
                        href={`/${req.generated_file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-xs hover:bg-secondary-container/30 rounded-full transition-colors text-primary"
                        title={t('download.document') || 'Download Document'}
                      >
                        <span className="material-symbols-outlined">download</span>
                      </a>
                    </div>
                    
                    <p className="font-body-xs text-on-surface-variant">
                      {t('upload.new.doc.desc') || 'You can upload a new version to replace the existing document.'}
                    </p>
                  </div>
                ) : (
                  <p className="font-body-sm text-on-surface-variant mb-sm">
                    {req.delivery_method === 'emailed' 
                      ? t('upload.doc.desc') || 'Upload the finalized PDF or document to automatically issue it to the parent for digital download.'
                      : t('upload.archive.desc') || 'Upload a scanned copy of the document for digital archiving (optional).'}
                  </p>
                )}

                <div className="mt-sm">
                  <input
                    type="file"
                    id="staff-doc-upload"
                    accept=".pdf,image/*"
                    disabled={req && (!req.parent_verified || (req.requires_payment && !req.payment_verified))}
                    onChange={handleDocFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor={req && (!req.parent_verified || (req.requires_payment && !req.payment_verified)) ? undefined : "staff-doc-upload"}
                    className={`flex flex-col items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary/50 rounded-lg p-md transition-colors bg-surface-container-low/30 hover:bg-surface-container-low/50 ${
                      req && (!req.parent_verified || (req.requires_payment && !req.payment_verified)) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '32px' }}>
                      cloud_upload
                    </span>
                    <span className="font-label-md text-on-surface mt-xs text-center">
                      {selectedDocFile ? selectedDocFile.name : (t('select.file') || 'Select Document File')}
                    </span>
                    <span className="font-body-xs text-on-surface-variant mt-xxs">
                      {t('max.file.size') || 'PDF, images up to 20MB'}
                    </span>
                  </label>
                </div>

                {uploadError && (
                  <p className="font-body-sm text-error mt-xs">{uploadError}</p>
                )}

                {selectedDocFile && (
                  <button
                    onClick={handleDocUpload}
                    disabled={uploadingDoc || (req && (!req.parent_verified || (req.requires_payment && !req.payment_verified)))}
                    className="w-full mt-md bg-primary text-on-primary py-xs rounded-lg font-label-lg shadow-sm hover:bg-primary-container flex items-center justify-center gap-sm transition-all disabled:opacity-50"
                  >
                    {uploadingDoc ? (
                      <><span className="material-symbols-outlined animate-spin text-sm">sync</span> {t('uploading') || 'Uploading...'}</>
                    ) : (
                      <><span className="material-symbols-outlined text-sm">upload</span> {
                        req.delivery_method === 'emailed'
                          ? t('submit.document') || 'Upload & Issue Document'
                          : t('upload.document') || 'Upload Document'
                      }</>
                    )}
                  </button>
                )}
              </div>

              {/* Quick Info */}
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
                <h3 className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest mb-sm">{t('sla.compliance')}</h3>
                <div className="flex items-center gap-sm">
                  <div className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
                  <p className="font-body-md text-on-surface">
                    {req.processing_speed === 'urgent' ? t('next.bus.day') : req.processing_speed === 'expedited' ? t('days.2_3') : t('days.5_7')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-tertiary-container text-on-tertiary-container px-lg py-sm rounded-full font-label-lg shadow-xl z-50 animate-in fade-in slide-in-from-bottom duration-300">
          {toast}
        </div>
      )}

      {showStaffLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowStaffLockModal(false)}>
          <div className="bg-surface border border-outline-variant/30 rounded-xl p-lg max-w-sm w-full mx-sm shadow-2xl flex flex-col items-center text-center gap-md" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>lock</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{t('request.locked') || 'Processing Locked'}</h3>
              <p className="font-body-md text-on-surface-variant mt-xs">
                {!req?.parent_verified && !req?.payment_verified && req?.requires_payment
                  ? 'This request is locked because both the parent\'s identity and payment require verification.'
                  : !req?.parent_verified
                  ? 'This request is locked because the parent\'s identity has not been verified yet.'
                  : 'This request is locked because payment verification is pending.'
                }
              </p>
            </div>
            <div className="flex flex-col gap-xs w-full mt-xs">
              {req?.requires_payment && !req?.payment_verified && (
                <button
                  onClick={() => { setShowStaffLockModal(false); navigate('/staff/payments'); }}
                  className="w-full bg-secondary-container text-on-secondary-container py-xs rounded-lg font-label-md hover:opacity-90 border border-outline-variant/20 transition-colors flex items-center justify-center gap-xs"
                >
                  <span className="material-symbols-outlined text-sm">payments</span>
                  Verify Payment
                </button>
              )}
              <button
                onClick={() => setShowStaffLockModal(false)}
                className="w-full border border-outline-variant hover:bg-surface-container py-xs rounded-lg font-label-md transition-colors mt-xs"
              >
                {t('close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav variant="staff" />
    </div>
  );
}
