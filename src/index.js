import { renderAdminPage, renderLoginPage } from "./ui.js";

const ADMIN_COOKIE = "accessdock_admin";
const DEFAULT_ACCESS_SECONDS = 60 * 60 * 24;
const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 30;
const ONE_TIME_GRANT_SECONDS = 60 * 2;

const CODE_DURATIONS = {
  once: { label: "不保留登录，刷新后失效", sessionSeconds: 0, expiresSeconds: 60 * 60 * 24 * 7 },
  "1m": { label: "1 分钟", sessionSeconds: 60, expiresSeconds: 60 },
  "2m": { label: "2 分钟", sessionSeconds: 60 * 2, expiresSeconds: 60 * 2 },
  "3m": { label: "3 分钟", sessionSeconds: 60 * 3, expiresSeconds: 60 * 3 },
  "5m": { label: "5 分钟", sessionSeconds: 60 * 5, expiresSeconds: 60 * 5 },
  "10m": { label: "10 分钟", sessionSeconds: 60 * 10, expiresSeconds: 60 * 10 },
  "30m": { label: "30 分钟", sessionSeconds: 60 * 30, expiresSeconds: 60 * 30 },
  "1h": { label: "1 小时", sessionSeconds: 60 * 60, expiresSeconds: 60 * 60 },
  "2h": { label: "2 小时", sessionSeconds: 60 * 60 * 2, expiresSeconds: 60 * 60 * 2 },
  "1d": { label: "1 天", sessionSeconds: 60 * 60 * 24, expiresSeconds: 60 * 60 * 24 },
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    await cleanupExpired(env);

    if (url.pathname === "/") return redirect("/admin");
    if (url.pathname === "/admin") return requireAdmin(request, env, () => adminPage(env, request));
    if (url.pathname === "/login") return handleLogin(request, env);
    if (url.pathname === "/logout") return redirect("/login", clearCookies(getAdminCookieName(env), env));
    if (url.pathname === "/api/check") return handleCheck(request, env);
    if (url.pathname === "/admin/rules") return requireAdmin(request, env, () => handleRules(request, env));
    if (url.pathname === "/admin/rules/toggle") return requireAdmin(request, env, () => handleRuleToggle(request, env));
    if (url.pathname === "/admin/rules/delete") return requireAdmin(request, env, () => handleRuleDelete(request, env));
    if (url.pathname === "/admin/codes") return requireAdmin(request, env, () => handleCodes(request, env));

    return notFound();
  },
};

async function handleLogin(request, env) {
  if (request.method === "GET") {
    const url = new URL(request.url);
    const returnUrl = sanitizeReturnUrl(url.searchParams.get("return") || "/admin");
    const target = parseTarget(returnUrl);
    return loginPage(env, {
      returnUrl,
      target,
      error: url.searchParams.get("error") || "",
    });
  }

  const form = await request.formData();
  const password = String(form.get("password") || "");
  const returnUrl = sanitizeReturnUrl(String(form.get("return") || "/admin"));

  if (password === env.ADMIN_PASSWORD) {
    const token = await createToken({ type: "admin" }, ADMIN_SESSION_SECONDS, env);
    return completeLogin(request, env, returnUrl, replaceCookie(getAdminCookieName(env), token, ADMIN_SESSION_SECONDS, env));
  }

  const target = parseTarget(returnUrl);
  if (!target) {
    return loginPage(env, { returnUrl, target, error: "请输入管理员密码。" }, 401);
  }

  const rules = await findMatchingRules(env, target.host, target.path);
  if (!rules.length) {
    return redirect(returnUrl);
  }

  const hash = await hashSecret(password, env);
  for (const rule of rules.filter((item) => isPasswordMode(item.mode) && item.password_hash)) {
    if (timingSafeEqual(hash, rule.password_hash)) {
      if (rule.mode === "password_once") {
        const grant = await createOneTimeGrant(rule, env);
        return redirect(appendQuery(returnUrl, "ad_grant", grant));
      }

      const seconds = Number(env.DEFAULT_ACCESS_SECONDS || DEFAULT_ACCESS_SECONDS);
      const token = await createToken({ type: "access", ruleId: rule.id, host: rule.host, pathPattern: rule.path_pattern }, seconds, env);
      return completeLogin(request, env, returnUrl, replaceCookie(getAccessCookieName(env), token, seconds, env));
    }
  }

  const codeResult = await consumeCodeForRules(password, rules, env);
  if (codeResult.ok) {
    const rule = codeResult.rule;
    if (codeResult.sessionSeconds > 0) {
      const token = await createToken({ type: "access", ruleId: rule.id, host: rule.host, pathPattern: rule.path_pattern }, codeResult.sessionSeconds, env);
      return completeLogin(request, env, returnUrl, replaceCookie(getAccessCookieName(env), token, codeResult.sessionSeconds, env));
    }

    const grant = await createOneTimeGrant(rule, env);
    return redirect(appendQuery(returnUrl, "ad_grant", grant));
  }

  return loginPage(env, { returnUrl, target, error: codeResult.message || "密码或临时码不正确。" }, 401);
}

