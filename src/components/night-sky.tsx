'use client';
import {useEffect,useRef,useState} from 'react';
import styles from './journal-home.module.css';
export function NightSky({active}:{active:boolean}) {
 const root=useRef<HTMLDivElement>(null);const video=useRef<HTMLVideoElement>(null);
 const [allowed,setAllowed]=useState(false);const [mobile,setMobile]=useState(false);const [visible,setVisible]=useState(false);const [pageVisible,setPageVisible]=useState(true);const [loaded,setLoaded]=useState(false);const [ready,setReady]=useState(false);const [failed,setFailed]=useState(false);
 useEffect(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)');const portrait=matchMedia('(max-width: 600px)');const connection=(navigator as Navigator & {connection?:{saveData?:boolean;addEventListener?:(name:string,fn:()=>void)=>void;removeEventListener?:(name:string,fn:()=>void)=>void}}).connection;
 const update=()=>setAllowed(!reduced.matches&&!connection?.saveData);const resize=()=>{setMobile(portrait.matches);setReady(false);setFailed(false);};const visibility=()=>setPageVisible(!document.hidden);
 update();resize();visibility();reduced.addEventListener('change',update);portrait.addEventListener('change',resize);connection?.addEventListener?.('change',update);document.addEventListener('visibilitychange',visibility);
 const observer=new IntersectionObserver(entries=>setVisible(entries[0]?.isIntersecting??false),{threshold:.1});if(root.current)observer.observe(root.current);
 return()=>{observer.disconnect();reduced.removeEventListener('change',update);portrait.removeEventListener('change',resize);connection?.removeEventListener?.('change',update);document.removeEventListener('visibilitychange',visibility);};},[]);
 useEffect(()=>{if(active&&allowed&&visible)setLoaded(true);},[active,allowed,visible]);
 const playing=active&&allowed&&visible&&pageVisible&&!failed;const src=mobile?'/videos/night-sky-mobile.mp4':'/videos/night-sky.mp4';
 useEffect(()=>{const player=video.current;if(!player)return;if(!playing){player.pause();return;}if(ready)void player.play().catch(()=>setFailed(true));},[playing,ready,src]);
 return <div ref={root} className={styles.nightSky} aria-hidden="true" data-night-sky data-ready={ready&&!failed}><picture><source media="(max-width:600px)" srcSet="/images/journal/night-sky-mobile.webp"/><img src="/images/journal/night-sky.webp" alt="" width={1280} height={720} loading="lazy"/></picture>{allowed&&loaded&&!failed&&<video key={src} ref={video} src={src} muted autoPlay={playing} loop playsInline preload="metadata" onCanPlay={()=>setReady(true)} onError={()=>{setReady(false);setFailed(true);}}/>}</div>;
}
