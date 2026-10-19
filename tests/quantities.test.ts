import test from 'node:test';
import assert from 'node:assert/strict';
import {getCatalog} from '../src/lib/catalog';
import {practicalQuantity} from '../src/lib/quantities';
import {advisorContext,advisorInputSchema} from '../src/lib/advisor';
import {catalogSchema,type Recipe} from '../src/lib/schema';
import ingredientData from '../src/data/ingredients.json';
import recipeData from '../src/data/recipes.json';
import sourceData from '../src/data/sources.json';
const catalog=getCatalog();
const recipe=catalog.recipes.find(r=>r.title==='Pindang Patin')!;
const item=(id:string)=>recipe.ingredients.find(i=>i.ingredientId===id)!;
test('small spices use sourced edible weights, source amounts and recipe versions remain intact',()=>{
 for(const [id,weight] of [['tekwan-contoh',35],['lenjer-contoh',35],['soto-lamongan',47],['gudeg',47]] as const){const egg=catalog.recipes.find(r=>r.id===id)!.ingredients.find(i=>i.ingredientId==='telur')!;assert.equal(egg.practicalMeasure?.amount,egg.amount*weight);assert.doesNotMatch(egg.practicalMeasure?.preparation||'',/kocok/);}
 assert.equal(item('kemiri').amount,2);assert.equal(item('kemiri').unit,'butir');assert.equal(item('kemiri').practicalMeasure?.amount,5.2);
 assert.equal(practicalQuantity(item('kemiri'),6,6).text,'sekitar 5 gram');assert.equal(practicalQuantity(item('kemiri'),1,6).text,'kurang dari 1 gram');
 assert.equal(practicalQuantity(item('patin'),1,6).text,'1 potong');assert.equal(practicalQuantity(item('patin'),12,6).text,'12 potong');
 for(const r of catalog.recipes)for(const i of r.ingredients)if(i.ingredientId==='pala'){assert.equal(i.practicalMeasure?.amount,i.amount*4.06);assert.deepEqual(i.practicalMeasure?.sourceIds,['nutmeg-kernel-weight']);assert.doesNotMatch(practicalQuantity(i,1,r.servings).preparation||'',/parut/);}
 for(const r of catalog.recipes)for(const ingredient of r.ingredients)if(ingredient.practicalMeasure)for(const id of ingredient.practicalMeasure.sourceIds)assert.ok(catalog.sources.some(s=>s.id===id),id);
});
test('liquids use millilitres below one litre and compact decimal litres for larger amounts',()=>{
 assert.equal(practicalQuantity(item('air'),3,6).text,'750 ml');assert.equal(practicalQuantity(item('air'),4,6).text,'1 liter');assert.equal(practicalQuantity(item('air'),6,6).text,'1,5 liter');assert.equal(practicalQuantity(item('air'),12,6).text,'3 liter');
 const tiny={ingredientId:'air',role:'support',amount:.2,unit:'ml'} as const;assert.equal(practicalQuantity(tiny,1,1).text,'kurang dari 1 ml');
});
test('spoon measures use readable words and smaller tablespoons become teaspoons',()=>{
 assert.equal(practicalQuantity(item('minyak'),1,6).text,'setengah sendok makan');assert.equal(practicalQuantity(item('garam'),1,6).text,'sekitar 1 gram');assert.equal(practicalQuantity(item('gula'),1,6).text,'sekitar 2 gram');
 const teaspoon={ingredientId:'merica',role:'support',amount:1,unit:'sdt'} as const;assert.equal(practicalQuantity(teaspoon,1,6).text,'sekitar seperdelapan sendok teh');
 const tablespoon={ingredientId:'minyak',role:'support',amount:1,unit:'sdm'} as const;assert.equal(practicalQuantity(tablespoon,1,6).text,'setengah sendok teh');assert.equal(practicalQuantity(tablespoon,2,6).text,'1 sendok teh');
});
test('all thirteen recipes and twelve portions produce positive readable quantities and identical current AI context',()=>{
 assert.equal(catalog.recipes.length,13);let checked=0;
 for(const r of catalog.recipes)for(let portions=1;portions<=12;portions++){
  const context=advisorContext(catalog,advisorInputSchema.parse({recipeId:r.id,question:'Takaran berapa?',ingredientIds:[],portions}))!;
  for(const ingredient of r.ingredients){const q=practicalQuantity(ingredient,portions,r.servings);assert.ok(q.text.length>0);assert.doesNotMatch(q.text,/(?:^|\s)0\s+(?:gram|ml|butir|buah|potong)/);assert.doesNotMatch(q.text,/\d+,\d+\s+(?:butir|siung|buah|batang|ekor|lembar|keping|gram|ml)/);assert.deepEqual(context.ingredients.find(i=>i.ingredientId===ingredient.ingredientId)!.practicalQuantity,q);checked++;}
 }
 assert.ok(checked>2000);
});
test('unverified equivalents never invent weights, and invalid metadata references fail catalog validation',()=>{
 const leaf={ingredientId:'daun-salam',role:'support',amount:1,unit:'lembar'} as const;assert.equal(practicalQuantity(leaf,1,2).text,'setengah lembar');assert.deepEqual(practicalQuantity(leaf,1,2).sourceIds,[]);
 assert.equal(practicalQuantity(leaf,3,4).text,'tiga perempat lembar');
 const raw:any=structuredClone({schemaVersion:1,catalogVersion:'test',ingredients:ingredientData,recipes:recipeData,sources:sourceData});const legacy=structuredClone(raw);for(const r of legacy.recipes)for(const i of r.ingredients)delete i.practicalMeasure;assert.equal(catalogSchema.safeParse(legacy).success,true);raw.recipes[0].ingredients[0].practicalMeasure={amount:1,unit:'gram',mode:'always',approximate:true,sourceIds:['not-a-source'],reference:'invalid'} as any;assert.equal(catalogSchema.safeParse(raw).success,false);
 assert.throws(()=>practicalQuantity(item('air'),0,6),/INVALID_QUANTITY_PORTIONS/);
});
