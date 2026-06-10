// ─── API Helper ────────────────────────────────────────────────────────────────
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('bishop_token');
}

function setToken(token) {
  localStorage.setItem('bishop_token', token);
}

function clearToken() {
  localStorage.removeItem('bishop_token');
  localStorage.removeItem('bishop_user');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('bishop_user'));
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem('bishop_user', JSON.stringify(user));
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(API_BASE + path, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login.html';
    throw new Error('Unauthorized');
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Error ${res.status}`);
  }

  return data;
}

function requireAuth(requiredRole) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    window.location.href = '/login.html';
    return false;
  }

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'super_admin') {
      window.location.href = '/superadmin.html';
    } else if (user.user_type === 'parent' || user.user_type === 'past_student') {
      window.location.href = '/parent.html';
    } else {
      window.location.href = '/staff.html';
    }
    return false;
  }

  return true;
}

function logout() {
  clearToken();
  window.location.href = '/login.html';
}

// Populate user info in sidebar
function populateSidebar() {
  const user = getUser();
  if (!user) return;
  const nameEl = document.getElementById('sidebar-user-name');
  const emailEl = document.getElementById('sidebar-user-email');
  if (nameEl) nameEl.textContent = user.full_name || 'Administrator';
  if (emailEl) emailEl.textContent = user.email || '';
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Never active';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Never active';
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return `Yesterday`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
