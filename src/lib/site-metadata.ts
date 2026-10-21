import type { Metadata } from 'next';
export const SITE_URL = 'https://rasanusantara-ashen.vercel.app';
export const SITE_DESCRIPTION = 'Temukan masakan Nusantara dari bahan di dapurmu. Ikuti langkah memasak bersama AI Teman Dapur dan kenali cerita di balik hidangannya.';
export function siteMetadata(path = '/', title = 'RasaNusantara — Dari dapur, ke cerita.', description = SITE_DESCRIPTION): Metadata {
 const url = new URL(path, SITE_URL).href;
 const image = {url: `${SITE_URL}/og/rasanusantara.png`,width:1200,height:630,type:'image/png',alt:'RasaNusantara — Dari dapur, ke cerita. Ilustrasi tekwan Palembang di atas lanskap Nusantara.'};
 return {metadataBase:new URL(SITE_URL),title,description,icons:{icon:[{url:'/favicon.svg',type:'image/svg+xml'},{url:'/favicon.ico',sizes:'16x16 32x32 48x48',type:'image/x-icon'}],apple:[{url:'/apple-touch-icon.png',sizes:'180x180',type:'image/png'}]},alternates:{canonical:url},openGraph:{type:'website',locale:'id_ID',siteName:'RasaNusantara',title,description,url,images:[image]},twitter:{card:'summary_large_image',title,description,images:[{url:image.url,alt:image.alt}]}};
}
