/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { SyncEvent, CartItem } from '../../shared/types.js';
import { INITIAL_PRODUCTS } from '../db/productsData.js';

interface CartState {
  cartId: string;
  storeId: string;
  version: number;
  lastSyncTimestamp: number;
  items: CartItem[];
  events: SyncEvent[];
}

// In-memory persistent edge sync store
const cartStore = new Map<string, CartState>();

export function getOrCreateCart(cartId: string, storeId: string = 'STORE-CA-082'): CartState {
  if (!cartStore.has(cartId)) {
    cartStore.set(cartId, {
      cartId,
      storeId,
      version: 0,
      lastSyncTimestamp: Date.now(),
      items: [],
      events: [],
    });
  }
  return cartStore.get(cartId)!;
}

export function computeEventHash(cartId: string, version: number, type: string, payload: unknown): string {
  return crypto
    .createHash('sha256')
    .update(`${cartId}:${version}:${type}:${JSON.stringify(payload)}`)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Reconciles incoming batch of offline events with server-side cart state
 */
export function reconcileSyncBatch(
  cartId: string,
  events: SyncEvent[]
): {
  success: boolean;
  serverVersion: number;
  syncedEventCount: number;
  reconciledItems: CartItem[];
  subtotal: number;
} {
  const cart = getOrCreateCart(cartId);

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  for (const event of sortedEvents) {
    // Check if event already applied to prevent duplicate writes
    const existing = cart.events.find(e => e.id === event.id);
    if (existing) continue;

    cart.version += 1;
    event.version = cart.version;
    event.serverSynced = true;
    cart.events.push(event);

    const { productId, quantity } = event.payload;

    if (event.type === 'ITEM_ADDED' && productId) {
      const product = INITIAL_PRODUCTS.find(p => p.id === productId);
      if (product) {
        const existingItem = cart.items.find(i => i.product.id === productId);
        if (existingItem) {
          existingItem.quantity += (quantity || 1);
        } else {
          cart.items.push({
            product,
            quantity: quantity || 1,
            addedAt: event.timestamp,
            scannedVia: 'barcode',
            verifiedWeight: true,
          });
        }
      }
    } else if (event.type === 'ITEM_REMOVED' && productId) {
      cart.items = cart.items.filter(i => i.product.id !== productId);
    } else if (event.type === 'QUANTITY_UPDATED' && productId) {
      const target = cart.items.find(i => i.product.id === productId);
      if (target) {
        if ((quantity || 0) <= 0) {
          cart.items = cart.items.filter(i => i.product.id !== productId);
        } else {
          target.quantity = quantity || 1;
        }
      }
    }
  }

  cart.lastSyncTimestamp = Date.now();
  const subtotal = Number(cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2));

  return {
    success: true,
    serverVersion: cart.version,
    syncedEventCount: sortedEvents.length,
    reconciledItems: cart.items,
    subtotal,
  };
}

export function getCartState(cartId: string): CartState {
  return getOrCreateCart(cartId);
}

export function resetCartState(cartId: string): void {
  cartStore.delete(cartId);
}
