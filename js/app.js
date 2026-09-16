/**
 * Safe Space - Global Application Logic & UI Helpers
 */

// Toast notification helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  if (type === 'error') icon = 'times-circle';

  toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Escape HTML utility to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Relative timestamp helper
function formatRelativeTime(dateInput) {
  if (!dateInput) return 'Just now';
  const now = new Date();
  const date = new Date(dateInput);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString();
}

// Mood configurations
const MOOD_MAP = {
  like: { emoji: '👍', label: 'Feeling good' },
  haha: { emoji: '😆', label: 'Feeling funny' },
  sad: { emoji: '😢', label: 'Feeling sad' },
  angry: { emoji: '😠', label: 'Feeling angry' },
  love: { emoji: '❤️', label: 'Feeling loved' },
  support: { emoji: '🤝', label: 'Seeking support' }
};

// Common Bottom Navigation Generator
function renderBottomNav(activePage = 'home') {
  const nav = document.createElement('div');
  nav.className = 'bottom-nav';
  nav.innerHTML = `
    <a href="index.html" class="nav-item ${activePage === 'home' ? 'active' : ''}">
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
  const user = await SafeSpaceDB.auth.getCurrentUser();
  if (!user && !window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
    window.location.href = 'login.html';
  }
  return user;
}

// Global modal closer
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.style.display = 'none';
  }
});

