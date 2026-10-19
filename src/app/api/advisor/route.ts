import { requestOriginAllowed } from '@/lib/request-origin';
import { getCatalog } from '@/lib/catalog';
import { readJson,errorResponse } from '@/lib/http';
import { UnknownIngredientError } from '@/lib/matching';
import { advisorInputSchema,advisorConfigured,advisorContext,generateAdvice,AdvisorProviderError } from '@/lib/advisor';
export const runtime='nodejs';
export const dynamic='force-dynamic';
let active=0,windowStarted=Date.now(),used=0;
const unavailable=(message:string,code:string,status=503)=>Response.json({status:'degraded',code,message,requestId:crypto.randomUUID()},{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){return Response.json({enabled:advisorConfigured()},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){
 try{
  if(!requestOriginAllowed(request))return errorResponse('Permintaan tidak diizinkan.',403,'INVALID_ORIGIN');
  const parsed=advisorInputSchema.safeParse(await readJson(request,64*1024));
  if(!parsed.success)return errorResponse('Periksa pertanyaan (1–500 karakter), porsi, bahan dan langkah.',400,'INVALID_INPUT');
  const context=advisorContext(getCatalog(),parsed.data);
  if(!context)return errorResponse('Resep tidak tersedia.',404,'RECIPE_NOT_FOUND');
  if(!advisorConfigured())return unavailable('AI Advisor belum tersambung. Bahan dan langkah resep tetap bisa digunakan.','AI_UNAVAILABLE');
  if(Date.now()-windowStarted>600000){windowStarted=Date.now();used=0;}
  if(active>=2||used>=30)return unavailable('Advisor sedang menerima banyak pertanyaan. Coba lagi beberapa saat.','AI_LIMIT',429);
  active++;used++;
  try{
   const answer=await generateAdvice(context,parsed.data.question,{key:process.env.GEMINI_API_KEY!.trim(),model:process.env.GEMINI_MODEL,signal:request.signal,history:parsed.data.history||[]});
   return Response.json({status:'ok',answer,context:{recipeId:context.recipeId,recipe:context.recipe,portions:context.portions,stepIndex:context.stepIndex},sources:context.sources,requestId:crypto.randomUUID()},{headers:{'Cache-Control':'no-store'}});
  }finally{active--;}
 }catch(error){
  if(error instanceof UnknownIngredientError)return errorResponse(error.message,422,'UNKNOWN_INGREDIENT');
  if(error instanceof AdvisorProviderError){const messages:Record<string,string>={AI_QUOTA:'Kuota Gemini sedang habis atau dibatasi. Coba lagi nanti.',AI_CREDENTIALS:'Koneksi Gemini belum berhasil. Pemilik aplikasi perlu memeriksa API key.',AI_CONFIGURATION:'Konfigurasi model Gemini perlu diperiksa oleh pemilik aplikasi.',AI_CONNECTION:'Gemini belum dapat dihubungi atau terlalu lama merespons. Coba lagi.',AI_NO_ANSWER:'AI belum memberikan jawaban lengkap. Coba pertanyaan yang lebih spesifik.'};return unavailable(messages[error.code]||'AI sedang tidak tersedia. Langkah resep tetap bisa digunakan.',error.code);}
  if(error instanceof Error&&error.message==='INVALID_STEP')return errorResponse('Langkah resep tidak valid.',400,'INVALID_STEP');
  if(error instanceof Error&&error.message==='TOO_LARGE')return errorResponse('Permintaan terlalu besar.',413,'BODY_TOO_LARGE');
  if(error instanceof SyntaxError||error instanceof Error&&error.message==='EMPTY')return errorResponse('Format permintaan tidak valid.',400,'INVALID_JSON');
  return unavailable('Advisor belum dapat dimuat. Coba lagi.','AI_UNAVAILABLE');
 }
}
