import ingredientData from '@/data/ingredients.json';
import recipeData from '@/data/recipes.json';
import sourceData from '@/data/sources.json';
import { catalogSchema, type Catalog, type ClientCatalog } from './schema';

export function selectCatalog(catalog: Catalog, demo: boolean): ClientCatalog {
  const recipes = catalog.recipes.filter(recipe => demo || recipe.status === 'published').map(({ review, ...recipe }) => recipe);
  const sourceIds = new Set(recipes.flatMap(recipe => [...recipe.sourceIds, ...recipe.culture.sourceIds, ...(recipe.culture.sections||[]).flatMap(section=>section.sourceIds), ...recipe.ingredients.flatMap(item => item.practicalMeasure?.sourceIds || []), ...(recipe.image ? [recipe.image.sourceId] : []), ...recipe.approvedSubstitutions.flatMap(item => item.sourceIds)]));
  return { schemaVersion: 1, catalogVersion: catalog.catalogVersion, mode: recipes.some(recipe => recipe.status === 'draft') ? 'demo' : 'curated', recipes, ingredients: recipes.length ? catalog.ingredients : [], sources: catalog.sources.filter(item => sourceIds.has(item.id)) };
}
export function getCatalog() {
  const catalog = catalogSchema.parse({ schemaVersion: 1, catalogVersion: '2026-10-20-cultural-stories-4', ingredients: ingredientData, recipes: recipeData, sources: sourceData });
  return selectCatalog(catalog, process.env.RASANUSANTARA_DEMO === 'true');
}
