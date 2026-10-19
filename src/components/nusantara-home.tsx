'use client';
import type { Dispatch, SetStateAction } from 'react';
import type { ClientCatalog, MatchInput } from '@/lib/schema';
import { PantryMatcher } from './pantry-matcher';
export function NusantaraHome({ pantryOnly = false, ...props }: { pantryOnly?: boolean; catalog: ClientCatalog; input: MatchInput; setInput: Dispatch<SetStateAction<MatchInput>>; onSearch: () => void }) {
  return <div id="cari"><PantryMatcher {...props} compact={pantryOnly}/></div>;
}
