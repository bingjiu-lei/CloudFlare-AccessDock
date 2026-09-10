// CloudFlare-AccessDock UI Templates & Design System

export const ICONS = {
  shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><circle cx="12" cy="15" r="1"/></svg>`,
  key: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-1.5 1.5L14 9l-3-3L2 15l4 4 9-9 3.5 3.5 1.5-1.5 2-2z"/><circle cx="7.5" cy="16.5" r="1.5"/></svg>`,
  plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  copy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  trash: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  globe: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  clock: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  zap: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  eye: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  server: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`
};

export function layout({ title, body }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} - AccessDock</title>
<style>
:root {
  --bg: #090d16;
  --bg-card: rgba(16, 24, 40, 0.72);
  --bg-card-hover: rgba(26, 38, 62, 0.85);
  --bg-input: rgba(13, 20, 36, 0.9);
  --line: rgba(255, 255, 255, 0.08);
  --line-strong: rgba(255, 255, 255, 0.16);
  --text: #f8fafc;
  --muted: #94a3b8;
  --subtle: #64748b;
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --primary-glow: rgba(99, 102, 241, 0.28);
  --accent: #38bdf8;
  --success: #10b981;
  --success-bg: rgba(16, 185, 129, 0.12);
  --success-border: rgba(16, 185, 129, 0.28);
  --warning: #f59e0b;
  --warning-bg: rgba(245, 158, 11, 0.12);
  --warning-border: rgba(245, 158, 11, 0.28);
  --danger: #f43f5e;
  --danger-bg: rgba(244, 63, 94, 0.12);
  --danger-border: rgba(244, 63, 94, 0.28);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  background-color: var(--bg);
  background-image: 
    radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.18) 0px, transparent 45%),
    radial-gradient(at 100% 0%, rgba(56, 189, 248, 0.14) 0px, transparent 45%),
    radial-gradient(at 50% 100%, rgba(16, 185, 129, 0.08) 0px, transparent 50%);
  background-attachment: fixed;
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.shell {
  width: min(1200px, calc(100% - 40px));
  margin: 0 auto;
  padding-bottom: 60px;
}

/* Header & Topbar */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0 28px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
}

.brand-icon {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(56, 189, 248, 0.2));
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
  box-shadow: 0 4px 16px rgba(56, 189, 248, 0.15);
}

.brand-title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-desc {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Stat Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: var(--line-strong);
  transform: translateY(-1px);
  background: var(--bg-card-hover);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  font-feature-settings: "tnum";
}

.stat-label {
  font-size: 12px;
  color: var(--muted);
  margin-top: 3px;
  white-space: nowrap;
}

/* Credential Badge / Generated Code Card */
.credential-card {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08));
  border: 1px solid var(--success-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 24px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 30px rgba(16, 185, 129, 0.08);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.credential-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.credential-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--success);
}

.credential-duration {
  font-size: 13px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid var(--line);
}

.credential-body {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.35);
  padding: 16px 20px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.credential-code-box {
  flex: 1;
  min-width: 0;
}

.code-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--muted);
  margin-bottom: 4px;
}

.code-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #34d399;
  user-select: all;
}

.credential-tip {
  margin-top: 12px;
  font-size: 12px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Error Notice */
.notice-error {
  background: var(--danger-bg);
  border: 1px solid var(--danger-border);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  margin-bottom: 24px;
  color: #fda4af;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Panels & Sections */
.section-panel {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 14px;
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.counter-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--muted);
}

/* Search Bar */
.search-wrapper {
  position: relative;
  width: min(320px, 100%);
}

.search-wrapper svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--subtle);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 38px;
  padding: 0 12px 0 36px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-glow);
}

/* Modern Tables */
.table-container {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
}

.table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.table th {
  background: rgba(255, 255, 255, 0.03);
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
}

.table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
  color: var(--text);
  vertical-align: middle;
}

.table tr:last-child td {
  border-bottom: 0;
}

.table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.host-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.host-name {
  font-weight: 700;
  color: #fff;
  font-size: 14px;
}

.path-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: var(--accent);
  background: rgba(56, 189, 248, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  max-width: fit-content;
}

/* Badges & Indicators */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
}

.badge-success {
  background: var(--success-bg);
  color: #34d399;
  border: 1px solid var(--success-border);
}

.badge-muted {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.badge-indigo {
  background: rgba(99, 102, 241, 0.12);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.25);
}

.badge-amber {
  background: rgba(245, 158, 11, 0.12);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.badge-cyan {
  background: rgba(6, 182, 212, 0.12);
  color: #67e8f9;
  border: 1px solid rgba(6, 182, 212, 0.25);
}

.badge-purple {
  background: rgba(168, 85, 247, 0.12);
  color: #d8b4fe;
  border: 1px solid rgba(168, 85, 247, 0.25);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  box-shadow: 0 0 8px currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

/* Buttons */
.btn {
  height: 38px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  text-decoration: none;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 10px var(--primary-glow);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  box-shadow: 0 4px 14px var(--primary-glow);
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border-color: var(--line);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--line-strong);
}

.btn-ghost {
  background: transparent;
  color: var(--muted);
  border-color: var(--line);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border-color: var(--line-strong);
}

.btn-sm {
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
}

.btn-toggle {
  background: rgba(255, 255, 255, 0.05);
  color: var(--muted);
  border-color: var(--line);
}

.btn-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.btn-danger-outline {
  background: transparent;
  color: #fda4af;
  border-color: rgba(244, 63, 94, 0.25);
}

.btn-danger-outline:hover {
  background: var(--danger-bg);
  border-color: var(--danger-border);
  color: #f43f5e;
}

.actions-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.empty-state {
  padding: 42px 20px;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}

.empty-state svg {
  margin-bottom: 12px;
  color: var(--subtle);
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 13, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.modal-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

.modal-dialog {
  width: min(520px, 100%);
  background: #0f172a;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.6);
  transform: scale(0.96) translateY(8px);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.modal-overlay.active .modal-dialog {
  transform: scale(1) translateY(0);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-close {
  background: transparent;
  border: 0;
  color: var(--muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.modal-body {
  padding: 24px;
}

/* Form Styles */
.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 6px;
}

.form-tip {
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
}

.form-input, .form-select {
  width: 100%;
  height: 42px;
  padding: 0 14px;
  background: var(--bg-input);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: all 0.15s ease;
}

.form-input:focus, .form-select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.form-select option {
  background: #0f172a;
  color: #fff;
}

.form-check {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  margin-top: 14px;
}

.form-check input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
  cursor: pointer;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--line);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  background: #1e293b;
  border: 1px solid var(--line-strong);
  color: #fff;
  padding: 12px 18px;
  border-radius: var(--radius-md);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  animation: toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateY(12px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Login Page Styling */
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  width: min(440px, 100%);
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-lg);
  padding: 36px 32px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary), var(--accent), transparent);
}

.login-logo {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(56, 189, 248, 0.2));
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
}

.login-title {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}

.login-subtitle {
  font-size: 13px;
  color: var(--muted);
  margin: 0 0 24px;
  line-height: 1.6;
}

.target-chip {
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 12px;
  color: var(--muted);
  text-align: left;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.target-chip span {
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: var(--accent);
  font-weight: 700;
  word-break: break-all;
}

.login-input-group {
  position: relative;
  margin-bottom: 20px;
  text-align: left;
}

.login-input-group input {
  width: 100%;
  height: 48px;
  padding: 0 46px 0 16px;
  background: var(--bg-input);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 15px;
  outline: none;
  transition: all 0.2s ease;
}

.login-input-group input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.toggle-pwd {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: 0;
  color: var(--subtle);
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.toggle-pwd:hover {
  color: #fff;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 700;
  border-radius: var(--radius-sm);
}

.login-footer {
  margin-top: 24px;
  font-size: 11px;
  color: var(--subtle);
  letter-spacing: 0.04em;
}

/* Responsive */
@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .shell {
    width: calc(100% - 24px);
  }
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .topbar-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  .topbar-actions .btn {
    flex: 1;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .credential-body {
    flex-direction: column;
    align-items: stretch;
  }
  .code-value {
    font-size: 20px;
    text-align: center;
  }
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  .search-wrapper {
    width: 100%;
  }
}
</style>
</head>
<body>
${body}
<div id="toastContainer" class="toast-container"></div>
<script>
function showToast(message, isError = false) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = (isError ? '${ICONS.close}' : '${ICONS.check}') + '<span>' + escapeHtml(message) + '</span>';
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 2600);
}

function copyText(text, btnElement) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      onCopySuccess(btnElement);
    }).catch(() => fallbackCopy(text, btnElement));
  } else {
    fallbackCopy(text, btnElement);
  }
}

function fallbackCopy(text, btnElement) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    onCopySuccess(btnElement);
  } catch (err) {
    showToast("复制失败，请手动复制", true);
  }
  document.body.removeChild(textArea);
}

function onCopySuccess(btnElement) {
  showToast("临时码已复制到剪贴板");
  if (btnElement) {
    const originalHtml = btnElement.innerHTML;
    btnElement.innerHTML = '${ICONS.check} <span>已复制</span>';
    btnElement.style.borderColor = 'var(--success)';
    setTimeout(() => {
      btnElement.innerHTML = originalHtml;
      btnElement.style.borderColor = '';
    }, 2000);
  }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

// Close modal when clicking backdrop
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

// ESC key closes modals
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }
});

function escapeHtml(str) {
  return String(str || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
</script>
</body>
</html>`;
}

