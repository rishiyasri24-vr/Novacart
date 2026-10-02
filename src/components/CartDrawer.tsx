/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useCart } from '../context/CartContext.js';
import { Product } from '../../shared/types.js';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  AlertTriangle, 
  ArrowRight, 
  Scale, 
  ShieldCheck, 
  Sparkles,
  ArrowRightLeft,
  ShoppingBag
} from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
  onOpenSubstitution: (product: Product) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onProceedToCheckout,
  onOpenSubstitution,
}) => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    tax,
    total,
    estimatedSavings,
    totalWeightGrams,
    budgetStatus,
    budgetProgressPercent,
    dietaryProfile,
    detectedAllergenAlerts,
    dismissAllergenAlert,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
  } = useCart();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Smart Shopping Cart">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Smart Cart Items</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              </div>
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close smart cart drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Budget Guardrail Meter in Drawer */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Budget Goal:</span>
                <span className="font-bold text-white">${total.toFixed(2)} / ${dietaryProfile.budgetGoal.toFixed(2)}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    budgetStatus === 'exceeded' ? 'bg-rose-500' : budgetStatus === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, budgetProgressPercent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                <span>Hard Cap: ${dietaryProfile.hardBudgetCap.toFixed(2)}</span>
                <span className={`font-semibold ${
                  budgetStatus === 'exceeded' ? 'text-rose-400' : budgetStatus === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {budgetStatus === 'exceeded' ? 'Budget Exceeded' : budgetStatus === 'warning' ? 'Approaching Cap' : 'Within Budget'}
                </span>
              </div>
            </div>

            {/* Scale Load-Cell Anti-Shrinkage Weight */}
            <div className="flex items-center justify-between mt-2.5 px-3 py-1.5 rounded-lg bg-slate-950 text-xs border border-slate-800 text-slate-400">
              <span className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-cyan-400" /> Smart Cart Scale:
              </span>
              <span className="font-mono font-semibold text-slate-200">
                {(totalWeightGrams / 1000).toFixed(2)} kg ({totalWeightGrams}g)
              </span>
            </div>
          </div>

          {/* Allergen Clash Warning in Drawer */}
          {detectedAllergenAlerts.length > 0 && (
            <div className="p-3 mx-4 mt-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs text-rose-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                Allergen Clash Detected!
              </div>
              <p className="text-[11px] text-rose-300">
                Some items clash with your profile ({dietaryProfile.allergies.join(', ')}).
              </p>
              <div className="mt-2 space-y-1">
                {detectedAllergenAlerts.map(alert => (
                  <div key={alert.product.id} className="flex items-center justify-between bg-rose-900/40 p-1.5 rounded">
                    <span className="truncate max-w-[180px] font-medium">{alert.product.name}</span>
                    <button
                      onClick={() => onOpenSubstitution(alert.product)}
                      className="px-2 py-0.5 rounded bg-rose-800 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3 h-3" /> Swap
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-800">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-500">
                <ShoppingBag className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-sm font-bold text-slate-400">Your smart cart is empty</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Scan items or pick from the catalog to populate your cart and view real-time budget and aisle routing.
                </p>
              </div>
            ) : (
              cartItems.map((item) => {
                const isAllergenClash = detectedAllergenAlerts.some(a => a.product.id === item.product.id);
                const itemTotal = Number((item.product.price * item.quantity).toFixed(2));

                return (
                  <div key={item.product.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-white truncate">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Remove item"
                            aria-label={`Remove ${item.product.name} from cart`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          ${item.product.price.toFixed(2)} / {item.product.unit} • {item.product.aisle}
                        </p>

                        {isAllergenClash && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800">
                            Contains {item.product.allergens.join(', ')}
                          </span>
                        )}

                        {/* Quantity and Line Total */}
                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-center border border-slate-700 bg-slate-950 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onOpenSubstitution(item.product)}
                              title="Find alternative item"
                              className="p-1 rounded text-cyan-400 hover:bg-slate-800"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-bold text-white font-mono">
                              ${itemTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/90 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-200">${subtotal.toFixed(2)}</span>
                </div>
                {estimatedSavings > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Promotional Savings</span>
                    <span className="font-mono">-${estimatedSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Tax (8.25%)</span>
                  <span className="font-mono text-slate-200">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Amount</span>
                  <span className="font-mono text-cyan-400 text-base">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Action */}
              <button
                onClick={onProceedToCheckout}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>Autonomous Tap-to-Pay Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={clearCart}
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                >
                  Clear Cart
                </button>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Anti-Shrinkage Verified
                </span>
              </div>
            </div>
          )}

        </aside>
      </div>
    </div>
  );
};
