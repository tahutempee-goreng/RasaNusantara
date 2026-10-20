'use client';
import { useEffect, useRef, useState } from 'react';

const MESSAGE = 'Menyiapkan cerita dan rasa…';
const CHARACTERS = Array.from(MESSAGE);
const SEEN_KEY = 'rn:intro:v1:seen';
let seenInMemory = false;
type IntroMode = 'pending' | 'first' | 'seen' | 'reduced';
function markSeen() {
 seenInMemory = true;
 try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* Optional preference falls back to document memory. */ }
}

export function StartupScreen({error='',ready=false,onComplete}: {error?:string;ready?:boolean;onComplete:()=>void}) {
 const [mode,setMode] = useState<IntroMode>('pending');
 const [count,setCount] = useState(0);
 const [leaving,setLeaving] = useState(false);
 const [hidden,setHidden] = useState(false);
 const started = useRef(0);
 useEffect(()=>{
  started.current = performance.now();
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let seen = seenInMemory;
  try { seen = seen || sessionStorage.getItem(SEEN_KEY) === '1'; } catch { /* Storage can be denied. */ }
  setMode(preference.matches ? 'reduced' : seen ? 'seen' : 'first');
  const reduce = ()=>{if(preference.matches)setMode('reduced');};
  const visibility = ()=>setHidden(document.hidden);
  visibility();
  preference.addEventListener('change',reduce);
  document.addEventListener('visibilitychange',visibility);
  return()=>{preference.removeEventListener('change',reduce);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{
  if(mode!=='first'||error)return;
  let timer:number;
  const type = ()=>{
   const elapsed = performance.now()-started.current;
   const next = Math.max(0,Math.min(CHARACTERS.length,1+Math.floor((elapsed-200)/40)));
   setCount(next);
   if(next<CHARACTERS.length)timer=window.setTimeout(type,Math.max(1,200+next*40-elapsed));
  };
  type();
  return()=>window.clearTimeout(timer);
 },[mode,error]);
 useEffect(()=>{
  if(!ready||error||mode==='pending')return;
  if(mode!=='first'){markSeen();onComplete();return;}
  let exitTimer:number;
  const timer=window.setTimeout(()=>{
   setLeaving(true);
   exitTimer=window.setTimeout(()=>{markSeen();onComplete();},250);
  },Math.max(0,1550-(performance.now()-started.current)));
  return()=>{window.clearTimeout(timer);window.clearTimeout(exitTimer);};
 },[ready,error,mode,onComplete]);
 const typed = mode==='pending'?'':mode==='first'?CHARACTERS.slice(0,count).join(''):MESSAGE;
 const typing = mode==='first'&&count<CHARACTERS.length&&!error;
 return <div className="startup-screen" data-state={error?'error':leaving?'leaving':'loading'} data-intro={mode} data-ready={ready} data-paused={hidden} role={error?'alert':'status'} aria-live="polite" aria-atomic="true">
  <div className="startup-content">
   <svg className="startup-bowl" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <g className="startup-steam"><path d="M32 35c-9-10 8-12 0-23"/><path d="M48 32c-9-10 8-12 0-23"/><path d="M64 35c-9-10 8-12 0-23"/></g>
    <path d="M15 48h66c-3 22-15 32-33 32S18 70 15 48ZM30 87h36M25 58h46"/>
   </svg>
   <h1>RasaNusantara</h1>
   {error?<><h2>Dapur belum bisa dibuka</h2><p>{error}</p><button className="button" onClick={()=>window.location.reload()}>Coba lagi</button></>:<p className="startup-message"><span className="startup-announcement">{MESSAGE}</span><span className="startup-placeholder" aria-hidden="true">{MESSAGE}</span><span className="startup-typed" aria-hidden="true" data-typing={typing}>{typed}</span></p>}
   <noscript><p>Aktifkan JavaScript pada browser untuk membuka resep dan panduan memasak.</p></noscript>
   <p className="startup-signature">Dari bahan di dapurmu,<br/>ke cerita di meja kita.</p>
  </div>
 </div>;
}
