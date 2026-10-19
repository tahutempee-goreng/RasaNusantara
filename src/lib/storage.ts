import { z } from 'zod';
import { matchInputSchema } from './schema';
export const wizardSchema = z.object({ version: z.literal(1), input: matchInputSchema });
export const cookingSchema = z.object({ version: z.literal(1), recipeId: z.string(), recipeVersion: z.number().int().positive(), step: z.number().int().nonnegative(), done: z.boolean() });
export function readStored<T>(key: string, schema: z.ZodType<T>): T | null { try { const raw = localStorage.getItem(key); return raw ? schema.parse(JSON.parse(raw)) : null; } catch { return null; } }
export function saveStored(key: string, value: unknown): boolean { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
export function clearStored(key: string): boolean { try { localStorage.removeItem(key); return true; } catch { return false; } }
