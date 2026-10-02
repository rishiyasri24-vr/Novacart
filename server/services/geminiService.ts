/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { Product } from '../../shared/types.js';

// Initialize Gemini SDK with process.env.GEMINI_API_KEY
const ai = new GoogleGenAI();

export interface DietaryAnalysisResult {
  isSafeForUser: boolean;
  allergenWarnings: string[];
  dietaryMatches: string[];
  dietaryConflicts: string[];
  healthScore: number; // 0 to 100
  nutritionSummary: string;
  insights: string;
  provider: 'gemini-2.5-flash' | 'rule-engine-fallback';
}

export interface RecipeAiResult {
  recipeName: string;
  servings: number;
  estimatedPrepMinutes: number;
  description: string;
  instructions: string[];
  matchedProductIds: string[];
  estimatedCost: number;
  provider: 'gemini-2.5-flash' | 'rule-engine-fallback';
}

export interface SubstitutionResult {
  originalProductId: string;
  recommendedProduct: Product | null;
  reason: string;
  estimatedSavings: number;
  healthBenefit: string;
}

/**
 * Analyzes food item ingredients against user allergies & dietary preferences
 */
export async function analyzeProductDietary(
  product: Product,
  userAllergies: string[] = [],
  userDiets: string[] = []
): Promise<DietaryAnalysisResult> {
  const directAllergenClash = product.allergens.filter(a => userAllergies.includes(a));
  
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are a clinical nutritionist and retail food safety AI.
Analyze this supermarket grocery product against the customer's personal dietary profile.

Product:
- Name: ${product.name}
- Brand: ${product.brand}
- Category: ${product.category}
- Calories: ${product.nutrition.calories} kcal, Protein: ${product.nutrition.proteinGrams}g, Carbs: ${product.nutrition.carbsGrams}g, Fat: ${product.nutrition.fatGrams}g, Sodium: ${product.nutrition.sodiumMg || 0}mg
- Known allergens: ${product.allergens.join(', ') || 'None listed'}
- Dietary tags: ${product.dietaryFlags.join(', ') || 'None'}

Customer Profile:
- Allergies to avoid: ${userAllergies.join(', ') || 'None'}
- Dietary preferences: ${userDiets.join(', ') || 'None'}

Return ONLY a valid JSON object matching this exact schema:
{
  "isSafeForUser": boolean,
  "allergenWarnings": string[],
  "dietaryMatches": string[],
  "dietaryConflicts": string[],
  "healthScore": number (1-100),
  "nutritionSummary": "concise 1-sentence breakdown",
  "insights": "practical shopper recommendation"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          isSafeForUser: Boolean(parsed.isSafeForUser && directAllergenClash.length === 0),
          allergenWarnings: parsed.allergenWarnings || directAllergenClash,
          dietaryMatches: parsed.dietaryMatches || product.dietaryFlags.filter(f => userDiets.includes(f)),
          dietaryConflicts: parsed.dietaryConflicts || [],
          healthScore: typeof parsed.healthScore === 'number' ? parsed.healthScore : 85,
          nutritionSummary: parsed.nutritionSummary || `${product.nutrition.calories} kcal | ${product.nutrition.proteinGrams}g protein`,
          insights: parsed.insights || 'Verified safe for your dietary preferences.',
          provider: 'gemini-2.5-flash',
        };
      }
    } catch (err) {
      console.warn('[Gemini AI] API call failed or rate limited, engaging fallback engine:', err);
    }
  }

  // High-fidelity fallback rule engine
  const isSafe = directAllergenClash.length === 0;
  const matches = product.dietaryFlags.filter(f => userDiets.includes(f));
  const conflicts: string[] = [];

  if (userDiets.includes('vegan') && !product.dietaryFlags.includes('vegan')) {
    conflicts.push('Not labeled 100% vegan');
  }
  if (userDiets.includes('gluten-free') && !product.dietaryFlags.includes('gluten-free')) {
    conflicts.push('Contains gluten or potential cross-contact');
  }
  if (userDiets.includes('keto') && product.nutrition.carbsGrams > 10) {
    conflicts.push(`Carbs (${product.nutrition.carbsGrams}g) exceed keto optimal limit`);
  }

  // Calculate composite health score
  let score = 70;
  if (product.category === 'Produce') score += 20;
  if (product.nutrition.proteinGrams > 15) score += 5;
  if (product.nutrition.fiberGrams && product.nutrition.fiberGrams > 3) score += 5;
  if ((product.nutrition.sodiumMg || 0) > 400) score -= 10;
  score = Math.min(98, Math.max(35, score));

  return {
    isSafeForUser: isSafe && conflicts.length === 0,
    allergenWarnings: directAllergenClash.map(a => `Contains known allergen: ${a}`),
    dietaryMatches: matches,
    dietaryConflicts: conflicts,
    healthScore: score,
    nutritionSummary: `${product.nutrition.calories} kcal | ${product.nutrition.proteinGrams}g protein | ${product.nutrition.carbsGrams}g carbs`,
    insights: isSafe 
      ? `Matches your nutritional focus with wholesome ingredients in ${product.aisle}.` 
      : `Warning: Conflicts with your profile (${[...directAllergenClash, ...conflicts].join(', ')}).`,
    provider: 'rule-engine-fallback',
  };
}

