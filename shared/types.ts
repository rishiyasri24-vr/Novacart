/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DietaryFlag = 
  | 'gluten-free'
  | 'vegan'
  | 'vegetarian'
  | 'dairy-free'
  | 'nut-free'
  | 'keto'
  | 'kosher'
  | 'halal'
  | 'low-sodium'
  | 'sugar-free';

export type Allergen = 
  | 'peanuts'
  | 'tree-nuts'
  | 'dairy'
  | 'eggs'
  | 'wheat'
  | 'soy'
  | 'fish'
  | 'shellfish'
  | 'sesame';

export interface NutritionFacts {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sodiumMg?: number;
}

export interface StoreCoordinate {
  x: number; // 0 to 100 percentage of store floor width
  y: number; // 0 to 100 percentage of store floor height
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'Produce' | 'Dairy & Eggs' | 'Bakery' | 'Pantry & Grains' | 'Meat & Seafood' | 'Frozen' | 'Beverages' | 'Snacks';
  price: number;
  originalPrice?: number;
  unit: string;
  barcode: string;
  imageUrl: string;
  aisle: string; // e.g. "Aisle 1 - Fresh Produce"
  aisleNumber: number;
  shelfSection: string;
  coordinates: StoreCoordinate;
  dietaryFlags: DietaryFlag[];
  allergens: Allergen[];
  nutrition: NutritionFacts;
  inStock: boolean;
  stockCount: number;
  weightGrams: number;
  ecoScore?: 'A' | 'B' | 'C' | 'D';
}

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: number;
  scannedVia: 'barcode' | 'catalog' | 'recipe_ai' | 'voice';
  verifiedWeight: boolean;
  allergenWarningDismissed?: boolean;
}

export interface UserDietaryProfile {
  name: string;
  allergies: Allergen[];
  dietPreferences: DietaryFlag[];
  calorieLimit?: number;
  budgetGoal: number; // in USD
  hardBudgetCap: number; // Strict warning threshold
}

export type UserRole = 'shopper' | 'store_associate' | 'security_auditor';

export interface AuthSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  storeId: string;
  cartId: string;
  token: string;
  expiresAt: number;
}

export interface SyncEvent {
  id: string;
  cartId: string;
  timestamp: number;
  version: number;
  type: 'ITEM_ADDED' | 'ITEM_REMOVED' | 'QUANTITY_UPDATED' | 'BUDGET_CHANGED' | 'CHECKOUT_INITIATED';
  payload: {
    productId?: string;
    productName?: string;
    price?: number;
    quantity?: number;
    budget?: number;
    timestamp?: number;
  };
  clientSynced: boolean;
  serverSynced: boolean;
  hash: string;
}

export interface RouteWaypoint {
  stepNumber: number;
  aisleNumber: number;
  aisleName: string;
  coordinates: StoreCoordinate;
  productsToPick: {
    productId: string;
    productName: string;
    quantity: number;
    shelf: string;
  }[];
  isCompleted: boolean;
}

export interface OptimizedShoppingRoute {
  totalEstimatedDistanceMeters: number;
  estimatedMinutes: number;
  waypoints: RouteWaypoint[];
  pathCoordinates: StoreCoordinate[];
}

export interface SecurityAuditLog {
  id: string;
  timestamp: number;
  actor: string;
  role: UserRole;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'security_alert' | 'critical';
  ipAddress: string;
  integrityHash: string;
}

export interface DigitalReceipt {
  receiptId: string;
  cartId: string;
  storeId: string;
  timestamp: number;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  tax: number;
  savings: number;
  total: number;
  paymentMethod: string;
  cryptographicSignature: string;
  antiTheftQrToken: string;
  verifiedAtExitGate: boolean;
}

export interface TestAssertion {
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
  category: 'Code Quality' | 'Security' | 'Efficiency' | 'Testing' | 'Accessibility' | 'Problem Statement Alignment' | 'Google Services Usage';
}

export interface TestSuiteResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  durationMs: number;
  timestamp: number;
  categories: Record<string, { total: number; passed: number }>;
  assertions: TestAssertion[];
}
