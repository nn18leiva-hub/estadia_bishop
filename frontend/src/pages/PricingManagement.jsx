import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function PricingManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [pricingList, setPricingList] = useState([]);
  const [priceInputs, setPriceInputs] = useState({});
  const [dataLoading, setDataLoading] = useState(true);
  const [updatingPriceId, setUpdatingPriceId] = useState(null);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');



  const loadPricing = async () => {
    setDataLoading(true);
    try {
      const data = await apiFetch('/superadmin/pricing');
      const pricingArray = Array.isArray(data) ? data : [];
      setPricingList(pricingArray);

      const inputs = {};
      pricingArray.forEach(p => {
        inputs[p.document_type_id] = p.base_price;
      });
      setPriceInputs(inputs);
    } catch (err) {
      console.error(err);
      setErrorMsg(t('price.load.fail') || 'Failed to load document pricing.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      loadPricing();
    }
  }, [user]);

  const handleUpdatePrice = async (id) => {
    setUpdatingPriceId(id);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const newPrice = parseFloat(priceInputs[id]);
      if (isNaN(newPrice) || newPrice < 0) {
        throw new Error(t('price.invalid') || 'Invalid price value.');
      }

      await apiFetch(`/superadmin/pricing/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ base_price: newPrice })
      });

      setSuccessMsg(t('price.updated') || 'Price updated successfully!');
      
      // Reload pricing
      const data = await apiFetch('/superadmin/pricing');
      if (Array.isArray(data)) {
        setPricingList(data);
        const inputs = {};
        data.forEach(p => {
          inputs[p.document_type_id] = p.base_price;
        });
        setPriceInputs(inputs);
      }
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || t('price.update.fail') || 'Failed to update price.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setUpdatingPriceId(null);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return null;

  // Custom icon map for document types
  const documentIcons = {
    transcript: 'description',
    enrollment: 'school',
    graduation: 'workspace_premium',
    deans: 'approval_delegation',
    diploma: 'picture_in_picture',
    good_moral: 'verified',
    lateness_form: 'alarm',
    absence_form: 'event_busy',
    other: 'more_horiz'
  };

  return (
    <div className="flex-grow flex flex-col w-full animate-in fade-in duration-300 space-y-md">
      
      {/* Page Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
        <div>
          <p className="text-primary font-bold tracking-wider uppercase text-[10px] sm:text-xs">Financial Adjustments</p>
          <h2 className="font-headline-sm text-headline-sm sm:font-headline-lg sm:text-headline-lg text-primary">{t('pricing.mgmt')}</h2>
          <p className="font-body-sm text-body-sm sm:font-body-md sm:text-body-md text-on-surface-variant max-w-2xl mt-px">
            {t('pricing.subtitle')}
          </p>
        </div>
      </section>

      {/* Messages */}
      {successMsg && (
        <div className="p-sm text-center text-white bg-green-600 rounded-xl border border-outline-variant/10 text-sm font-bold flex items-center justify-center gap-xs shadow-sm animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-sm text-center text-error bg-error-container/30 rounded-xl border border-error/20 text-sm font-bold flex items-center justify-center gap-xs shadow-sm animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Bento Analytics Graph & Documents Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">

        {/* Pricing Items Settings Cards Grid */}
        <div className="lg:col-span-12 space-y-sm">
          
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-sm shadow-sm flex flex-col sm:flex-row gap-xs sm:items-center justify-between">
            <span className="font-label-lg text-label-lg font-bold text-primary flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
              <span>Document Types Fee Settings</span>
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant bg-surface border border-outline-variant/25 px-sm py-[3px] rounded-lg">
              BZD (Belize Dollars)
            </span>
          </div>

          {dataLoading ? (
            <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl flex items-center justify-center p-xl shadow-sm">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
            </div>
          ) : pricingList.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl flex items-center justify-center p-md shadow-sm text-on-surface-variant font-medium">
              {t('no.document.types') || 'No document types registered.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
              {pricingList.map(item => {
                const isAuto = item.is_auto_generated || !item.requires_payment;
                const currentValue = priceInputs[item.document_type_id];
                const isUpdating = updatingPriceId === item.document_type_id;
                const hasChanged = currentValue !== undefined && parseFloat(currentValue) !== parseFloat(item.base_price);
                const documentKey = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const matchedIcon = documentIcons[item.name.toLowerCase()] || documentIcons[documentKey] || 'description';

                return (
                  <div 
                    key={item.document_type_id}
                    className={`bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-sm flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden ${
                      isAuto ? 'border-l-4 border-l-secondary' : 'border-l-4 border-l-primary'
                    }`}
                  >
                    
                    <div className="space-y-sm">
                      {/* Name & Type Badge */}
                      <div className="flex justify-between items-start gap-xs">
                        <div className="flex items-center gap-xs min-w-0">
                          <div className={`p-xs rounded-xl ${isAuto ? 'bg-secondary/5 text-secondary' : 'bg-primary/5 text-primary'} flex-shrink-0 flex`}>
                            <span className="material-symbols-outlined text-[20px]">{matchedIcon}</span>
                          </div>
                          <h4 className="font-label-lg text-label-lg text-on-surface font-bold truncate">
                            {t(item.name) || item.name}
                          </h4>
                        </div>
                        <span className={`font-label-md text-label-md px-sm py-[2px] rounded-lg uppercase font-bold text-[8px] flex-shrink-0 tracking-wider ${
                          isAuto ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'
                        }`}>
                          {isAuto ? t('auto.generated') || 'Auto' : t('paid.document') || 'Paid'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed text-[11px] font-medium opacity-85">
                        {item.description || 'No description catalogued.'}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-md pt-sm border-t border-outline-variant/10 flex items-center justify-between gap-sm">
                      
                      {/* Base Price configuration */}
                      <div className="flex items-center gap-xs">
                        <span className="text-[11px] font-bold text-on-surface-variant opacity-75">Base Price:</span>
                        {isAuto ? (
                          <span className="text-secondary font-bold text-sm uppercase bg-secondary/5 px-sm py-[2px] rounded-lg border border-secondary/15">
                            {t('free') || 'Free'}
                          </span>
                        ) : (
                          <div className="inline-flex items-center bg-surface border border-outline-variant/35 rounded-xl px-xs py-[2px] focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <span className="text-on-surface-variant font-bold text-[13px] opacity-75">$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.50"
                              className="w-16 px-xs py-0 text-right bg-transparent border-none outline-none font-mono text-[14px] font-bold text-on-surface focus:ring-0"
                              value={currentValue !== undefined ? currentValue : ''}
                              onChange={e => setPriceInputs({ ...priceInputs, [item.document_type_id]: e.target.value })}
                              disabled={isUpdating}
                            />
                          </div>
                        )}
                      </div>

                      {/* Save action button */}
                      {!isAuto && (
                        <button
                          onClick={() => handleUpdatePrice(item.document_type_id)}
                          className={`px-sm py-xs text-[11px] rounded-xl font-bold flex items-center justify-center gap-xs shadow-sm active:scale-95 transition-all disabled:opacity-40 ${
                            hasChanged 
                              ? 'bg-primary text-on-primary hover:bg-primary-container' 
                              : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/20'
                          }`}
                          disabled={isUpdating || !hasChanged}
                        >
                          {isUpdating ? (
                            <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                          ) : (
                            <span className="material-symbols-outlined text-xs">save</span>
                          )}
                          <span>{t('save')}</span>
                        </button>
                      )}
                      
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
