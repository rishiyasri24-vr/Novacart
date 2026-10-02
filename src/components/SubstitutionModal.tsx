/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product } from '../../shared/types.js';
import { useCart } from '../context/CartContext.js';
import { 
  X, 
  ArrowRightLeft, 
  Sparkles, 
  DollarSign, 
  ShieldCheck, 
  Heart, 
  Check, 
  MapPin 
} from 'lucide-react';

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProduct: Product | null;
}

interface SubResult {
  originalProductId: string;
  recommendedProduct: Product | null;
  reason: string;
  estimatedSavings: number;
  healthBenefit: string;
}

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  isOpen,
  onClose,
  targetProduct,
}) => {
  const { cartItems, updateQuantity, removeFromCart, addToCart } = useCart();
  const [reason, setReason] = useState<'cheaper' | 'allergen_free' | 'healthier'>('cheaper');
  const [subResult, setSubResult] = useState<SubResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSwapped, setIsSwapped] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !targetProduct) return;

    let isCancelled = false;
    const fetchSub = async () => {
      setIsLoading(true);
      setIsSwapped(false);
      try {
        const res = await fetch('/api/gemini/substitutions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: targetProduct.id,
            reason,
          }),
        });

        if (res.ok && !isCancelled) {
          const data = await res.json();
          setSubResult(data);
        }
      } catch (err) {
        console.error('Failed to load substitutions:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchSub();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, targetProduct, reason]);

  const handleApplySwap = () => {
    if (!targetProduct || !subResult?.recommendedProduct) return;

    const existingInCart = cartItems.find(i => i.product.id === targetProduct.id);
    const qty = existingInCart ? existingInCart.quantity : 1;

    // Remove old, add new
    removeFromCart(targetProduct.id);
    addToCart(subResult.recommendedProduct, qty, 'catalog');
    setIsSwapped(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (!isOpen || !targetProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Smart Grocery Substitutions">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Smart Grocery Substitution
              </h2>
              <p className="text-xs text-slate-400">
                Swap items for cost optimization, allergen safety, or nutrition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          
          {/* Reason Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setReason('cheaper')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                reason === 'cheaper' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Save Money
            </button>
            <button
              onClick={() => setReason('allergen_free')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                reason === 'allergen_free' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Allergen-Free
            </button>
            <button
              onClick={() => setReason('healthier')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                reason === 'healthier' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" /> Healthier
            </button>
          </div>

          {/* Comparison Cards: Current vs Replacement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Current Item */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Current Cart Item
              </span>
              <div className="flex gap-2.5">
                <img
                  src={targetProduct.imageUrl}
                  alt={targetProduct.name}
                  className="w-12 h-12 rounded-lg object-cover bg-slate-900 shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{targetProduct.name}</h4>
                  <p className="text-[11px] font-mono text-slate-300 font-bold mt-0.5">
                    ${targetProduct.price.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-500">{targetProduct.aisle}</p>
                </div>
              </div>
            </div>

            {/* Recommended Item */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-800/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Recommended Swap
              </span>
              {isLoading ? (
                <div className="py-4 text-center text-xs text-slate-400">Finding best in-stock alternative...</div>
              ) : subResult?.recommendedProduct ? (
                <div className="flex gap-2.5">
                  <img
                    src={subResult.recommendedProduct.imageUrl}
                    alt={subResult.recommendedProduct.name}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-900 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-cyan-200 truncate">
                      {subResult.recommendedProduct.name}
                    </h4>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-[11px] font-mono font-bold text-emerald-400">
                        ${subResult.recommendedProduct.price.toFixed(2)}
                      </span>
                      {subResult.estimatedSavings > 0 && (
                        <span className="text-[10px] text-emerald-300 font-semibold">
                          (Save ${subResult.estimatedSavings.toFixed(2)})
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-cyan-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {subResult.recommendedProduct.aisle}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500">
                  No alternative found in this department.
                </div>
              )}
            </div>

          </div>

          {/* AI Rationale */}
          {subResult && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <p className="font-semibold text-slate-200">
                <strong>Recommendation:</strong> {subResult.reason}
              </p>
              <p className="text-slate-400 mt-1">
                {subResult.healthBenefit}
              </p>
            </div>
          )}

          {/* Action */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
            >
              Cancel
            </button>
            {subResult?.recommendedProduct && (
              <button
                onClick={handleApplySwap}
                disabled={isSwapped}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isSwapped ? 'bg-emerald-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30'
                }`}
              >
                {isSwapped ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Swapped Successfully!
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Confirm & Swap Item
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
