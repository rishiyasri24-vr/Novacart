/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product } from '../../shared/types.js';
import { useCart } from '../context/CartContext.js';
import { useStoreMap } from '../context/StoreMapContext.js';
import { 
  X, 
  Sparkles, 
  Clock, 
  Users, 
  DollarSign, 
  MapPin, 
  Check, 
  PlusCircle, 
  RefreshCw,
  ChefHat
} from 'lucide-react';

interface RecipeAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

interface RecipeResult {
  recipeName: string;
  servings: number;
  estimatedPrepMinutes: number;
  description: string;
  instructions: string[];
  products: Product[];
  estimatedCost: number;
  provider: string;
}

const PRESET_IDEAS = [
  'Mediterranean Keto Dinner under $25',
  'Organic Avocado & Spinach Power Bowl (Vegan)',
  'High-Protein Salmon & Ancient Quinoa',
  'Artisan Sourdough Bruschetta & Italian Marinara',
];

export const RecipeAssistantModal: React.FC<RecipeAssistantModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const { addToCart } = useCart();
  const { refreshRoute } = useStoreMap();
  const [prompt, setPrompt] = useState<string>('Mediterranean Keto Dinner under $25');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [recipe, setRecipe] = useState<RecipeResult | null>(null);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  const handleGenerate = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || prompt;
    if (!targetPrompt.trim()) return;

    setIsGenerating(true);
    setIsAdded(false);
    try {
      const res = await fetch('/api/gemini/recipe-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: targetPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecipe(data);
      }
    } catch (err) {
      console.error('Recipe generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchAddToCart = () => {
    if (!recipe || !recipe.products) return;

    recipe.products.forEach((p) => {
      addToCart(p, 1, 'recipe_ai');
    });

    setIsAdded(true);
    refreshRoute();
    if (onSuccessToast) {
      onSuccessToast(`Added ${recipe.products.length} recipe ingredients to your cart & updated store route!`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Gemini Recipe Assistant">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-900/30">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Gemini Recipe-to-Cart AI Planner
              </h2>
              <p className="text-xs text-slate-400">
                Plan wholesome meals within your budget and auto-map ingredients to store aisles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close recipe assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6">
          
          {/* Prompt Input Form */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              What would you like to cook? (Specify budget, diet, or cravings):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Quick 20-minute Mediterranean keto dinner under $20"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || !prompt.trim()}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-cyan-900/30 flex items-center gap-2 shrink-0"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Planning...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Plan Meal</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Inspiration Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Quick Ideas:</span>
              {PRESET_IDEAS.map((idea) => (
                <button
                  key={idea}
                  onClick={() => {
                    setPrompt(idea);
                    handleGenerate(idea);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Recipe View */}
          {recipe && (
            <div className="space-y-5 pt-4 border-t border-slate-800">
              
              {/* Recipe Meta Banner */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {recipe.recipeName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {recipe.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase">Prep</span>
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" /> {recipe.estimatedPrepMinutes}m
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase">Cost</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        ${recipe.estimatedCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Matched Store Inventory Items */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Matched In-Store Ingredients ({recipe.products.length}):</span>
                  <span className="text-cyan-400 normal-case font-medium">Mapped to Aisles</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {recipe.products.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-900 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{prod.name}</p>
                          <p className="text-[10px] text-cyan-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Aisle {prod.aisleNumber} ({prod.aisle})
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-200 shrink-0">
                        ${prod.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Chef Instructions:
                </h4>
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  {recipe.instructions.map((step, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Powered by {recipe.provider}
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBatchAddToCart}
                    disabled={isAdded}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-900/30'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" /> Added to Cart & Route Mapped!
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" /> Add All to Cart & Map Route (${recipe.estimatedCost.toFixed(2)})
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
