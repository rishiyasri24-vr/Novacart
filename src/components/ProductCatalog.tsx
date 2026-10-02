/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Product, DietaryFlag, Allergen } from '../../shared/types.js';
import { useCart } from '../context/CartContext.js';
import { 
  Search, 
  Plus, 
  Minus, 
  AlertTriangle, 
  Sparkles, 
  Check, 
  Filter, 
  MapPin, 
  Flame, 
  Leaf, 
  ShieldAlert,
  ArrowRightLeft
} from 'lucide-react';

interface ProductCatalogProps {
  onScanProduct: (product: Product) => void;
  onOpenSubstitution: (product: Product) => void;
}

const CATEGORIES = [
  'All',
  'Produce',
  'Bakery',
  'Dairy & Eggs',
  'Pantry & Grains',
  'Meat & Seafood',
  'Frozen',
  'Beverages',
  'Snacks',
];

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  onScanProduct,
  onOpenSubstitution,
}) => {
  const { cartItems, addToCart, dietaryProfile } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeDietFilter, setActiveDietFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  // Fetch products from /api/products
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (searchQuery) queryParams.set('q', searchQuery);
        if (selectedCategory !== 'All') queryParams.set('category', selectedCategory);
        if (activeDietFilter !== 'all') queryParams.set('diet', activeDietFilter);

        const res = await fetch(`/api/products?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setProducts(data.products || []);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(loadProducts, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory, activeDietFilter]);

  const handleAdd = (product: Product) => {
    addToCart(product, 1, 'catalog');
    setRecentlyAddedId(product.id);
    setTimeout(() => setRecentlyAddedId(null), 1200);
  };

  const getItemQuantityInCart = (productId: string) => {
    const item = cartItems.find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groceries by name, brand, nutrition, or aisle..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              aria-label="Search catalog groceries"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Dietary Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Diet:
            </span>
            {['all', 'gluten-free', 'vegan', 'keto'].map((diet) => (
              <button
                key={diet}
                onClick={() => setActiveDietFilter(diet)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  activeDietFilter === diet
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {diet === 'all' ? 'All Diets' : diet}
              </button>
            ))}
          </div>
        </div>

        {/* Category Scroll Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-slate-800/80 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 animate-pulse h-72">
              <div className="w-full h-36 bg-slate-800/60 rounded-lg mb-3" />
              <div className="w-3/4 h-4 bg-slate-800 rounded mb-2" />
              <div className="w-1/2 h-3 bg-slate-800 rounded mb-4" />
              <div className="w-full h-8 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <p className="text-slate-400 font-medium">No grocery items found matching your filters.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setActiveDietFilter('all'); }}
            className="mt-3 px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700"
          >
            Reset Catalog Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const inCartQty = getItemQuantityInCart(product.id);
            const conflictingAllergens = product.allergens.filter(a => dietaryProfile.allergies.includes(a));
            const hasAllergenClash = conflictingAllergens.length > 0;
            const isJustAdded = recentlyAddedId === product.id;

            return (
              <div
                key={product.id}
                className={`relative flex flex-col justify-between bg-slate-900 border rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:border-slate-700 ${
                  hasAllergenClash 
                    ? 'border-rose-900/80 bg-rose-950/10' 
                    : 'border-slate-800'
                }`}
              >
                {/* Product Image & Badges */}
                <div>
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 mb-3">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Aisle Badge */}
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      Aisle {product.aisleNumber}
                    </div>

                    {/* Eco Score / Weight */}
                    {product.ecoScore && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-md border border-emerald-700 text-[10px] font-bold text-emerald-300">
                        Eco: {product.ecoScore}
                      </div>
                    )}

                    {/* Allergen Warning Banner on Image */}
                    {hasAllergenClash && (
                      <div className="absolute bottom-0 inset-x-0 bg-rose-600/90 backdrop-blur-sm text-white px-2 py-1 text-[11px] font-bold flex items-center gap-1.5 justify-center">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Allergy: {conflictingAllergens.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Brand & Title */}
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    {product.brand}
                  </p>
                  <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 mt-0.5">
                    {product.name}
                  </h3>

                  {/* Dietary Flags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.dietaryFlags.map((flag) => (
                      <span
                        key={flag}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>

                  {/* Macro Nutrients */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-0.5">
                      <Flame className="w-3 h-3 text-amber-500" /> {product.nutrition.calories} kcal
                    </span>
                    <span>•</span>
                    <span>{product.nutrition.proteinGrams}g Protein</span>
                    <span>•</span>
                    <span>{product.nutrition.carbsGrams}g Carbs</span>
                  </div>
                </div>

                {/* Footer: Price, Gemini Scan & Add to Cart */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-white">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs line-through text-slate-500">
                            ${product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">per {product.unit}</span>
                    </div>

                    {/* Gemini Multimodal Analysis Trigger */}
                    <button
                      onClick={() => onScanProduct(product)}
                      title="Analyze with Google Gemini 2.5 Flash"
                      className="p-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      aria-label={`Analyze ${product.name} with Gemini AI`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden sm:inline">AI Scan</span>
                    </button>
                  </div>

                  {/* Add to Cart / Quantity Stepper */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdd(product)}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isJustAdded
                          ? 'bg-emerald-600 text-white'
                          : inCartQty > 0
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/30'
                      }`}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Added to Cart!
                        </>
                      ) : inCartQty > 0 ? (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Add Another (In Cart: {inCartQty})
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Add to Cart
                        </>
                      )}
                    </button>

                    {/* Smart Swap button if allergen detected or to save money */}
                    <button
                      onClick={() => onOpenSubstitution(product)}
                      title="Find Smart Substitute (Cheaper or Allergen-Free)"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                      aria-label={`Find smart substitution for ${product.name}`}
                    >
                      <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
