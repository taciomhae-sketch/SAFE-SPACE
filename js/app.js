/**
 * Safe Space - Global Application Logic & UI Helpers
 */

// Toast notification helper
function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  
  var icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  if (type === 'error') icon = 'times-circle';

  toast.innerHTML = '<i class="fas fa-' + icon + '"></i> <span>' + escapeHTML(message) + '</span>';
  container.appendChild(toast);

  setTimeout(function() {
    toast.classList.add('toast-show');
  }, 10);

  setTimeout(function() {
    toast.classList.remove('toast-show');
    setTimeout(function() { toast.remove(); }, 300);
  }, 3500);
}

// Escape HTML utility to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Relative timestamp helper
function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Just now';
  var now = new Date();
  var date = new Date(dateInput);
  var diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return Math.floor(diffSec / 60) + 'm ago';
  if (diffSec < 86400) return Math.floor(diffSec / 3600) + 'h ago';
  if (diffSec < 604800) return Math.floor(diffSec / 86400) + 'd ago';
  return date.toLocaleDateString();
}

// Mood configurations
var MOOD_MAP = {
  like: { emoji: '👍', label: 'Feeling good' },
  haha: { emoji: '😆', label: 'Feeling funny' },
  sad: { emoji: '😢', label: 'Feeling sad' },
  angry: { emoji: '😠', label: 'Feeling angry' },
  love: { emoji: '❤️', label: 'Feeling loved' },
  support: { emoji: '🤝', label: 'Seeking support' }
};

// Common Bottom Navigation Generator
function renderBottomNav(activePage) {
  activePage = activePage || 'home';
  var nav = document.createElement('div');
  nav.className = 'bottom-nav';
  nav.innerHTML = `
    <a href="home.html" class="nav-item ${activePage === 'home' ? 'active' : ''}">
      <i class="fas fa-home"></i>
      <span>Feed</span>
    </a>
    <a href="community.html" class="nav-item ${activePage === 'community' ? 'active' : ''}">
      <i class="fas fa-users"></i>
      <span>Community</span>
    </a>
    <a href="chat.html" class="nav-item ${activePage === 'chat' ? 'active' : ''}">
      <i class="fas fa-comment-dots"></i>
      <span>Chat</span>
    </a>
    <a href="resources.html" class="nav-item ${activePage === 'resources' ? 'active' : ''}">
      <i class="fas fa-book-open"></i>
      <span>Resources</span>
    </a>
    <a href="profile.html" class="nav-item ${activePage === 'profile' ? 'active' : ''}">
      <i class="fas fa-user"></i>
      <span>Profile</span>
    </a>
  `;
  return nav;
}

// Require Login Guard
async function requireAuth() {
  var path = window.location.pathname;
  var publicPages = ['login.html', 'register.html', 'welcome.html', 'index.html'];
  var isPublic = publicPages.some(function(p) { return path.endsWith(p); });
  if (typeof SafeSpaceDB === 'undefined' || !SafeSpaceDB.auth) {
    if (!isPublic) window.location.href = 'welcome.html';
    return null;
  }
  try {
    var user = await SafeSpaceDB.auth.getCurrentUser();
    if (!user && !isPublic) {
      window.location.href = 'welcome.html';
    }
    return user;
  } catch (err) {
    console.warn('[Auth] Session check error:', err);
    if (!isPublic) window.location.href = 'welcome.html';
    return null;
  }
}

// Global modal closer
window.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.style.display = 'none';
  }
});

// ============================================================
// Page Loader Management
// ============================================================
function hidePageLoader() {
  var loader = document.getElementById('pageLoader');
  if (loader && !loader.classList.contains('fade-out')) {
    loader.classList.add('fade-out');
    setTimeout(function() {
      if (loader && loader.classList.contains('fade-out')) {
        loader.style.display = 'none';
      }
    }, 380);
  }
}

function showPageLoader(sublabel) {
  var loader = document.getElementById('pageLoader');
  if (loader) {
    loader.style.display = 'flex';
    void loader.offsetWidth;
    loader.classList.remove('fade-out');
    if (sublabel) {
      var sub = loader.querySelector('.loader-sublabel');
      if (sub) sub.textContent = sublabel;
    }
  }
}

// Ensure loader fades out cleanly after assets load
window.addEventListener('load', function() {
  setTimeout(hidePageLoader, 350);
});

