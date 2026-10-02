/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, OptimizedShoppingRoute, RouteWaypoint, StoreCoordinate } from '../../shared/types.js';
import { STORE_AISLES } from '../db/productsData.js';

const ENTRANCE: StoreCoordinate = { x: 10, y: 10 };
const CHECKOUT: StoreCoordinate = { x: 50, y: 92 };

// Helper Euclidean distance
function calculateDistance(a: StoreCoordinate, b: StoreCoordinate): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Optimizes grocery route using Nearest-Neighbor TSP from store entrance to checkout
 */
export function optimizeShoppingPath(cartItems: { product: Product; quantity: number }[]): OptimizedShoppingRoute {
  if (!cartItems || cartItems.length === 0) {
    return {
      totalEstimatedDistanceMeters: 45,
      estimatedMinutes: 2,
      waypoints: [],
      pathCoordinates: [ENTRANCE, CHECKOUT],
    };
  }

  // Group items by aisle
  const aisleMap = new Map<number, {
    aisleNumber: number;
    aisleName: string;
    coordinate: StoreCoordinate;
    items: { productId: string; productName: string; quantity: number; shelf: string }[];
  }>();

  for (const item of cartItems) {
    const aisleNum = item.product.aisleNumber;
    const aisleMeta = STORE_AISLES.find(a => a.number === aisleNum) || {
      number: aisleNum,
      name: item.product.aisle,
      coordinate: item.product.coordinates,
    };

    if (!aisleMap.has(aisleNum)) {
      aisleMap.set(aisleNum, {
        aisleNumber: aisleNum,
        aisleName: aisleMeta.name,
        coordinate: aisleMeta.coordinate,
        items: [],
      });
    }

    aisleMap.get(aisleNum)!.items.push({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      shelf: item.product.shelfSection,
    });
  }

  // Nearest neighbor ordering
  const unvisited = Array.from(aisleMap.values());
  const orderedAisles: typeof unvisited = [];
  let currentCoord = ENTRANCE;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = calculateDistance(currentCoord, unvisited[0].coordinate);

    for (let i = 1; i < unvisited.length; i++) {
      const dist = calculateDistance(currentCoord, unvisited[i].coordinate);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    const nextAisle = unvisited.splice(nearestIndex, 1)[0];
    orderedAisles.push(nextAisle);
    currentCoord = nextAisle.coordinate;
  }

  // Build waypoints
  const waypoints: RouteWaypoint[] = orderedAisles.map((aisle, idx) => ({
    stepNumber: idx + 1,
    aisleNumber: aisle.aisleNumber,
    aisleName: aisle.aisleName,
    coordinates: aisle.coordinate,
    productsToPick: aisle.items,
    isCompleted: false,
  }));

  // Build path coordinates: Entrance -> Waypoints -> Checkout
  const pathCoordinates: StoreCoordinate[] = [
    ENTRANCE,
    ...waypoints.map(w => w.coordinates),
    CHECKOUT,
  ];

  // Calculate cumulative real-world meters (assume 1% = 1.2 meters in store)
  let totalDistPercent = 0;
  for (let i = 0; i < pathCoordinates.length - 1; i++) {
    totalDistPercent += calculateDistance(pathCoordinates[i], pathCoordinates[i + 1]);
  }

  const totalEstimatedDistanceMeters = Math.round(totalDistPercent * 1.35);
  // Average walking speed 1 m/s + 40 seconds picking time per aisle
  const estimatedMinutes = Math.max(2, Math.round((totalEstimatedDistanceMeters / 60) + (waypoints.length * 0.75)));

  return {
    totalEstimatedDistanceMeters,
    estimatedMinutes,
    waypoints,
    pathCoordinates,
  };
}
