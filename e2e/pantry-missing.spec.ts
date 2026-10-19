import {test,expect} from '@playwright/test';

test('missing ingredients can be marked directly, reach 100% and persist without selecting other items',async({page,request})=>{
 const catalog=await(await request.get('/api/catalog')).json();const recipe=catalog.recipes.find((r:any)=>r.id==='tekwan-contoh');const missing=['merica','kaldu','bawang-goreng'];const owned=recipe.ingredients.filter((i:any)=>!missing.includes(i.ingredientId)).map((i:any)=>i.ingredientId);
 await page.addInitScript(input=>{if(!localStorage.getItem('rn:wizard'))localStorage.setItem('rn:wizard',JSON.stringify({version:1,input}));},{regionId:'palembang',dishType:'berkuah',mainIngredientId:'tenggiri',ingredientIds:owned});
 await page.goto('/cari');const card=page.locator('.live-match[data-recipe-id="tekwan-contoh"]');await expect(card.locator('[data-score]')).toHaveAttribute('data-score','82');
 await card.getByText('Masih perlu 3 bahan',{exact:true}).click();
 await expect(card.locator('.missing-ingredients')).toContainText('Merica');
 await expect(card.getByRole('checkbox')).toHaveCount(0);
 await card.getByRole('link',{name:'Lihat di daftar bahan'}).click();
 const list=page.getByRole('region',{name:'Daftar bahan',exact:true});await expect(list.getByRole('checkbox')).toHaveCount(3);
 await list.getByRole('checkbox',{name:'Merica',exact:true}).click();
 await expect(list.getByRole('checkbox')).toHaveCount(2);
 await expect(card.locator('[data-score]')).not.toHaveAttribute('data-score','100');
 await list.getByRole('checkbox',{name:'Kaldu bubuk',exact:true}).click();
 await list.getByRole('checkbox',{name:'Bawang goreng',exact:true}).click();
 await expect(card.locator('[data-score]')).toHaveAttribute('data-score','100');
 await page.reload();await expect(card.locator('[data-score]')).toHaveAttribute('data-score','100');
});
