/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCart } from '../context/CartContext.js';
import { DigitalReceipt } from '../../shared/types.js';
import { 
  X, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  QrCode, 
  Download, 
  ArrowRight, 
  Lock, 
  ShoppingBag,
  Sparkles
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompletedReceipt: (receipt: DigitalReceipt) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onCompletedReceipt,
}) => {
  const { cartItems, subtotal, tax, total, estimatedSavings, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<string>('Apple Pay / Contactless Smart Cart');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<DigitalReceipt | null>(null);

  const handleExecuteCheckout = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: 'CART-BAY-409',
          items: cartItems,
          paymentMethod,
        }),
      });

      if (response.ok) {
        const generatedReceipt: DigitalReceipt = await response.json();
        setReceipt(generatedReceipt);
        onCompletedReceipt(generatedReceipt);
        clearCart();
      }
    } catch (err) {
      console.error('Checkout failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Autonomous Checkout">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Autonomous Tap-and-Go Checkout
              </h2>
              <p className="text-xs text-slate-400">
                Server-side verified pricing & cryptographic exit pass
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

        {/* Content */}
        <div className="p-5 space-y-5">
          {!receipt ? (
            <>
              {/* Cart Summary */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Authoritative Order Review ({cartItems.length} items)
                </span>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-800/80 pr-1 text-xs">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="py-2 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-white truncate">{item.product.name}</p>
                        <p className="text-[10px] text-slate-400">Qty: {item.quantity} × ${item.product.price.toFixed(2)}</p>
                      </div>
                      <span className="font-mono text-slate-200 font-bold">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-1 text-xs">
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
                    <span>Sales Tax (8.25%)</span>
                    <span className="font-mono text-slate-200">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-1">
                    <span>Total Charged</span>
                    <span className="font-mono text-cyan-400 text-base">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Select Contactless Payment Method:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Apple Pay / Contactless', 'Google Pay Instant', 'NovaCart Smart Wallet', 'Credit / Debit Card'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-xl border text-left font-semibold transition-colors flex items-center gap-2 ${
                        paymentMethod === method
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Assurance */}
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>End-to-end encrypted token. No credit card details stored on cart.</span>
              </div>

              {/* Pay Button */}
              <button
                onClick={handleExecuteCheckout}
                disabled={isProcessing || cartItems.length === 0}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all"
              >
                {isProcessing ? (
                  <span>Securing & Authorizing Payment...</span>
                ) : (
                  <>
                    <span>Confirm & Pay ${total.toFixed(2)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </>
          ) : (
            /* Digital Receipt & Exit Pass View */
            <div className="space-y-5 text-center">
              
              <div className="w-14 h-14 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Payment Authorized!</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Receipt #{receipt.receiptId} • Bay 409
                </p>
              </div>

              {/* Simulated Exit Gate QR Pass */}
              <div className="p-4 rounded-2xl bg-white text-slate-950 text-center max-w-xs mx-auto shadow-2xl">
                <div className="flex items-center justify-center p-3 bg-slate-100 rounded-xl mb-2">
                  <QrCode className="w-36 h-36 text-slate-900" />
                </div>
                <p className="text-[11px] font-black tracking-wider uppercase">
                  STORE EXIT GATE PASS
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5 font-mono truncate">
                  {receipt.antiTheftQrToken}
                </p>
                <p className="text-[9px] text-slate-500 mt-1">
                  Scan at automated exit turnstile to disarm cart sensor
                </p>
              </div>

              {/* Cryptographic Receipt Breakdown */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Store:</span>
                  <span className="text-white">{receipt.storeId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Items:</span>
                  <span className="text-white">{receipt.items.length} validated items</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Paid:</span>
                  <span className="text-emerald-400 font-bold">${receipt.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                  <span>HMAC Signature:</span>
                  <span className="text-cyan-400 truncate max-w-[170px]">{receipt.cryptographicSignature}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
                >
                  Done & Exit Store
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
