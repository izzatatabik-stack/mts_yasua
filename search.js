/**
 * MTs YASUA Pilangwetan - Interactive Live Search & Spotlight Modal Component
 * Features:
 * - Client-side real-time fuzzy/substring search
 * - Category filter tabs (Semua, PPDB, Program, Profil, Berita, Kontak)
 * - Keyboard navigation (Ctrl+K / Cmd+K to open, Escape to close, ArrowDown/Up to navigate, Enter to visit)
 * - Highlight matched keyword
 * - Responsive UI matching Islamic Emerald & Gold brand identity
 */

(function () {
  'use strict';

  // Comprehensive Search Database for MTs YASUA
  const SEARCH_DATABASE = [
    {
      title: "Pendaftaran Siswa Baru (PPDB Online 2026/2027)",
      category: "PPDB",
      categoryLabel: "PPDB Online",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      icon: "clipboard-check",
      url: "ppdb.html",
      snippet: "Informasi lengkap penerimaan santri/siswa baru MTs YASUA Pilangwetan. Jalur reguler, prestasi, dan tahfidz.",
      keywords: ["ppdb", "daftar", "pendaftaran", "siswa baru", "santri", "formulir", "biaya", "gratis", "gelombang", "beasiswa", "jadwal", "registrasi", "masuk"]
    },
    {
      title: "Syarat, Alur & Berkas Pendaftaran PPDB",
      category: "PPDB",
      categoryLabel: "PPDB Online",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      icon: "file-text",
      url: "ppdb.html#alur",
      snippet: "Syarat berkas pendaftaran: Fotokopi KK, Akta Kelahiran, Ijazah/SKL SD/MI, pas foto, serta alur pendaftaran mudah.",
      keywords: ["syarat", "persyaratan", "berkas", "kk", "kartu keluarga", "akta", "ijazah", "dokumen", "alur", "tahapan"]
    },
    {
      title: "Brosur Digital PPDB Resmi (Format Cetak PDF)",
      category: "PPDB",
      categoryLabel: "Brosur & Unduhan",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: "printer",
      action: "openBrochure",
      url: "javascript:void(0)",
      snippet: "Buka dan cetak brosur resmi flyer PPDB MTs YASUA ukuran A4 portrait siap print langsung dari browser.",
      keywords: ["brosur", "pdf", "cetak", "flyer", "leaflet", "pamflet", "unduh", "print", "download"]
    },
    {
      title: "Program Unggulan: Tahfidzul Qur'an & Tahsin",
      category: "Program",
      categoryLabel: "Pendidikan",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: "book-open",
      url: "program.html",
      snippet: "Bimbingan intensif hafalan Al-Qur'an juz 30 dan surat pilihan bersama asatidz hafidz/hafidzah bersanad.",
      keywords: ["tahfidz", "quran", "al-quran", "hafalan", "tahsin", "program unggulan", "santri", "tilawah", "murottal"]
    },
    {
      title: "Program Kajian Kitab Salaf (Kitab Kuning)",
      category: "Program",
      categoryLabel: "Pendidikan",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: "book",
      url: "program.html",
      snippet: "Pembelajaran ilmu fiqih, aqidah, akhlak, nahwu, dan shorof dengan metode madrosy dan sorogan pesantren.",
      keywords: ["kitab", "kuning", "salaf", "pesantren", "fiqih", "akhlak", "nahwu", "shorof", "santri", "kajian"]
    },
    {
      title: "Laboratorium Komputer & Penguasaan IT",
      category: "Program",
      categoryLabel: "Fasilitas & Teknologi",
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
      icon: "laptop",
      url: "program.html",
      snippet: "Fasilitas lab komputer ber-AC, pelatihan komputer dasar, literasi internet sehat, dan simulasi ANBK mandiri.",
      keywords: ["lab", "komputer", "it", "multimedia", "teknologi", "anbk", "fasilitas", "komputerisasi", "internet"]
    },
    {
      title: "Ekstrakurikuler: Pramuka, Drumband, Hadroh & PMR",
      category: "Program",
      categoryLabel: "Kesiswaan",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      icon: "sparkles",
      url: "ekskul.html",
      snippet: "Wadah pengembangan minat bakat santri dalam kepanduan Pramuka, korps musik Drumband, Hadroh Al-Banjari, dan PMR.",
      keywords: ["ekskul", "ekstrakurikuler", "pramuka", "drumband", "hadroh", "rebana", "pmr", "olahraga", "futsal", "bakat"]
    },
    {
      title: "Profil Madrasah, Visi, Misi & Sejarah",
      category: "Profil",
      categoryLabel: "Tentang Kami",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "compass",
      url: "profil.html",
      snippet: "Sejarah rintisan sejak 1949 di bawah naungan Yayasan Islam Suada (YASUA) Pilangwetan, Kebonagung, Demak.",
      keywords: ["visi", "misi", "tujuan", "sejarah", "profil", "yasua", "latar belakang", "1949", "yayasan", "suada", "npsn", "akreditasi"]
    },
    {
      title: "Sambutan Kepala Madrasah Tsanawiyah",
      category: "Profil",
      categoryLabel: "Pimpinan",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "user-check",
      url: "sambutan.html",
      snippet: "Arah kebijakan dan pesan penting Kepala Madrasah MTs YASUA mengenai sinergi akhlak, kecerdasan, dan teknologi.",
      keywords: ["sambutan", "kepala", "pimpinan", "madrasah", "kamad", "pesan", "kepala sekolah", "sambutan pimpinan"]
    },
    {
      title: "Dewan Guru & Tenaga Kependidikan",
      category: "Profil",
      categoryLabel: "Tenaga Pendidik",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "users",
      url: "guru.html",
      snippet: "Daftar bapak/ibu guru pengajar berpengalaman, berpendidikan linier S1/S2, dan berdedikasi tinggi membina santri.",
      keywords: ["guru", "pendidik", "ustadz", "ustadzah", "pengajar", "staf", "wali kelas", "tenaga kependidikan", "dewan guru"]
    },
    {
      title: "Kemitraan & Nota Kesepahaman (MOU)",
      category: "Profil",
      categoryLabel: "Kemitraan & Relasi",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
      icon: "handshake",
      url: "mou.html",
      snippet: "Jejaring kemitraan resmi dengan Kemenag Demak, Puskesmas, Polsek, BSI/BRI, pesantren, dan mitra dunia industri.",
      keywords: ["mou", "kemitraan", "kerjasama", "instansi", "puskesmas", "kemenag", "polsek", "bank", "bsi", "bri", "pesantren", "komite", "relasi"]
    },
    {
      title: "Kalender Islam & Jawa (Tri-Penanggalan Asnawiyyah)",
      category: "Program",
      categoryLabel: "Kalender Islam",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: "calendar",
      url: "kalender.html",
      snippet: "Tri-penanggalan Masehi, Hijriyah standar hisab LF PBNU, dan Pasaran Jawa (Legi, Pahing, Pon, Wage, Kliwon) serta jadwal puasa sunnah.",
      keywords: ["kalender", "hijriyah", "pasaran", "jawa", "legi", "pahing", "pon", "wage", "kliwon", "puasa", "ayyamul bidh", "senin kamis", "phbi", "pbnu"]
    },
    {
      title: "Jadwal & Agenda Rutinitas Santri",
      category: "Program",
      categoryLabel: "Jadwal KBM",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: "clock",
      url: "agenda.html",
      snippet: "Jadwal kegiatan belajar mengajar (KBM), rutinitas pembiasaan santri harian, dan agenda tahunan madrasah.",
      keywords: ["agenda", "jadwal", "kegiatan", "akademik", "matsama", "kemah", "anbk", "pts", "pas", "phbi", "hari santri"]
    },
    {
      title: "Prestasi Siswa MTs YASUA (Galeri Juara)",
      category: "Program",
      categoryLabel: "Prestasi Siswa",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      icon: "trophy",
      url: "prestasi.html",
      snippet: "Daftar juara sains madrasah (KSM), MTQ, kaligrafi kontemporer, festival drumband, dan beasiswa prestasi yayasan.",
      keywords: ["prestasi", "juara", "trofi", "ksm", "mtq", "kaligrafi", "drumband", "silat", "pramuka", "beasiswa", "medali", "lomba"]
    },
    {
      title: "Portal Alumni MTs YASUA (IKAMAS)",
      category: "Program",
      categoryLabel: "Jejaring Alumni",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      icon: "graduation-cap",
      url: "alumni.html",
      snippet: "Ikatan Alumni MTs YASUA (IKAMAS), tracer study sebaran lulusan, kisah inspiratif santri, dan registrasi alumni.",
      keywords: ["alumni", "ikamas", "tracer", "lulusan", "reuni", "pesantren", "mahasiswa", "kisah sukses", "pendataan alumni"]
    },
    {
      title: "Berita: Penilaian Tengah Semester (PTS) TA 2026/2027",
      category: "Berita",
      categoryLabel: "Pengumuman",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "newspaper",
      url: "berita.html",
      snippet: "Jadwal dan pengumuman pelaksanaan PTS Gasal terpadu bagi seluruh santri kelas VII, VIII, dan IX.",
      keywords: ["berita", "pts", "ujian", "penilaian", "tengah semester", "pengumuman", "jadwal", "akademik", "gasal"]
    },
    {
      title: "Prestasi: Siswa Raih Juara 1 Olimpiade Sains & Robotika",
      category: "Berita",
      categoryLabel: "Prestasi Siswa",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: "trophy",
      url: "berita.html",
      snippet: "Delegasi siswa MTs YASUA harumkan nama madrasah dengan meraih Juara 1 tingkat Provinsi Jawa Tengah.",
      keywords: ["prestasi", "juara", "olimpiade", "sains", "robotika", "lomba", "penghargaan", "provinsi", "jawa tengah"]
    },
    {
      title: "Berita: Workshop Parenting Akbar & Silaturahmi Wali Siswa",
      category: "Berita",
      categoryLabel: "Kegiatan Madrasah",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      icon: "heart-handshake",
      url: "berita.html",
      snippet: "Sinergi erat antara komite madrasah, dewan asatidz, dan wali murid dalam mendidik putra-putri berakhlak Qur'ani.",
      keywords: ["parenting", "wali siswa", "orang tua", "workshop", "silaturahmi", "komite", "pertemuan", "wali murid"]
    },
    {
      title: "Galeri Foto & Dokumentasi Media Sosial",
      category: "Berita",
      categoryLabel: "Dokumentasi",
      badgeColor: "bg-pink-100 text-pink-800 border-pink-200",
      icon: "camera",
      url: "galeri.html",
      snippet: "Kumpulan dokumentasi foto dan video kegiatan madrasah, sholat berjamaah, upacara, dan aktivitas santri.",
      keywords: ["galeri", "foto", "video", "dokumentasi", "kegiatan", "instagram", "tiktok", "suasana"]
    },
    {
      title: "Kontak Resmi, WhatsApp & Peta Lokasi Madrasah",
      category: "Kontak",
      categoryLabel: "Hubungi Kami",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
      icon: "map-pin",
      url: "kontak.html",
      snippet: "Lokasi di Jl. Pilangwetan, Kebonagung, Demak (59583). Hubungi admin madrasah langsung via WhatsApp resmi.",
      keywords: ["kontak", "alamat", "lokasi", "telepon", "whatsapp", "wa", "maps", "kebonagung", "demak", "email", "hubungi", "peta"]
    }
  ];

  // State
  let currentActiveCategory = 'Semua';
  let activeIndex = -1;
  let currentResults = [];

  // Create & Inject Modal Template into DOM
  function injectSearchModal() {
    if (document.getElementById('siteSearchModal')) return;

    const modalHTML = `
      <div id="siteSearchModal"
        class="fixed inset-0 z-50 hidden bg-slate-950/65 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 sm:pt-20 transition-all duration-200 animate-fadeIn"
        role="dialog" aria-modal="true" aria-labelledby="siteSearchInput">
        
        <!-- Modal Card Container -->
        <div id="siteSearchCard"
          class="w-full max-w-2xl bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(6,95,70,0.25)] border border-emerald-100 overflow-hidden flex flex-col max-h-[85vh] transition-all transform duration-200">
          
          <!-- Search Header Input -->
          <div class="relative px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-emerald-50/50 via-white to-white">
            <div class="w-10 h-10 rounded-2xl bg-emerald-100/80 text-brand-primary flex items-center justify-center shrink-0">
              <i data-lucide="search" class="w-5 h-5 text-brand-primary"></i>
            </div>
            
            <input type="text" id="siteSearchInput"
              class="w-full bg-transparent text-slate-900 placeholder:text-slate-400 font-semibold text-sm sm:text-base outline-none pr-8"
              placeholder="Cari info, syarat PPDB, program, guru, berita..."
              autocomplete="off" spellcheck="false">
              
            <!-- Clear Button -->
            <button id="siteSearchClearBtn" type="button"
              class="hidden text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              title="Bersihkan">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <!-- Close ESC Badge -->
            <button onclick="closeSearchModal()" type="button"
              class="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
              title="Tutup pencarian (ESC)">
              <span>ESC</span>
            </button>
            <button onclick="closeSearchModal()" type="button"
              class="sm:hidden text-slate-400 hover:text-slate-700 p-1.5"
              aria-label="Tutup">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Category Filter Tabs -->
          <div class="px-4 sm:px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold text-slate-600">
            <span class="text-[10px] uppercase tracking-wider text-slate-600 mr-1 hidden sm:inline">Kategori:</span>
            <button type="button" data-cat="Semua"
              class="search-filter-btn px-3 py-1 rounded-full bg-brand-primary text-white transition-all shadow-xs shrink-0 cursor-pointer">Semua</button>
            <button type="button" data-cat="PPDB"
              class="search-filter-btn px-3 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-600 hover:text-brand-primary border border-slate-200/80 transition-all shrink-0 cursor-pointer">PPDB Online</button>
            <button type="button" data-cat="Program"
              class="search-filter-btn px-3 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-600 hover:text-brand-primary border border-slate-200/80 transition-all shrink-0 cursor-pointer">Program &amp; Ekskul</button>
            <button type="button" data-cat="Profil"
              class="search-filter-btn px-3 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-600 hover:text-brand-primary border border-slate-200/80 transition-all shrink-0 cursor-pointer">Profil &amp; Guru</button>
            <button type="button" data-cat="Berita"
              class="search-filter-btn px-3 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-600 hover:text-brand-primary border border-slate-200/80 transition-all shrink-0 cursor-pointer">Berita</button>
            <button type="button" data-cat="Kontak"
              class="search-filter-btn px-3 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-600 hover:text-brand-primary border border-slate-200/80 transition-all shrink-0 cursor-pointer">Kontak</button>
          </div>

          <!-- Results Scroll Area -->
          <div id="siteSearchResultsList" class="p-3 sm:p-4 overflow-y-auto max-h-[55vh] space-y-1.5 focus:outline-none">
            <!-- Dynamic content injected here -->
          </div>

          <!-- Modal Footer / Navigation Helpers -->
          <div class="px-4 sm:px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center gap-1"><kbd class="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold text-[10px]">↑↓</kbd> Navigasi</span>
              <span class="inline-flex items-center gap-1"><kbd class="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold text-[10px]">↵</kbd> Buka</span>
              <span class="inline-flex items-center gap-1"><kbd class="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-semibold text-[10px]">ESC</kbd> Tutup</span>
            </div>
            <div class="flex items-center gap-1.5 font-bold text-emerald-700">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500"></i>
              <span>MTs YASUA Search</span>
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Bind events
    setupSearchEvents();
  }

  // Setup DOM Event Listeners
  function setupSearchEvents() {
    const modal = document.getElementById('siteSearchModal');
    const input = document.getElementById('siteSearchInput');
    const clearBtn = document.getElementById('siteSearchClearBtn');
    const filterBtns = document.querySelectorAll('.search-filter-btn');

    if (!input || !modal) return;

    // Input live typing
    input.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearBtn.classList.toggle('hidden', q.length === 0);
      performSearch(q, currentActiveCategory);
    });

    // Clear input
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.classList.add('hidden');
      input.focus();
      performSearch('', currentActiveCategory);
    });

    // Category button filter
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.className = 'search-filter-btn px-3 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-600 hover:text-brand-primary border border-slate-200/80 transition-all shrink-0 cursor-pointer';
        });
        btn.className = 'search-filter-btn px-3 py-1 rounded-full bg-brand-primary text-white transition-all shadow-xs shrink-0 cursor-pointer';
        currentActiveCategory = btn.getAttribute('data-cat') || 'Semua';
        performSearch(input.value.trim(), currentActiveCategory);
      });
    });

    // Backdrop click close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeSearchModal();
      }
    });

    // Keyboard navigation (Arrow keys & Enter) inside input
    input.addEventListener('keydown', handleKeyNavigation);
  }

  // Key Navigation (ArrowUp, ArrowDown, Enter)
  function handleKeyNavigation(e) {
    const items = document.querySelectorAll('.search-result-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < items.length) {
        items[activeIndex].click();
      } else if (items.length > 0) {
        items[0].click();
      }
    }
  }

  function updateActiveItem(items) {
    items.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add('bg-emerald-50', 'border-emerald-300', 'ring-2', 'ring-emerald-400/30');
        item.classList.remove('bg-white', 'border-slate-100');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        item.classList.remove('bg-emerald-50', 'border-emerald-300', 'ring-2', 'ring-emerald-400/30');
        item.classList.add('bg-white', 'border-slate-100');
      }
    });
  }

  // Highlight Matched Substring
  function highlightText(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<span class="bg-amber-200 text-slate-900 px-0.5 rounded font-bold">$1</span>');
  }

  // Search execution
  function performSearch(query, category) {
    const container = document.getElementById('siteSearchResultsList');
    if (!container) return;

    activeIndex = -1;

    // Filter by category first
    let pool = SEARCH_DATABASE;
    if (category && category !== 'Semua') {
      pool = pool.filter(item => item.category === category);
    }

    // If query is empty, show Quick Recommendations
    if (!query) {
      renderEmptyStateRecommendations(container, pool);
      if (window.lucide) lucide.createIcons();
      return;
    }

    const q = query.toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);

    // Scoring & Filtering
    const matches = [];
    pool.forEach(item => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const snippetLower = item.snippet.toLowerCase();
      const categoryLower = item.categoryLabel.toLowerCase();
      const kwLower = item.keywords.join(' ').toLowerCase();

      // Exact title match high priority
      if (titleLower.includes(q)) score += 100;
      if (snippetLower.includes(q)) score += 40;
      if (categoryLower.includes(q)) score += 30;

      // Word match
      words.forEach(word => {
        if (titleLower.includes(word)) score += 25;
        if (snippetLower.includes(word)) score += 15;
        if (kwLower.includes(word)) score += 20;
      });

      if (score > 0) {
        matches.push({ item, score });
      }
    });

    matches.sort((a, b) => b.score - a.score);
    currentResults = matches.map(m => m.item);

    // Render results
    if (matches.length === 0) {
      container.innerHTML = `
        <div class="py-10 text-center px-4">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
            <i data-lucide="search-x" class="w-6 h-6"></i>
          </div>
          <h4 class="font-bold text-slate-800 text-sm mb-1">Informasi Tidak Ditemukan</h4>
          <p class="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Tidak ada halaman atau artikel yang cocok dengan kata kunci "<strong>${escapeHtml(query)}</strong>".
          </p>
          <div class="flex items-center justify-center gap-2">
            <a href="https://wa.me/6285649881966?text=${encodeURIComponent('Assalamu’alaikum admin MTs YASUA, saya mencari info mengenai: ' + query)}"
              target="_blank" rel="noopener"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white font-bold text-xs hover:bg-brand-dark transition-colors shadow-sm">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span>Tanyakan Panitia via WhatsApp</span>
            </a>
          </div>
        </div>
      `;
    } else {
      let html = `
        <div class="px-2 pb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-600">
          <span>DITEMUKAN ${matches.length} HASIL</span>
          <span class="text-[10px] text-slate-600 font-normal">Tekan ↑↓ untuk memilih</span>
        </div>
      `;

      matches.forEach(({ item }, index) => {
        const highlightedTitle = highlightText(escapeHtml(item.title), query);
        const highlightedSnippet = highlightText(escapeHtml(item.snippet), query);

        const clickHandler = item.action === 'openBrochure'
          ? `closeSearchModal(); if (typeof openBrochureModal === 'function') openBrochureModal();`
          : `window.location.href = '${item.url}'`;

        html += `
          <div onclick="${clickHandler}"
            data-index="${index}"
            class="search-result-item group p-3 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer flex items-start gap-3 shadow-2xs">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 text-brand-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 group-hover:bg-emerald-100 transition-all">
              <i data-lucide="${item.icon}" class="w-4 h-4 text-brand-primary"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${item.badgeColor}">
                  ${item.categoryLabel}
                </span>
                <h4 class="font-bold text-slate-800 text-xs sm:text-[13px] group-hover:text-brand-primary transition-colors truncate">
                  ${highlightedTitle}
                </h4>
              </div>
              <p class="text-[11.5px] text-slate-500 line-clamp-2 leading-relaxed">
                ${highlightedSnippet}
              </p>
            </div>
            <div class="text-slate-300 group-hover:text-brand-primary transition-colors shrink-0 self-center">
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    }

    if (window.lucide) lucide.createIcons();
  }

  // Render Initial Popular Suggestions
  function renderEmptyStateRecommendations(container, pool) {
    let html = `
      <div class="px-2 py-1 text-[11px] font-black tracking-wider text-slate-600 uppercase flex items-center gap-1.5">
        <i data-lucide="flame" class="w-3.5 h-3.5 text-amber-500"></i>
        <span>Pencarian Populer &amp; Rekomendasi</span>
      </div>
    `;

    // Take first 5 items from pool
    const suggestions = pool.slice(0, 5);
    suggestions.forEach((item, index) => {
      const clickHandler = item.action === 'openBrochure'
        ? `closeSearchModal(); if (typeof openBrochureModal === 'function') openBrochureModal();`
        : `window.location.href = '${item.url}'`;

      html += `
        <div onclick="${clickHandler}"
          data-index="${index}"
          class="search-result-item group p-3 rounded-2xl bg-white hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 group-hover:text-brand-primary transition-colors">
              <i data-lucide="${item.icon}" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-bold text-xs text-slate-800 group-hover:text-brand-primary transition-colors truncate">
                  ${escapeHtml(item.title)}
                </span>
                <span class="text-[9.5px] px-1.5 py-0.2 rounded font-semibold text-slate-600 bg-slate-100 hidden sm:inline">
                  ${item.categoryLabel}
                </span>
              </div>
              <p class="text-[11px] text-slate-600 truncate">${escapeHtml(item.snippet)}</p>
            </div>
          </div>
          <span class="text-[11px] font-bold text-emerald-700 group-hover:translate-x-1 transition-transform shrink-0 flex items-center gap-0.5">
            Buka <i data-lucide="arrow-right" class="w-3 h-3"></i>
          </span>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Global Trigger Functions
  window.openSearchModal = function () {
    injectSearchModal();
    const modal = document.getElementById('siteSearchModal');
    const input = document.getElementById('siteSearchInput');

    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Reset search
    if (input) {
      input.value = '';
      const clearBtn = document.getElementById('siteSearchClearBtn');
      if (clearBtn) clearBtn.classList.add('hidden');
      performSearch('', currentActiveCategory);
      setTimeout(() => {
        input.focus();
      }, 50);
    }

    if (window.lucide) lucide.createIcons();
  };

  window.closeSearchModal = function () {
    const modal = document.getElementById('siteSearchModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  };

  // Keyboard shortcut listener (Ctrl+K, Cmd+K, or '/')
  window.addEventListener('keydown', (e) => {
    // Escape to close
    if (e.key === 'Escape') {
      const modal = document.getElementById('siteSearchModal');
      if (modal && !modal.classList.contains('hidden')) {
        closeSearchModal();
      }
    }

    // Ctrl+K or Cmd+K or press '/' when not typing in an input
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const modal = document.getElementById('siteSearchModal');
      if (modal && !modal.classList.contains('hidden')) {
        closeSearchModal();
      } else {
        openSearchModal();
      }
    }

    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      openSearchModal();
    }
  });

  // Auto-inject modal when DOM ready so it's always responsive
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSearchModal);
  } else {
    injectSearchModal();
  }

})();
