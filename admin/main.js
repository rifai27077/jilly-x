// ============================================
// JillyX Admin — Main Application Logic
// ============================================

import { createClient } from '@supabase/supabase-js';

// ---- Supabase Config ----
const SUPABASE_URL = 'https://bfsnirnbzufkknlrmovw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc25pcm5ienVma2tubHJtb3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzQ5NjAsImV4cCI6MjA4ODgxMDk2MH0.b2K5E2ZjKB4QaF_1F_1X-kiPUOAFv3ODP8E_vIGCHWM';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- Admin Password ----
const ADMIN_PASSWORD = 'jillyx2026';

// ---- State ----
let allLicenses = [];
let currentExtendLicenseId = null;
let confirmCallback = null;

// ============================================
// License Key Generator
// ============================================
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function generateKey() {
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `JILLY-ANDROID-${suffix}`;
}

// ============================================
// Helpers
// ============================================
function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelectorAll(sel); }

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(hours) {
  if (!hours) return '—';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  if (rem === 0) return `${days}d`;
  return `${days}d ${rem}h`;
}

function getLicenseStatus(license) {
  if (!license.is_active && !license.activated_at) return 'unused';
  if (!license.is_active) return 'expired';

  const now = new Date();
  if (license.expires_at) {
    return new Date(license.expires_at) > now ? 'active' : 'expired';
  }
  // Fallback for old licenses without expires_at
  if (license.activated_at) {
    const durationMs = (license.duration_hours || 24) * 60 * 60 * 1000;
    const expiresAt = new Date(new Date(license.activated_at).getTime() + durationMs);
    return expiresAt > now ? 'active' : 'expired';
  }
  return 'unused';
}

