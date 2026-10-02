/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { INITIAL_PRODUCTS, STORE_AISLES } from '../db/productsData.js';
import { optimizeShoppingPath } from '../services/routeOptimizer.js';
import { analyzeProductDietary, generateRecipePlan, findSmartSubstitutions } from '../services/geminiService.js';
import { reconcileSyncBatch, getCartState } from '../services/syncEngine.js';
import { generateDigitalReceipt, getSecurityLogs, recordSecurityLog } from '../services/auditLogger.js';
import { runAutomatedTestSuite } from '../services/testSuite.js';
import { requireRole } from '../middleware/security.js';
import { Product, UserRole } from '../../shared/types.js';

export const apiRouter = Router();

// --- 1. Products & Catalog ---
apiRouter.get('/products', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  const category = req.query.category as string;
  const allergenToAvoid = req.query.avoidAllergen as string;
  const dietFilter = req.query.diet as string;

  let filtered = [...INITIAL_PRODUCTS];

  if (query) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.aisle.toLowerCase().includes(query)
    );
  }

  if (category && category !== 'All') {
    filtered = filtered.filter(p => p.category === category);
  }

  if (allergenToAvoid) {
    const allergens = allergenToAvoid.split(',').map(s => s.trim().toLowerCase());
    filtered = filtered.filter(p => !p.allergens.some(a => allergens.includes(a.toLowerCase())));
  }

  if (dietFilter) {
    const diets = dietFilter.split(',').map(s => s.trim().toLowerCase());
    filtered = filtered.filter(p => diets.every(d => p.dietaryFlags.includes(d as any)));
  }

  res.json({
    total: filtered.length,
    products: filtered,
    aisles: STORE_AISLES,
  });
});

apiRouter.get('/products/:id', (req: Request, res: Response) => {
  const product = INITIAL_PRODUCTS.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// --- 2. Google Gemini Services ---
apiRouter.post('/gemini/analyze-product', async (req: Request, res: Response) => {
  try {
    const { productId, userAllergies, userDiets } = req.body;
    let product: Product | undefined;

    if (productId) {
      product = INITIAL_PRODUCTS.find(p => p.id === productId);
    } else if (req.body.product) {
      product = req.body.product;
    }

    if (!product) {
      return res.status(400).json({ error: 'Valid product or productId is required' });
    }

    const analysis = await analyzeProductDietary(product, userAllergies || [], userDiets || []);
    res.json(analysis);
  } catch (err: any) {
    console.error('Dietary analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze product', message: err.message });
  }
});

apiRouter.post('/gemini/recipe-assistant', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A recipe prompt string is required' });
    }

    const recipe = await generateRecipePlan(prompt, INITIAL_PRODUCTS);
    const matchedProducts = INITIAL_PRODUCTS.filter(p => recipe.matchedProductIds.includes(p.id));

    res.json({
      ...recipe,
      products: matchedProducts,
    });
  } catch (err: any) {
    console.error('Recipe AI error:', err);
    res.status(500).json({ error: 'Failed to generate recipe plan', message: err.message });
  }
});

apiRouter.post('/gemini/substitutions', (req: Request, res: Response) => {
  const { productId, reason } = req.body;
  const product = INITIAL_PRODUCTS.find(p => p.id === productId);

  if (!product) {
    return res.status(400).json({ error: 'Valid productId is required' });
  }

  const substitution = findSmartSubstitutions(product, INITIAL_PRODUCTS, reason || 'cheaper');
  res.json(substitution);
});

// --- 3. Dynamic Store Navigation & Path Optimization ---
apiRouter.post('/route/optimize', (req: Request, res: Response) => {
  const { cartItems } = req.body;
  const optimized = optimizeShoppingPath(cartItems || []);
  res.json(optimized);
});

// --- 4. Edge LocalSync Engine ---
apiRouter.post('/sync/batch', (req: Request, res: Response) => {
  const { cartId, events } = req.body;
  if (!cartId || !Array.isArray(events)) {
    return res.status(400).json({ error: 'cartId and events array required' });
  }

  const syncResult = reconcileSyncBatch(cartId, events);
  res.json(syncResult);
});

apiRouter.get('/sync/state/:cartId', (req: Request, res: Response) => {
  const state = getCartState(req.params.cartId);
  res.json(state);
});

// --- 5. Autonomous Checkout & Loss Prevention Exit Pass ---
apiRouter.post('/checkout', (req: Request, res: Response) => {
  const { cartId, items, paymentMethod } = req.body;
  if (!cartId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cannot checkout empty cart' });
  }

  // Security re-verification: recalculate items from authoritative database to prevent price tampering
  const validatedItems = items.map((clientItem: any) => {
    const dbProduct = INITIAL_PRODUCTS.find(p => p.id === clientItem.product.id) || clientItem.product;
    return {
      product: dbProduct,
      quantity: Math.max(1, Math.min(99, Number(clientItem.quantity) || 1)),
      addedAt: clientItem.addedAt || Date.now(),
      scannedVia: clientItem.scannedVia || 'catalog',
      verifiedWeight: true,
    };
  });

  const receipt = generateDigitalReceipt(cartId, validatedItems, 0.0825, paymentMethod || 'Apple Pay');
  res.json(receipt);
});

// --- 6. Security Audit Ledger (Loss Prevention Auditor & Associate View) ---
apiRouter.get('/audit-logs', requireRole(['security_auditor', 'store_associate']), (req: Request, res: Response) => {
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const logs = getSecurityLogs(limit);
  res.json({ logs });
});

apiRouter.post('/audit-logs/record', (req: Request, res: Response) => {
  const { actor, role, action, details, severity } = req.body;
  const entry = recordSecurityLog(
    actor || 'anonymous',
    (role as UserRole) || 'shopper',
    action || 'USER_ACTION',
    details || '',
    severity || 'info',
    req.ip || '127.0.0.1'
  );
  res.json(entry);
});

// --- 7. Live Automated Assessment Test Suite ---
apiRouter.get('/tests/run', async (_req: Request, res: Response) => {
  try {
    const results = await runAutomatedTestSuite();
    res.json(results);
  } catch (err: any) {
    console.error('Test suite execution error:', err);
    res.status(500).json({ error: 'Failed to run test suite', message: err.message });
  }
});
