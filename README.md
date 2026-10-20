# Website Resmi MTs. YASUA (Pilangwetan - Demak)

Website resmi madrasah untuk **MTs. YASUA Pilangwetan, Kebonagung, Demak**, dirancang dengan standar web sekolah profesional bertema **Hijau Islami Modern (Emerald Green & Warm Gold)**.

---

## 🌟 Fitur Unggulan

1. **Desain Modern & Responsif:**
   - **Floating Glassmorphism Header**: Navigasi melayang dengan backdrop-blur transparan dan adaptif di layar smartphone maupun desktop.
   - **Top Announcement Bar**: Pengumuman berjalan informasi PPDB online.
   - **Basmalah Arabic Banner**: Header islami dengan tipografi Arab (*Amiri*).
   - **Hero Section**: Tagline *"Membentuk Generasi Qur'ani, Cerdas, & Berakhlakul Karimah"*, slider interaktif dengan prioritas LCP, dan tombol aksi cepat.

2. **Fitur Akademik & Informasi Transparan:**
   - **🎓 Dewan Guru & Tenaga Pendidik**: Slider marquee kontinu otomatis tanpa henti ke kiri (dengan fitur *pause on hover*), menampilkan 6 profil pengajar bergelar dan tombol modal detail profil pendidik.
   - **📰 Berita & Pengumuman Sekolah**: Layout modern menampilkan poster utama PTS (Penilaian Tengah Semester) dan daftar berita terkini (Prestasi Siswa, Parenting Akbar, PPDB, dan ANBK) lengkap dengan modal baca detail interaktif.
   - **Visi & Misi Resmi**: 5 pilar misi madrasah berasaskan Ahlus Sunnah Wal Jama’ah dan Yayasan Islam Suada (YASUA).
   - **Sejarah Sejak 1949**: Dokumentasi 6 tokoh ulama & perintis madrasah.

3. **Layanan PPDB & Dokumen Digital:**
   - **Brosur Flyer Digital PPDB (Print-to-PDF)**: Modal brosur resmi lengkap dengan kop madrasah yang siap dicetak langsung atau disimpan sebagai file PDF ukuran A4 dari browser dengan sekali klik.
   - **Formulir PPDB Online Resmi**: Terintegrasi langsung dengan Google Form resmi madrasah.
   - **Google Drive Berkas**: Tautan langsung ke repositori dokumen sekolah.

4. **Komunikasi & Lokasi Interaktif:**
   - **WhatsApp Center Resmi**: Terintegrasi dengan nomor resmi panitia PPDB MTs. YASUA: **`+62 856-4988-1966`**.
   - **Formulir WhatsApp Otomatis**: Memformat pertanyaan wali murid (nama, asal sekolah, topik) dan otomatis membuka aplikasi WhatsApp panitia.
   - **Peta Lokasi Google Maps**: Sematan peta interaktif (*Google Maps embed*) dan tombol penunjuk arah GPS ke Desa Pilangwetan, Kebonagung, Demak.
   - **Galeri Media Sosial**: Tautan resmi ke Instagram [@mts.yasua_pilangwetan](https://www.instagram.com/mts.yasua_pilangwetan/) dan TikTok [@mtsyasuapilangwetan](https://www.tiktok.com/@mtsyasuapilangwetan).

5. **Optimasi Performa & Standar SEO:**
   - **Format Gambar WebP**: Seluruh gambar terkompresi hemat ~84% tanpa penurunan kualitas.
   - **Lazy Loading**: Gambar di bawah layar lipat (*below-the-fold*) dimuat secara cerdas saat digulir.
   - **Metadata & Open Graph Lengkap**: Pratinjau thumbnail resmi saat dibagikan ke WhatsApp dan media sosial.
   - **Schema.org Structured Data**: JSON-LD standar Google Search Console bertipe `MiddleSchool` (`EducationalOrganization`) dengan NPSN resmi: **20364357**.
   - **Vercel Production Headers**: Konfigurasi caching statis 1 tahun dan security headers di [`vercel.json`](file:///c:/Users/pc/Documents/APP/mts_yasua/vercel.json).

---

## 🚀 Cara Menjalankan

Karena file ini bersifat **HTML Standalone (Zero-Config)**:
1. Buka file [`index.html`](file:///c:/Users/pc/Documents/APP/mts_yasua/index.html) dengan klik dua kali di file explorer, atau
2. Jalankan lokal server ringan (misal menggunakan ekstensi *Live Server* di VS Code atau `python -m http.server 3000`), atau
3. Deploy langsung ke Vercel via CLI: `vercel --prod`.
