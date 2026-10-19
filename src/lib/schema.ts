import { z } from 'zod';

export const dishTypeSchema = z.enum(['berkuah', 'kering']);
export const regionSchema = z.enum(['palembang', 'padang', 'jawa', 'makassar']);
export const ingredientSchema = z.object({ id: z.string().min(1), name: z.string().min(1), aliases: z.array(z.string()), group: z.enum(['utama', 'bumbu', 'pelengkap']), allergens: z.array(z.string()) });
export const sourceSchema = z.object({ id: z.string().min(1), title: z.string(), author: z.string(), url: z.url(), accessedAt: z.string(), kind: z.literal('article') });
export const recipeSchema = z.object({
  id: z.string().min(1), slug: z.string().min(1), title: z.string().min(1), variant: z.string(), regionId: regionSchema, origin: z.string().min(1), timeNote: z.string().min(1), adaptationNote: z.string().min(1), dishType: dishTypeSchema, mainIngredientId: z.string().nullable(), servings: z.number().int().positive(), prepMinutes: z.number().nonnegative(), cookMinutes: z.number().nonnegative(), equipment: z.array(z.string()),
  ingredients: z.array(z.object({ ingredientId: z.string(), amount: z.number().positive(), unit: z.string(), role: z.enum(['core', 'support', 'optional']), note: z.string().optional(), practicalMeasure: z.object({ amount: z.number().positive(), unit: z.enum(['gram','ml','potong']), mode: z.enum(['always','fractional']), approximate: z.boolean(), sourceIds: z.array(z.string()).min(1), reference: z.string().min(1), preparation: z.string().optional() }).optional() })).min(1),
  steps: z.array(z.object({ order: z.number().int().positive(), title: z.string(), instruction: z.string(), ingredientIds: z.array(z.string()) })).min(1),
  culture: z.object({ summary: z.string(), sourceIds: z.array(z.string()) }), sourceIds: z.array(z.string()),
  image: z.object({ path: z.string().min(1), alt: z.string().min(1), sourceId: z.string().min(1), license: z.string().min(1) }).nullable(),
  approvedSubstitutions: z.array(z.object({ fromIngredientId: z.string(), toIngredientId: z.string(), explanation: z.string(), adaptation: z.boolean(), sourceIds: z.array(z.string()) })),
  status: z.enum(['draft', 'published']), review: z.object({ reviewer: z.string().min(1), reviewedAt: z.string().min(1) }).nullable(), version: z.number().int().positive(),
});
export const catalogSchema = z.object({ schemaVersion: z.literal(1), catalogVersion: z.string(), ingredients: z.array(ingredientSchema), recipes: z.array(recipeSchema), sources: z.array(sourceSchema) }).superRefine((catalog, context) => {
  const issue = (message: string) => context.addIssue({ code: 'custom', message });
  for (const [name, entries] of [['ingredient', catalog.ingredients], ['recipe', catalog.recipes], ['source', catalog.sources]] as const) {
    if (new Set(entries.map(item => item.id)).size !== entries.length) issue(`Duplicate ${name} ID`);
  }
  if (new Set(catalog.recipes.map(item => item.slug)).size !== catalog.recipes.length) issue('Duplicate slug');
  const ingredients = new Set(catalog.ingredients.map(item => item.id));
  const sources = new Set(catalog.sources.map(item => item.id));
  const aliases = new Map<string, string>();
  for (const ingredient of catalog.ingredients) for (const alias of [ingredient.id, ...ingredient.aliases]) {
    const normalized = alias.trim().toLowerCase();
    if (aliases.has(normalized) && aliases.get(normalized) !== ingredient.id) issue(`Ambiguous alias ${alias}`);
    aliases.set(normalized, ingredient.id);
  }
  for (const recipe of catalog.recipes) {
    const ids = recipe.ingredients.map(item => item.ingredientId);
    const recipeIds = new Set(ids);
    if (recipeIds.size !== ids.length) issue(`Duplicate recipe ingredient: ${recipe.slug}`);
    if (ids.some(id => !ingredients.has(id))) issue(`Unknown ingredient: ${recipe.slug}`);
    if (recipe.mainIngredientId && !recipeIds.has(recipe.mainIngredientId)) issue(`Invalid main ingredient: ${recipe.slug}`);
    if (!recipe.ingredients.some(item => item.role === 'core')) issue(`No core ingredient: ${recipe.slug}`);
    if (recipe.steps.some((step, index) => step.order !== index + 1 || step.ingredientIds.some(id => !recipeIds.has(id)))) issue(`Invalid steps: ${recipe.slug}`);
    const allSources = [...recipe.sourceIds, ...recipe.culture.sourceIds, ...recipe.ingredients.flatMap(item => item.practicalMeasure?.sourceIds || []), ...recipe.approvedSubstitutions.flatMap(item => item.sourceIds), ...(recipe.image ? [recipe.image.sourceId] : [])];
    if (allSources.some(id => !sources.has(id))) issue(`Unknown source: ${recipe.slug}`);
    if (recipe.approvedSubstitutions.some(item => !recipeIds.has(item.fromIngredientId) || !ingredients.has(item.toIngredientId) || !item.sourceIds.length)) issue(`Invalid substitution: ${recipe.slug}`);
    if (recipe.status === 'published' && (!recipe.review || !recipe.culture.summary || !recipe.culture.sourceIds.length || !recipe.sourceIds.length || !recipe.image?.license)) issue(`Incomplete review/provenance: ${recipe.slug}`);
  }
});

export type DishType = z.infer<typeof dishTypeSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type ClientCatalog = Omit<Catalog, 'recipes'> & { mode: 'demo' | 'curated'; recipes: Omit<Recipe, 'review'>[] };
export const matchInputSchema = z.object({ dishType: dishTypeSchema, regionId: regionSchema.nullable().optional(), mainIngredientId: z.string().nullable(), ingredientIds: z.array(z.string().min(1)).min(1).max(200) }).strict();
export type MatchInput = z.infer<typeof matchInputSchema>;
