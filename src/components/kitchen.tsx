'use client';
import {clearAdvisorHistory} from '@/lib/advisor-history';
import { AiAdvisor, AiChatIcon } from './ai-advisor';
import { RecipeStepFlow } from './recipe-experience';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ClientCatalog, MatchInput } from '@/lib/schema';
import { matchRecipes } from '@/lib/matching';
import { cookingSchema, readStored, saveStored, clearStored, wizardSchema } from '@/lib/storage';
import { SiteFooter } from './site-footer';
import { About } from './about';
import { SiteHeader } from './site-header';
import { JournalHome } from './journal-home';
import { PantryMatcher } from './pantry-matcher';
import { RecipeDetail, RecipeIngredients, recipePortions } from './recipe-experience';

const initial: MatchInput = { regionId: null, dishType: 'berkuah', mainIngredientId: null, ingredientIds: [] };
export function Kitchen() {
  const path = usePathname(); const router = useRouter(); const params = useSearchParams();
  const [catalog, setCatalog] = useState<ClientCatalog | null>(null);
  const [error, setError] = useState(''); const [input, setInput] = useState<MatchInput>(initial);
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof matchRecipes> | null>(null);
  const [loading, setLoading] = useState(false); const [localResult, setLocalResult] = useState(false);
  const [conversationReset,setConversationReset]=useState(0);
  const [step, setStep] = useState(0); const [done, setDone] = useState(false);
  const [resume, setResume] = useState<ReturnType<typeof cookingSchema.parse> | null>(null);
  const [stale, setStale] = useState(false); const [cookReady, setCookReady] = useState(false);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const slug = path.split('/')[2]; const recipe = catalog?.recipes.find(item => item.slug === slug);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/catalog', { signal: controller.signal }).then(async response => { if (!response.ok) throw Error('Katalog belum dapat dimuat.'); return response.json(); }).then((data: ClientCatalog) => {
      setCatalog(data); const stored = readStored('rn:wizard', wizardSchema);
      if (stored) setInput({ ...stored.input, mainIngredientId: data.ingredients.some(i => i.id === stored.input.mainIngredientId) ? stored.input.mainIngredientId : null, ingredientIds: stored.input.ingredientIds.filter(id => data.ingredients.some(i => i.id === id)) });
      setReady(true);
    }).catch(error => { if (error.name !== 'AbortError') setError(error.message); });
    return () => controller.abort();
  }, []);
  useEffect(() => { if (ready) setStorageWarning(input.ingredientIds.length ? !saveStored('rn:wizard', { version: 1, input }) : !clearStored('rn:wizard')); }, [input, ready]);
  useEffect(() => {
    if (path !== '/hasil' || !catalog || !ready || !input.ingredientIds.length) return;
    const controller = new AbortController(); setLoading(true); setResult(null); setLocalResult(false);
    fetch('/api/match', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: controller.signal }).then(async response => { if (!response.ok) throw Error('match'); return response.json(); }).then(data => { setResult(data); setLoading(false); }).catch(error => {
      if (error.name !== 'AbortError') { setResult(matchRecipes(catalog, input)); setLocalResult(true); setLoading(false); }
    }); return () => controller.abort();
  }, [path, catalog, input, ready]);
  useEffect(() => {
    if (!recipe || !path.startsWith('/masak/')) return;
    setCookReady(false); setStep(0); setDone(false); setResume(null); setStale(false);
    const stored = readStored('rn:cook:' + recipe.id, cookingSchema);
    if (stored && stored.recipeId === recipe.id && stored.recipeVersion === recipe.version && stored.step < recipe.steps.length) setResume(stored);
    else {
      if (stored) setStale(true);
      setStorageWarning(!saveStored('rn:cook:' + recipe.id, { version: 1, recipeId: recipe.id, recipeVersion: recipe.version, step: 0, done: false }));
    }
    setCookReady(true);
  }, [path, recipe]);
  function restartCooking(){if(!recipe)return;clearAdvisorHistory(recipe.id,recipe.version);setConversationReset(value=>value+1);persistCook(0,false);}
  function persistCook(nextStep: number, finished: boolean) {
    if (!recipe) return; moveFocus.current = true; setStep(nextStep); setDone(finished); setResume(null); setStale(false);
    setStorageWarning(!saveStored('rn:cook:' + recipe.id, { version: 1, recipeId: recipe.id, recipeVersion: recipe.version, step: nextStep, done: finished }));
  }
  useEffect(() => { if (moveFocus.current && !done && !resume) { stepHeading.current?.focus({ preventScroll: true }); stepHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); moveFocus.current = false; } }, [step, done, resume]);
  const portions = recipe ? recipePortions(params.get('porsi'), recipe.servings) : 1;
  const name = (id: string) => catalog?.ingredients.find(item => item.id === id)?.name || id;
  return <><a className="skip-link" href="#main-content">Langsung ke isi</a><SiteHeader/>
    {catalog?.mode === 'demo' && <aside className={path === '/' ? 'demo journal-demo' : 'demo'}>Mode demo · Data contoh untuk uji alur. Takaran, langkah, dan cerita budaya belum ditinjau untuk panduan memasak.</aside>}
    {storageWarning && <aside role="status" className="notice">Penyimpanan perangkat tidak tersedia. Progres hanya bertahan selama halaman ini terbuka.</aside>}
    <main id="main-content" className={path === '/' && catalog?.recipes.length ? 'home-main' : undefined}>
    {!catalog ? <section className="panel"><h1>{error || 'Menyiapkan dapur…'}</h1>{error && <button onClick={() => window.location.reload()}>Coba lagi</button>}</section> : !catalog.recipes.length ? <section className="panel"><p className="eyebrow">Katalog terkurasi</p><h1>Resep sedang disiapkan</h1><p>Resep akan tampil setelah sumber, cerita budaya, dan langkah memasaknya selesai ditinjau.</p></section> : path === '/' ? <>
      <JournalHome catalog={catalog} input={input} setInput={setInput} onSearch={() => router.push('/hasil')}/>
    </> : path === '/tentang' ? <About catalog={catalog}/> : path === '/cari' ? <section className="workspace search-workspace"><PantryMatcher catalog={catalog} input={input} setInput={setInput}/></section> : path === '/hasil' ? <section className="workspace"><Link href="/cari" className="back">← Ubah pilihan bahan</Link><p className="eyebrow">02 / Temuan dapur</p><h1>Masakan yang paling dekat</h1><p>Persentase menunjukkan kecocokan berbobot: bahan inti lebih menentukan daripada pendukung. Jumlah bahan tersedia ditampilkan terpisah. Bahan opsional tidak menambah skor.</p>{localResult && <p role="status" className="notice">Koneksi terputus. Hasil dihitung di perangkat dari katalog yang sudah dimuat.</p>}{!input.ingredientIds.length ? <p>Pilih setidaknya satu bahan terlebih dahulu. <Link href="/cari">Pilih bahan</Link></p> : loading ? <p role="status">Mencocokkan bahan…</p> : result?.results.length ? <div className="cards">{result.results.map(match => { const found = catalog.recipes.find(r => r.id === match.recipeId)!; return <article className="recipe-card" key={match.recipeId}><p className="eyebrow">{found.dishType} · {found.origin}</p><h2>{found.title}</h2><strong className="score">{match.score}% <span>kecocokan berbobot</span></strong><p>{match.matchedRequiredCount} dari {match.requiredCount} bahan wajib tersedia.</p><p>{match.hasAllCore ? 'Semua bahan inti tersedia' : 'Masih ada bahan inti yang perlu disiapkan'}</p><p className="small">Belum tersedia: {match.missingRequiredIngredientIds.map(name).join(', ') || 'Tidak ada'}</p><Link className="button" href={'/resep/' + found.slug}>Lihat resep →</Link></article>; })}</div> : result && <div className="panel"><h2>Belum ada yang cocok</h2><p>Coba tambah bahan di dapurmu atau ganti pilihan bahan utama.</p><Link className="button" href="/cari">Ubah bahan</Link></div>}</section>
    : path.startsWith('/resep/') && recipe ? <RecipeDetail key={recipe.id} recipe={recipe} catalog={catalog} selected={input.ingredientIds}/>
    : path.startsWith('/masak/') && recipe ? <section className="cooking"><Link className="back" href={'/resep/' + recipe.slug+'?porsi='+portions}>← Detail resep</Link><div className="cooking-header"><div><p>Cooking Mode</p><p>{recipe.title} · {portions} porsi</p></div><a className="cooking-ai-entry" href="#ai-teman-dapur" onClick={()=>requestAnimationFrame(()=>document.getElementById('advisor-question')?.focus({preventScroll:true}))}><AiChatIcon/><span>Tanya AI</span><span aria-hidden="true">↘</span></a></div>{resume ? <section className="panel"><h1>{resume.done ? 'Masakan sebelumnya selesai' : 'Lanjut dari langkah terakhir?'}</h1><p>Progres tersimpan pada langkah {resume.step + 1} dari {recipe.steps.length}.</p><div className="button-group"><button onClick={() => persistCook(resume.step, resume.done)}>Lanjutkan progres</button><button className="secondary" onClick={restartCooking}>Mulai ulang</button></div></section> : done ? <section className="panel"><p className="eyebrow">Selesai</p><h1>Dapur hari ini, tuntas.</h1><p>Semua langkah {recipe.title} sudah kamu lewati.</p><div className="button-group"><Link href="/cari" className="button">Cari masakan lain</Link><button className="secondary" onClick={restartCooking}>Masak ulang</button></div></section> : cookReady && <>{stale && <p role="status" className="notice">Resep telah berubah. Progres lama direset agar sesuai langkah terbaru.</p>}<RecipeStepFlow recipe={recipe} current={step} onSelect={index=>persistCook(index,false)}/><div className="progress" aria-label={'Langkah ' + (step + 1) + ' dari ' + recipe.steps.length}>{recipe.steps.map((item, index) => <span key={item.order} className={index <= step ? 'active' : ''}/>)}</div><p className="small">Langkah {step + 1} dari {recipe.steps.length}</p><h1 ref={stepHeading} tabIndex={-1} className="active-step">{recipe.steps[step].title}</h1><p className="instruction">{recipe.steps[step].instruction}</p>{portions !== recipe.servings && <p className="small">Takaran bahan disesuaikan untuk {portions} porsi. Jumlah yang tertulis dalam instruksi atau catatan tetap mengacu pada resep asal {recipe.servings} porsi.</p>}<details className="step-ingredients" key={step}><summary>Bahan untuk langkah ini</summary><RecipeIngredients recipe={recipe} catalog={catalog} selected={input.ingredientIds} step={step} portions={portions}/><Link href={'/resep/' + recipe.slug + '?porsi='+portions+'#bahan-resep'}>Lihat semua takaran</Link></details><div className="action-row cooking-actions"><button className="secondary" disabled={step === 0} onClick={() => persistCook(step - 1, false)}>← Sebelumnya</button><button onClick={() => step === recipe.steps.length - 1 ? persistCook(step, true) : persistCook(step + 1, false)}>{step === recipe.steps.length - 1 ? 'Selesaikan memasak' : 'Langkah berikutnya →'}</button></div></>}

      <AiAdvisor key={recipe.id+':'+recipe.version} resetToken={conversationReset} recipe={recipe} step={resume?.step??step} portions={portions} ingredientIds={input.ingredientIds}/></section>
    : <section className="panel"><h1>Halaman tidak ditemukan</h1><Link className="button" href="/">Kembali ke beranda</Link></section>}
    </main><SiteFooter home={path==='/'}/></>;
}


