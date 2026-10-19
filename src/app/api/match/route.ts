import { getCatalog } from '@/lib/catalog';
import { matchInputSchema } from '@/lib/schema';
import { matchRecipes, UnknownIngredientError } from '@/lib/matching';
import { readJson, errorResponse } from '@/lib/http';
export async function POST(request: Request) {
  try {
    const parsed = matchInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return errorResponse('Pilih daerah, kategori, dan 1–200 bahan yang valid.', 400, 'INVALID_INPUT');
    return Response.json(matchRecipes(getCatalog(), parsed.data));
  } catch (error) {
    if (error instanceof UnknownIngredientError) return errorResponse(error.message, 422, 'UNKNOWN_INGREDIENT');
    if (error instanceof SyntaxError || error instanceof Error && error.message === 'EMPTY') return errorResponse('Format permintaan tidak valid.', 400, 'INVALID_JSON');
    if (error instanceof Error && error.message === 'TOO_LARGE') return errorResponse('Permintaan terlalu besar.', 413, 'BODY_TOO_LARGE');
    return errorResponse('Katalog belum dapat dimuat. Coba lagi.', 500, 'CATALOG_UNAVAILABLE');
  }
}
