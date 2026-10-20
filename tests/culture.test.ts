import test from 'node:test';
import assert from 'node:assert/strict';
import {getCatalog} from '../src/lib/catalog';
import {catalogSchema} from '../src/lib/schema';
import ingredients from '../src/data/ingredients.json';
import recipes from '../src/data/recipes.json';
import sources from '../src/data/sources.json';

test('all thirteen published dishes provide substantial distinct stories with resolvable section references',()=>{
 const catalog=getCatalog();assert.equal(catalog.recipes.length,13);const titles=new Set<string>();
 for(const recipe of catalog.recipes){assert.equal(recipe.culture.sections?.length,3);const text=[recipe.culture.summary,...recipe.culture.sections!.flatMap(s=>s.paragraphs)].join(' ');assert.ok(text.split(/\s+/).length>=180,recipe.id);assert.equal(new Set(recipe.culture.sections!.map(s=>s.title)).size,3);for(const section of recipe.culture.sections!){assert.ok(section.paragraphs.every(p=>p.length>100));for(const id of section.sourceIds)assert.ok(catalog.sources.some(s=>s.id===id),id);}assert.ok(!titles.has(text));titles.add(text);}
});

test('old summaries remain valid while an invalid reference inside an expanded story fails validation',()=>{
 const raw=structuredClone({schemaVersion:1,catalogVersion:'test',ingredients,recipes,sources});for(const r of raw.recipes)delete (r.culture as {sections?:unknown}).sections;assert.equal(catalogSchema.safeParse(raw).success,true);
 const broken=structuredClone({schemaVersion:1,catalogVersion:'test',ingredients,recipes,sources});broken.recipes[0].culture.sections![0].sourceIds=['missing-cultural-source'];assert.equal(catalogSchema.safeParse(broken).success,false);
});
