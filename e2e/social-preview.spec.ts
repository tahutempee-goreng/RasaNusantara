import { test, expect } from '@playwright/test';
const site = 'https://rasanusantara-ashen.vercel.app';
test('sharing bots receive complete public metadata in the initial document head', async ({request}) => {
 for (const userAgent of ['facebookexternalhit/1.1','WhatsApp/2.24.0']) {
  for (const [path,title,canonical] of [['/','RasaNusantara',''],['/resep/rendang?porsi=2','Rendang','/resep/rendang'],['/cari','Cari masakan dari bahan','/cari'],['/masak/rendang?porsi=2','Memasak Rendang','/masak/rendang'],['/tentang','Tentang RasaNusantara','/tentang']]) {
   const response = await request.get(path,{headers:{'user-agent':userAgent}});expect(response.ok()).toBe(true);
   const html = await response.text();const head = html.split('</head>')[0];
   expect(head).toContain(`property="og:title" content="${title}`);
   expect(head).toContain(`property="og:url" content="${site}${canonical}"`);
   expect(head).toContain(`rel="canonical" href="${site}${canonical}"`);
   expect(head).toContain(`property="og:image" content="${site}/og/rasanusantara.png"`);
   expect(head).toContain('property="og:image:width" content="1200"');expect(head).toContain('property="og:image:height" content="630"');
   expect(head).toContain('property="og:locale" content="id_ID"');expect(head).toContain('name="twitter:card" content="summary_large_image"');
   expect(head).toContain('property="og:description"');expect(head).not.toContain('GEMINI_API_KEY');
  }
 }
});
test('share image is public, correctly sized PNG within a practical file size',async({request})=>{
 const response = await request.get('/og/rasanusantara.png');expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('image/png');
 const bytes=await response.body();expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');expect(bytes.readUInt32BE(16)).toBe(1200);expect(bytes.readUInt32BE(20)).toBe(630);expect(bytes.length).toBeLessThan(2*1024*1024);
});
