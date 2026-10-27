/**
 * MTs YASUA Pilangwetan — Progressive Web App (PWA) & Mobile UX Controller
 * - Service Worker Registration & Caching
 * - PWA Install Prompts (Android & iPhone / iOS Safari)
 * - Mobile Bottom App Dock with Safe-Area Insets (env(safe-area-inset-bottom))
 * - Native-feel Navigation & Mobile Drawer Interactivity
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
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  let deferredPrompt = null;

  // Listen for Chrome/Edge install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] beforeinstallprompt event captured');

    // Reveal any manual install buttons
    document.querySelectorAll('.pwa-install-btn').forEach((btn) => btn.classList.remove('hidden'));

    // Show floating prompt after short delay if not dismissed recently
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
  });

  // 3. Inject PWA UI Elements (Banner, iOS Modal, Bottom Dock)
  function createPwaUI() {
    // A. Floating Install Banner (Positioned above bottom nav on mobile)
    if (!document.getElementById('pwaInstallPrompt')) {
      const banner = document.createElement('div');
      banner.id = 'pwaInstallPrompt';
      banner.className =
        'fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 transform translate-y-36 opacity-0 transition-all duration-300 pointer-events-none';
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

    // C. Mobile Bottom Dock (App-Like Quick Navigation for Android & iPhone)
    if (!document.getElementById('mobileBottomDock') && !isStandalone) {
      document.body.classList.add('pb-20', 'lg:pb-0'); // prevent content being hidden behind bottom bar

      const currentPath = window.location.pathname.toLowerCase();
      const isHome = currentPath.endsWith('/') || currentPath.endsWith('/index.html') || currentPath === '';
      const isProg = currentPath.includes('program') || currentPath.includes('ekskul');
      const isAgenda = currentPath.includes('agenda') || currentPath.includes('prestasi');

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

          <!-- 2. Program -->
          <a href="program.html" class="flex flex-col items-center justify-center py-1 ${isProg ? 'text-brand-primary font-bold' : 'text-slate-500 hover:text-brand-primary'} transition-colors">
            <svg class="w-5 h-5 ${isProg ? 'stroke-[2.5]' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            <span class="text-[9.5px] tracking-tight mt-0.5">Program</span>
          </a>

          <!-- 3. PPDB Online (Highlight Button) -->
          <a href="ppdb.html" class="flex flex-col items-center justify-center -mt-5 group">
            <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-accent to-amber-500 text-slate-950 flex items-center justify-center shadow-glow-gold group-active:scale-95 transition-transform border-2 border-white">
              <svg class="w-5 h-5 text-slate-950 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
            </div>
            <span class="text-[10px] font-black text-brand-dark mt-0.5">PPDB</span>
          </a>

          <!-- 4. Agenda -->
          <a href="agenda.html" class="flex flex-col items-center justify-center py-1 ${isAgenda ? 'text-brand-primary font-bold' : 'text-slate-500 hover:text-brand-primary'} transition-colors">
            <svg class="w-5 h-5 ${isAgenda ? 'stroke-[2.5]' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span class="text-[9.5px] tracking-tight mt-0.5">Agenda</span>
          </a>

          <!-- 5. Menu Drawer Trigger -->
          <button onclick="window.toggleMobileMenu()" class="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-brand-primary transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
            <span class="text-[9.5px] tracking-tight mt-0.5">Menu</span>
          </button>
        </div>
      `;
      document.body.appendChild(dock);
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

  // 5. Toast Notifications
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

  // 6. Enhanced Mobile Navigation Controller
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
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
        window.toggleMobileMenu();
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

  // 7. Network Online/Offline Indicators
  window.addEventListener('online', () => showToast('Koneksi pulih. Anda kembali online.'));
  window.addEventListener('offline', () => showToast('Mode offline aktif. Halaman tersimpan tetap dapat dibaca.'));

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createPwaUI();
      initMobileNav();
    });
  } else {
    createPwaUI();
    initMobileNav();
  }
})();
