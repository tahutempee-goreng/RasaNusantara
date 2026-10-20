import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
const root = process.cwd();
async function asset(path:string) { return `data:image/webp;base64,${(await readFile(`${root}/public/${path}`)).toString('base64')}`; }
async function main() {
 const font = await readFile(`${root}/public/fonts/cormorant-garamond.ttf`);
 const sans = await readFile(`${root}/public/fonts/figtree-400.ttf`);
 const landscape = await asset('images/journal/nusantara-landscape.webp');
 const dish = await asset('images/journal/tekwan.webp');
 const markup = renderToStaticMarkup(
 <div style={{display:'flex',width:'100%',height:'100%',background:'#f3ecd9',color:'#173440',fontFamily:'Figtree',position:'relative'}}>
  <div style={{display:'flex',position:'absolute',right:0,top:0,width:450,height:630,background:'#243449'}}><img src={landscape} width="450" height="630" style={{objectFit:'cover',opacity:0.6}} /></div>
  <div style={{display:'flex',flexDirection:'column',padding:'56px 64px',width:770}}>
   <div style={{display:'flex',fontFamily:'Cormorant',fontSize:45}}>RasaNusantara</div>
   <div style={{display:'flex',flexDirection:'column',fontFamily:'Cormorant',fontSize:94,lineHeight:0.97,marginTop:54}}><span>Dari dapur,</span><span>ke cerita.</span></div>
   <div style={{display:'flex',flexDirection:'column',fontSize:24,lineHeight:1.5,marginTop:28}}><span>Temukan masakan dari bahan yang ada.</span><span>Masak bersama AI Teman Dapur.</span></div>
   <div style={{display:'flex',fontSize:18,marginTop:40,color:'#80553f'}}>rasanusantara-ashen.vercel.app</div>
  </div>
  <div style={{display:'flex',position:'absolute',right:46,top:129,flexDirection:'column',padding:13,paddingBottom:23,background:'#fffaf0',transform:'rotate(5deg)'}}>
   <img src={dish} width="348" height="348" style={{objectFit:'cover'}} />
   <div style={{display:'flex',fontFamily:'Cormorant',fontSize:27,justifyContent:'center',marginTop:14}}>Tekwan · Palembang</div>
  </div>
 </div>);
 const browser = await chromium.launch({channel:'chrome',headless:true});
 const page = await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
 await page.setContent(`<style>@font-face{font-family:Cormorant;src:url(data:font/ttf;base64,${font.toString('base64')})}@font-face{font-family:Figtree;src:url(data:font/ttf;base64,${sans.toString('base64')})}*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden}body>div{width:1200px!important;height:630px!important}</style>${markup}`);
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(Array.from(document.images).map(img=>img.decode()));});
 await mkdir(`${root}/public/og`,{recursive:true});
 await page.screenshot({path:`${root}/public/og/rasanusantara.png`});
 await browser.close();
 console.log('OG image generated: 1200 × 630');
}
void main();
