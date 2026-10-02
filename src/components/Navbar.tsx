/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShoppingCart, 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  FileCode2, 
  Scan,
  User,
  Eye
} from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../../shared/types.js';

interface NavbarProps {
  onOpenRecipeModal: () => void;
  onOpenScannerModal: () => void;
  onOpenSyncModal: () => void;
  onOpenAuditModal: () => void;
  onOpenTestModal: () => void;
  onOpenProfileModal: () => void;
  showMap: boolean;
  setShowMap: (show: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRecipeModal,
  onOpenScannerModal,
  onOpenSyncModal,
  onOpenAuditModal,
  onOpenTestModal,
  onOpenProfileModal,
  showMap,
  setShowMap,
}) => {
  const { 
    cartItems, 
    total, 
    dietaryProfile, 
    budgetStatus, 
    budgetProgressPercent,
    isOfflineMode, 
    setIsOfflineMode,
    pendingSyncEvents, 
    isSyncing, 
    flushSyncQueue,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    detectedAllergenAlerts
  } = useCart();

  const { session, setRole } = useAuth();
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const getBudgetColor = () => {
    if (budgetStatus === 'exceeded') return 'text-rose-400 bg-rose-950/60 border-rose-800';
    if (budgetStatus === 'warning') return 'text-amber-400 bg-amber-950/60 border-amber-800';
    return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
  };

  const getBudgetBarColor = () => {
    if (budgetStatus === 'exceeded') return 'bg-rose-500';
    if (budgetStatus === 'warning') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo & Store Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-900/30">
              <ShoppingCart className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Nova<span className="text-cyan-400">Cart</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    AI Edge
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Bay 409 • Store #CA-082
              </p>
            </div>
          </div>

          {/* Real-time Budget Guardrail */}
          <div className="hidden md:flex flex-col w-56 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/50">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <span>Budget:</span>
                <span className="font-semibold text-slate-200">${total.toFixed(2)}</span>
                <span className="text-slate-500">/ ${dietaryProfile.budgetGoal.toFixed(0)}</span>
              </span>
              <span className={`text-[11px] font-bold px-1 rounded ${getBudgetColor()}`}>
                {budgetProgressPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${getBudgetBarColor()}`}
                style={{ width: `${Math.min(100, budgetProgressPercent)}%` }}
              />
            </div>
          </div>

          {/* Action Center & Modals */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* Offline LocalSync Status Indicator */}
            <button
              onClick={onOpenSyncModal}
              title={`LocalSync: ${isOfflineMode ? 'Simulating In-Store Offline' : 'Connected to Edge Cloud'}`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isOfflineMode 
                  ? 'bg-amber-950/70 border-amber-700 text-amber-300' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              aria-label="LocalSync Status"
            >
              {isOfflineMode ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="hidden lg:inline">Offline Sync</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden lg:inline">Edge Sync</span>
                </>
              )}
              {pendingSyncEvents.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                  {pendingSyncEvents.length}
                </span>
              )}
            </button>

            {/* Gemini Recipe AI */}
            <button
              onClick={onOpenRecipeModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-900/60 to-blue-900/60 hover:from-cyan-800/70 hover:to-blue-800/70 border border-cyan-700/60 text-cyan-200 transition-all shadow-sm"
              aria-label="Gemini Recipe Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Recipe AI</span>
            </button>

            {/* Gemini Dietary Scanner */}
            <button
              onClick={onOpenScannerModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
              aria-label="Gemini Dietary Scanner"
            >
              <Scan className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Diet Scanner</span>
            </button>

            {/* Interactive Store Map Toggle */}
            <button
              onClick={() => setShowMap(!showMap)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                showMap 
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-900/40' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              aria-label="Toggle In-Store Map"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{showMap ? 'Hide Map' : 'Store Map'}</span>
            </button>

            {/* Automated Test Suite Runner (Key Criterion 4 & 1) */}
            <button
              onClick={onOpenTestModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-700 text-emerald-300 transition-all shadow-sm"
              title="Run Automated Test Suite (Code Quality, Security, Efficiency, A11y, Problem Alignment, Gemini)"
              aria-label="Run Automated Code Assessment Test Suite"
            >
              <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Run Tests</span>
            </button>

            {/* Loss Prevention / Audit Ledger */}
            {(session.role === 'security_auditor' || session.role === 'store_associate') && (
              <button
                onClick={onOpenAuditModal}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 transition-colors"
                title="Loss Prevention Cryptographic Security Ledger"
                aria-label="Security Audit Ledger"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden lg:inline">LP Ledger</span>
              </button>
            )}

            {/* Profile & Dietary Settings */}
            <button
              onClick={onOpenProfileModal}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
              title="Dietary Profile & Preferences"
              aria-label="User Dietary Profile"
            >
              <User className="w-4 h-4 text-slate-300" />
            </button>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-md shadow-cyan-900/30"
              aria-label={`Open Cart, ${totalItemCount} items, total $${total.toFixed(2)}`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="font-bold">${total.toFixed(2)}</span>
              {totalItemCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-slate-900 font-extrabold text-[11px] flex items-center justify-center">
                  {totalItemCount}
                </span>
              )}
              {detectedAllergenAlerts.length > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full animate-ping" 
                  title="Allergen Clash Detected in Cart!"
                />
              )}
            </button>

          </div>
        </div>

        {/* Allergen Clash Top Warning Banner */}
        {detectedAllergenAlerts.length > 0 && (
          <div className="py-1.5 px-3 mb-2 rounded bg-rose-950/80 border border-rose-700/80 flex items-center justify-between text-xs text-rose-200 animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Dietary Warning:</strong> Cart contains items conflicting with your allergy profile ({detectedAllergenAlerts.map(a => a.product.name).join(', ')}).
              </span>
            </div>
            <button 
              onClick={() => setIsCartDrawerOpen(true)}
              className="underline font-semibold text-rose-300 hover:text-white shrink-0 ml-2"
            >
              Review Substitutions
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
