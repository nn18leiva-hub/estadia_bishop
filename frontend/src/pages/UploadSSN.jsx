import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export default function UploadSSN() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { fetchProfile } = useAuth();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
    if (!allowed.includes(f.type)) return setError(t('err.allowed.id.formats'));
    if (f.size > 15 * 1024 * 1024) return setError(t('err.max.id.size'));
    setError('');
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return setError(t('err.upload.id'));
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('ssn_image', file);
      await apiFetch('/parent/upload-ssn-card', { method: 'POST', body: formData });
      await fetchProfile();
      navigate('/dashboard/parents/verify-ssn');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <TopAppBar showBack backTo="/dashboard/parents" />

      <main className="pt-24 pb-24 px-sm md:px-gutter max-w-container-max mx-auto">
        <div className="mb-lg">
          <h1 className="font-headline-lg text-headline-lg text-primary">{t('id.verification')}</h1>
          <p className="font-body-md text-on-surface-variant mt-xs max-w-xl">
            {t('id.ver.desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Upload Panel */}
          <div className="lg:col-span-7 flex flex-col gap-md">
            {/* Drop Zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`upload-dashed-border rounded-xl flex flex-col items-center justify-center gap-lg cursor-pointer transition-all p-xl min-h-[300px]
                ${dragOver ? 'drag-over' : 'hover:bg-surface-container-low'}`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />

              {file ? (
                <div className="flex flex-col items-center gap-sm text-center">
                  <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <p className="font-headline-sm text-headline-sm text-on-surface">{file.name}</p>
                  <p className="font-body-sm text-on-surface-variant">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); }}
                    className="text-error hover:underline font-label-md text-label-md mt-sm"
                  >
                    {t('remove.reupload')}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-sm text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '40px' }}>badge</span>
                  </div>
                  <div>
                    <p className="font-body-lg text-body-lg text-on-surface font-semibold">{t('upload.id.doc')}</p>
                    <p className="font-body-sm text-on-surface-variant mt-xs">{t('drag.drop.id')}</p>
                  </div>
                  <div className="flex flex-wrap gap-xs justify-center mt-xs">
                    {[t('passport'), t('national.id'), t('drivers.license'), t('voters.id')].map(type => (
                      <span key={type} className="px-sm py-0.5 bg-surface-container rounded-full font-label-md text-label-md text-on-surface-variant border border-outline-variant/30">
                        {type}
                      </span>
                    ))}
                  </div>
                  <p className="font-label-md text-label-md text-on-surface-variant">{t('allowed.id.specs')}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-sm px-sm py-xs bg-error-container rounded-lg border border-error/20">
                <span className="material-symbols-outlined text-error">error</span>
                <p className="font-body-sm text-on-error-container">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={uploading || !file}
              className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-lg shadow-sm hover:bg-primary-container disabled:opacity-40 flex items-center justify-center gap-sm transition-all"
            >
              {uploading ? (
                <><span className="material-symbols-outlined animate-spin">sync</span> {t('verifying')}</>
              ) : (
                <>{t('verify.continue')} <span className="material-symbols-outlined">arrow_forward</span></>
              )}
            </button>
          </div>

          {/* Tips Sidebar */}
          <div className="lg:col-span-5 flex flex-col gap-md">
            {/* Document preview illustration */}
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md flex flex-col items-center gap-sm">
              <div className="w-full max-w-xs bg-surface-container-high rounded-lg p-md flex items-center justify-center relative border-2 border-dashed border-primary/20" style={{ minHeight: '140px' }}>
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '64px', opacity: 0.3 }}>badge</span>
                {/* Corner markers */}
                {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map(pos => (
                  <div key={pos} className={`absolute w-4 h-4 border-primary/60 ${pos}`}
                    style={{ borderTop: pos.includes('top') ? '2px solid' : 'none', borderLeft: pos.includes('left') ? '2px solid' : 'none', borderRight: pos.includes('right') ? '2px solid' : 'none', borderBottom: pos.includes('bottom') ? '2px solid' : 'none', borderColor: 'var(--color-primary)' }} />
                ))}
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant text-center">{t('pos.id.frame')}</p>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-md">{t('photo.guidelines')}</h3>
              <div className="flex flex-col gap-sm">
                {[
                  { icon: 'crop_free', title: t('guideline.corners'), body: t('guideline.corners.desc') },
                  { icon: 'wb_sunny', title: t('guideline.glare'), body: t('guideline.glare.desc') },
                  { icon: 'straighten', title: t('guideline.level'), body: t('guideline.level.desc') },
                  { icon: 'lock', title: t('guideline.secure'), body: t('guideline.secure.desc') },
                ].map(tip => (
                  <div key={tip.title} className="flex items-start gap-sm">
                    <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: '20px' }}>{tip.icon}</span>
                    <div>
                      <p className="font-label-lg text-label-lg text-on-surface">{tip.title}</p>
                      <p className="font-body-sm text-on-surface-variant">{tip.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav variant="parent" />
    </div>
  );
}
