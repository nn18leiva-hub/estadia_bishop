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

  return (
    <div className="flex-grow flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden pb-10">
      
      {/* Page Header */}
      <section className="mb-sm sm:mb-lg">
        <h2 className="font-headline-sm text-headline-sm sm:font-headline-lg sm:text-headline-lg text-primary mb-xs">{t('pricing.mgmt')}</h2>
        <p className="font-body-sm text-body-sm sm:font-body-md sm:text-body-md text-on-surface-variant max-w-2xl">
          {t('pricing.subtitle')}
        </p>
      </section>

      {/* Messages */}
      {successMsg && (
        <div className="p-sm mb-md text-center text-white bg-green-600 rounded border border-outline-variant/10 text-sm font-bold animate-in fade-in duration-300">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-sm mb-md text-center text-error bg-error-container rounded border border-outline-variant/10 text-sm font-bold animate-in fade-in duration-300">
          {errorMsg}
        </div>
      )}

      {/* MOBILE VIEW: Cards (Fixes squished screen issue) */}
      <div className="block md:hidden flex flex-col gap-sm">
        {dataLoading ? (
          <div className="p-xl text-center">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        ) : pricingList.length === 0 ? (
          <div className="p-md bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-center font-body-md text-on-surface-variant">
            {t('no.document.types') || 'No document types registered.'}
          </div>
        ) : (
          pricingList.map(item => {
            const isAuto = item.is_auto_generated || !item.requires_payment;
            const currentValue = priceInputs[item.document_type_id];
            const isUpdating = updatingPriceId === item.document_type_id;

            return (
              <div 
                key={`mob-pr-${item.document_type_id}`}
                className={`bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md shadow-sm flex flex-col gap-sm relative overflow-hidden ${
                  isAuto ? 'border-l-4 border-l-secondary' : 'border-l-4 border-l-primary'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    {t(item.name) || item.name}
                  </h4>
                  <span className={`font-label-md text-label-md px-[6px] py-[2px] rounded uppercase font-bold text-[10px] ${
                    isAuto ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'
                  }`}>
                    {isAuto ? t('auto.generated') || 'Auto' : t('paid.document') || 'Paid'}
                  </span>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  {item.description || '-'}
                </p>

                <div className="flex justify-between items-center border-t border-outline-variant/10 pt-sm mt-xs">
                  <span className="font-label-lg text-on-surface-variant font-semibold">
                    {t('base.price.bzd')}
                  </span>
                  {isAuto ? (
                    <span className="text-secondary font-bold font-headline-sm uppercase">
                      {t('free')}
                    </span>
                  ) : (
                    <div className="flex items-center gap-xs">
                      <span className="text-on-surface-variant font-semibold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.50"
                        className="w-20 px-xs py-[4px] text-right bg-surface border border-outline-variant rounded font-body-md font-semibold"
                        value={currentValue !== undefined ? currentValue : ''}
                        onChange={e => setPriceInputs({ ...priceInputs, [item.document_type_id]: e.target.value })}
                        disabled={isUpdating}
                      />
                    </div>
                  )}
                </div>

                {!isAuto && (
                  <button
                    onClick={() => handleUpdatePrice(item.document_type_id)}
                    className="w-full mt-xs py-[8px] bg-primary text-on-primary font-label-md text-label-md rounded flex items-center justify-center gap-xs font-bold active:scale-95 transition-all disabled:opacity-50"
                    disabled={isUpdating || currentValue === item.base_price}
                  >
                    {isUpdating ? (
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">save</span>
                    )}
                    {t('save')}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP VIEW: Beautiful Grid Table */}
      <div className="hidden md:block bg-surface-container-lowest border border-outline-variant/10 rounded overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-label-lg text-label-lg uppercase tracking-wider">
            <tr>
              <th className="p-md">{t('document.type') || 'Document Type'}</th>
              <th className="p-md">{t('description') || 'Description'}</th>
              <th className="p-md text-right px-lg">{t('base.price.bzd') || 'Base Price (BZD)'}</th>
              <th className="p-md text-center">{t('actions') || 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10 text-body-md text-on-surface">
            {dataLoading ? (
              <tr>
                <td colSpan={4} className="p-xl text-center">
                  <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                </td>
              </tr>
            ) : pricingList.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-xl text-center text-on-surface-variant font-body-md">
                  {t('no.document.types') || 'No document types registered.'}
                </td>
              </tr>
            ) : (
              pricingList.map(item => {
                const isAuto = item.is_auto_generated || !item.requires_payment;
                const currentValue = priceInputs[item.document_type_id];
                const isUpdating = updatingPriceId === item.document_type_id;

                return (
                  <tr key={item.document_type_id} className="hover:bg-surface-container-low/30 transition-colors">
                    {/* Name / Type badge */}
                    <td className="p-md">
                      <strong className="block text-on-surface font-bold text-base mb-xs">
                        {t(item.name) || item.name}
                      </strong>
                      <span className={`font-label-md text-label-md px-[6px] py-[2px] rounded uppercase font-bold text-xs ${
                        isAuto ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'
                      }`}>
                        {isAuto ? t('auto.generated') || 'Auto-generated' : t('paid.document') || 'Paid'}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="p-md text-on-surface-variant text-sm max-w-xs truncate lg:max-w-md">
                      {item.description || '-'}
                    </td>

                    {/* Base Price input */}
                    <td className="p-md text-right px-lg">
                      {isAuto ? (
                        <span className="text-on-surface-variant opacity-60 font-semibold italic">
                          {t('free') || 'FREE'}
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-xs">
                          <span className="text-on-surface-variant font-semibold">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.50"
                            className="w-24 px-xs py-[4px] text-right bg-surface border border-outline-variant rounded hover:border-primary focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none font-body-md font-semibold"
                            value={currentValue !== undefined ? currentValue : ''}
                            onChange={e => setPriceInputs({ ...priceInputs, [item.document_type_id]: e.target.value })}
                            disabled={isUpdating}
                          />
                        </div>
                      )}
                    </td>

                    {/* Action button */}
                    <td className="p-md text-center">
                      {!isAuto && (
                        <button
                          onClick={() => handleUpdatePrice(item.document_type_id)}
                          className="inline-flex items-center gap-xs px-md py-xs bg-primary text-on-primary font-label-md text-label-md rounded border border-outline-variant/20 hover:opacity-90 active:scale-95 transition-all font-bold disabled:opacity-50"
                          disabled={isUpdating || currentValue === item.base_price}
                        >
                          {isUpdating ? (
                            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                          ) : (
                            <span className="material-symbols-outlined text-sm">save</span>
                          )}
                          {t('save')}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
