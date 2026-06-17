import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TopAppBar from '../components/TopAppBar';
import BottomNav from '../components/BottomNav';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiFetch } from '../services/api';

export default function DigitalSignature() {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);
  const lastWidthRef = useRef(0);
  const startDrawRef = useRef(null);
  const drawRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Form data passed from NewRequest
  const { requestData, fee, docLabel } = location.state || {};

  // Pre-fill typed name from the student name so the user doesn't have to retype
  const [fullName, setFullName] = useState(requestData?.student_full_name || '');

  // ── Canvas helpers ────────────────────────────────────────────────────────
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const newWidth = Math.round(rect.width);

    // Skip height-only resize (mobile URL bar show/hide) to preserve drawing
    if (newWidth === lastWidthRef.current && hasSignature) return;
    lastWidthRef.current = newWidth;

    const imageData = canvas.width > 0 && canvas.height > 0
      ? canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
      : null;

    canvas.width = newWidth;
    canvas.height = Math.round(rect.height);

    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = theme === 'dark' ? '#ffb4a8' : '#570000';

    if (imageData) ctx.putImageData(imageData, 0, 0);
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Attach native touch listeners with passive:false so preventDefault() works
    const canvas = canvasRef.current;
    if (canvas) {
      const onTouchStart = (e) => { e.preventDefault(); startDrawRef.current(e); };
      const onTouchMove  = (e) => { e.preventDefault(); drawRef.current(e); };
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove',  onTouchMove);
      };
    }
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [theme]);

  // ── Draw handlers ─────────────────────────────────────────────────────────

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e) => {
    setIsDrawing(true);
    setHasSignature(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = theme === 'dark' ? '#ffb4a8' : '#570000';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  startDrawRef.current = startDraw;

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = theme === 'dark' ? '#ffb4a8' : '#570000';
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  drawRef.current = draw;

  const stopDraw = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleAuthorize = async () => {
    if (!agreed || (!hasSignature && !fullName.trim())) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const formData = new FormData();

      // Attach all request fields
      if (requestData) {
        Object.entries(requestData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value);
          }
        });
      }

      // Attach signature image if drawn
      if (hasSignature && canvasRef.current) {
        await new Promise((resolve) => {
          canvasRef.current.toBlob((blob) => {
            if (blob) formData.append('signature_image', blob, 'signature.png');
            resolve();
          }, 'image/png');
        });
      }

      const data = await apiFetch('/requests/create', {
        method: 'POST',
        body: formData,
      });

      setAuthorized(true);
      setTimeout(() => {
        navigate('/dashboard/parents/success', {
          state: { requestId: data?.request?.request_id, fee, docLabel }
        });
      }, 900);
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  const canAuthorize = agreed && (hasSignature || fullName.trim().length >= 2);

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <TopAppBar showBack backTo="/dashboard/parents/new" />

      <main className="flex-1 pt-24 pb-32 px-md flex justify-center">
        <div className="max-w-[800px] w-full flex flex-col gap-lg">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-xs font-label-md text-label-md text-on-surface-variant">
            <span>{t('dashboard')}</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span>{t('requests')}</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary font-bold">{t('review.sign')}</span>
          </nav>

          {/* Title */}
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary">{t('review.sign')}</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
              {t('consent.text')}
            </p>
            {docLabel && (
              <div className="mt-sm inline-flex items-center gap-xs px-sm py-xs bg-primary-fixed/30 rounded-full">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>description</span>
                <span className="font-label-md text-primary">{docLabel} · BZD ${fee}.00</span>
              </div>
            )}
          </div>

          {/* Main Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md md:p-lg flex flex-col gap-md shadow-sm">
            {/* Legal Section */}
            <div className="flex flex-col gap-sm">
              <div className="flex items-center gap-xs text-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                <h3 className="font-label-lg text-label-lg uppercase tracking-widest">{t('legal.acknowledgement')}</h3>
              </div>
              <div className="bg-surface-container-low border border-outline-variant/10 p-sm rounded-lg max-h-48 overflow-y-auto slim-scroll">
                <div className="font-body-sm text-body-sm text-on-surface-variant space-y-sm">
                  <p>{t('legal.text.1')}</p>
                  <p>{t('legal.text.2')}</p>
                  <p>{t('legal.text.3')}</p>
                </div>
              </div>
              <label className="flex items-start gap-sm cursor-pointer py-xs group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-outline text-primary cursor-pointer animate-none"
                />
                <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">
                  {t('legal.agree')}
                </span>
              </label>
            </div>

            <div className="h-px bg-outline-variant/20 w-full" />

            {/* Signature Pad */}
            <div className="flex flex-col gap-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-xs text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>draw</span>
                  <h3 className="font-label-lg text-label-lg uppercase tracking-widest">{t('sig.pad')}</h3>
                </div>
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-xs text-primary hover:bg-surface-container-high px-sm py-base rounded transition-colors font-label-md text-label-md font-semibold"
                >
                  <span className="material-symbols-outlined text-lg">history_edu</span> {t('clear')}
                </button>
              </div>

              <div className="relative w-full bg-surface-container-lowest border-2 border-dashed border-outline-variant/40 rounded-lg overflow-hidden animate-none" style={{ minHeight: '200px', aspectRatio: '2/1' }}>
                <canvas
                  ref={canvasRef}
                  className="signature-pad w-full h-full cursor-crosshair relative z-10 bg-transparent"
                  style={{ touchAction: 'none' }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchEnd={stopDraw}
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface-variant/40 pointer-events-none">
                    <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>edit</span>
                    <span className="font-label-lg text-label-lg">{t('sig.instruction')}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-lg text-label-lg text-on-surface-variant" htmlFor="parent-name">
                  {t('sig.name.label')}
                </label>
                <input
                  id="parent-name"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={t('sig.name.placeholder')}
                  className="w-full border border-outline/30 rounded-lg p-sm font-body-md bg-surface"
                />
              </div>
            </div>

            {/* Error */}
            {submitError && (
              <div className="flex items-center gap-sm px-sm py-xs bg-error-container rounded-lg border border-error/20">
                <span className="material-symbols-outlined text-error">error</span>
                <p className="font-body-sm text-on-error-container">{submitError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-md mt-md">
              <button
                onClick={() => navigate('/dashboard/parents')}
                className="w-full sm:w-auto px-lg py-sm font-label-lg text-label-lg text-primary hover:bg-surface-container-high rounded transition-all font-semibold"
              >
                {t('cancel.request')}
              </button>
              <button
                disabled={!canAuthorize || submitting}
                onClick={handleAuthorize}
                className={`w-full sm:w-auto px-lg py-sm font-label-lg text-label-lg rounded shadow-sm transition-all flex items-center justify-center gap-sm font-semibold
                  ${authorized
                    ? 'bg-green-700 text-white'
                    : 'bg-primary-container text-on-primary-container hover:brightness-110 disabled:opacity-40'
                  }`}
              >
                {submitting ? (
                  <><span className="material-symbols-outlined animate-spin">sync</span> {t('processing.verification')}</>
                ) : authorized ? (
                  <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {t('authorized')}</>
                ) : (
                  <>{t('confirm.authorize')} <span className="material-symbols-outlined">verified</span></>
                )}
              </button>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {[
              { icon: 'info', title: t('processing.time'), body: t('processing.time.desc') },
              { icon: 'security', title: t('secure.transmission'), body: t('secure.transmission.desc') },
            ].map(card => (
              <div key={card.title} className="bg-surface-container border border-outline-variant/20 rounded-lg p-sm flex items-start gap-sm">
                <div className="p-base bg-white dark:bg-surface-container-low rounded border border-outline-variant/10 flex-shrink-0">
                  <span className="material-symbols-outlined text-primary">{card.icon}</span>
                </div>
                <div>
                  <span className="font-label-lg text-label-lg text-primary block">{card.title}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{card.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav variant="parent" />
    </div>
  );
}
