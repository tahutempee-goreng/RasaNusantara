# Video langit malam

Dibuat 18 Oktober 2026 atas persetujuan pengguna untuk menambah video loop hanya pada latar paling belakang. Ilustrasi desa, pepohonan, kapal, bukit, bulan dan kartu tetap terpisah.

- Source: night-sky-video/index.html dan night-sky-video/mobile/index.html, BRIEF.md, hyperframes.json, runtime GSAP lokal.
- Komposisi: canvas deterministik, seed bintang tetap; satu timeline paused 20 detik. Kabut bergerak siklis, kelip mempunyai periode pembagi 20, meteor di detik 4,5 dan 13,5. Tanpa perpindahan kamera, teks, audio atau layanan generatif.
- Pemeriksaan HyperFrames desktop/HP: lint, runtime, layout lulus pada 0/5/10/14/19,96 detik. Tidak ada teks sehingga contrast checker media memeriksa 0 teks, bukan klaim aksesibilitas seluruh aplikasi.
- Master: night-sky-video/desktop-master.mp4 dan mobile-master.mp4, render high 24fps dengan software screenshot capture.
- Web: app/public/videos/night-sky.mp4 (1280x720, 348.533 byte) dan night-sky-mobile.mp4 (720x1280, 252.062 byte). Keduanya H.264, 20 detik, 24fps, tanpa track audio, faststart. Poster di app/public/images/journal/night-sky[-mobile].webp.
- Metadata dan perbandingan sambungan: night-sky-video/MEDIA-VALIDATION.json. Perbedaan absolut rata-rata frame pertama/terakhir desktop 0,121 dari skala 255; dibandingkan secara visual melalui frame awal, tengah, meteor dan akhir. Bukan klaim setiap piksel identik pada hasil kompresi.
- Tidak memakai kredit Flow/provider AI. Instalasi Node/dependency aplikasi tidak berubah. Pembaruan skill general-video gagal ENOTFOUND registry; dokumentasi lokal dan CLI HyperFrames 0.8.149 yang sudah tersedia dipakai.
- Render tidak identik dengan video referensi pengguna; mengikuti arah visual yang disetujui. Source dan provenance foto/ilustrasi resep tetap pada catatan aset sebelumnya dan /tentang.
