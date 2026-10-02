/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useCart } from '../context/CartContext.js';
import { Allergen, DietaryFlag } from '../../shared/types.js';
import { 
  X, 
  User, 
  ShieldAlert, 
  DollarSign, 
  Check, 
  Sliders, 
  Eye, 
  Type, 
  Contrast 
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALLERGEN_OPTIONS: Allergen[] = [
  'peanuts',
  'tree-nuts',
  'dairy',
  'eggs',
  'wheat',
  'soy',
  'fish',
  'shellfish',
  'sesame',
];

const DIET_OPTIONS: DietaryFlag[] = [
  'gluten-free',
  'vegan',
  'vegetarian',
  'dairy-free',
  'keto',
  'kosher',
  'halal',
  'low-sodium',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { dietaryProfile, updateDietaryProfile } = useCart();
  const [allergies, setAllergies] = useState<Allergen[]>(dietaryProfile.allergies);
  const [diets, setDiets] = useState<DietaryFlag[]>(dietaryProfile.dietPreferences);
  const [budgetGoal, setBudgetGoal] = useState<number>(dietaryProfile.budgetGoal);
  const [hardCap, setHardCap] = useState<number>(dietaryProfile.hardBudgetCap);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return document.body.classList.contains('high-contrast');
  });

  const toggleAllergen = (item: Allergen) => {
    setAllergies(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  const toggleDiet = (item: DietaryFlag) => {
    setDiets(prev =>
      prev.includes(item) ? prev.filter(d => d !== item) : [...prev, item]
    );
  };

  const toggleContrast = () => {
    const nextState = !isHighContrast;
    setIsHighContrast(nextState);
    if (nextState) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  const handleSave = () => {
    updateDietaryProfile({
      allergies,
      dietPreferences: diets,
      budgetGoal: Math.max(10, Number(budgetGoal) || 50),
      hardBudgetCap: Math.max(budgetGoal, Number(hardCap) || 75),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Dietary and Accessibility Profile">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Shopper Dietary & Budget Guardrails
              </h2>
              <p className="text-xs text-slate-400">
                Personalized allergy shielding and spending safety thresholds
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
        <div className="p-5 space-y-6">
          
          {/* Allergens to avoid */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Allergens to Shield Against (Real-time Cart Blocker):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALLERGEN_OPTIONS.map((allergen) => {
                const isSelected = allergies.includes(allergen);
                return (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => toggleAllergen(allergen)}
                    className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-950/70 border-rose-700 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{allergen.replace('-', ' ')}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diets */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Dietary Lifestyle Preferences:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DIET_OPTIONS.map((diet) => {
                const isSelected = diets.includes(diet);
                return (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => toggleDiet(diet)}
                    className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-600 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{diet.replace('-', ' ')}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget Guardrail Inputs */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Smart Budget Guardrails:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Target Shopping Trip Budget ($ USD):
                </span>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  step="5"
                  value={budgetGoal}
                  onChange={(e) => setBudgetGoal(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base font-bold"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Hard Limit / Strict Warning Threshold ($ USD):
                </span>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  step="5"
                  value={hardCap}
                  onChange={(e) => setHardCap(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base font-bold"
                />
              </div>
            </div>
          </div>

          {/* Accessibility Settings */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" />
              Accessibility & Display Controls (WCAG 2.1 AA):
            </label>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">High Contrast Mode</span>
                <span className="text-[11px] text-slate-400">Maximizes luminance ratios for low-vision shoppers</span>
              </div>
              <button
                type="button"
                onClick={toggleContrast}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                  isHighContrast
                    ? 'bg-cyan-600 text-white border-cyan-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Contrast className="w-3.5 h-3.5" />
                <span>{isHighContrast ? 'Enabled' : 'Disabled'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30"
          >
            Save Profile & Guardrails
          </button>
        </div>

      </div>
    </div>
  );
};
