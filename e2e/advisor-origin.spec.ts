import {test,expect} from '@playwright/test';
test('real browser same-origin Advisor POST reaches validation without calling Gemini',async({page})=>{
 await page.goto('/masak/rendang');
 const result=await page.evaluate(async()=>{const response=await fetch('/api/advisor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({recipeId:'rendang',ingredientIds:[],question:''})});return {status:response.status,data:await response.json()};});
 expect(result.status).toBe(400);expect(result.data.error.code).toBe('INVALID_INPUT');
});
test('foreign origin and alternate loopback host are still denied',async({request})=>{
 for(const origin of ['https://foreign.example','http://localhost:3000']){const response=await request.post('/api/advisor',{headers:{Origin:origin},data:{recipeId:'rendang',ingredientIds:[],question:''}});expect(response.status()).toBe(403);expect((await response.json()).error.code).toBe('INVALID_ORIGIN');}
});
