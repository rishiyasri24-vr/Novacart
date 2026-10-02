/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, CartItem, UserDietaryProfile, SyncEvent, DigitalReceipt, Allergen } from '../../shared/types.js';
import { useAuth } from './AuthContext.js';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, scannedVia?: CartItem['scannedVia']) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  dietaryProfile: UserDietaryProfile;
  updateDietaryProfile: (updates: Partial<UserDietaryProfile>) => void;
  detectedAllergenAlerts: { product: Product; conflictingAllergens: Allergen[] }[];
  dismissAllergenAlert: (productId: string) => void;
  subtotal: number;
  tax: number;
  total: number;
  estimatedSavings: number;
  totalWeightGrams: number;
  budgetStatus: 'safe' | 'warning' | 'exceeded';
  budgetProgressPercent: number;
  isOfflineMode: boolean;
  setIsOfflineMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  pendingSyncEvents: SyncEvent[];
  flushSyncQueue: () => Promise<void>;
  isSyncing: boolean;
  lastSyncedAt: number;
  checkoutReceipt: DigitalReceipt | null;
  setCheckoutReceipt: (receipt: DigitalReceipt | null) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const DEFAULT_DIETARY_PROFILE: UserDietaryProfile = {
  name: 'Sarah',
  allergies: ['peanuts', 'tree-nuts'],
  dietPreferences: ['gluten-free'],
  budgetGoal: 45.0,
  hardBudgetCap: 60.0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(`novacart_items_${session.cartId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [dietaryProfile, setDietaryProfile] = useState<UserDietaryProfile>(() => {
    const saved = localStorage.getItem('novacart_dietary_profile');
    return saved ? JSON.parse(saved) : DEFAULT_DIETARY_PROFILE;
  });

  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [pendingSyncEvents, setPendingSyncEvents] = useState<SyncEvent[]>(() => {
    const saved = localStorage.getItem(`novacart_sync_queue_${session.cartId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(Date.now());
  const [checkoutReceipt, setCheckoutReceipt] = useState<DigitalReceipt | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [dismissedAllergens, setDismissedAllergens] = useState<string[]>([]);

  // Persist cart to local storage
  useEffect(() => {
    localStorage.setItem(`novacart_items_${session.cartId}`, JSON.stringify(cartItems));
  }, [cartItems, session.cartId]);

  useEffect(() => {
    localStorage.setItem('novacart_dietary_profile', JSON.stringify(dietaryProfile));
  }, [dietaryProfile]);

  useEffect(() => {
    localStorage.setItem(`novacart_sync_queue_${session.cartId}`, JSON.stringify(pendingSyncEvents));
  }, [pendingSyncEvents, session.cartId]);

  // Record an offline-first sync event
  const enqueueSyncEvent = useCallback((type: SyncEvent['type'], payload: SyncEvent['payload']) => {
    const event: SyncEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      cartId: session.cartId,
      timestamp: Date.now(),
      version: 0,
      type,
      payload,
      clientSynced: true,
      serverSynced: false,
      hash: `${session.cartId}:${type}:${Date.now()}`,
    };

    setPendingSyncEvents(prev => [...prev, event]);
  }, [session.cartId]);

  // Flush sync queue with server
  const flushSyncQueue = useCallback(async () => {
    if (isOfflineMode || pendingSyncEvents.length === 0 || isSyncing) return;
    setIsSyncing(true);

    try {
      const response = await fetch('/api/sync/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': session.role,
          'x-user-id': session.userId,
        },
        body: JSON.stringify({
          cartId: session.cartId,
          events: pendingSyncEvents,
        }),
      });

      if (response.ok) {
        setPendingSyncEvents([]);
        setLastSyncedAt(Date.now());
      }
    } catch (err) {
      console.warn('[LocalSync] Sync server unreachable, keeping offline events queued:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isOfflineMode, pendingSyncEvents, isSyncing, session.cartId, session.role, session.userId]);

  // Background auto-sync every 8 seconds if online and events are pending
  useEffect(() => {
    if (!isOfflineMode && pendingSyncEvents.length > 0) {
      const timer = setTimeout(() => {
        flushSyncQueue();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOfflineMode, pendingSyncEvents, flushSyncQueue]);

  const addToCart = useCallback((product: Product, quantity = 1, scannedVia: CartItem['scannedVia'] = 'catalog') => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          product,
          quantity,
          addedAt: Date.now(),
          scannedVia,
          verifiedWeight: true,
        },
      ];
    });

    enqueueSyncEvent('ITEM_ADDED', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity,
    });
  }, [enqueueSyncEvent]);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId));
    enqueueSyncEvent('ITEM_REMOVED', { productId });
  }, [enqueueSyncEvent]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prev =>
      prev.map(i => (i.product.id === productId ? { ...i, quantity } : i))
    );

    enqueueSyncEvent('QUANTITY_UPDATED', { productId, quantity });
  }, [removeFromCart, enqueueSyncEvent]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCheckoutReceipt(null);
  }, []);

  const updateDietaryProfile = useCallback((updates: Partial<UserDietaryProfile>) => {
    setDietaryProfile(prev => ({ ...prev, ...updates }));
    enqueueSyncEvent('BUDGET_CHANGED', { budget: updates.budgetGoal });
  }, [enqueueSyncEvent]);

  const dismissAllergenAlert = useCallback((productId: string) => {
    setDismissedAllergens(prev => [...prev, productId]);
  }, []);

  // Allergen clash detector
  const detectedAllergenAlerts = useMemo(() => {
    const alerts: { product: Product; conflictingAllergens: Allergen[] }[] = [];
    for (const item of cartItems) {
      if (dismissedAllergens.includes(item.product.id)) continue;
      const clashes = item.product.allergens.filter(a => dietaryProfile.allergies.includes(a));
      if (clashes.length > 0) {
        alerts.push({ product: item.product, conflictingAllergens: clashes });
      }
    }
    return alerts;
  }, [cartItems, dietaryProfile.allergies, dismissedAllergens]);

  // Financial calculations
  const subtotal = useMemo(() => {
    return Number(cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2));
  }, [cartItems]);

  const estimatedSavings = useMemo(() => {
    return Number(
      cartItems.reduce((acc, item) => {
        const orig = item.product.originalPrice || item.product.price;
        return acc + ((orig - item.product.price) * item.quantity);
      }, 0).toFixed(2)
    );
  }, [cartItems]);

  const tax = useMemo(() => {
    return Number((subtotal * 0.0825).toFixed(2));
  }, [subtotal]);

  const total = useMemo(() => {
    return Number((subtotal + tax).toFixed(2));
  }, [subtotal, tax]);

  const totalWeightGrams = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.product.weightGrams * item.quantity), 0);
  }, [cartItems]);

  // Budget calculations
  const budgetProgressPercent = useMemo(() => {
    if (!dietaryProfile.budgetGoal || dietaryProfile.budgetGoal <= 0) return 0;
    return Math.min(100, Math.round((total / dietaryProfile.budgetGoal) * 100));
  }, [total, dietaryProfile.budgetGoal]);

  const budgetStatus: 'safe' | 'warning' | 'exceeded' = useMemo(() => {
    if (total > dietaryProfile.hardBudgetCap) return 'exceeded';
    if (total >= dietaryProfile.budgetGoal * 0.85) return 'warning';
    return 'safe';
  }, [total, dietaryProfile.hardBudgetCap, dietaryProfile.budgetGoal]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        dietaryProfile,
        updateDietaryProfile,
        detectedAllergenAlerts,
        dismissAllergenAlert,
        subtotal,
        tax,
        total,
        estimatedSavings,
        totalWeightGrams,
        budgetStatus,
        budgetProgressPercent,
        isOfflineMode,
        setIsOfflineMode,
        pendingSyncEvents,
        flushSyncQueue,
        isSyncing,
        lastSyncedAt,
        checkoutReceipt,
        setCheckoutReceipt,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