async function handleCheck(request, env) {
  const url = new URL(request.url);
  const returnUrl = sanitizeReturnUrl(url.searchParams.get("return") || "");
  const target = parseTarget(returnUrl);
  if (!target) return json({ allowed: false, loginUrl: loginUrl(env, returnUrl), reason: "missing_target" }, 400);

  const rules = await findMatchingRules(env, target.host, target.path);
  if (!rules.length) return json({ allowed: true, protected: false });
  const rule = rules[0];

  if (await hasAdminSession(request, env)) return json({ allowed: true, protected: true, role: "admin", rule });
  const accessRule = await findAccessSessionRule(request, env, rules);
  if (accessRule) return json({ allowed: true, protected: true, role: "access", rule: accessRule });

  const grantToken = new URL(returnUrl).searchParams.get("ad_grant");
  if (grantToken) {
    const grantRule = await consumeGrantForRules(grantToken, rules, env);
    if (grantRule) return json({ allowed: true, protected: true, role: "grant", rule: grantRule });
  }

  return json({ allowed: false, protected: true, loginUrl: loginUrl(env, returnUrl), reason: "login_required", rule }, 401);
}

async function handleRules(request, env) {
  const form = await request.formData();
  const now = unix();
  const id = Number(form.get("id") || 0);
  const host = normalizeHost(String(form.get("host") || ""));
  const pathPattern = normalizePathPattern(String(form.get("pathPattern") || ""));
  const mode = ["password", "password_once", "code", "admin"].includes(String(form.get("mode"))) ? String(form.get("mode")) : "password";
  const enabled = form.get("enabled") === "on" ? 1 : 0;
  const note = String(form.get("note") || "").trim();
  const password = String(form.get("password") || "");

  if (!host || !pathPattern) return redirect("/admin?error=rule_required");

  let passwordHash = null;
  if (isPasswordMode(mode) && password) {
    passwordHash = await hashSecret(password, env);
  }

  if (id > 0) {
    const current = await env.ACCESSDOCK_DB.prepare("SELECT * FROM rules WHERE id = ?").bind(id).first();
    passwordHash = passwordHash || current?.password_hash || null;
    if (isPasswordMode(mode) && !passwordHash) return redirect("/admin?error=password_required");
    if (enabled && await hasEnabledSameModeRule(env, host, pathPattern, mode, id)) return redirect("/admin?error=duplicate_rule");
    await env.ACCESSDOCK_DB.prepare(
      "UPDATE rules SET host = ?, path_pattern = ?, mode = ?, password_hash = ?, enabled = ?, note = ?, updated_at = ? WHERE id = ?",
    ).bind(host, pathPattern, mode, passwordHash, enabled, note, now, id).run();
  } else {
    if (isPasswordMode(mode) && !passwordHash) return redirect("/admin?error=password_required");
    if (enabled && await hasEnabledSameModeRule(env, host, pathPattern, mode)) return redirect("/admin?error=duplicate_rule");
    await env.ACCESSDOCK_DB.prepare(
      "INSERT INTO rules(host, path_pattern, mode, password_hash, enabled, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(host, pathPattern, mode, passwordHash, enabled, note, now, now).run();
  }

  return redirect("/admin");
}

async function handleRuleToggle(request, env) {
  const form = await request.formData();
  const id = Number(form.get("id") || 0);
  const enabled = Number(form.get("enabled") || 0) ? 0 : 1;
  const current = await env.ACCESSDOCK_DB.prepare("SELECT * FROM rules WHERE id = ?").bind(id).first();
  if (!current) return redirect("/admin?error=missing_rule");
  if (enabled && await hasEnabledSameModeRule(env, current.host, current.path_pattern, current.mode, id)) {
    return redirect("/admin?error=duplicate_rule");
  }
  await env.ACCESSDOCK_DB.prepare("UPDATE rules SET enabled = ?, updated_at = ? WHERE id = ?").bind(enabled, unix(), id).run();
  return redirect("/admin");
}

async function hasEnabledSameModeRule(env, host, pathPattern, mode, excludeId = 0) {
  const row = await env.ACCESSDOCK_DB.prepare(
    "SELECT id FROM rules WHERE enabled = 1 AND lower(host) = lower(?) AND path_pattern = ? AND mode = ? AND id <> ? LIMIT 1",
  ).bind(host, pathPattern, mode, excludeId).first();
  return Boolean(row);
}

async function handleRuleDelete(request, env) {
  const form = await request.formData();
  const id = Number(form.get("id") || 0);
  await env.ACCESSDOCK_DB.prepare("DELETE FROM rules WHERE id = ?").bind(id).run();
  return redirect("/admin");
}

async function handleCodes(request, env) {
  const form = await request.formData();
  const ruleId = Number(form.get("ruleId") || 0);
  const durationKey = String(form.get("duration") || "once");
  const duration = CODE_DURATIONS[durationKey] || CODE_DURATIONS.once;
  const note = String(form.get("note") || "").trim();
  const rule = await env.ACCESSDOCK_DB.prepare("SELECT * FROM rules WHERE id = ?").bind(ruleId).first();
  if (!rule) return redirect("/admin?error=missing_rule");

  const code = createCode();
  const now = unix();
  await env.ACCESSDOCK_DB.prepare(
    "INSERT INTO access_codes(code_hash, rule_id, session_seconds, max_uses, used_count, expires_at, note, created_at) VALUES (?, ?, ?, 1, 0, ?, ?, ?)",
  ).bind(await hashSecret(normalizeCode(code), env), ruleId, duration.sessionSeconds, now + duration.expiresSeconds, note, now).run();

  return redirect(`/admin?code=${encodeURIComponent(code)}&duration=${encodeURIComponent(duration.label)}`);
}

async function adminPage(env, request) {
  const url = new URL(request.url);
  const [rulesResult, codesResult] = await Promise.all([
    env.ACCESSDOCK_DB.prepare("SELECT * FROM rules ORDER BY updated_at DESC, id DESC").all(),
    env.ACCESSDOCK_DB.prepare(
      "SELECT c.*, r.host, r.path_pattern FROM access_codes c LEFT JOIN rules r ON r.id = c.rule_id ORDER BY c.created_at DESC LIMIT 20",
    ).all(),
  ]);
  const rules = rulesResult.results || [];
  const codes = codesResult.results || [];
  const codeRules = uniqueRulesForCodes(rules);
  const generatedCode = url.searchParams.get("code") || "";
  const generatedDuration = url.searchParams.get("duration") || "";
  const errorMessage = errorLabel(url.searchParams.get("error") || "");

  const existingRulesJson = jsonForScript(rules.map((rule) => ({
    id: rule.id,
    host: rule.host,
    pathPattern: rule.path_pattern,
    mode: rule.mode,
    enabled: Number(rule.enabled || 0),
  })));

  return html(renderAdminPage({
    rules,
    codes,
    codeRules,
    generatedCode,
    generatedDuration,
    errorMessage,
    existingRulesJson,
    codeDurations: CODE_DURATIONS,
  }));
}

async function requireAdmin(request, env, next) {
  if (await hasAdminSession(request, env)) return next();
  return redirect(`/login?return=${encodeURIComponent(new URL(request.url).pathname)}`);
}

async function hasAdminSession(request, env) {
  for (const token of getCookies(request, getAdminCookieName(env))) {
    const payload = await verifyToken(token, env);
    if (payload?.type === "admin") return true;
  }
  return false;
}

async function hasAccessSession(request, env, rule) {
  for (const token of getCookies(request, getAccessCookieName(env))) {
    const payload = await verifyToken(token, env);
    if (payload?.type !== "access") continue;
    if (Number(payload.ruleId) === Number(rule.id) || matchScope(rule.host, rule.path_pattern, payload.host, payload.pathPattern)) return true;
  }
  return false;
}

async function findAccessSessionRule(request, env, rules) {
  for (const rule of rules) {
    if (await hasAccessSession(request, env, rule)) return rule;
  }
  return null;
}

async function createOneTimeGrant(rule, env) {
  const id = crypto.randomUUID();
  const expiresAt = unix() + ONE_TIME_GRANT_SECONDS;
  await env.ACCESSDOCK_DB.prepare(
    "INSERT INTO one_time_grants(id, rule_id, host, path_pattern, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(id, rule.id, rule.host, rule.path_pattern, expiresAt, unix()).run();
  return createToken({ type: "grant", id, ruleId: rule.id, host: rule.host, pathPattern: rule.path_pattern }, ONE_TIME_GRANT_SECONDS, env);
}

async function consumeGrant(token, rule, env) {
  const payload = await verifyToken(token, env);
  if (payload?.type !== "grant" || Number(payload.ruleId) !== Number(rule.id)) return false;
  const row = await env.ACCESSDOCK_DB.prepare("SELECT * FROM one_time_grants WHERE id = ?").bind(payload.id).first();
  if (!row || row.used_at || unix() > row.expires_at) return false;
  await env.ACCESSDOCK_DB.prepare("UPDATE one_time_grants SET used_at = ? WHERE id = ?").bind(unix(), payload.id).run();
  return true;
}

async function consumeGrantForRules(token, rules, env) {
  for (const rule of rules) {
    if (await consumeGrant(token, rule, env)) return rule;
  }
  return null;
}

async function consumeCode(input, rule, env) {
  const codeHash = await hashSecret(normalizeCode(input), env);
  const row = await env.ACCESSDOCK_DB.prepare(
    "SELECT * FROM access_codes WHERE code_hash = ? AND rule_id = ?",
  ).bind(codeHash, rule.id).first();
  if (!row) return { ok: false, message: "密码或临时码不正确。" };
  if (row.used_count >= row.max_uses) return { ok: false, message: "临时码已使用。" };
  if (unix() > row.expires_at) return { ok: false, message: "临时码已过期。" };
  await env.ACCESSDOCK_DB.prepare(
    "UPDATE access_codes SET used_count = used_count + 1, used_at = ? WHERE id = ?",
  ).bind(unix(), row.id).run();
  return { ok: true, sessionSeconds: Number(row.session_seconds || 0) };
}

async function consumeCodeForRules(input, rules, env) {
  let message = "";
  for (const rule of rules) {
    const result = await consumeCode(input, rule, env);
    if (result.ok) return { ...result, rule };
    if (result.message !== "密码或临时码不正确。") message = result.message;
  }
  return { ok: false, message: message || "密码或临时码不正确。" };
}

async function findMatchingRules(env, host, path) {
  const result = await env.ACCESSDOCK_DB.prepare(
    "SELECT * FROM rules WHERE enabled = 1 AND lower(host) = lower(?)",
  ).bind(host).all();
  const matches = (result.results || [])
    .filter((rule) => wildcardMatch(path, rule.path_pattern))
    .sort((a, b) => {
      const pathDiff = b.path_pattern.length - a.path_pattern.length;
      if (pathDiff) return pathDiff;
      const updatedDiff = Number(b.updated_at || 0) - Number(a.updated_at || 0);
      if (updatedDiff) return updatedDiff;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  return matches;
}

async function cleanupExpired(env) {
  const cutoff = unix() - 60 * 60 * 24;
  await env.ACCESSDOCK_DB.prepare("DELETE FROM access_codes WHERE expires_at < ?").bind(cutoff).run();
  await env.ACCESSDOCK_DB.prepare("DELETE FROM one_time_grants WHERE expires_at < ?").bind(cutoff).run();
}

async function createToken(payload, maxAgeSeconds, env) {
  const body = { ...payload, iat: unix(), exp: unix() + maxAgeSeconds };
  const encoded = base64UrlEncode(JSON.stringify(body));
  const signature = await sign(encoded, env);
  return `${encoded}.${signature}`;
}

async function verifyToken(token, env) {
  if (!token || !token.includes(".")) return null;
  const [encoded, signature] = token.split(".");
  const expected = await sign(encoded, env);
  if (!timingSafeEqual(signature || "", expected)) return null;
  const payload = JSON.parse(base64UrlDecode(encoded));
  if (!payload.exp || unix() > payload.exp) return null;
  return payload;
}

async function sign(value, env) {
  const secret = env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bufferToBase64Url(signature);
}

async function hashSecret(value, env) {
  const data = `${env.SESSION_SECRET || ""}:${String(value || "")}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return bufferToBase64Url(digest);
}

function parseTarget(returnUrl) {
  try {
    const url = new URL(returnUrl);
    return { host: url.host.toLowerCase(), path: safeDecodePath(url.pathname || "/") };
  } catch {
    return null;
  }
}

function safeDecodePath(path) {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

function wildcardMatch(path, pattern) {
  const normalizedPath = safeDecodePath(path);
  const normalizedPattern = safeDecodePath(pattern);
  const escaped = normalizedPattern.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${escaped}$`).test(normalizedPath);
}

function matchScope(host, pattern, payloadHost, payloadPattern) {
  return String(host).toLowerCase() === String(payloadHost).toLowerCase() && pattern === payloadPattern;
}

function appendQuery(value, key, data) {
  const url = new URL(value);
  url.searchParams.set(key, data);
  return url.toString();
}

function loginUrl(env, returnUrl) {
  return `${getBaseUrl(env)}/login?return=${encodeURIComponent(returnUrl)}`;
}

function setCookie(name, value, maxAge, env) {
  const domain = env.COOKIE_DOMAIN ? `; Domain=${env.COOKIE_DOMAIN}` : "";
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax${domain}`;
}

function completeLogin(request, env, returnUrl, cookies) {
  const target = parseTarget(returnUrl);
  const sameSiteTarget = !/^https?:\/\//i.test(returnUrl) || (target && target.host.toLowerCase() === new URL(request.url).host.toLowerCase());
  if (sameSiteTarget) return redirect(returnUrl, cookies, 303);

  return html(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>登录成功</title></head><body><p>登录成功，正在安全跳转…</p><form id="continue" method="post" action="${escapeHtml(returnUrl)}"></form><script>document.getElementById("continue").submit()</script><noscript><button form="continue" type="submit">继续访问</button></noscript></body></html>`, 200, cookies);
}

function replaceCookie(name, value, maxAge, env) {
  // Older deployments may have created a host-only cookie with the same name.
  // Expire it before writing the shared-domain cookie so browsers cannot send
  // two values in an implementation-dependent order.
  return [...clearCookies(name, env), setCookie(name, value, maxAge, env)];
}

function clearCookies(name, env) {
  const attributes = "; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
  const cookies = [`${name}=${attributes}`];
  if (env.COOKIE_DOMAIN) cookies.push(`${name}=${attributes}; Domain=${env.COOKIE_DOMAIN}`);
  return cookies;
}

function getCookies(request, name) {
  const cookies = request.headers.get("cookie") || "";
  return cookies
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${name}=`))
    .map((part) => part.slice(name.length + 1));
}

function getAdminCookieName(env) {
  return env.ADMIN_COOKIE_NAME || ADMIN_COOKIE;
}

function getAccessCookieName(env) {
  return env.ACCESS_COOKIE_NAME || "accessdock_access";
}

function getBaseUrl(env) {
  return String(env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
}

function sanitizeReturnUrl(value) {
  if (!value) return "/admin";
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    return value.startsWith("/") ? value : "/admin";
  }
}

function normalizeHost(value) {
  return value.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
}

function normalizePathPattern(value) {
  const trimmed = value.trim() || "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function createCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let text = "AD";
  for (const byte of bytes) text += alphabet[byte % alphabet.length];
  return `${text.slice(0, 2)}-${text.slice(2, 6)}-${text.slice(6)}`;
}

function unix() {
  return Math.floor(Date.now() / 1000);
}

function isPasswordMode(mode) {
  return mode === "password" || mode === "password_once";
}

function uniqueRulesForCodes(rules) {
  const byScope = new Map();
  const sorted = [...rules].sort((a, b) => {
    const enabledDiff = Number(b.enabled || 0) - Number(a.enabled || 0);
    if (enabledDiff) return enabledDiff;
    const updatedDiff = Number(b.updated_at || 0) - Number(a.updated_at || 0);
    if (updatedDiff) return updatedDiff;
    return Number(b.id || 0) - Number(a.id || 0);
  });

  for (const rule of sorted) {
    if (!Number(rule.enabled || 0)) continue;
    const key = `${String(rule.host || "").toLowerCase()}\n${String(rule.path_pattern || "")}`;
    if (!byScope.has(key)) byScope.set(key, rule);
  }

  return [...byScope.values()].sort((a, b) => {
    const hostCompare = String(a.host || "").localeCompare(String(b.host || ""), "zh-CN");
    if (hostCompare) return hostCompare;
    return String(a.path_pattern || "").localeCompare(String(b.path_pattern || ""), "zh-CN");
  });
}

function modeLabel(mode) {
  return { password: "固定密码", password_once: "固定密码-每次验证", code: "临时码", admin: "仅管理员" }[mode] || mode;
}

function errorLabel(error) {
  return {
    rule_required: "请填写域名和路径规则。",
    password_required: "固定密码模式需要填写固定密码。",
    missing_rule: "没有找到关联规则。",
    duplicate_rule: "已存在相同域名、路径和访问模式的启用规则，请先停用旧规则。",
  }[error] || "";
}

function jsonForScript(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function formatTime(value) {
  return new Date(Number(value) * 1000).toLocaleString("zh-CN", { hour12: false });
}

function bufferToBase64Url(buffer) {
  let binary = "";
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlEncode(value) {
  return btoa(unescape(encodeURIComponent(value))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return decodeURIComponent(escape(atob(padded)));
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function html(content, status = 200, cookies = []) {
  const headers = new Headers({
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(content, { status, headers });
}

function redirect(location, cookies = [], status = 302) {
  const headers = new Headers({ location, "cache-control": "no-store" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status, headers });
}

function notFound() {
  return new Response("Not Found", { status: 404 });
}

function loginPage(env, { returnUrl, target, error }, status = 200) {
  return html(renderLoginPage({ returnUrl, target, error }), status);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
