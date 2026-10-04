/**
 * Safe Space - Global Application Logic & UI Helpers
 */

// Immediate Theme Application (Prevents visual flash across all pages)
(function applySavedTheme() {
  try {
    var mode = localStorage.getItem('safe_space_theme_mode') || 'light';
    var color = localStorage.getItem('safe_space_theme_color') || 'purple';
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.setAttribute('data-color', color);
  } catch (e) {}
})();

// Helper to switch theme immediately and persist
function applyTheme(mode, color) {
  mode = mode || localStorage.getItem('safe_space_theme_mode') || 'light';
  color = color || localStorage.getItem('safe_space_theme_color') || 'purple';
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.setAttribute('data-color', color);
  try {
    localStorage.setItem('safe_space_theme_mode', mode);
    localStorage.setItem('safe_space_theme_color', color);
  } catch (e) {}
}

function getThemeSettings() {
  return {
    mode: localStorage.getItem('safe_space_theme_mode') || 'light',
    color: localStorage.getItem('safe_space_theme_color') || 'purple'
  };
}

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
    if (!isPublic) {
      if (typeof hidePageLoader === 'function') hidePageLoader();
      window.location.href = 'welcome.html';
    }
    return null;
  }
  try {
    var user = await SafeSpaceDB.auth.getCurrentUser();
    if (!user && !isPublic) {
      if (typeof hidePageLoader === 'function') hidePageLoader();
      window.location.href = 'welcome.html';
    }
    return user;
  } catch (err) {
    console.warn('[Auth] Session check error:', err);
    if (!isPublic) {
      if (typeof hidePageLoader === 'function') hidePageLoader();
      window.location.href = 'welcome.html';
    }
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
// Page Loader & Transition Management (Logo Loading)
// ============================================================
function hidePageLoader() {
  var loader = document.getElementById('pageLoader');
  if (loader && !loader.classList.contains('fade-out')) {
    loader.classList.add('fade-out');
    setTimeout(function() {
      if (loader) {
        loader.style.display = 'none';
      }
    }, 180);
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

// Fade out logo loader cleanly upon initial asset/DOM readiness
window.addEventListener('load', function() {
  hidePageLoader();
});

// Avoid stuck loader when navigating with browser back/forward buttons
window.addEventListener('pageshow', function(e) {
  if (e.persisted) {
    hidePageLoader();
  }
});

// Smooth page transition: show logo loading when navigating between app pages
document.addEventListener('click', function(e) {
  var link = e.target.closest('a');
  if (!link || !link.href) return;
  if (link.target === '_blank' || link.hasAttribute('download')) return;
  var targetUrl = link.getAttribute('href');
  if (!targetUrl || targetUrl.startsWith('#') || targetUrl.startsWith('javascript:')) return;
  
  var currentPath = window.location.pathname.split('/').pop() || 'index.html';
  var targetPath = targetUrl.split('?')[0].split('/').pop();
  
  if (targetPath && targetPath !== currentPath && targetPath.endsWith('.html')) {
    showPageLoader();
  }
});

// ============================================================
// Desktop Sidebar Initialization
// ============================================================
async function initDesktopSidebar(activePage) {
  var sidebar = document.querySelector('.desktop-sidebar');
  if (!sidebar) return;

  // Set active link
  if (activePage) {
    var links = sidebar.querySelectorAll('.sidebar-link');
    links.forEach(function(link) {
      if (link.getAttribute('data-page') === activePage || link.getAttribute('href') === activePage + '.html') {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Hook up Create Post button
  var createBtn = document.getElementById('sidebarCreatePostBtn');
  if (createBtn) {
    createBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var homeCreateBtn = document.getElementById('openCreatePostBtn');
      if (homeCreateBtn) {
        homeCreateBtn.click();
      } else {
        window.location.href = 'home.html?action=create-post';
      }
    });
  }

  // Populate user info if logged in
  if (typeof SafeSpaceDB !== 'undefined' && SafeSpaceDB.auth) {
    try {
      var user = await SafeSpaceDB.auth.getCurrentUser();
      if (user) {
        var nameEl = document.getElementById('sidebarUserName');
        var avatarEl = document.getElementById('sidebarUserAvatar');
        if (nameEl) {
          nameEl.textContent = user.username ? '@' + user.username : (user.email ? user.email.split('@')[0] : 'Student');
        }
        if (avatarEl) {
          if (window.SafeSpaceAvatars) {
            avatarEl.innerHTML = window.SafeSpaceAvatars.renderHtml(user, { alt: user.username || 'Avatar' });
          } else {
            var avatarSrc = typeof resolveAvatarUrl === 'function' 
              ? resolveAvatarUrl(user.avatar_url, user.avatar_type, user.avatar_value) 
              : user.avatar_url;
            if (avatarSrc) {
              avatarEl.innerHTML = '<img src="' + escapeHTML(avatarSrc) + '" alt="Avatar" />';
            } else {
              avatarEl.innerHTML = '<i class="fas fa-user"></i>';
            }
          }
        }
        if (user.theme_mode && !localStorage.getItem('safe_space_theme_mode')) {
          applyTheme(user.theme_mode, user.theme_color || 'purple');
        }
      }
    } catch (err) {
      console.warn('[DesktopSidebar] Failed to load user:', err);
    }
  }
}

// Auto-run on DOM ready if sidebar exists
document.addEventListener('DOMContentLoaded', function() {
  var path = window.location.pathname;
  var page = 'home';
  if (path.includes('community.html')) page = 'community';
  else if (path.includes('chat.html')) page = 'chat';
  else if (path.includes('resources.html')) page = 'resources';
  else if (path.includes('profile.html')) page = 'profile';

  initDesktopSidebar(page);

  // Auto-trigger create post modal if URL has ?action=create-post
  if (page === 'home') {
    var params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create-post') {
      setTimeout(function() {
        var btn = document.getElementById('openCreatePostBtn');
        if (btn) btn.click();
      }, 300);
    }
  }

  // Update sidebar avatar immediately when changed
  window.addEventListener('safespace:avatar-changed', function(e) {
    var avatarEl = document.getElementById('sidebarUserAvatar');
    if (avatarEl && e.detail) {
      if (window.SafeSpaceAvatars) {
        avatarEl.innerHTML = window.SafeSpaceAvatars.renderHtml(e.detail.avatarUrl || e.detail, { alt: 'Avatar' });
      } else if (e.detail.avatarUrl) {
        avatarEl.innerHTML = '<img src="' + escapeHTML(e.detail.avatarUrl) + '" alt="Avatar" />';
      }
    }
  });
});


