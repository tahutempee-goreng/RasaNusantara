'use client';
import Link from 'next/link';
import { useId, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { ClientCatalog, MatchInput } from '@/lib/schema';
import { matchRecipes } from '@/lib/matching';
import { regions } from '@/lib/regions';

type Props = { catalog: ClientCatalog; input: MatchInput; setInput: Dispatch<SetStateAction<MatchInput>>; compact?: boolean; onSearch?: () => void };
const views = [{ id: 'utama', label: 'Utama' }, { id: 'bumbu', label: 'Bumbu' }, { id: 'pelengkap', label: 'Pelengkap' }, { id: 'dipilih', label: 'Dipilih' }] as const;
type View = typeof views[number]['id'];
export function PantryMatcher({ catalog, input, setInput, compact = false, onSearch }: Props) {
  const Heading = compact ? 'h2' : 'h1';
  const uid = useId().replaceAll(':', '');
  const resultsId = `hasil-${uid}`;
  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('utama');
  const [missingIds, setMissingIds] = useState<string[] | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const candidates = catalog.recipes.filter(recipe => (!input.regionId || recipe.regionId === input.regionId) && recipe.dishType === input.dishType);
  const relevant = new Set(candidates.flatMap(recipe => recipe.ingredients.map(item => item.ingredientId)));
  const ingredients = catalog.ingredients.filter(item => relevant.has(item.id));
  const selected = catalog.ingredients.filter(item => input.ingredientIds.includes(item.id));
  const query = search.trim().toLocaleLowerCase('id');
  const pool = view === 'dipilih' && !query && !missingIds ? selected : ingredients;
  const shown = pool.filter(item => (!missingIds || missingIds.includes(item.id)) && (missingIds ? !input.ingredientIds.includes(item.id) : query || view === 'dipilih' || item.group === view) && (!query || [item.name, ...item.aliases].some(name => name.toLocaleLowerCase('id').includes(query))));
  const matches = useMemo(() => input.ingredientIds.length ? matchRecipes(catalog, input).results : [], [catalog, input]);
  const selectedCount = ingredients.filter(item => input.ingredientIds.includes(item.id)).length;
  const hiddenCount = input.ingredientIds.length - selectedCount;
  const name = (id: string) => catalog.ingredients.find(item => item.id === id)?.name || id;
  function toggle(id: string) {
    const focused = document.activeElement;
    const controls = Array.from(list.current?.querySelectorAll<HTMLInputElement>('input') || []);
    const index = controls.indexOf(focused as HTMLInputElement);
    setInput(value => ({ ...value, ingredientIds: value.ingredientIds.includes(id) ? value.ingredientIds.filter(item => item !== id) : [...value.ingredientIds, id] }));
    requestAnimationFrame(() => {
      if (index < 0 || focused?.isConnected || document.activeElement !== document.body) return;
      const next = list.current?.querySelectorAll<HTMLInputElement>('input');
      (next?.[Math.min(index, next.length - 1)] || list.current)?.focus({ preventScroll: true });
    });
  }
  function resetList(next: View = 'utama') { setView(next); setSearch(''); setMissingIds(null); if (list.current) list.current.scrollTop = 0; }
  function chooseRegion(regionId: MatchInput['regionId']) { resetList(); setInput(value => ({ ...value, regionId, mainIngredientId: null })); }
  function showMissing(ids: string[]) {
    setMissingIds(ids); setSearch('');
    requestAnimationFrame(() => { if (list.current) { list.current.scrollTop = 0; list.current.focus({ preventScroll: true }); } });
  }
  return <section className={'pantry-preview matcher matcher-paged matcher-scroll' + (compact ? ' matcher-compact' : '')} aria-labelledby={`pantry-title-${uid}`}>
    <div className="section-heading"><div><Heading id={`pantry-title-${uid}`}>{compact ? 'Isi dapurmu, temukan hidangannya.' : 'Hari ini mau masak apa?'}</Heading><p>Pilih daerah dan jenis masakan, lalu tandai isi dapurmu. Hasil langsung mengikuti pilihanmu.</p></div><span className="catalog-note">{catalog.recipes.length} resep · {regions.filter(region => catalog.recipes.some(recipe => recipe.regionId === region.id)).length} pilihan daerah</span></div>
    <div className="pantry-config">
      <fieldset><legend>Daerah yang ingin kamu jelajahi</legend><div className="region-chips"><button className="region-chip" type="button" aria-pressed={!input.regionId} onClick={() => chooseRegion(null)}>Semua daerah</button>{regions.map(region => <button className="region-chip" key={region.id} type="button" aria-pressed={input.regionId === region.id} onClick={() => chooseRegion(region.id)}>{region.name}</button>)}</div></fieldset>
      <fieldset><legend>Jenis masakan</legend><div className="home-dish-types">{(['berkuah', 'kering'] as const).map(type => <label key={type} className={input.dishType === type ? 'dish-selected' : ''}><input type="radio" name={`dish-${uid}`} checked={input.dishType === type} onChange={() => { resetList(); setInput(value => ({ ...value, dishType: type, mainIngredientId: null })); }}/><span><b>{type === 'berkuah' ? 'Berkuah' : 'Kering'}</b><small>{type === 'berkuah' ? 'Sup, soto, dan gulai' : 'Goreng, bakar, atau bersaus'}</small></span></label>)}</div></fieldset>
    </div>
    <div className="pantry-grid"><form className="pantry-form" onSubmit={event => event.preventDefault()} aria-label="Isi dapurmu">
      <fieldset className="ingredient-fieldset"><legend>Bahan yang kamu punya</legend><p className="matcher-help" id={`${uid}-list-help`}>Pilih kategori, lalu gulir daftarnya. Pencarian menjangkau semua kategori, termasuk garam dan air.</p>
        <label className="field">Cari bahan<input type="search" value={search} onChange={event => { setSearch(event.target.value); if (list.current) list.current.scrollTop = 0; }} placeholder="Misalnya ikan, cabai, atau garam"/></label>
        <div className="ingredient-tabs" role="tablist" aria-label="Kategori bahan" onKeyDown={event => {
          const index = views.findIndex(item => `${uid}-tab-${item.id}` === (event.target as HTMLElement).id);
          const next = event.key === 'ArrowRight' ? (index + 1) % views.length : event.key === 'ArrowLeft' ? (index + views.length - 1) % views.length : event.key === 'Home' ? 0 : event.key === 'End' ? views.length - 1 : -1;
          if (next >= 0) { event.preventDefault(); resetList(views[next].id); document.getElementById(`${uid}-tab-${views[next].id}`)?.focus({ preventScroll: true }); }
        }}>{views.map(item => {
          const total = item.id === 'dipilih' ? selected.length : ingredients.filter(ingredient => ingredient.group === item.id).length;
          const count = item.id === 'dipilih' ? selected.length : ingredients.filter(ingredient => ingredient.group === item.id && input.ingredientIds.includes(ingredient.id)).length;
          return <button type="button" role="tab" id={`${uid}-tab-${item.id}`} aria-controls={`${uid}-ingredients`} key={item.id} tabIndex={view === item.id ? 0 : -1} aria-selected={!query && !missingIds && view === item.id} onClick={() => resetList(item.id)}>{item.label}<span>{item.id === 'dipilih' ? count : `${count}/${total}`}</span></button>;
        })}</div>
        {query && <p className="ingredient-list-status">Hasil pencarian di semua kategori</p>}
        {missingIds && <div className="ingredient-search-state"><span>Bahan yang masih kurang untuk resep ini</span><button type="button" onClick={() => resetList()}>Kembali ke kategori</button></div>}
        <div className="ingredient-picker" data-ingredient-scroll="true" ref={list} id={`${uid}-ingredients`} role="region" aria-label="Daftar bahan" aria-describedby={`${uid}-list-help`} tabIndex={0}>
          {shown.length ? <div className="home-ingredients">{shown.map(item => <label key={item.id} data-ingredient-id={item.id} className={input.ingredientIds.includes(item.id) ? 'is-selected' : ''}><input type="checkbox" aria-label={item.name} checked={input.ingredientIds.includes(item.id)} onChange={() => toggle(item.id)}/><span>{item.name}<small>{!relevant.has(item.id) ? 'Tersimpan dari pilihan lain' : item.group === 'utama' ? 'Bahan utama' : item.group === 'bumbu' ? 'Bumbu & rempah' : 'Pelengkap'}</small></span></label>)}</div> : <p className="ingredient-empty">{query ? 'Bahan tidak ditemukan. Coba nama lain.' : view === 'dipilih' ? 'Belum ada bahan dipilih.' : missingIds ? 'Semua bahan pada daftar ini sudah dipilih.' : !candidates.length ? 'Resep untuk pilihan ini belum tersedia. Coba daerah atau jenis masakan lain.' : 'Tidak ada bahan pada kategori ini.'}</p>}
        </div>
        <p className="ingredient-list-status" role="status">{shown.length} bahan ditampilkan · {selectedCount} bahan relevan dipilih</p>
      </fieldset>
      <details className="extra-filter"><summary>Filter tambahan</summary><label className="field">Bahan utama resep<select aria-label="Bahan utama resep" value={input.mainIngredientId || ''} onChange={event => setInput(value => ({ ...value, mainIngredientId: event.target.value || null }))}><option value="">Semua bahan utama</option>{[...new Set(candidates.map(recipe => recipe.mainIngredientId))].filter(Boolean).map(id => <option key={id} value={id!}>{name(id!)}</option>)}</select></label><p>Hanya menyaring resep. Isi dapurmu tetap mengikuti bahan yang kamu tandai.</p></details>
      <div className="pantry-form-actions"><span role="status">{selectedCount} bahan relevan dipilih</span><a className="button" href={'#' + resultsId}>Lihat hasil <span aria-hidden="true">↓</span></a></div>
      {hiddenCount > 0 && <p className="matcher-help pantry-saved">{hiddenCount} bahan dari pilihan lain tetap disimpan. Pilih “Dipilih” untuk meninjaunya.</p>}
      {input.ingredientIds.length > 0 && <button className="clear-pantry" type="button" onClick={() => setInput(value => ({ ...value, ingredientIds: [] }))}>Kosongkan isi dapur</button>}
    </form><aside className="matcher-results" id={resultsId} aria-label="Pratinjau kecocokan resep">
      <div className="results-heading"><h3>Yang bisa kamu masak</h3><p aria-live="polite" aria-atomic="true">{matches.length ? `${matches.length} rekomendasi · ${selectedCount} bahan relevan dipilih` : 'Tandai bahan untuk melihat kecocokan.'}</p></div>
      {matches.length ? matches.slice(0, compact ? 1 : 3).map((result, index) => {
        const recipe = catalog.recipes.find(item => item.id === result.recipeId)!;
        return index > 0 ? <article className="live-match match-alternative" key={recipe.id} data-recipe-id={recipe.id}><div><h3>{recipe.title}</h3><p>{recipe.origin}</p></div><strong data-score={result.score}>{result.score}%</strong><Link href={'/resep/' + recipe.slug} aria-label={'Lihat resep ' + recipe.title}>Lihat resep <span aria-hidden="true">↗</span></Link></article> : <article className="live-match" key={recipe.id} data-recipe-id={recipe.id}><div className="match-topline"><span>PALING DEKAT DENGAN DAPURMU</span><span>{recipe.origin}</span></div><h3>{recipe.title}</h3><p>{recipe.variant}</p>
          <div className="live-score"><strong data-score={result.score}>{result.score}<span>%</span></strong><span>{result.matchedRequiredCount} dari {result.requiredCount}<br/>bahan wajib tersedia</span></div><div className="match-meter" role="img" aria-label={'Kecocokan bahan ' + result.score + ' persen'}><span style={{ width: result.score + '%' }}/></div><div className="match-tags">{result.matchedIngredientIds.slice(0, 4).map(id => <span key={id}>{name(id)}</span>)}{result.matchedIngredientIds.length > 4 && <span>+{result.matchedIngredientIds.length - 4} bahan</span>}</div>
          {result.missingRequiredIngredientIds.length ? <details className="missing-details"><summary>Masih perlu {result.missingRequiredIngredientIds.length} bahan</summary><div className="missing-ingredients"><p>{result.missingRequiredIngredientIds.map(name).join(', ')}</p><a className="missing-list-link" href={'#' + uid + '-ingredients'} onClick={() => showMissing(result.missingRequiredIngredientIds)}>Lihat di daftar bahan <span aria-hidden="true">↖</span></a></div></details> : <p className="missing-ingredients">Semua bahan wajib tersedia. Periksa juga takarannya sebelum memasak.</p>}
          <Link className="match-recipe-link" href={'/resep/' + recipe.slug}>Lihat resep <span aria-hidden="true">↗</span></Link><p className="match-footnote">Persentase berbobot, bukan jumlah bahan: bahan inti dihitung 3×, pendukung 1×. Opsional tidak menambah skor; 100% berarti semua bahan wajib tersedia.</p></article>;
      }) : <div className="live-match matcher-empty"><h3>{input.ingredientIds.length ? 'Belum ada yang cocok.' : 'Ada apa di dapurmu?'}</h3><p>{input.ingredientIds.length ? 'Coba tambah bahan yang relevan atau ubah filter. Isi dapurmu tetap tersimpan ketika berganti daerah.' : 'Tandai bahan yang tersedia. Bahan utama, bumbu, dan pelengkap bisa dipilih dalam satu daftar.'}</p></div>}
      {compact && <div className="matcher-more">{onSearch && matches.length > 0 ? <button type="button" onClick={onSearch}>Lihat semua hasil</button> : <Link href="/cari">Buka pencarian lengkap</Link>}</div>}
    </aside></div>
  </section>;
}
