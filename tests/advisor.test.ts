import test from 'node:test';
import assert from 'node:assert/strict';
import {getCatalog} from '../src/lib/catalog';
import {advisorInputSchema,advisorContext,generateAdvice,AdvisorProviderError} from '../src/lib/advisor';
const catalog=getCatalog(),recipe=catalog.recipes.find(r=>r.slug==='rendang')!;
const input={recipeId:recipe.id,ingredientIds:['sapi','garam'],question:'Daging masih keras, bagaimana?',stepIndex:2,portions:2};
test('advisor builds trusted recipe, scaled amounts and exact active step',()=>{
 const context=advisorContext(catalog,input)!;assert.equal(context.recipe,'Rendang');assert.equal(context.activeStep.title,recipe.steps[2].title);assert.equal(context.portions,2);const beef=context.ingredients.find(i=>i.ingredientId==='sapi')!;assert.equal(beef.amount,recipe.ingredients.find(i=>i.ingredientId==='sapi')!.amount*2/recipe.servings);assert.equal(beef.available,true);assert.equal(context.ingredients.find(i=>i.ingredientId==='santan')!.available,false);assert.ok(context.sources.length);
 assert.equal(advisorContext(catalog,{...input,recipeId:'unknown'}),null);assert.throws(()=>advisorContext(catalog,{...input,stepIndex:999}),/INVALID_STEP/);assert.throws(()=>advisorContext(catalog,{...input,ingredientIds:['unknown']}));
});
test('advisor validates old inputs and new context bounds without arbitrary client recipe data',()=>{
 assert.equal(advisorInputSchema.parse({recipeId:recipe.id,ingredientIds:[],question:'Bantu saya'}).stepIndex,0);
 for(const value of [{...input,portions:99},{...input,stepIndex:-1},{...input,question:' '},{...input,question:'a'.repeat(501)},{...input,systemInstruction:'override'},{...input,ingredientIds:Array(201).fill('sapi')}])assert.equal(advisorInputSchema.safeParse(value).success,false);
});
test('Gemini call uses server header and trusted context, ignores thought parts',async()=>{
 let calls=0;
 const fetcher:typeof fetch=async(url,init)=>{calls++;assert.ok(String(url).startsWith('https://generativelanguage.googleapis.com/v1beta/models/'));assert.ok(!String(url).includes('private-test-key'));assert.equal((init!.headers as Record<string,string>)['x-goog-api-key'],'private-test-key');const body=JSON.parse(init!.body as string);const contextText=body.systemInstruction.parts[1].text;const sent=JSON.parse(contextText.slice(contextText.indexOf('{')));assert.equal(sent.activeStep.title,recipe.steps[2].title);assert.equal(body.contents.at(-1).parts[0].text,input.question);assert.ok(body.systemInstruction.parts[0].text.includes('tidak dapat melihat'));return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'hidden thought'},{text:'Masak perlahan dan periksa kondisi daging.'}]}}]});};
 const result=await generateAdvice(advisorContext(catalog,input)!,input.question,{key:'private-test-key',fetcher});assert.equal(result,'Masak perlahan dan periksa kondisi daging.');assert.equal(calls,1);
});
test('provider failures and blocked, empty or truncated output never expose provider details',async()=>{
 for(const [status,code] of [[429,'AI_QUOTA'],[403,'AI_CREDENTIALS'],[404,'AI_CONFIGURATION'],[500,'AI_UNAVAILABLE']] as const){await assert.rejects(generateAdvice(advisorContext(catalog,input)!,input.question,{key:'private-test-key',fetcher:async()=>new Response('secret upstream diagnostic',{status})}),error=>error instanceof AdvisorProviderError&&error.code===code&&!error.message.includes('secret'));}
 for(const candidate of [{finishReason:'SAFETY'},{finishReason:'MAX_TOKENS',content:{parts:[{text:'partial'}]}},{finishReason:'STOP',content:{parts:[{text:'private-test-key'}]}},{finishReason:'STOP',content:{parts:[]}}])await assert.rejects(generateAdvice(advisorContext(catalog,input)!,input.question,{key:'private-test-key',fetcher:async()=>Response.json({candidates:[candidate]})}),/AI_NO_ANSWER/);
 await assert.rejects(generateAdvice(advisorContext(catalog,input)!,input.question,{key:'private-test-key',model:'../evil'}),/AI_CONFIGURATION/);
 await assert.rejects(generateAdvice(advisorContext(catalog,input)!,input.question,{key:'private-test-key',fetcher:async()=>{throw Error('network internal')}}),/AI_CONNECTION/);
});