function getTimeRemaining(license) {
  const status = getLicenseStatus(license);
  if (status !== 'active') return null;

  if (license.duration_hours && license.duration_hours > 800000) {
    return 'Lifetime';
  }

  let expiresAt;
  if (license.expires_at) {
    expiresAt = new Date(license.expires_at);
  } else if (license.activated_at) {
    const durationMs = (license.duration_hours || 24) * 60 * 60 * 1000;
    expiresAt = new Date(new Date(license.activated_at).getTime() + durationMs);
  }

  if (!expiresAt) return null;
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m left`;
}

// ============================================
// Toast System
// ============================================
function showToast(message, type = 'info') {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================
// Auth
// ============================================
function isLoggedIn() {
  return sessionStorage.getItem('jillyx_admin') === 'true';
}

function login(password) {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem('jillyx_admin', 'true');
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem('jillyx_admin');
  showPage('login');
}

// ============================================
// Routing / Pages
// ============================================
function showPage(page) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $(`${page}-page`).classList.add('active');
}

function showSection(section) {
  $$('.content-section').forEach(s => s.classList.remove('active'));
  $(`section-${section}`).classList.add('active');
  $$('.nav-item[data-section]').forEach(n => {
    n.classList.toggle('active', n.dataset.section === section);
  });

  const titles = { overview: 'Dashboard', licenses: 'License Manager', devices: 'Device Tracking' };
  $('page-title').textContent = titles[section] || 'Dashboard';
}

// ============================================
// Modal Helpers
// ============================================
function openModal(id) { $(id).classList.remove('hidden'); }
function closeModal(id) { $(id).classList.add('hidden'); }

// ============================================
// CRUD Operations
// ============================================
async function fetchLicenses() {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Failed to fetch licenses', 'error');
    return [];
  }
  return data || [];
}

async function createLicense(notes) {
  const licenseKey = generateKey();
  const durationHours = 876000; // 100 years = Lifetime

  const { error } = await supabase.from('licenses').insert({
    license_key: licenseKey,
    is_active: false,
    duration_hours: durationHours,
    notes: notes || null,
  });

  if (error) {
    showToast(`Failed to create: ${error.message}`, 'error');
    return null;
  }

  showToast(`License created: ${licenseKey}`, 'success');
  return licenseKey;
}

async function revokeLicense(licenseId) {
  const { error } = await supabase.from('licenses')
    .update({
      is_active: false,
      device_id: null,
      activated_at: null,
      expires_at: null,
    })
    .eq('id', licenseId);

  if (error) {
    showToast(`Failed to revoke: ${error.message}`, 'error');
    return false;
  }

  showToast('License revoked', 'success');
  return true;
}

async function deleteLicense(licenseId) {
  const { error } = await supabase.from('licenses')
    .delete()
    .eq('id', licenseId);

  if (error) {
    showToast(`Failed to delete: ${error.message}`, 'error');
    return false;
  }

  showToast('License deleted', 'success');
  return true;
}

// ============================================
// Render Functions
// ============================================
function renderStatusBadge(license) {
  const status = getLicenseStatus(license);
  const labels = { active: 'Active', expired: 'Expired', unused: 'Unused' };
  const remaining = getTimeRemaining(license);
  const extra = remaining ? ` · ${remaining}` : '';

  return `<span class="status-badge status-${status}"><span class="status-dot"></span>${labels[status]}${extra}</span>`;
}

function renderStats() {
  const total = allLicenses.length;
  const active = allLicenses.filter(l => getLicenseStatus(l) === 'active').length;
  const expired = allLicenses.filter(l => getLicenseStatus(l) === 'expired').length;
  const unused = allLicenses.filter(l => getLicenseStatus(l) === 'unused').length;

  $('stat-total').textContent = total;
  $('stat-active').textContent = active;
  $('stat-expired').textContent = expired;
  $('stat-unused').textContent = unused;
}

function renderRecentLicenses() {
  const tbody = $('recent-licenses-body');
  const cardList = $('recent-licenses-list');
  const recent = allLicenses.slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No licenses yet. Create one!</td></tr>';
    cardList.innerHTML = '<div class="list-empty">No licenses yet. Create one!</div>';
    return;
  }

  // Desktop Table
  tbody.innerHTML = recent.map(l => `
    <tr>
      <td class="license-key-cell">${l.license_key}</td>
      <td>${renderStatusBadge(l)}</td>
      <td class="device-id-cell">${l.device_id || '—'}</td>
      <td>${formatDate(l.created_at)}</td>
    </tr>
  `).join('');

  // Mobile Cards
  cardList.innerHTML = recent.map(l => `
    <div class="license-card">
      <div class="license-card-top">
        <span class="license-card-key">${l.license_key}</span>
        ${renderStatusBadge(l)}
      </div>
      <div class="license-card-meta">
        <div class="license-card-field">
          <span class="license-card-field-label">Created</span>
          <span class="license-card-field-value">${formatDate(l.created_at)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function renderAllLicenses(filter = 'all', search = '') {
  const tbody = $('all-licenses-body');
  const cardList = $('all-licenses-list');
  let filtered = allLicenses;

  if (filter !== 'all') {
    filtered = filtered.filter(l => getLicenseStatus(l) === filter);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(l =>
      l.license_key.toLowerCase().includes(q) ||
      (l.device_id && l.device_id.toLowerCase().includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No licenses found</td></tr>';
    cardList.innerHTML = '<div class="list-empty">No licenses found</div>';
    return;
  }

  // Desktop Table
  tbody.innerHTML = filtered.map(l => {
    const status = getLicenseStatus(l);
    return `
    <tr>
      <td class="license-key-cell">${l.license_key}</td>
      <td>${renderStatusBadge(l)}</td>
      <td class="device-id-cell">${l.device_id || '—'}</td>
      <td>${formatDate(l.activated_at)}</td>
      <td>
        <div class="actions-cell">
          ${status === 'active' ? `
          <button class="btn-icon btn-revoke" title="Revoke" data-action="revoke" data-id="${l.id}" data-key="${l.license_key}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </button>` : ''}
          <button class="btn-icon btn-delete" title="Delete" data-action="delete" data-id="${l.id}" data-key="${l.license_key}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
  }).join('');

  // Mobile Cards
  cardList.innerHTML = filtered.map(l => {
    const status = getLicenseStatus(l);
    return `
    <div class="license-card">
      <div class="license-card-top">
        <span class="license-card-key">${l.license_key}</span>
        ${renderStatusBadge(l)}
      </div>
      <div class="license-card-meta">
        <div class="license-card-field" style="grid-column: span 2">
          <span class="license-card-field-label">Device ID</span>
          <span class="license-card-field-value device-id-cell">${l.device_id || '—'}</span>
        </div>
        <div class="license-card-field" style="grid-column: span 2">
          <span class="license-card-field-label">Activated</span>
          <span class="license-card-field-value">${formatDate(l.activated_at)}</span>
        </div>
      </div>
      <div class="license-card-actions">
        ${status === 'active' ? `
        <button class="btn-icon btn-revoke" data-action="revoke" data-id="${l.id}" data-key="${l.license_key}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          <span>Revoke</span>
        </button>` : ''}
        <button class="btn-icon btn-delete" data-action="delete" data-id="${l.id}" data-key="${l.license_key}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  `;
  }).join('');
}

function renderDevices() {
  const tbody = $('devices-body');
  const cardList = $('devices-list');
  const withDevices = allLicenses.filter(l => l.device_id);

  if (withDevices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No devices bound yet</td></tr>';
    cardList.innerHTML = '<div class="list-empty">No devices bound yet</div>';
    return;
  }

  // Desktop Table
  tbody.innerHTML = withDevices.map(l => `
    <tr>
      <td class="device-id-cell" style="max-width:260px">${l.device_id}</td>
      <td class="license-key-cell">${l.license_key}</td>
      <td>${renderStatusBadge(l)}</td>
      <td>${formatDate(l.activated_at)}</td>
    </tr>
  `).join('');

  // Mobile Cards
  cardList.innerHTML = withDevices.map(l => `
    <div class="device-card">
      <div class="device-card-id">${l.device_id}</div>
      <div class="license-card-top" style="margin-bottom: 12px">
        <span class="license-card-key">${l.license_key}</span>
        ${renderStatusBadge(l)}
      </div>
      <div class="license-card-meta">
        <div class="license-card-field">
          <span class="license-card-field-label">Bound</span>
          <span class="license-card-field-value">${formatDate(l.activated_at)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================
// Refresh All Data
// ============================================
async function refreshData() {
  allLicenses = await fetchLicenses();
  renderStats();
  renderRecentLicenses();
  renderAllLicenses($('filter-status').value, $('search-input').value);
  renderDevices();
}

// ============================================
// Event Listeners
// ============================================
function initEvents() {
  // Login
  $('login-btn').addEventListener('click', () => {
    const pw = $('admin-password').value;
    if (login(pw)) {
      $('login-error').classList.add('hidden');
      showPage('dashboard');
      refreshData();
    } else {
      $('login-error').textContent = 'Invalid password. Try again.';
      $('login-error').classList.remove('hidden');
    }
  });

  $('admin-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('login-btn').click();
  });

  // Logout handlers
  if ($('logout-btn-desktop')) $('logout-btn-desktop').addEventListener('click', logout);
  if ($('logout-btn')) $('logout-btn').addEventListener('click', logout);

  // Navigation handlers (works for both sidebar and bottom bar)
  $$('a.nav-item[data-section], button.bottom-nav-item[data-section]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      showSection(item.dataset.section);
      
      // Update both nav bars
      $$('.nav-item').forEach(n => n.classList.remove('active'));
      $$('.bottom-nav-item').forEach(n => n.classList.remove('active'));
      
      const section = item.dataset.section;
      $$(`.nav-item[data-section="${section}"]`).forEach(n => n.classList.add('active'));
      $$(`.bottom-nav-item[data-section="${section}"]`).forEach(n => n.classList.add('active'));
    });
  });

  // "View All" button in overview
  $$('.btn[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      showSection(btn.dataset.section);
      $$('.bottom-nav-item').forEach(n => n.classList.remove('active'));
      $$(`.bottom-nav-item[data-section="${btn.dataset.section}"]`).forEach(n => n.classList.add('active'));
    });
  });

  // Mobile menu toggle (optional if you still use a hamburger menu, though replaced by bottom nav mostly)
  if ($('menu-toggle')) {
    $('menu-toggle').addEventListener('click', () => {
      $('sidebar').classList.toggle('open');
    });
  }

  // Create license modal (bind to both desktop and mobile buttons if separated)
  const openCreateModal = () => {
    $('new-license-notes').value = '';
    $('generated-key-box').classList.add('hidden');
    $('generate-btn').disabled = false;
    openModal('create-modal');
  };
  
  if ($('create-license-btn')) $('create-license-btn').addEventListener('click', openCreateModal);
  if ($('create-license-btn-2')) $('create-license-btn-2').addEventListener('click', openCreateModal);

  $('generate-btn').addEventListener('click', async () => {
    const notes = $('new-license-notes').value.trim();

    $('generate-btn').disabled = true;
    $('generate-btn').textContent = 'Generating...';

    const key = await createLicense(notes);

    if (key) {
      $('generated-key-text').textContent = key;
      $('generated-key-box').classList.remove('hidden');
      await refreshData();
    }

    $('generate-btn').disabled = false;
    $('generate-btn').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
      Generate Key
    `;
  });

  $('copy-key-btn').addEventListener('click', () => {
    const key = $('generated-key-text').textContent;
    navigator.clipboard.writeText(key).then(() => {
      showToast('Key copied to clipboard!', 'success');
    });
  });

  // Close modals
  $$('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // Close modals on overlay click
  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
      }
    });
  });

  // Confirm modal action
  $('confirm-action-btn').addEventListener('click', async () => {
    if (confirmCallback) {
      $('confirm-action-btn').disabled = true;
      $('confirm-action-btn').textContent = 'Processing...';
      await confirmCallback();
      $('confirm-action-btn').disabled = false;
      $('confirm-action-btn').textContent = 'Confirm';
      confirmCallback = null;
      closeModal('confirm-modal');
    }
  });

  // Search & filter
  $('search-input').addEventListener('input', () => {
    renderAllLicenses($('filter-status').value, $('search-input').value);
  });

  $('filter-status').addEventListener('change', () => {
    renderAllLicenses($('filter-status').value, $('search-input').value);
  });

  // Table action delegation
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const key = btn.dataset.key;

    if (action === 'revoke') {
      $('confirm-title').textContent = 'Revoke License';
      $('confirm-message').textContent = `Are you sure you want to revoke ${key}? The device will be unbound and the license will be deactivated.`;
      confirmCallback = async () => {
        const ok = await revokeLicense(id);
        if (ok) await refreshData();
      };
      openModal('confirm-modal');
    }

    if (action === 'delete') {
      $('confirm-title').textContent = 'Delete License';
      $('confirm-message').textContent = `Are you sure you want to permanently delete ${key}? This action cannot be undone.`;
      $('confirm-action-btn').className = 'btn btn-danger';
      confirmCallback = async () => {
        const ok = await deleteLicense(id);
        if (ok) await refreshData();
      };
      openModal('confirm-modal');
    }
  });
}

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initEvents();

  if (isLoggedIn()) {
    showPage('dashboard');
    refreshData();
  } else {
    showPage('login');
  }

  // Auto-refresh every 30 seconds
  setInterval(() => {
    if (isLoggedIn()) refreshData();
  }, 30000);
});
