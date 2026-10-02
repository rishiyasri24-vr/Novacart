/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product } from '../../shared/types.js';
import { useCart } from '../context/CartContext.js';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Plus, 
  Scan,
  RefreshCw,
  HeartPulse
} from 'lucide-react';

interface DietaryScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
}

interface AnalysisState {
  isSafeForUser: boolean;
  allergenWarnings: string[];
  dietaryMatches: string[];
  dietaryConflicts: string[];
  healthScore: number;
  nutritionSummary: string;
  insights: string;
  provider: string;
}

export const DietaryScannerModal: React.FC<DietaryScannerModalProps> = ({
  isOpen,
  onClose,
  initialProduct,
}) => {
  const { dietaryProfile, addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct || null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  // Sync initialProduct
  useEffect(() => {
    if (initialProduct) {
      setSelectedProduct(initialProduct);
    }
  }, [initialProduct]);

  // Load product list for selection dropdown
  useEffect(() => {
    if (isOpen) {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
          if (data.products) {
            setAvailableProducts(data.products);
            if (!selectedProduct && data.products.length > 0) {
              setSelectedProduct(data.products[0]);
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen, selectedProduct]);

  // Trigger Gemini Analysis whenever selectedProduct changes
  useEffect(() => {
    if (!isOpen || !selectedProduct) return;

    let isCancelled = false;
    const runAnalysis = async () => {
      setIsAnalyzing(true);
      setAnalysis(null);
      try {
        const response = await fetch('/api/gemini/analyze-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: selectedProduct.id,
            userAllergies: dietaryProfile.allergies,
            userDiets: dietaryProfile.dietPreferences,
          }),
        });

        if (response.ok && !isCancelled) {
          const result = await response.json();
          setAnalysis(result);
        }
      } catch (err) {
        console.error('Dietary scan failed:', err);
      } finally {
        if (!isCancelled) setIsAnalyzing(false);
      }
    };

    runAnalysis();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, selectedProduct, dietaryProfile.allergies, dietaryProfile.dietPreferences]);

  const handleBarcodeLookup = () => {
    if (!barcodeInput) return;
    const match = availableProducts.find(p => p.barcode === barcodeInput.trim());
    if (match) {
      setSelectedProduct(match);
      setBarcodeInput('');
    } else {
      alert(`No product found with barcode "${barcodeInput}". Try a sample barcode like 01111000101.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Gemini Dietary Allergen Scanner">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-900/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Gemini 2.5 Flash Dietary Scanner
              </h2>
              <p className="text-xs text-slate-400">
                Clinical allergen safety, macronutrient grading, and cross-contact screening
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dietary scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* Product Selector & Simulated Barcode Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Grocery Item:
              </label>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const p = availableProducts.find(item => item.id === e.target.value);
                  if (p) setSelectedProduct(p);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Simulate Hardware Barcode Scan:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="e.g. 01111000101"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleBarcodeLookup}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
                >
                  Scan
                </button>
              </div>
            </div>
          </div>

          {/* Active Product Preview Card */}
          {selectedProduct && (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
              />
              <div className="flex-1 text-center sm:text-left">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  {selectedProduct.brand} • {selectedProduct.aisle}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedProduct.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Barcode: <span className="font-mono text-slate-300">{selectedProduct.barcode}</span> • Weight: {selectedProduct.weightGrams}g
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                  {selectedProduct.dietaryFlags.map(f => (
                    <span key={f} className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {f}
                    </span>
                  ))}
                  {selectedProduct.allergens.map(a => (
                    <span key={a} className="px-2 py-0.5 rounded-md text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                      Contains {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis Result Section */}
          {isAnalyzing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm font-bold text-white">Gemini 2.5 Flash analyzing nutritional chemistry...</p>
              <p className="text-xs text-slate-400">Comparing allergens and dietary flags against your saved profile</p>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              
              {/* Safety Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                analysis.isSafeForUser 
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' 
                  : 'bg-rose-950/50 border-rose-800 text-rose-200'
              }`}>
                {analysis.isSafeForUser ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-bold">
                    {analysis.isSafeForUser ? 'Safe for Consumption' : 'Allergen / Diet Conflict Detected'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    {analysis.isSafeForUser 
                      ? 'No known allergens clash with your active profile. Wholesome nutritional profile.' 
                      : analysis.allergenWarnings.join(' • ') || analysis.dietaryConflicts.join(' • ')}
                  </p>
                </div>
              </div>

              {/* Health Score and Macro Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Health Score Gauge */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center flex flex-col items-center justify-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-cyan-400" /> Health Score
                  </span>
                  <div className="text-3xl font-black text-cyan-400 font-mono">
                    {analysis.healthScore}
                    <span className="text-xs text-slate-500 font-normal">/100</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {analysis.healthScore > 80 ? 'Optimal Choice' : analysis.healthScore > 60 ? 'Moderate' : 'Indulgent'}
                  </span>
                </div>

                {/* Nutrition Summary */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" /> Nutritional Profile
                  </span>
                  <p className="text-xs font-semibold text-slate-200">
                    {analysis.nutritionSummary}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    <strong className="text-cyan-400">Gemini Clinical Insight:</strong> {analysis.insights}
                  </p>
                </div>
              </div>

              {/* Provider Badge */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Model Engine: {analysis.provider}</span>
                <span className="text-cyan-400 font-semibold">Verified via @google/genai SDK</span>
              </div>

            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              Close
            </button>
            {selectedProduct && (
              <button
                onClick={() => {
                  addToCart(selectedProduct, 1, 'barcode');
                  onClose();
                }}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
                  analysis && !analysis.isSafeForUser
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>
                  {analysis && !analysis.isSafeForUser ? 'Add Anyway (Override Alert)' : 'Add to Smart Cart'}
                </span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
