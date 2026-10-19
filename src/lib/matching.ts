import type { Catalog, MatchInput } from './schema';

export class UnknownIngredientError extends Error {}
export function normalizeIngredients(catalog: Pick<Catalog, 'ingredients'>, input: string[]) {
  const aliases = new Map<string, string>();
  for (const ingredient of catalog.ingredients) for (const alias of [ingredient.id, ...ingredient.aliases]) aliases.set(alias.trim().toLowerCase(), ingredient.id);
  return [...new Set(input.map(value => {
    const id = aliases.get(value.trim().toLowerCase());
    if (!id) throw new UnknownIngredientError(`Bahan tidak dikenal: ${value}`);
    return id;
  }))];
}
export function matchRecipes(catalog: Catalog | import('./schema').ClientCatalog, input: MatchInput) {
  const ingredientIds = normalizeIngredients(catalog, input.ingredientIds);
  const pantry = new Set(ingredientIds);
  if (input.mainIngredientId && !catalog.ingredients.some(item => item.id === input.mainIngredientId)) throw new UnknownIngredientError('Pilihan bahan utama tidak dikenal.');
  const candidates = catalog.recipes.filter(recipe => recipe.dishType === input.dishType && (!input.regionId || recipe.regionId === input.regionId) && (!input.mainIngredientId || recipe.mainIngredientId === input.mainIngredientId));
  const results = candidates.map(recipe => {
    const required = recipe.ingredients.filter(item => item.role !== 'optional');
    const weight = (role: string) => role === 'core' ? 3 : 1;
    const denominator = required.reduce((sum, item) => sum + weight(item.role), 0);
    if (!denominator) throw new Error('Katalog resep tidak valid.');
    const missing = required.filter(item => !pantry.has(item.ingredientId));
    const missingCore = missing.filter(item => item.role === 'core');
    const score = missing.length ? Math.min(99, Math.round(100 * required.reduce((sum, item) => sum + (pantry.has(item.ingredientId) ? weight(item.role) : 0), 0) / denominator)) : 100;
    return { recipeId: recipe.id, slug: recipe.slug, score, requiredCount: required.length, matchedRequiredCount: required.length - missing.length, hasAllCore: missingCore.length === 0, matchedIngredientIds: recipe.ingredients.filter(item => pantry.has(item.ingredientId)).map(item => item.ingredientId), missingRequiredIngredientIds: missing.map(item => item.ingredientId), missingCoreIngredientIds: missingCore.map(item => item.ingredientId), optionalIngredientIds: recipe.ingredients.filter(item => item.role === 'optional').map(item => item.ingredientId) };
  }).filter(result => result.score > 0).sort((a, b) => Number(b.hasAllCore) - Number(a.hasAllCore) || b.score - a.score || a.missingRequiredIngredientIds.length - b.missingRequiredIngredientIds.length || a.slug.localeCompare(b.slug, 'en')).slice(0, 3);
  return { catalogVersion: catalog.catalogVersion, results, emptyReason: results.length ? null : candidates.length ? 'zero_match' as const : 'no_candidate' as const };
}
export type MatchResponse = ReturnType<typeof matchRecipes>;
