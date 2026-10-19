export function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { code, message }, requestId: crypto.randomUUID() }, { status });
}
export async function readJson(request: Request, maxBytes = 8192) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('EMPTY');
  let size = 0;
  const parts: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new Error('TOO_LARGE'); }
    parts.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