export function renderAdminPage({ rules, codes, codeRules, generatedCode, generatedDuration, errorMessage, existingRulesJson, codeDurations }) {
  const now = Math.floor(Date.now() / 1000);
  const totalRules = rules.length;
  const activeRules = rules.filter(r => Number(r.enabled || 0)).length;
  const uniqueHosts = new Set(rules.map(r => String(r.host || '').toLowerCase())).size;
  const validCodes = codes.filter(c => c.used_count < c.max_uses && c.expires_at > now).length;

  return layout({
    title: "访问控制台",
    body: `
    <div class="shell">
      <!-- Topbar -->
      <header class="topbar">
        <a class="brand" href="/admin">
          <div class="brand-icon">${ICONS.shield}</div>
          <div>
            <div class="brand-title">AccessDock <span class="badge badge-indigo">Edge 100%</span></div>
            <div class="brand-desc">轻量级通用访问控制鉴权中心</div>
          </div>
        </a>
        <div class="topbar-actions">
          <button type="button" class="btn btn-primary" onclick="openModal('ruleModal')">
            ${ICONS.plus} <span>新增规则</span>
          </button>
          <button type="button" class="btn btn-secondary" onclick="openModal('codeModal')">
            ${ICONS.key} <span>生成临时码</span>
          </button>
          <a class="btn btn-ghost" href="/logout">
            ${ICONS.logout} <span>退出</span>
          </a>
        </div>
      </header>

      <!-- Stat Overview Cards -->
      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">${ICONS.globe}</div>
          <div class="stat-content">
            <div class="stat-value">${uniqueHosts}</div>
            <div class="stat-label">受保护域名</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">${ICONS.shield}</div>
          <div class="stat-content">
            <div class="stat-value">${activeRules} <span style="font-size:14px;color:var(--muted);font-weight:400;">/ ${totalRules}</span></div>
            <div class="stat-label">活跃防护规则</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">${ICONS.key}</div>
          <div class="stat-content">
            <div class="stat-value">${validCodes}</div>
            <div class="stat-label">可用临时码</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">${ICONS.server}</div>
          <div class="stat-content">
            <div class="stat-value" style="display:flex;align-items:center;gap:8px;font-size:16px;">
              <span class="pulse-dot" style="color:var(--success);"></span> 正常运行
            </div>
            <div class="stat-label">Cloudflare D1 驱动</div>
          </div>
        </div>
      </section>

      <!-- Generated Credential Alert -->
      ${generatedCode ? `
        <section class="credential-card">
          <div class="credential-header">
            <div class="credential-badge">
              <span class="pulse-dot"></span>
              临时访问凭证已生成
            </div>
            <div class="credential-duration">时效策略：${escapeHtml(generatedDuration)}</div>
          </div>
          <div class="credential-body">
            <div class="credential-code-box">
              <div class="code-label">TEMPORARY ACCESS CODE</div>
              <div class="code-value">${escapeHtml(generatedCode)}</div>
            </div>
            <button type="button" class="btn btn-primary btn-copy" onclick="copyText('${escapeHtml(generatedCode)}', this)">
              ${ICONS.copy}
              <span>一键复制临时码</span>
            </button>
          </div>
          <div class="credential-tip">
            ${ICONS.zap} 发送给使用者后，访问被拦截的图床或剪贴板页面时直接输入此码即可解锁。
          </div>
        </section>
      ` : ""}

      <!-- Error Notice -->
      ${errorMessage ? `
        <section class="notice-error">
          ${ICONS.close}
          <span>${escapeHtml(errorMessage)}</span>
        </section>
      ` : ""}

      <!-- Rules Table Section -->
      <section class="section-panel">
        <div class="section-header">
          <div class="section-title">
            <span>防护规则列表</span>
            <span class="counter-pill">${rules.length} 条</span>
          </div>
          <div class="search-wrapper">
            ${ICONS.search}
            <input type="text" class="search-input" id="ruleSearchInput" placeholder="实时搜索域名、路径或备注..." oninput="filterRules(this.value)">
          </div>
        </div>

        <div class="table-container">
          <table class="table" id="rulesTable">
            <thead>
              <tr>
                <th style="width: 100px;">状态</th>
                <th>受保护目标 (域名 & 路径规则)</th>
                <th style="width: 160px;">访问模式</th>
                <th>备注说明</th>
                <th style="width: 160px; text-align: right;">操作</th>
              </tr>
            </thead>
            <tbody id="rulesTableBody">
              ${rules.map(renderRuleRow).join("") || `
                <tr>
                  <td colspan="5">
                    <div class="empty-state">
                      ${ICONS.shield}
                      <div>暂无配置任何访问规则，点击右上角「新增规则」添加。</div>
                    </div>
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Codes Table Section -->
      <section class="section-panel">
        <div class="section-header">
          <div class="section-title">
            <span>最近签发的临时码</span>
            <span class="counter-pill">${codes.length} 条</span>
          </div>
          <div class="search-wrapper">
            ${ICONS.search}
            <input type="text" class="search-input" id="codeSearchInput" placeholder="过滤临时码规则或备注..." oninput="filterCodes(this.value)">
          </div>
        </div>

        <div class="table-container">
          <table class="table" id="codesTable">
            <thead>
              <tr>
                <th style="width: 100px;">状态</th>
                <th>关联保护目标</th>
                <th style="width: 200px;">有效截止时间</th>
                <th>签发备注</th>
              </tr>
            </thead>
            <tbody id="codesTableBody">
              ${codes.map(renderCodeRow).join("") || `
                <tr>
                  <td colspan="4">
                    <div class="empty-state">
                      ${ICONS.key}
                      <div>近期没有生成临时码，点击右上角「生成临时码」快速创建。</div>
                    </div>
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Modal: 新增规则 -->
    <div id="ruleModal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">${ICONS.plus} <span>新增防护规则</span></div>
          <button type="button" class="modal-close" onclick="closeModal('ruleModal')">${ICONS.close}</button>
        </div>
        <form method="post" action="/admin/rules" data-rule-form>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">受保护域名 (Host)</label>
              <input class="form-input" name="host" placeholder="例如: img.yourdomain.com 或 paste.yourdomain.com" required data-rule-host>
              <div class="form-tip">支持二级域名或纯主机名，无需包含 https://</div>
            </div>
            <div class="form-group">
              <label class="form-label">路径通配规则 (Path Pattern)</label>
              <input class="form-input" name="pathPattern" placeholder="例如: /* 或 /private/* 或 /api/upload" required data-rule-path>
              <div class="form-tip">支持 * 通配符，如 /* 匹配全站，/private/* 匹配私有资源</div>
            </div>
            <div class="form-group">
              <label class="form-label">鉴权模式</label>
              <select class="form-select" name="mode" data-rule-mode>
                <option value="password">固定密码 (验证后保持会话)</option>
                <option value="password_once">固定密码 - 每次访问重新验证</option>
                <option value="code">临时码 (通过后台按需签发短期凭证)</option>
                <option value="admin">仅管理员 (仅持有管理员登录态可访)</option>
              </select>
            </div>
            <div class="form-group" data-password-field>
              <label class="form-label">访问密码</label>
              <input class="form-input" name="password" type="password" placeholder="请输入固定访问密码" data-rule-password>
            </div>
            <div class="form-group">
              <label class="form-label">业务备注</label>
              <input class="form-input" name="note" placeholder="例如: 个人图床私密相册 / 剪贴板敏感笔记">
            </div>
            <label class="form-check">
              <input name="enabled" type="checkbox" checked data-rule-enabled>
              <span style="font-size: 14px; font-weight: 600;">立即启用该规则</span>
            </label>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" onclick="closeModal('ruleModal')">取消</button>
            <button type="submit" class="btn btn-primary">保存规则</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: 生成临时码 -->
    <div id="codeModal" class="modal-overlay">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-title">${ICONS.key} <span>生成临时访问码</span></div>
          <button type="button" class="modal-close" onclick="closeModal('codeModal')">${ICONS.close}</button>
        </div>
        <form method="post" action="/admin/codes">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">关联目标规则</label>
              <select class="form-select" name="ruleId" required>
                ${codeRules.length ? codeRules.map(r => `<option value="${r.id}">${escapeHtml(r.host)}${escapeHtml(r.path_pattern)} (${escapeHtml(r.note || '无备注')})</option>`).join("") : `<option value="">暂无可用规则，请先添加规则</option>`}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">访问有效期 / 策略</label>
              <select class="form-select" name="duration">
                ${Object.entries(codeDurations).map(([key, value]) => `<option value="${key}">${escapeHtml(value.label)}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">用途备注</label>
              <input class="form-input" name="note" placeholder="例如: 分享给朋友临时查看相册 / 临时剪贴板查看">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-ghost" onclick="closeModal('codeModal')">取消</button>
            <button type="submit" class="btn btn-primary" ${codeRules.length ? "" : "disabled"}>立即生成</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      const existingRules = ${existingRulesJson};

      const ruleForm = document.querySelector("[data-rule-form]");
      const modeSelect = document.querySelector("[data-rule-mode]");
      const passwordField = document.querySelector("[data-password-field]");
      const passwordInput = document.querySelector("[data-rule-password]");
      const hostInput = document.querySelector("[data-rule-host]");
      const pathInput = document.querySelector("[data-rule-path]");
      const enabledInput = document.querySelector("[data-rule-enabled]");

      function isPasswordRuleMode(mode) {
        return mode === "password" || mode === "password_once";
      }

      function normalizeHostInput(value) {
        return String(value || "").trim().replace(/^https?:\\/\\//, "").replace(/\\/.*$/, "").toLowerCase();
      }

      function normalizePathInput(value) {
        const trimmed = String(value || "").trim() || "/";
        return trimmed.startsWith("/") ? trimmed : "/" + trimmed;
      }

      function syncPasswordField() {
        const needsPassword = isPasswordRuleMode(modeSelect.value);
        passwordField.hidden = !needsPassword;
        passwordInput.required = needsPassword;
        if (!needsPassword) passwordInput.value = "";
      }

      modeSelect.addEventListener("change", syncPasswordField);
      syncPasswordField();

      ruleForm.addEventListener("submit", (event) => {
        if (!enabledInput.checked) return;

        const host = normalizeHostInput(hostInput.value);
        const pathPattern = normalizePathInput(pathInput.value);
        const hasDuplicateMode = existingRules.some((rule) =>
          rule.enabled &&
          rule.mode === modeSelect.value &&
          normalizeHostInput(rule.host) === host &&
          normalizePathInput(rule.pathPattern) === pathPattern
        );

        if (hasDuplicateMode) {
          showToast("已存在相同域名、路径和访问模式的启用规则，请先停用旧规则。", true);
          event.preventDefault();
        }
      });

      function filterRules(query) {
        const text = String(query || '').toLowerCase().trim();
        const rows = document.querySelectorAll('#rulesTableBody tr');
        rows.forEach(row => {
          if (row.cells.length < 5) return;
          const match = row.textContent.toLowerCase().includes(text);
          row.style.display = match ? '' : 'none';
        });
      }

      function filterCodes(query) {
        const text = String(query || '').toLowerCase().trim();
        const rows = document.querySelectorAll('#codesTableBody tr');
        rows.forEach(row => {
          if (row.cells.length < 4) return;
          const match = row.textContent.toLowerCase().includes(text);
          row.style.display = match ? '' : 'none';
        });
      }
    </script>
    `
  });
}

export function renderRuleRow(rule) {
  const isEnabled = Number(rule.enabled || 0);
  const statusBadge = isEnabled 
    ? `<span class="badge badge-success"><span class="pulse-dot"></span>启用</span>`
    : `<span class="badge badge-muted">停用</span>`;

  let modeBadge = `<span class="badge badge-indigo">固定密码</span>`;
  if (rule.mode === "password_once") {
    modeBadge = `<span class="badge badge-amber">固定密码 (单次)</span>`;
  } else if (rule.mode === "code") {
    modeBadge = `<span class="badge badge-cyan">临时码</span>`;
  } else if (rule.mode === "admin") {
    modeBadge = `<span class="badge badge-purple">仅管理员</span>`;
  }

  return `<tr data-rule-id="${rule.id}">
    <td>${statusBadge}</td>
    <td>
      <div class="host-cell">
        <span class="host-name">${escapeHtml(rule.host)}</span>
        <code class="path-code">${escapeHtml(rule.path_pattern)}</code>
      </div>
    </td>
    <td>${modeBadge}</td>
    <td style="color: var(--muted);">${escapeHtml(rule.note || "—")}</td>
    <td style="text-align: right;">
      <div class="actions-cell" style="justify-content: flex-end;">
        <form method="post" action="/admin/rules/toggle" style="margin:0;">
          <input type="hidden" name="id" value="${rule.id}">
          <input type="hidden" name="enabled" value="${rule.enabled}">
          <button class="btn btn-sm btn-toggle" type="submit" title="${isEnabled ? '停用此规则' : '启用此规则'}">
            ${isEnabled ? '停用' : '启用'}
          </button>
        </form>
        <form method="post" action="/admin/rules/delete" onsubmit="return confirm('确定要删除针对 ${escapeHtml(rule.host)}${escapeHtml(rule.path_pattern)} 的访问规则吗？');" style="margin:0;">
          <input type="hidden" name="id" value="${rule.id}">
          <button class="btn btn-sm btn-danger-outline" type="submit" title="删除规则">
            ${ICONS.trash}
          </button>
        </form>
      </div>
    </td>
  </tr>`;
}

export function renderCodeRow(code) {
  const now = Math.floor(Date.now() / 1000);
  const used = code.used_count >= code.max_uses;
  const expired = now > code.expires_at;
  
  let statusBadge = `<span class="badge badge-success"><span class="pulse-dot"></span>可用</span>`;
  if (used) {
    statusBadge = `<span class="badge badge-muted">已使用</span>`;
  } else if (expired) {
    statusBadge = `<span class="badge badge-amber">已过期</span>`;
  }

  const expireDate = new Date(Number(code.expires_at) * 1000).toLocaleString("zh-CN", { hour12: false });

  return `<tr>
    <td>${statusBadge}</td>
    <td>
      <div class="host-cell">
        <span class="host-name">${escapeHtml(code.host || "未知域名")}</span>
        <code class="path-code">${escapeHtml(code.path_pattern || "/*")}</code>
      </div>
    </td>
    <td style="color: var(--muted); font-feature-settings: 'tnum';">
      <div style="display:flex;align-items:center;gap:6px;">
        ${ICONS.clock} <span>${expireDate}</span>
      </div>
    </td>
    <td style="color: var(--muted);">${escapeHtml(code.note || "—")}</td>
  </tr>`;
}

export function renderLoginPage({ returnUrl, target, error }) {
  const hasTarget = target && target.host;

  return layout({
    title: "安全访问验证",
    body: `
    <main class="login-wrap">
      <div class="login-card">
        <div class="login-logo">${ICONS.shield}</div>
        <h1 class="login-title">AccessDock</h1>
        <p class="login-subtitle">此页面受统一访问网关保护，请输入通行凭据继续</p>

        ${hasTarget ? `
          <div class="target-chip">
            <span style="font-size: 11px; color: var(--muted); text-transform: uppercase;">Protected Target</span>
            <span>https://${escapeHtml(target.host)}${escapeHtml(target.path)}</span>
          </div>
        ` : ""}

        ${error ? `
          <div class="notice-error" style="margin-bottom: 20px; text-align: left;">
            ${ICONS.close}
            <span>${escapeHtml(error)}</span>
          </div>
        ` : ""}

        <form method="post" action="/login">
          <input type="hidden" name="return" value="${escapeHtml(returnUrl)}">
          
          <div class="login-input-group">
            <input id="passwordField" name="password" type="password" autocomplete="current-password" autofocus required placeholder="请输入管理员密码、访问密码或临时码">
            <button type="button" class="toggle-pwd" onclick="togglePasswordVisibility()" title="显示/隐藏密码">
              ${ICONS.eye}
            </button>
          </div>

          <button type="submit" class="btn btn-primary login-btn">
            <span>验证并访问</span> →
          </button>
        </form>

        <div class="login-footer">
          POWERED BY CLOUDFLARE WORKERS & D1 EDGE
        </div>
      </div>
    </main>

    <script>
      function togglePasswordVisibility() {
        const input = document.getElementById('passwordField');
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    </script>
    `
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
