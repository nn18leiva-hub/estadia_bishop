const STEPS = [
  { label: 'Document', icon: 'description' },
  { label: 'Student', icon: 'person' },
  { label: 'Delivery', icon: 'local_shipping' },
  { label: 'Review', icon: 'fact_check' },
];

export default function Stepper({ currentStep }) {
  // currentStep is 1-indexed
  return (
    <div className="flex items-center w-full max-w-2xl mx-auto">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={step.label} className="flex items-center flex-1">
            {/* Step circle */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all
                  ${isDone
                    ? 'bg-primary border-primary text-on-primary'
                    : isActive
                      ? 'border-primary text-primary bg-primary-fixed'
                      : 'border-outline-variant text-on-surface-variant bg-surface-container-low'
                  }`}
              >
                {isDone ? (
                  <span className="material-symbols-outlined text-[18px]">check</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
                )}
              </div>
              <span
                className={`mt-1 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap
                  ${isActive ? 'text-primary' : isDone ? 'text-primary' : 'text-on-surface-variant'}`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`stepper-line flex-1 ${isDone ? 'active' : ''}`}
                style={{ marginBottom: '18px' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
