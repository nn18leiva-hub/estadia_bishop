import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function UploadReceipt() {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId, fee, docLabel } = location.state || {};
  const { t } = useLanguage();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!requestId) {
      navigate('/dashboard/parents');
    }
  }, [requestId, navigate]);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(f.type)) return setError(t('err.allowed.formats'));
    if (f.size > 10 * 1024 * 1024) return setError(t('err.max.size'));
    setError('');
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return setError(t('err.upload.receipt'));
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('receipt_image', file);
      formData.append('transfer_reference', refNumber);
      if (requestId) {
        formData.append('request_id', requestId);
      }
      await apiFetch('/payment/upload-receipt', { method: 'POST', body: formData });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard/parents/success', {
        state: { requestId, fee, docLabel, paymentUploaded: true }
      }), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopAppBar showBack />

      <main className="pt-24 pb-24 px-sm md:px-gutter max-w-container-max mx-auto">
        <div className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg text-primary">{t('upload.payment.receipt')}</h1>
          <p className="font-body-md text-on-surface-variant mt-xs max-w-xl">
            {t('upload.receipt.desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Upload Area */}
          <div className="lg:col-span-7 flex flex-col gap-md">
            {/* Reference Field */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <label className="font-label-lg text-label-lg text-on-surface block mb-xs">{t('txn.ref.num')}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">tag</span>
                <input
                  type="text"
                  value={refNumber}
                  onChange={e => setRefNumber(e.target.value)}
                  placeholder="e.g. TXN-2024-XY9921"
                  className="w-full pl-10 pr-4 py-sm border border-outline-variant/50 rounded-lg bg-surface font-body-md"
                />
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                {t('txn.ref.desc')}
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`upload-dashed-border rounded-xl p-xl flex flex-col items-center justify-center gap-md cursor-pointer min-h-[260px] transition-all
                ${dragOver ? 'drag-over' : 'hover:bg-surface-container-low'}`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${file ? 'bg-secondary-container' : 'bg-primary-fixed'}`}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>
                  {file ? 'check_circle' : 'cloud_upload'}
                </span>
              </div>
              {file ? (
                <div className="text-center">
                  <p className="font-headline-sm text-headline-sm text-on-surface">{file.name}</p>
                  <p className="font-body-sm text-on-surface-variant">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                    className="mt-sm text-error hover:underline font-label-md text-label-md"
                  >
                    {t('remove.reupload')}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-body-lg text-body-lg text-on-surface">{t('drag.drop.receipt')}</p>
                  <p className="font-body-sm text-on-surface-variant mt-xs">{t('click.browse')}</p>
                  <p className="font-label-md text-label-md text-on-surface-variant mt-sm">PDF · JPG · PNG · Max 10 MB</p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-sm px-sm py-xs bg-error-container rounded-lg">
                <span className="material-symbols-outlined text-error text-lg">error</span>
                <p className="font-body-sm text-on-error-container">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={uploading || success}
              className={`w-full py-sm rounded-lg font-label-lg shadow-sm flex items-center justify-center gap-sm transition-all
                ${success ? 'bg-green-700 text-white' : 'bg-primary text-on-primary hover:bg-primary-container disabled:opacity-60'}`}
            >
              {uploading ? (
                <><span className="material-symbols-outlined animate-spin">sync</span> {t('submitting')}</>
              ) : success ? (
                <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {t('uploaded.success')}</>
              ) : (
                <><span className="material-symbols-outlined">upload</span> {t('submit.receipt')}</>
              )}
            </button>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-5 flex flex-col gap-md">
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-md">{t('photo.tips')}</h3>
              <div className="flex flex-col gap-sm">
                {[
                  { icon: 'crop_free', title: t('tip.corners'), body: t('tip.corners.desc') },
                  { icon: 'wb_sunny', title: t('tip.glare'), body: t('tip.glare.desc') },
                  { icon: 'straighten', title: t('tip.level'), body: t('tip.level.desc') },
                  { icon: 'lock', title: t('tip.secure'), body: t('tip.secure.desc') },
                ].map(tip => (
                  <div key={tip.title} className="flex items-start gap-sm">
                    <span className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5" style={{ fontSize: '20px' }}>{tip.icon}</span>
                    <div>
                      <p className="font-label-lg text-label-lg text-on-surface">{tip.title}</p>
                      <p className="font-body-sm text-on-surface-variant">{tip.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bank info reminder */}
            <div className="bg-primary text-on-primary rounded-xl p-md relative overflow-hidden">
              <div className="absolute inset-0 bento-texture" style={{ opacity: 0.1 }} />
              <div className="relative z-10">
                <span className="material-symbols-outlined mb-sm" style={{ fontSize: '28px', opacity: 0.8 }}>account_balance</span>
                <p className="font-label-lg text-label-lg opacity-80 mb-xs">{t('payment.sent.to')}</p>
                <p className="font-headline-sm text-headline-sm">Belize Bank Limited</p>
                <p className="font-body-sm opacity-80 mt-xs">Bishop Martin High School – Registrar</p>
                <p className="font-mono font-semibold mt-xs tracking-wider">1234-5678-9012</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav variant="parent" />
    </div>
  );
}
