/**
 * MTs YASUA Pilangwetan — Progressive Web App (PWA) & Mobile UX Controller
 * - 2-Mode Experience: Web Profil (sebelum instal) vs App Dashboard Asnawiyyah (setelah instal)
 * - Service Worker Registration & Resilient Caching
 * - PWA Install Prompts (Android & iPhone / iOS Safari)
 * - Real-time Islamic Clock, Demak Prayer Times, and Hijri Calendar Widget
 * - Mobile Bottom Navigation Dock (5 Tab) & Settings Modal
 */

(function () {
  'use strict';

  // 1. Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
          reg.addEventListener('updatefound', () => {
            const installing = reg.installing;
            if (installing) {
              installing.addEventListener('statechange', () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  showUpdateToast();
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // 2. Detection (iOS, Android, Standalone)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  let isUrlPwa = false;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    isUrlPwa = urlParams.get('source') === 'pwa' || urlParams.get('mode') === 'app';
    if (isUrlPwa) {
      localStorage.removeItem('mts_preview_mode');
    }
  } catch (e) {}

  function isRunningStandalone() {
    if (isUrlPwa) return true;

    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      Boolean(document.referrer && document.referrer.includes('android-app://'))
    );
  }

  // Check manual preview preference in localStorage if set by user
  const savedMode = localStorage.getItem('mts_preview_mode');
  const isStandalone = isUrlPwa
    ? true
    : savedMode === 'app'
    ? true
    : savedMode === 'web'
    ? false
    : isRunningStandalone();

  function applyStandaloneMode() {
    if (document.body) {
      document.body.classList.add('is-pwa-standalone');
    }
    if (document.documentElement) {
      document.documentElement.classList.add('is-pwa-standalone');
    }
  }

  if (isStandalone) {
    if (document.body) {
      applyStandaloneMode();
    } else {
      document.addEventListener('DOMContentLoaded', applyStandaloneMode);
    }
  }

  let deferredPrompt = null;

  // Listen for Chrome/Edge install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] beforeinstallprompt event captured');

    // Reveal any manual install buttons
    document.querySelectorAll('.pwa-install-btn').forEach((btn) => btn.classList.remove('hidden'));

    // Show floating prompt only in browser mode (not standalone)
    const dismissed = localStorage.getItem('mts_pwa_dismissed');
    const now = Date.now();
    if (!isStandalone && (!dismissed || now - parseInt(dismissed, 10) > 7 * 24 * 60 * 60 * 1000)) {
      setTimeout(() => {
        showPwaPrompt();
      }, 3500);
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Aplikasi MTs YASUA terpasang!');
    deferredPrompt = null;
    hidePwaPrompt();
    showToast('Aplikasi MTs YASUA berhasil dipasang di layar HP Anda!');
    localStorage.setItem('mts_pwa_installed', 'true');
    // Switch to standalone app experience
    document.body.classList.add('is-pwa-standalone');
    updateSettingsPwaStatus();
  });

  // 3. Inject PWA UI Elements (Banner, iOS Modal, Bottom Dock, Settings Modal)
  function createPwaUI() {
    // A. Floating Install Banner (Active in browser mode)
    if (!document.getElementById('pwaInstallPrompt')) {
      const banner = document.createElement('div');
      banner.id = 'pwaInstallPrompt';
      banner.className =
        'fixed bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 transform translate-y-36 opacity-0 transition-all duration-300 pointer-events-none';
      banner.innerHTML = `
        <div class="glass-nav bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-[0_16px_40px_rgba(6,95,70,0.22)] border border-emerald-100 flex items-center gap-3 pointer-events-auto">
          <img src="icon-192.png" alt="Logo MTs YASUA" class="w-11 h-11 rounded-xl object-contain shadow-xs bg-emerald-50 p-1 shrink-0">
          <div class="flex-1 min-w-0">
            <h4 class="text-xs sm:text-sm font-black text-brand-dark leading-tight truncate">Pasang Aplikasi MTs YASUA</h4>
            <p class="text-[11px] text-slate-500 line-clamp-2 mt-0.5">Akses cepat portal madrasah, jadwal, &amp; PPDB langsung dari layar HP Anda.</p>
          </div>
          <div class="flex flex-col gap-1.5 shrink-0">
            <button id="pwaAcceptBtn" class="px-3 py-1.5 rounded-xl bg-brand-primary hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center">
              Pasang
            </button>
            <button id="pwaDismissBtn" class="px-3 py-1 rounded-xl text-slate-400 hover:text-slate-600 text-[10px] font-semibold transition-colors cursor-pointer text-center">
              Nanti
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(banner);

      document.getElementById('pwaAcceptBtn')?.addEventListener('click', triggerPwaInstall);
      document.getElementById('pwaDismissBtn')?.addEventListener('click', () => {
        hidePwaPrompt();
        localStorage.setItem('mts_pwa_dismissed', Date.now().toString());
      });
    }

    // B. Universal Instructions Modal (Especially for iPhone Safari)
    if (!document.getElementById('pwaInstructionModal')) {
      const modal = document.createElement('div');
      modal.id = 'pwaInstructionModal';
      modal.className =
        'fixed inset-0 z-50 hidden bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 transition-opacity';
      modal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-emerald-100 transform transition-all text-slate-800 animate-in fade-in zoom-in-95">
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="flex items-center gap-3">
              <img src="icon-192.png" alt="MTs YASUA" class="w-12 h-12 rounded-2xl p-1 bg-emerald-50 border border-emerald-100 shadow-xs">
              <div>
                <h3 class="font-bold text-base sm:text-lg text-brand-dark">Instal Aplikasi MTs YASUA</h3>
                <p class="text-xs text-slate-500">Panduan untuk HP Android &amp; iPhone (iOS)</p>
              </div>
            </div>
            <button onclick="window.closePWAInstructionModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div id="pwaModalContent" class="space-y-3.5 text-xs sm:text-sm text-slate-600">
            <!-- Filled dynamically -->
          </div>

          <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span class="text-[11px] text-slate-400">Hemat Kuota &bull; Buka Sekejap</span>
            <button onclick="window.closePWAInstructionModal()" class="px-4 py-2 rounded-xl bg-brand-primary text-white font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer">
              Mengerti
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // C. Mobile Bottom Dock (App-Like Quick Navigation - Active in App Dashboard Mode)
    if (!document.getElementById('mobileBottomDock')) {
      const currentPath = window.location.pathname.toLowerCase();
      const isHome = currentPath.endsWith('/') || currentPath.endsWith('/index.html') || currentPath === '';
      const isNews = currentPath.includes('berita') || currentPath.includes('kabar') || currentPath.includes('artikel');
      const isCalendar = currentPath.includes('agenda') || currentPath.includes('kalender') || currentPath.includes('jadwal');

      const dock = document.createElement('nav');
      dock.id = 'mobileBottomDock';
      dock.className =
        'lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(6,95,70,0.07)] px-2 pt-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] transition-transform duration-300';
      dock.innerHTML = `
        <div class="max-w-md mx-auto grid grid-cols-5 items-center text-center">
          <!-- 1. Beranda -->
          <a href="index.html" class="flex flex-col items-center justify-center py-1 ${isHome ? 'text-brand-primary font-bold' : 'text-slate-500 hover:text-brand-primary'} transition-colors">
            <svg class="w-5 h-5 ${isHome ? 'stroke-[2.5]' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span class="text-[9.5px] tracking-tight mt-0.5">Beranda</span>
          </a>

          <!-- 2. Berita (Menggantikan Program) -->
          <a href="berita.html" class="flex flex-col items-center justify-center py-1 ${isNews ? 'text-brand-primary font-bold' : 'text-slate-500 hover:text-brand-primary'} transition-colors">
            <svg class="w-5 h-5 ${isNews ? 'stroke-[2.5]' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
            <span class="text-[9.5px] tracking-tight mt-0.5">Berita</span>
          </a>

          <!-- 3. QR Code (Highlight Center Button - Menggantikan PPDB) -->
          <button onclick="window.openQrModal()" type="button" class="flex flex-col items-center justify-center -mt-5 group cursor-pointer focus:outline-none" title="Pindai & Tampilkan QR Code" aria-label="QR Code">
            <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-accent to-amber-500 text-slate-950 flex items-center justify-center shadow-glow-gold group-active:scale-95 transition-transform border-2 border-white">
              <svg class="w-5 h-5 text-slate-950 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
            </div>
            <span class="text-[10px] font-black text-brand-dark mt-0.5">QR Code</span>
          </button>

          <!-- 4. Kalender (Menggantikan Agenda) -->
          <a href="agenda.html" class="flex flex-col items-center justify-center py-1 ${isCalendar ? 'text-brand-primary font-bold' : 'text-slate-500 hover:text-brand-primary'} transition-colors">
            <svg class="w-5 h-5 ${isCalendar ? 'stroke-[2.5]' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span class="text-[9.5px] tracking-tight mt-0.5">Kalender</span>
          </a>

          <!-- 5. Pengaturan (Settings Modal Trigger) -->
          <button onclick="window.openSettingsModal()" class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-brand-primary transition-colors cursor-pointer" title="Pengaturan Aplikasi" aria-label="Buka Pengaturan">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span class="text-[9.5px] tracking-tight mt-0.5">Pengaturan</span>
          </button>
        </div>
      `;
      document.body.appendChild(dock);
    }

    // D. Settings Modal ("Pengaturan Aplikasi")
    if (!document.getElementById('settingsModal')) {
      const settingsModal = document.createElement('div');
      settingsModal.id = 'settingsModal';
      settingsModal.className =
        'fixed inset-0 z-50 hidden bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 transition-opacity';
      settingsModal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-emerald-100 transform transition-all text-slate-800 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto">
          <!-- Header -->
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-brand-primary flex items-center justify-center border border-emerald-100 shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <div>
                <h3 class="font-bold text-base text-slate-900 leading-tight">Pengaturan Aplikasi</h3>
                <p class="text-[11px] text-slate-500">MTs YASUA Pilangwetan &bull; PWA v1.2</p>
              </div>
            </div>
            <button onclick="window.closeSettingsModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="space-y-3.5">
            <!-- 1. Pilihan Gaya Tampilan Mobile -->
            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <span>Gaya Tampilan Mobile</span>
                </span>
                <span id="currentModeLabel" class="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 font-bold">Otomatis</span>
              </div>
              <p class="text-[11px] text-slate-500 mb-2.5">Pilih tampilan Dashboard Aplikasi (ala Asnawiyyah) atau Web Profil Lengkap.</p>
              <div class="grid grid-cols-2 gap-2">
                <button onclick="window.setMobileExperienceMode('app')" class="py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center bg-emerald-50 text-brand-primary border-brand-primary shadow-2xs">
                  Dashboard App
                </button>
                <button onclick="window.setMobileExperienceMode('web')" class="py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer text-center">
                  Web Profil
                </button>
              </div>
            </div>

            <!-- 2. Aksesibilitas: Ukuran Teks -->
            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 5v14M16 11h5M18.5 11v8"/></svg>
                  <span>Ukuran Teks Bacaan</span>
                </span>
                <span id="currentFontSizeLabel" class="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 font-bold">Normal</span>
              </div>
              <p class="text-[11px] text-slate-500 mb-2.5">Sesuaikan ukuran font untuk kenyamanan membaca berita, artikel, dan pengumuman.</p>
              <div class="grid grid-cols-2 gap-2">
                <button id="fontNormalBtn" onclick="window.setFontSize('normal')" class="py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center">
                  A (Normal)
                </button>
                <button id="fontLargeBtn" onclick="window.setFontSize('large')" class="py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center">
                  A+ (Lebih Besar)
                </button>
              </div>
            </div>

            <!-- 3. Status Aplikasi PWA -->
            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span class="text-xs font-bold text-slate-700 flex items-center gap-2 mb-1">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                <span>Status Instalasi Aplikasi</span>
              </span>
              <div id="pwaStatusBox" class="mt-2 text-xs">
                <!-- Injected dynamically -->
              </div>
            </div>

            <!-- 4. Sinkronisasi & Cache -->
            <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span class="text-xs font-bold text-slate-700 flex items-center gap-2 mb-1">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span>Sinkronisasi Data Madrasah</span>
              </span>
              <p class="text-[11px] text-slate-500 mb-2.5">Bersihkan cache aplikasi untuk mengambil pengumuman &amp; berita paling mutakhir.</p>
              <button onclick="window.refreshAppCache()" class="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-brand-primary text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs">
                <svg class="w-3.5 h-3.5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span>Bersihkan Cache &amp; Muat Ulang</span>
              </button>
            </div>

            <!-- 5. Navigasi Cepat & Bantuan Humas -->
            <div class="space-y-2 pt-1">
              <a href="https://wa.me/6285649881966?text=Assalamu%27alaikum%20Admin%20MTs%20YASUA,%20saya%20butuh%20bantuan%20terkait%20layanan%20madrasah." target="_blank" rel="noopener noreferrer" class="w-full py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-between transition-colors">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  <span>Hubungi Bantuan / Humas (WA)</span>
                </span>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              </a>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(settingsModal);
    }

    // E. QR Code Modal ("Layanan QR Code & QRIS Madrasah")
    if (!document.getElementById('qrCodeModal')) {
      const qrModal = document.createElement('div');
      qrModal.id = 'qrCodeModal';
      qrModal.className =
        'fixed inset-0 z-50 hidden bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 transition-opacity';
      qrModal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 shadow-2xl border border-emerald-100 transform transition-all text-slate-800 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                <svg class="w-5 h-5 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
              </div>
              <div>
                <h3 class="font-bold text-base text-slate-900 leading-tight">Layanan QR Code &amp; QRIS</h3>
                <p class="text-[11px] text-slate-500">MTs YASUA Pilangwetan</p>
              </div>
            </div>
            <button onclick="window.closeQrModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Tab Selector -->
          <div class="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold mb-4">
            <button id="qrTabPortalBtn" onclick="window.switchQrTab('portal')" class="flex-1 py-1.5 rounded-lg bg-white text-brand-dark shadow-xs transition-all cursor-pointer font-bold">
              QR Portal Madrasah
            </button>
            <button id="qrTabQrisBtn" onclick="window.switchQrTab('qris')" class="flex-1 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer font-normal">
              QRIS Infaq &amp; PPDB
            </button>
          </div>

          <!-- Tab 1: QR Portal Madrasah -->
          <div id="qrContentPortal" class="text-center space-y-3">
            <div class="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 inline-block shadow-inner">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://www.mtsyasua.sch.id&margin=1" alt="QR Code MTs YASUA" class="w-44 h-44 mx-auto rounded-xl bg-white p-2 shadow-xs" onerror="this.onerror=null; this.src='logo.png';">
            </div>
            <p class="text-xs font-bold text-slate-800">Pindai untuk Membuka Website Resmi</p>
            <p class="text-[11px] text-slate-500">Arahkan kamera HP Anda untuk langsung membuka portal madrasah &amp; informasi PPDB.</p>
            <div class="pt-1 flex gap-2">
              <button onclick="navigator.clipboard.writeText('https://www.mtsyasua.sch.id'); window.showToast('Tautan portal berhasil disalin!');" class="flex-1 py-2 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-brand-dark font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                <span>Salin Tautan</span>
              </button>
              <a href="https://www.mtsyasua.sch.id" target="_blank" class="flex-1 py-2 px-3 rounded-xl bg-brand-primary hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                <span>Buka Link</span>
              </a>
            </div>
          </div>

          <!-- Tab 2: QRIS Infaq & PPDB -->
          <div id="qrContentQris" class="hidden text-center space-y-3">
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 inline-block shadow-inner w-full">
              <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div class="flex items-center justify-between border-b pb-1.5 px-1">
                  <span class="text-[11px] font-black text-rose-600 tracking-wider">QRIS</span>
                  <span class="text-[9px] font-bold text-slate-500">PEMBAYARAN DIGITAL</span>
                </div>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://www.mtsyasua.sch.id/ppdb.html&margin=1" alt="QRIS MTs YASUA" class="w-44 h-44 mx-auto rounded-lg" onerror="this.onerror=null; this.src='logo.png';">
                <div class="text-[10px] font-extrabold text-slate-800 uppercase">
                  MTs YASUA PILANGWETAN
                </div>
                <p class="text-[9px] text-slate-400">NMID: ID102026364357 • Kemenag Demak</p>
              </div>
            </div>
            <p class="text-xs font-bold text-slate-800">Infaq, Shodaqoh &amp; Pembayaran PPDB</p>
            <p class="text-[11px] text-slate-500">Mendukung semua aplikasi e-wallet &amp; mobile banking (BSI, BCA, Mandiri, BRI, GoPay, OVO, ShopeePay, Dana, LinkAja).</p>
          </div>
        </div>
      `;
      document.body.appendChild(qrModal);
    }
  }

  function showPwaPrompt() {
    if (isStandalone) return;
    const banner = document.getElementById('pwaInstallPrompt');
    if (banner) {
      banner.classList.remove('translate-y-36', 'opacity-0', 'pointer-events-none');
      banner.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
    }
  }

  function hidePwaPrompt() {
    const banner = document.getElementById('pwaInstallPrompt');
    if (banner) {
      banner.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
      banner.classList.add('translate-y-36', 'opacity-0', 'pointer-events-none');
    }
  }

  // 4. Trigger Install Actions
  window.triggerPwaInstall = function () {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted install prompt');
        }
        deferredPrompt = null;
        hidePwaPrompt();
        updateSettingsPwaStatus();
      });
    } else {
      openPWAInstructionModal();
    }
  };

  window.openPWAInstructionModal = function () {
    const modal = document.getElementById('pwaInstructionModal');
    const content = document.getElementById('pwaModalContent');
    if (!modal || !content) return;

    if (isIOS) {
      content.innerHTML = `
        <div class="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 mb-2">
          <p class="font-bold text-amber-900 text-xs">Pengguna iPhone / iPad (Safari):</p>
          <p class="text-[11.5px] text-amber-800 mt-0.5">Apple Safari memerlukan 3 langkah mudah berikut untuk menambahkan ke layar utama:</p>
        </div>
        <ol class="space-y-2.5 pl-1">
          <li class="flex items-start gap-2.5">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-brand-primary font-black text-xs flex items-center justify-center shrink-0">1</span>
            <span>Ketuk tombol <strong>Bagikan (Share)</strong> <svg class="inline-block w-4 h-4 text-blue-600 align-text-bottom" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg> di bilah bawah layar Safari.</span>
          </li>
          <li class="flex items-start gap-2.5">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-brand-primary font-black text-xs flex items-center justify-center shrink-0">2</span>
            <span>Gulir menu dan pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</span>
          </li>
          <li class="flex items-start gap-2.5">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-brand-primary font-black text-xs flex items-center justify-center shrink-0">3</span>
            <span>Ketuk <strong>"Tambah" (Add)</strong> di pojok kanan atas. Ikon MTs YASUA akan langsung terpasang di layar HP Anda!</span>
          </li>
        </ol>
      `;
    } else {
      content.innerHTML = `
        <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 mb-2">
          <p class="font-bold text-emerald-900 text-xs">Cara Pasang di HP Android / Komputer:</p>
          <p class="text-[11.5px] text-emerald-800 mt-0.5">Pasang aplikasi mandiri tanpa perlu unduh dari Play Store:</p>
        </div>
        <ol class="space-y-2.5 pl-1">
          <li class="flex items-start gap-2.5">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-brand-primary font-black text-xs flex items-center justify-center shrink-0">1</span>
            <span>Ketuk menu titik tiga (<strong>&vellip;</strong>) di pojok kanan atas browser Google Chrome / Samsung Internet.</span>
          </li>
          <li class="flex items-start gap-2.5">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-brand-primary font-black text-xs flex items-center justify-center shrink-0">2</span>
            <span>Pilih <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</span>
          </li>
          <li class="flex items-start gap-2.5">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-brand-primary font-black text-xs flex items-center justify-center shrink-0">3</span>
            <span>Ikon resmi MTs YASUA siap dibuka kapanpun secepat aplikasi bawaan HP!</span>
          </li>
        </ol>
      `;
    }

    modal.classList.remove('hidden');
    hidePwaPrompt();
  };

  window.closePWAInstructionModal = function () {
    const modal = document.getElementById('pwaInstructionModal');
    if (modal) modal.classList.add('hidden');
  };

  // 5. Settings Modal Controls & Mode Switcher
  window.openSettingsModal = function () {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    updateSettingsPwaStatus();
    updateFontSizeUI();
    const modeLabel = document.getElementById('currentModeLabel');
    if (modeLabel) {
      modeLabel.textContent = document.body.classList.contains('is-pwa-standalone')
        ? 'Dashboard App'
        : 'Web Profil';
    }
    modal.classList.remove('hidden');
    hidePwaPrompt();
  };

  window.closeSettingsModal = function () {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('hidden');
  };

  window.setMobileExperienceMode = function (mode) {
    if (mode === 'app') {
      document.body.classList.add('is-pwa-standalone');
      localStorage.setItem('mts_preview_mode', 'app');
      showToast('Beralih ke tampilan Dashboard Aplikasi (Asnawiyyah).');
    } else {
      document.body.classList.remove('is-pwa-standalone');
      localStorage.setItem('mts_preview_mode', 'web');
      showToast('Beralih ke tampilan Web Profil Lengkap.');
    }
    window.closeSettingsModal();
    if (window.lucide) window.lucide.createIcons();
  };

  window.togglePreviewWebMode = function () {
    if (document.body.classList.contains('is-pwa-standalone')) {
      window.setMobileExperienceMode('web');
    } else {
      window.setMobileExperienceMode('app');
    }
  };

  // 6. QR Code Modal Controls
  window.openQrModal = function () {
    const modal = document.getElementById('qrCodeModal');
    if (modal) {
      modal.classList.remove('hidden');
      hidePwaPrompt();
    }
  };

  window.closeQrModal = function () {
    const modal = document.getElementById('qrCodeModal');
    if (modal) modal.classList.add('hidden');
  };

  window.switchQrTab = function (tab) {
    const portalTab = document.getElementById('qrTabPortalBtn');
    const qrisTab = document.getElementById('qrTabQrisBtn');
    const portalContent = document.getElementById('qrContentPortal');
    const qrisContent = document.getElementById('qrContentQris');

    if (tab === 'portal') {
      if (portalTab) {
        portalTab.className = 'flex-1 py-1.5 rounded-lg bg-white text-brand-dark shadow-xs transition-all cursor-pointer font-bold';
      }
      if (qrisTab) {
        qrisTab.className = 'flex-1 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer font-normal';
      }
      if (portalContent) portalContent.classList.remove('hidden');
      if (qrisContent) qrisContent.classList.add('hidden');
    } else {
      if (portalTab) {
        portalTab.className = 'flex-1 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer font-normal';
      }
      if (qrisTab) {
        qrisTab.className = 'flex-1 py-1.5 rounded-lg bg-white text-brand-dark shadow-xs transition-all cursor-pointer font-bold';
      }
      if (portalContent) portalContent.classList.add('hidden');
      if (qrisContent) qrisContent.classList.remove('hidden');
    }
  };

  function updateSettingsPwaStatus() {
    const box = document.getElementById('pwaStatusBox');
    if (!box) return;

    const currentlyStandalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (currentlyStandalone) {
      box.innerHTML = `
        <div class="p-2.5 bg-emerald-100/70 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-emerald-900 font-semibold">
          <svg class="w-4 h-4 text-brand-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
          <span class="leading-tight">Aplikasi Terpasang di Layar HP (Mode Mandiri PWA)</span>
        </div>
      `;
    } else {
      box.innerHTML = `
        <div class="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl gap-2">
          <div class="min-w-0">
            <span class="font-bold text-slate-800 block leading-tight">Terbuka di Browser</span>
            <span class="text-[10px] text-slate-500">Dapat dipasang ke layar utama HP</span>
          </div>
          <button onclick="window.triggerPwaInstall()" class="px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer">
            Pasang PWA
          </button>
        </div>
      `;
    }
  }

  // Font Size Settings
  window.setFontSize = function (size) {
    if (size === 'large') {
      document.documentElement.classList.add('text-lg-active');
      localStorage.setItem('mts_text_size', 'large');
    } else {
      document.documentElement.classList.remove('text-lg-active');
      localStorage.setItem('mts_text_size', 'normal');
    }
    updateFontSizeUI();
    showToast(`Ukuran teks diatur ke: ${size === 'large' ? 'Lebih Besar' : 'Normal'}`);
  };

  function updateFontSizeUI() {
    const isLarge = document.documentElement.classList.contains('text-lg-active');
    const label = document.getElementById('currentFontSizeLabel');
    const normalBtn = document.getElementById('fontNormalBtn');
    const largeBtn = document.getElementById('fontLargeBtn');

    if (label) label.textContent = isLarge ? 'Lebih Besar (+10%)' : 'Normal';

    if (normalBtn) {
      if (!isLarge) {
        normalBtn.className =
          'py-2 px-3 rounded-xl text-xs font-bold border border-brand-primary bg-emerald-50 text-brand-primary shadow-2xs transition-all cursor-pointer text-center';
      } else {
        normalBtn.className =
          'py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer text-center';
      }
    }

    if (largeBtn) {
      if (isLarge) {
        largeBtn.className =
          'py-2 px-3 rounded-xl text-xs font-bold border border-brand-primary bg-emerald-50 text-brand-primary shadow-2xs transition-all cursor-pointer text-center';
      } else {
        largeBtn.className =
          'py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer text-center';
      }
    }
  }

  // Clear Cache and Refresh
  window.refreshAppCache = function () {
    if ('caches' in window) {
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      }).then(() => {
        showToast('Cache dibersihkan. Memuat ulang...');
        setTimeout(() => window.location.reload(true), 600);
      });
    } else {
      window.location.reload(true);
    }
  };

  // 6. Real-time Clock, Demak Prayer Times & Pasaran Widget Controller
  function initPrayerAndClockWidget() {
    function updateClockAndPrayer() {
      const now = new Date();

      // Digital Clock
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      const clockStr = `${hours}:${mins}:${secs} WIB`;
      const clockEl = document.getElementById('home-digital-clock');
      if (clockEl) clockEl.textContent = clockStr;

      // Hari & Pasaran Jawa
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const pasaranNames = ['Wage', 'Kliwon', 'Legi', 'Pahing', 'Pon'];
      const daysSince1970 = Math.floor((now.getTime() + 7 * 3600 * 1000) / 86400000);
      const pasaran = pasaranNames[(daysSince1970 + 3) % 5];
      const dayName = dayNames[now.getDay()];

      const dayEl = document.getElementById('home-current-day');
      if (dayEl) dayEl.textContent = `${dayName} ${pasaran}`;

      // Tanggal Masehi
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const masehiStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
      const masehiEl = document.getElementById('home-date-masehi');
      if (masehiEl) masehiEl.textContent = masehiStr;

      // Tanggal Hijriyah (Approximate Islamic Lunar for 2026/2027)
      const hijriEl = document.getElementById('home-date-hijri');
      if (hijriEl && !hijriEl.textContent.trim()) {
        hijriEl.textContent = '15 Jumadil Ula 1448 H';
      }

      // Waktu Shalat Demak (Kemenag standard approx)
      const prayers = [
        { name: 'Subuh', h: 4, m: 2 },
        { name: 'Terbit', h: 5, m: 20 },
        { name: 'Zuhur', h: 11, m: 35 },
        { name: 'Ashar', h: 14, m: 52 },
        { name: 'Maghrib', h: 17, m: 46 },
        { name: 'Isya', h: 18, m: 58 }
      ];

      const currentMins = now.getHours() * 60 + now.getMinutes();
      let nextP = prayers.find((p) => p.h * 60 + p.m > currentMins);
      if (!nextP) nextP = prayers[0];

      const prayerNameEl = document.getElementById('home-next-prayer-name');
      const prayerTimeEl = document.getElementById('home-next-prayer-time');
      if (prayerNameEl && prayerTimeEl) {
        if (prayerNameEl.childNodes[0]) {
          prayerNameEl.childNodes[0].textContent = nextP.name + ' ';
        } else {
          prayerNameEl.textContent = nextP.name + ' ';
        }
        prayerTimeEl.textContent = `${String(nextP.h).padStart(2, '0')}:${String(nextP.m).padStart(2, '0')} WIB`;
      }
    }

    updateClockAndPrayer();
    setInterval(updateClockAndPrayer, 1000);
  }

  // 7. Toast Notifications
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className =
      'fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300';
    toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span><span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  function showUpdateToast() {
    const toast = document.createElement('div');
    toast.className =
      'fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 bg-brand-dark text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-400/30 flex items-center justify-between gap-3';
    toast.innerHTML = `
      <div class="text-xs">
        <p class="font-bold text-emerald-300">Pembaruan Tersedia</p>
        <p class="text-[11px] text-slate-300">Muat ulang untuk melihat konten terbaru.</p>
      </div>
      <button onclick="window.location.reload()" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer">
        Perbarui
      </button>
    `;
    document.body.appendChild(toast);
  }

  // 8. Enhanced Mobile Navigation Controller
  function initMobileNav() {
    const nav = document.querySelector('header nav');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileBtn = document.getElementById('mobileMenuBtn');

    if (!mobileMenu || !nav) return;

    window.toggleMobileMenu = function () {
      const isClosed = mobileMenu.classList.contains('hidden');
      if (isClosed) {
        mobileMenu.classList.remove('hidden');
        nav.classList.remove('rounded-full');
        nav.classList.add('rounded-3xl', 'shadow-2xl');
        if (mobileBtn) {
          mobileBtn.innerHTML =
            '<svg class="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>';
        }
      } else {
        mobileMenu.classList.add('hidden');
        nav.classList.remove('rounded-3xl', 'shadow-2xl');
        nav.classList.add('rounded-full');
        if (mobileBtn) {
          mobileBtn.innerHTML =
            '<svg class="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>';
        }
      }
    };

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !mobileMenu.classList.contains('hidden')) {
        window.toggleMobileMenu();
      }
      const settingsModal = document.getElementById('settingsModal');
      if (settingsModal && !settingsModal.classList.contains('hidden') && e.target === settingsModal) {
        window.closeSettingsModal();
      }
      const pwaModal = document.getElementById('pwaInstructionModal');
      if (pwaModal && !pwaModal.classList.contains('hidden') && e.target === pwaModal) {
        window.closePWAInstructionModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!mobileMenu.classList.contains('hidden')) window.toggleMobileMenu();
        window.closeSettingsModal();
        window.closePWAInstructionModal();
      }
    });

    // Close when tapping an inner link
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (!mobileMenu.classList.contains('hidden')) {
          window.toggleMobileMenu();
        }
      });
    });

    // Add "Pasang Aplikasi (PWA)" button inside mobile drawer
    if (!mobileMenu.querySelector('.pwa-drawer-item')) {
      const pwaBox = document.createElement('div');
      pwaBox.className = 'pt-2 border-t border-slate-100 pwa-drawer-item';
      pwaBox.innerHTML = `
        <button onclick="window.triggerPwaInstall()" type="button" class="w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-brand-primary text-white font-bold text-xs flex items-center justify-between shadow-sm hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer">
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span>Pasang Aplikasi (Layar HP)</span>
          </span>
          <span class="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-black tracking-wide uppercase">Instal PWA</span>
        </button>
      `;
      mobileMenu.appendChild(pwaBox);
    }
  }

  // 9. Banner Auto Slide in App Mode
  function initAppBannerSlider() {
    const track = document.getElementById('appBannerTrack');
    if (!track) return;
    let slideIdx = 0;
    const total = track.children.length;
    if (total <= 1) return;

    setInterval(() => {
      slideIdx = (slideIdx + 1) % total;
      track.style.transform = `translateX(-${slideIdx * 100}%)`;
    }, 4500);
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createPwaUI();
      initMobileNav();
      initPrayerAndClockWidget();
      initAppBannerSlider();
      if (window.lucide) window.lucide.createIcons();
    });
  } else {
    createPwaUI();
    initMobileNav();
    initPrayerAndClockWidget();
    initAppBannerSlider();
    if (window.lucide) window.lucide.createIcons();
  }
})();
