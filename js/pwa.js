/**
 * Safe Space PWA Controller
 * Handles Service Worker registration, PWA installation banner, and Network status.
 */
let deferredPrompt = null;

// 1. Service Worker Registration (active when served over HTTP/HTTPS)
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  });
}

// 2. Capture Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] Install prompt intercepted');
  
  // Display install banner if element exists
  const installBanner = document.getElementById('pwaInstallBanner');
  if (installBanner) {
    installBanner.style.display = 'flex';
  }
});

// 3. User Triggered Install
function installSafeSpacePWA() {
  if (!deferredPrompt) {
    alert('Safe Space is already installed or your browser doesn\'t support automatic installation. You can use "Add to Home Screen" from your browser menu.');
    return;
  }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }
    deferredPrompt = null;
    const installBanner = document.getElementById('pwaInstallBanner');
    if (installBanner) installBanner.style.display = 'none';
  });
}

window.addEventListener('appinstalled', () => {
  console.log('[PWA] Safe Space was successfully installed');
  const installBanner = document.getElementById('pwaInstallBanner');
  if (installBanner) installBanner.style.display = 'none';
  if (typeof showToast === 'function') {
    showToast('Safe Space installed successfully!', 'success');
  }
});

// 4. Online/Offline Status Indicator
window.addEventListener('online', () => {
  if (typeof showToast === 'function') {
    showToast('You are back online 🌈', 'success');
  }
});

window.addEventListener('offline', () => {
  if (typeof showToast === 'function') {
    showToast('You are currently offline. Showing cached content.', 'warning');
  }
});

