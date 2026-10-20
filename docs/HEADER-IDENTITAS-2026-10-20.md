# Cap identitas beranda — 20 Oktober 2026

Dekorasi gunung/RN diganti dengan cap kuliner bergambar mangkuk beruap, tulisan Rasa Nusantara dan label Tentang. Cap menjadi tautan /tentang yang dapat diakses keyboard, dengan aria-label Tentang RasaNusantara. Halaman tujuan memakai isi aplikasi existing: penjelasan aplikasi, resep/sumber, kredit visual dan informasi AI/penyimpanan. Bukan tombol kosong atau cap singkatan.

Warna navy/terakota di atas kertas gading tetap terbaca pada bab terang dan gelap. Ukuran104x59px menjaga tinggi header existing. Pada HP cap disembunyikan untuk memberi ruang navigasi; Tentang tetap dapat dibuka melalui menu Dapur. Tidak mengubah resep, skor, provider/key, progres memasak atau alur AI.

Build produksi dan TypeScript lulus. Sepuluh tes browser terarah lulus: cap/tautan/keyboard, navigasi HP, header lima bab, carousel dan pemilihan bahan. Tambahan pemeriksaan posisi tautan kembali pada halaman Tentang setelah scroll selesai juga lulus. Visual desktop lima bab, halaman Tentang, HP390x844 dan mendatar844x390:8capture, pageerror kosong. Tidak mengklaim menjalankan seluruh suite75 pada perubahan terbatas ini; suite74 sebelumnya lulus pada19Oktober.

## Koreksi hasil konfirmasi produksi
Pemeriksaan dari bab terakhir menemukan posisi awal halaman Tentang dapat menyisakan tautan kembali di bawah header. Halaman Tentang kini mengembalikan scroll ke awal sekali saat dibuka tanpa hash; deep link yang memiliki hash tidak ditimpa. Regresi cap diperluas agar berangkat dari bab Panduan, bukan hanya sampul. Hasil awal dari sampul lulus, tetapi tidak mewakili kasus dari bab terakhir. Build/tes terarah dijalankan kembali setelah koreksi.
