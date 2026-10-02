/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { OptimizedShoppingRoute, StoreCoordinate } from '../../shared/types.js';
import { useCart } from './CartContext.js';

interface StoreAisleInfo {
  number: number;
  name: string;
  category: string;
  coordinate: StoreCoordinate;
}

export const STORE_AISLES_DATA: StoreAisleInfo[] = [
  { number: 1, name: 'Produce', category: 'Produce', coordinate: { x: 20, y: 30 } },
  { number: 2, name: 'Bakery', category: 'Bakery', coordinate: { x: 20, y: 70 } },
  { number: 3, name: 'Dairy', category: 'Dairy & Eggs', coordinate: { x: 45, y: 30 } },
  { number: 4, name: 'Pantry', category: 'Pantry & Grains', coordinate: { x: 45, y: 70 } },
  { number: 5, name: 'Meat & Seafood', category: 'Meat & Seafood', coordinate: { x: 70, y: 30 } },
  { number: 6, name: 'Frozen', category: 'Frozen', coordinate: { x: 70, y: 70 } },
  { number: 7, name: 'Beverages', category: 'Beverages', coordinate: { x: 90, y: 30 } },
  { number: 8, name: 'Snacks', category: 'Snacks', coordinate: { x: 90, y: 70 } },
];

interface StoreMapContextType {
  route: OptimizedShoppingRoute;
  selectedAisle: number | null;
  setSelectedAisle: (aisle: number | null) => void;
  toggleWaypointCompleted: (stepNumber: number) => void;
  isLoadingRoute: boolean;
  activeCartLocation: StoreCoordinate;
  refreshRoute: () => Promise<void>;
}

const DEFAULT_ROUTE: OptimizedShoppingRoute = {
  totalEstimatedDistanceMeters: 45,
  estimatedMinutes: 2,
  waypoints: [],
  pathCoordinates: [{ x: 10, y: 10 }, { x: 50, y: 92 }],
};

const StoreMapContext = createContext<StoreMapContextType | undefined>(undefined);

export const StoreMapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cartItems } = useCart();
  const [route, setRoute] = useState<OptimizedShoppingRoute>(DEFAULT_ROUTE);
  const [selectedAisle, setSelectedAisle] = useState<number | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [activeCartLocation, setActiveCartLocation] = useState<StoreCoordinate>({ x: 10, y: 10 });

  const fetchOptimizedRoute = useCallback(async () => {
    setIsLoadingRoute(true);
    try {
      const response = await fetch('/api/route/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems }),
      });
      if (response.ok) {
        const data: OptimizedShoppingRoute = await response.json();
        setRoute(data);

        // Position cart near first unfinished waypoint or entrance
        if (data.waypoints.length > 0) {
          const firstIncomplete = data.waypoints.find(w => !w.isCompleted);
          if (firstIncomplete) {
            setActiveCartLocation(firstIncomplete.coordinates);
          }
        }
      }
    } catch (err) {
      console.warn('[RouteOptimizer] Using local fallback path:', err);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [cartItems]);

  useEffect(() => {
    fetchOptimizedRoute();
  }, [fetchOptimizedRoute]);

  const toggleWaypointCompleted = (stepNumber: number) => {
    setRoute(prev => {
      const nextWaypoints = prev.waypoints.map(w =>
        w.stepNumber === stepNumber ? { ...w, isCompleted: !w.isCompleted } : w
      );

      const nextPending = nextWaypoints.find(w => !w.isCompleted);
      if (nextPending) {
        setActiveCartLocation(nextPending.coordinates);
      } else {
        setActiveCartLocation({ x: 50, y: 92 }); // at checkout
      }

      return {
        ...prev,
        waypoints: nextWaypoints,
      };
    });
  };

  return (
    <StoreMapContext.Provider
      value={{
        route,
        selectedAisle,
        setSelectedAisle,
        toggleWaypointCompleted,
        isLoadingRoute,
        activeCartLocation,
        refreshRoute: fetchOptimizedRoute,
      }}
    >
      {children}
    </StoreMapContext.Provider>
  );
};

export function useStoreMap() {
  const context = useContext(StoreMapContext);
  if (!context) {
    throw new Error('useStoreMap must be used within a StoreMapProvider');
  }
  return context;
}
