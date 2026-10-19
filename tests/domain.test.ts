import test from 'node:test';
import assert from 'node:assert/strict';
import ingredients from '../src/data/ingredients.json';
import recipes from '../src/data/recipes.json';
import sources from '../src/data/sources.json';
import { catalogSchema, matchInputSchema } from '../src/lib/schema';
import { selectCatalog } from '../src/lib/catalog';
import { matchRecipes, normalizeIngredients } from '../src/lib/matching';
import { cookingSchema, wizardSchema, readStored } from '../src/lib/storage';
import { readJson } from '../src/lib/http';
const catalog = catalogSchema.parse({ schemaVersion: 1, catalogVersion: 'test', ingredients, recipes, sources });
test('only source-checked published recipes appear outside demo mode', () => {
  assert.equal(selectCatalog(catalog, false).recipes.length, 13);
  const raw = structuredClone(catalog); raw.recipes[0].status = 'draft'; raw.recipes[0].review = null;
  assert.equal(selectCatalog(raw, false).recipes.length, 12);
  assert.equal(selectCatalog(raw, true).recipes.length, 13);
});
test('species and flours stay distinct; aliases normalize and duplicates collapse', () => { assert.deepEqual(normalizeIngredients(catalog, [' Tepung sagu ', 'sagu', 'tapioka', 'patin']), ['sagu', 'tapioka', 'patin']); assert.throws(() => normalizeIngredients(catalog, ['ikan sembarang'])); });
test('main ingredient filter does not imply pantry ownership; zero match is empty', () => { const result = matchRecipes(catalog, { dishType: 'berkuah', mainIngredientId: 'tenggiri', ingredientIds: ['sapi'] }); assert.equal(result.results.length, 0); assert.equal(result.emptyReason, 'zero_match'); });
test('every recipe has explainable weighted coverage; 100 means no required ingredient missing', () => {
  for (const recipe of catalog.recipes) {
    const required = recipe.ingredients.filter(item => item.role !== 'optional');
    const input = { regionId: recipe.regionId, dishType: recipe.dishType, mainIngredientId: recipe.mainIngredientId, ingredientIds: required.map(item => item.ingredientId) };
    const complete = matchRecipes(catalog, input).results.find(item => item.recipeId === recipe.id)!;
    assert.equal(complete.score, 100, recipe.id); assert.equal(complete.matchedRequiredCount, required.length); assert.deepEqual(complete.missingRequiredIngredientIds, []);
    const missing = matchRecipes(catalog, {...input, ingredientIds: input.ingredientIds.slice(1)}).results.find(item => item.recipeId === recipe.id)!;
    assert.ok(missing.score < 100, recipe.id); assert.equal(missing.matchedRequiredCount, required.length - 1);
    const withOptional = matchRecipes(catalog, {...input, ingredientIds: recipe.ingredients.map(item => item.ingredientId)}).results.find(item => item.recipeId === recipe.id)!;
    assert.equal(withOptional.score, complete.score);
  }
});
test('all four regions provide both categories and filtering never leaks a different origin', () => {
  for (const regionId of ['palembang', 'padang', 'jawa', 'makassar'] as const) for (const dishType of ['berkuah', 'kering'] as const) {
    const input = { regionId, dishType, mainIngredientId: null, ingredientIds: catalog.ingredients.map(item => item.id) };
    const result = matchRecipes(catalog, input); assert.ok(result.results.length > 0);
    for (const match of result.results) { const recipe = catalog.recipes.find(item => item.id === match.recipeId)!; assert.equal(recipe.regionId,regionId); assert.equal(recipe.dishType,dishType); }
  }
});
test('old pantry data defaults to all regions and accepts more than thirty ingredients', () => {
  const old = { version: 1, input: { dishType: 'berkuah', mainIngredientId: null, ingredientIds: ['tenggiri'] } };
  assert.ok(wizardSchema.safeParse(old).success);
  assert.deepEqual(matchRecipes(catalog, old.input as never), matchRecipes(catalog, {...old.input, regionId: null} as never));
  assert.ok(matchInputSchema.safeParse({...old.input, ingredientIds: catalog.ingredients.map(item => item.id)}).success);
  assert.equal(matchInputSchema.safeParse({...old.input, regionId: 'unknown'}).success, false);
});
test('unreviewed recipe cannot be published and invalid foreign keys are rejected', () => { const raw = structuredClone(catalog); raw.recipes[0].status = 'published'; raw.recipes[0].review = null; assert.equal(catalogSchema.safeParse(raw).success, false); raw.recipes[0].ingredients[0].ingredientId = 'unknown'; assert.equal(catalogSchema.safeParse(raw).success, false); });
test('corrupt or inaccessible storage cannot crash cooking mode', () => { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => '{invalid' } }); assert.equal(readStored('cook', cookingSchema), null); Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => { throw Error('blocked'); } } }); assert.equal(readStored('cook', cookingSchema), null); });
test('request reader rejects oversized and malformed bodies', async () => { await assert.rejects(readJson(new Request('http://localhost', { method: 'POST', body: 'x'.repeat(9000) })), /TOO_LARGE/); await assert.rejects(readJson(new Request('http://localhost', { method: 'POST', body: '{' }))); });