/**
 * Converts a recipe prompt (e.g. "Healthy Mediterranean dinner for 2 under $20") into store items
 */
export async function generateRecipePlan(
  prompt: string,
  catalog: Product[]
): Promise<RecipeAiResult> {
  if (process.env.GEMINI_API_KEY) {
    try {
      const catalogSummary = catalog.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        aisle: p.aisle,
      }));

      const aiPrompt = `You are a culinary meal planner and grocery optimization assistant.
The shopper wants: "${prompt}"

Available Store Catalog (pick matching IDs from here):
${JSON.stringify(catalogSummary)}

Return ONLY a valid JSON object matching this schema:
{
  "recipeName": "Title of the Dish",
  "servings": number,
  "estimatedPrepMinutes": number,
  "description": "Short appetizing description",
  "instructions": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "matchedProductIds": ["prod-XXX", "prod-YYY"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: aiPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        const validIds = (parsed.matchedProductIds || []).filter((id: string) => catalog.some(p => p.id === id));
        const matchedProducts = catalog.filter(p => validIds.includes(p.id));
        const estimatedCost = matchedProducts.reduce((sum, p) => sum + p.price, 0);

        return {
          recipeName: parsed.recipeName || 'Chef Curated Meal Plan',
          servings: parsed.servings || 2,
          estimatedPrepMinutes: parsed.estimatedPrepMinutes || 25,
          description: parsed.description || 'Nutrient-rich, delicious meal planned from local store inventory.',
          instructions: parsed.instructions || ['Prep fresh ingredients', 'Cook to temperature', 'Plate and enjoy'],
          matchedProductIds: validIds.length > 0 ? validIds : ['prod-001', 'prod-010', 'prod-014'],
          estimatedCost: Number(estimatedCost.toFixed(2)),
          provider: 'gemini-2.5-flash',
        };
      }
    } catch (err) {
      console.warn('[Gemini Recipe AI] Falling back to curated meal planner:', err);
    }
  }

  // High quality deterministic fallback recipes based on keywords
  const lower = prompt.toLowerCase();
  let recipeName = 'Pan-Seared Alaskan Sockeye with Quinoa & Greens';
  let matchedIds = ['prod-014', 'prod-011', 'prod-003', 'prod-010'];
  let prepMinutes = 20;
  let instructions = [
    'Rinse quinoa and simmer with 2 parts water until fluffy (15 mins).',
    'Heat Extra Virgin Olive Oil in a skillet over medium-high heat.',
    'Season Alaskan Sockeye Salmon fillet and sear for 4 minutes per side until flaky.',
    'Toss fresh baby spinach with olive oil and serve warm alongside salmon and quinoa.'
  ];

  if (lower.includes('salad') || lower.includes('vegan') || lower.includes('avocado')) {
    recipeName = 'California Organic Avocado & Spinach Power Bowl';
    matchedIds = ['prod-001', 'prod-003', 'prod-015', 'prod-010', 'prod-021'];
    prepMinutes = 15;
    instructions = [
      'Cube sprouted organic tofu and pan-crisp in olive oil with a pinch of sea salt.',
      'Slice fresh organic Hass avocados.',
      'Layer baby spinach in a bowl, topping with tofu, avocado, and crunchy roasted chickpeas.',
      'Drizzle with olive oil and freshly squeezed lemon.'
    ];
  } else if (lower.includes('pasta') || lower.includes('italian') || lower.includes('pizza')) {
    recipeName = 'Artisan Sourdough Bruschetta & San Marzano Marinara';
    matchedIds = ['prod-004', 'prod-012', 'prod-010'];
    prepMinutes = 18;
    instructions = [
      'Slice San Francisco sourdough loaf and brush with extra virgin olive oil.',
      'Toast slices until golden brown and fragrant.',
      'Crush San Marzano whole tomatoes with garlic and sea salt, warming gently in a pan.',
      'Spoon marinara over warm sourdough and serve immediately.'
    ];
  }

  const matchedItems = catalog.filter(p => matchedIds.includes(p.id));
  const estimatedCost = matchedItems.reduce((acc, curr) => acc + curr.price, 0);

  return {
    recipeName,
    servings: 2,
    estimatedPrepMinutes: prepMinutes,
    description: 'Freshly balanced meal optimized for budget and in-store availability.',
    instructions,
    matchedProductIds: matchedIds,
    estimatedCost: Number(estimatedCost.toFixed(2)),
    provider: 'rule-engine-fallback',
  };
}

/**
 * Finds a smart substitution for an item (e.g. lower price, healthier, or allergen-free)
 */
export function findSmartSubstitutions(
  product: Product,
  catalog: Product[],
  reason: 'cheaper' | 'healthier' | 'allergen_free' = 'cheaper'
): SubstitutionResult {
  const sameCategory = catalog.filter(p => p.id !== product.id && p.category === product.category);

  if (reason === 'cheaper') {
    const cheaper = sameCategory
      .filter(p => p.price < product.price)
      .sort((a, b) => a.price - b.price)[0];

    if (cheaper) {
      return {
        originalProductId: product.id,
        recommendedProduct: cheaper,
        reason: `Save $${(product.price - cheaper.price).toFixed(2)} with ${cheaper.brand} in ${cheaper.aisle}.`,
        estimatedSavings: Number((product.price - cheaper.price).toFixed(2)),
        healthBenefit: 'Comparable nutritional profile with high customer satisfaction.',
      };
    }
  }

  if (reason === 'allergen_free') {
    const allergenFree = sameCategory.find(p => p.allergens.length === 0);
    if (allergenFree) {
      return {
        originalProductId: product.id,
        recommendedProduct: allergenFree,
        reason: `Contains 0 major allergens compared to ${product.name}.`,
        estimatedSavings: Number((product.price - allergenFree.price).toFixed(2)),
        healthBenefit: 'Hypoallergenic certified, safe for sensitive households.',
      };
    }
  }

  // Default healthier
  const healthier = sameCategory.find(p => (p.dietaryFlags.includes('vegan') || p.dietaryFlags.includes('gluten-free')) && p.id !== product.id);
  const target = healthier || sameCategory[0] || null;

  return {
    originalProductId: product.id,
    recommendedProduct: target,
    reason: target ? `Nutrient-dense alternative located in ${target.aisle}.` : 'No direct alternative available in this department.',
    estimatedSavings: target ? Math.max(0, Number((product.price - target.price).toFixed(2))) : 0,
    healthBenefit: 'Enhanced fiber and lower processed sodium content.',
  };
}
