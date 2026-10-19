'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import type {ClientCatalog} from '@/lib/schema';
import styles from './journal-home.module.css';
type Recipe=ClientCatalog['recipes'][number];
export function RecipeCarousel({recipes,active}:{recipes:Recipe[];active:boolean}) {
 const [index,setIndex]=useState(0);const [settled,setSettled]=useState(0);const [busy,setBusy]=useState(false);const [failed,setFailed]=useState<Record<string,boolean>>({});
 const stage=useRef<HTMLDivElement>(null);const current=useRef(0);const wanted=useRef(0);const direction=useRef(1);const running=useRef(false);const mounted=useRef(true);const token=useRef(0);const cancel=useRef<(()=>void)|null>(null);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;token.current++;cancel.current?.();};},[]);
 useEffect(()=>{if(!active)cancel.current?.();const reduced=matchMedia('(prefers-reduced-motion: reduce)');const stop=()=>{if(document.hidden||reduced.matches)cancel.current?.();};document.addEventListener('visibilitychange',stop);reduced.addEventListener('change',stop);return()=>{document.removeEventListener('visibilitychange',stop);reduced.removeEventListener('change',stop);};},[active]);
 async function move(target:number,way=1) {
  if(!recipes.length)return;wanted.current=(target+recipes.length)%recipes.length;direction.current=way;
  if(running.current)return;running.current=true;
  while(mounted.current&&wanted.current!==current.current){
   const destination=wanted.current;const sign=direction.current;const run=++token.current;const root=stage.current;
   if(!root)break;
   if(!active||document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches){current.current=destination;setIndex(destination);setSettled(destination);continue;}
   setBusy(true);root.inert=true;
   let copy:HTMLElement|null=null;let animations:Animation[]=[];
   const finish=(next:number)=>{copy?.remove();animations.forEach(a=>a.cancel());root.inert=false;root.style.removeProperty('min-height');current.current=next;if(mounted.current){setIndex(next);setSettled(next);setBusy(false);}running.current=false;cancel.current=null;};
   cancel.current=()=>{token.current++;finish(wanted.current);};
   try{
    const image=new Image();image.src=recipes[destination].image?.path||'';
    try{await image.decode();}catch{if(mounted.current)setFailed(value=>({...value,[recipes[destination].id]:true}));}
    if(token.current!==run) return;
    const scene=root.firstElementChild as HTMLElement;root.style.minHeight=scene.offsetHeight+'px';copy=scene.cloneNode(true) as HTMLElement;copy.querySelectorAll('[data-paper-backing]').forEach(el=>el.remove());copy.setAttribute('aria-hidden','true');copy.inert=true;copy.dataset.outgoing='true';copy.style.cssText='position:absolute;inset:0;z-index:3;pointer-events:none;margin:0;width:100%;';
    root.appendChild(copy);setIndex(destination);
    await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
    if(token.current!==run)return;
    const photo=copy.querySelector<HTMLElement>('[data-polaroid]');const card=copy.querySelector<HTMLElement>('article');
    const animate=(el:HTMLElement|null,frames:Keyframe[],duration=600)=>{if(!el)return;const a=el.animate(frames,{duration,easing:'cubic-bezier(.22,.75,.25,1)',fill:'forwards'});animations.push(a);};
    if(photo){photo.style.transformOrigin=sign>0?'12% 8%':'88% 8%';animate(photo,[{transform:'perspective(900px) translate3d(0,0,0) rotate(-2deg)',boxShadow:'0 6px 10px #0003',opacity:1},{offset:.3,transform:`perspective(900px) translate3d(${sign*18}px,-24px,45px) rotate(${sign*5-2}deg) rotateY(${sign*-7}deg)`,boxShadow:'0 22px 28px #0005',opacity:1},{offset:.8,transform:`perspective(900px) translate3d(${sign*140}px,-140px,75px) rotate(${sign*15}deg) rotateY(${sign*-16}deg)`,boxShadow:'0 28px 36px #0003',opacity:1},{transform:`perspective(900px) translate3d(${sign*185}px,-165px,90px) rotate(${sign*19}deg) rotateY(${sign*-19}deg)`,boxShadow:'0 35px 45px #0002',opacity:0}]);}
    animate(card,[{opacity:1,transform:'rotate(.7deg)'},{offset:.3,opacity:1,transform:'translateY(-6px) rotate(1deg)'},{opacity:0,transform:`translate(${sign*24}px,-20px) rotate(${sign*2}deg)`}],520);
    await Promise.allSettled(animations.map(a=>a.finished));
    if(token.current!==run)return;
    copy.remove();copy=null;animations.forEach(a=>a.cancel());root.inert=false;root.style.removeProperty('min-height');current.current=destination;setSettled(destination);setBusy(false);cancel.current=null;
   }catch{if(token.current===run)finish(destination);}
  }
  running.current=false;if(mounted.current)setBusy(false);
 }
 const recipe=recipes[index];if(!recipe)return null;
 return <div className={styles.carouselDeck} data-carousel-busy={busy}><div className={styles.recipeSlideStage} ref={stage} aria-busy={busy}>
 <div className={styles.recipeScene} data-slide-id={recipe.id}><div className={styles.polaroidStack}><div className={styles.backPrint} data-paper-backing aria-hidden="true"/><div className={styles.backPrintSecond} data-paper-backing aria-hidden="true"/><Link className={styles.polaroid} href={'/resep/'+recipe.slug} data-polaroid><span className={styles.tape} aria-hidden="true"/>{failed[recipe.id]?<div className={styles.recipeArtFallback}>Gambar belum tersedia</div>:<img className={styles.recipeArt} src={recipe.image?.path} alt={recipe.image?.alt||recipe.title} loading="lazy" onError={()=>setFailed(value=>({...value,[recipe.id]:true}))}/>}<span className={styles.photoCaption}>{recipe.title} · {recipe.origin}</span></Link></div>
 <div className={styles.recipeInformation}><article className={styles.recipeCard} data-recipe-id={recipe.id}><span className={styles.recipeCategory}>{recipe.origin.toLocaleUpperCase('id')} / {recipe.dishType==='berkuah'?'BERKUAH':'KERING'}</span><h3>{recipe.title}</h3><p>{recipe.variant}. Cocokkan isi dapurmu, periksa takarannya, lalu ikuti langkah memasaknya.</p><dl><div><dt>ESTIMASI TOTAL</dt><dd>{recipe.prepMinutes+recipe.cookMinutes} menit</dd></div><div><dt>PORSI</dt><dd>{recipe.servings} orang</dd></div></dl><Link href={'/resep/'+recipe.slug}>BUKA RESEP <span aria-hidden="true">↗</span></Link></article></div></div></div>
 <div className={styles.recipeControls}><div><button type="button" onClick={()=>void move(wanted.current-1,-1)} aria-label="Resep sebelumnya">←</button><button type="button" onClick={()=>void move(wanted.current+1,1)} aria-label="Resep berikutnya">→</button></div><span aria-live="polite">{String(settled+1).padStart(2,'0')} / {String(recipes.length).padStart(2,'0')}</span><div className={styles.recipeDots}>{recipes.map((item,i)=><button type="button" key={item.id} aria-label={'Tampilkan resep '+item.title} aria-pressed={i===settled} onClick={()=>void move(i,i>=current.current?1:-1)}><span/></button>)}</div></div></div>;
}
