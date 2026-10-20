# RasaNusantara

Masak dari bahan yang ada, kenal cerita di balik hidangannya.

**Website:** https://rasanusantara-ashen.vercel.app/

Website responsif untuk menemukan masakan Nusantara berdasarkan bahan di dapur, mengikuti langkah memasak, dan bertanya kepada AI Teman Dapur sesuai resep yang sedang dibuka. Dibuat untuk tema IT Fest 2026: Empowering Culture Through AI-Driven Innovation.

## Fitur

- Katalog 13 resep dari Palembang, Padang/Minangkabau, Jawa, dan Makassar, dengan tiga bagian cerita per hidangan dan rujukan per bagian. Halaman Tentang menyatukan alur aplikasi, sumber, kredit dan penyimpanan.
- Filter daerah dan jenis masakan; daftar bahan utama, bumbu, pelengkap, pencarian dan pilihan tersimpan.
- Rekomendasi langsung berubah. Skor berbobot bahan inti 3, pendukung 1, opsional 0; 100% berarti seluruh bahan wajib tersedia.
- Detail resep dengan porsi 1–12, takaran praktis bersama, bahan yang kurang, langkah berurutan dan cerita daerah.
- Cooking Mode menyimpan progres per resep/versi pada perangkat; bahan, langkah dan porsi tetap terhubung.
- AI Teman Dapur menggunakan Gemini dari server. Konteks terbaru dibangun dari katalog server, termasuk takaran, pilihan bahan, porsi dan langkah aktif. Enam pasangan percakapan terakhir per resep tersimpan selama sesi tab, termasuk setelah refresh.
- Beranda lima bab dengan ilustrasi Nusantara, carousel resep, video tanpa suara dan dukungan reduced motion. Perangkat sentuh memakai efek kertas ringan dengan ilustrasi statis dan navigasi bab langsung; desktop mempertahankan paralaks. Reduced motion/browser lama tetap memakai alur native. Pembuka pertama tab menampilkan mangkuk/uap dan teks mengetik sekitar 1,8 detik saat data siap cepat; refresh berikutnya tanpa waktu tambahan. Reduced motion langsung memakai teks lengkap.

## Teknologi

Next.js 16, React 19, TypeScript, Zod dan CSS. Katalog JSON tervalidasi; tidak memerlukan database atau akun pengguna. Deployment produksi menggunakan Vercel. Gemini dipanggil melalui endpoint server POST /api/advisor; API key tidak dikirim ke browser.

## Menjalankan lokal

Gunakan Node.js 22 atau lebih baru, lalu jalankan dari root repository:

```sh
npm ci
npm run dev
```

Buka http://127.0.0.1:3000 . Katalog, pencarian dan Cooking Mode dapat dipakai tanpa key. Untuk mengaktifkan AI, buat `.env.local` dari contoh `.env.example` bila file tersebut belum ada:

```dotenv
RASANUSANTARA_DEMO=false
AI_ENABLED=true
GEMINI_API_KEY=isi_key_pribadi_anda
GEMINI_MODEL=gemini-3.5-flash-lite
```

Simpan key hanya dalam file lokal tersebut atau Secret server hosting. Jangan menambah prefiks NEXT_PUBLIC_ pada key, jangan commit `.env.local`, dan jangan memasukkan key ke video/screenshot. Tanpa key atau saat provider gagal, langkah memasak tetap dapat digunakan. Model dapat disesuaikan dengan akses akun provider.

## Build dan pemeriksaan

```sh
npm test
npm run build
npm run typecheck
npm run test:e2e
```

Suite browser memakai Google Chrome serta WebKit untuk emulasi iPhone. Pastikan Chrome tersedia, lalu jalankan `npx playwright install webkit`. Lihat playwright.config.ts, e2e/iphone-scroll.spec.ts dan e2e/server.ts. Suite menjalankan server produksi sendiri pada port 3000 sehingga memerlukan build terlebih dahulu dan port tersebut tersedia.

Hasil pemeriksaan lokal 20 Oktober 2026: 30 tes domain/provider/origin lulus dan 101 tes browser lulus; rincian pemeriksaan ada di VALIDATION.md; katalog 13 resep, TypeScript dan build produksi lulus. Formatter diperiksa pada 2.664 kombinasi bahan/porsi. Sesudah deployment, browser tanpa login menuntaskan bahan → rekomendasi → detail → Cooking Mode → refresh progres; satu skenario AI sungguhan mengenali Rendang 2 porsi dan langkah aktif. Ini hasil pada lingkungan pengembangan/produksi saat diperiksa, bukan jaminan semua lingkungan atau saran AI selalu benar.

## Endpoint

- GET /api/catalog: katalog publik, termasuk metadata padanan takaran dan sumber.
- POST /api/match: pencocokan dengan filter daerah/jenis/bahan; memakai matcher yang sama dengan fallback lokal.
- GET /api/advisor: status ketersediaan AI tanpa membocorkan konfigurasi.
- POST /api/advisor: pertanyaan, ID resep, porsi, langkah, bahan dan riwayat opsional. Server memvalidasi input serta origin dan membangun konteks terpercaya.

## Data, media dan keterbatasan

Resep diadaptasi dari sumber tertaut, belum diuji memasak langsung. Durasi adaptasi dan padanan bobot merupakan perkiraan yang ditandai; ukuran bahan dapat berbeda. Takaran/unit asal tetap disimpan. Lihat [riset katalog](docs/RISET-KATALOG-2026-10-18.md) dan [riset takaran](docs/RISET-TAKARAN-2026-10-19.md).

Ilustrasi AI dan atribusi foto dicatat di [provenance media resep](docs/ASSET-RECIPE-2026-10-18.md). Foto rendang: Midori / Wikimedia Commons, CC BY 3.0, diperkecil dan dikompresi; sumber serta kredit tersedia di data katalog dan halaman Tentang. Aset pihak ketiga mengikuti lisensi sumber masing-masing. Repository ini tidak mengklaim kepemilikan eksklusif atas aset pihak ketiga atau dukungan dari penyedia sumber.

Saat memakai AI, pertanyaan, konteks resep, bahan, porsi, langkah dan riwayat yang relevan dikirim ke Google Gemini. Jangan memasukkan data pribadi. AI tidak melihat masakan secara langsung dan jawabannya perlu diperiksa. Riwayat AI berada di sessionStorage (fallback memori jika storage ditolak), bukan database; progres memasak/pilihan bahan tersimpan pada browser. Limiter server saat ini per-proses, belum terdistribusi.

## Isi repository

`src/` berisi aplikasi, API, domain dan katalog; `public/` aset; `tests/` tes domain/provider; `e2e/` tes browser; `docs/` catatan sumber. File rahasia, node_modules, build, runtime log, kredensial Vercel dan cache lokal tidak disertakan. AI Development Log untuk pengumpulan lomba disiapkan terpisah dalam format PDF/DOCX.


Pratinjau berbagi: metadata Open Graph/Twitter dan canonical disediakan server. Gambar 1200 × 630 di `public/og/rasanusantara.png` dapat dibuat ulang melalui `npm run og:image` dengan Chrome lokal. Domain publik ditetapkan di `src/lib/site-metadata.ts`; ubah saat pindah domain.
