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
    if (url.pathname === "/logout") return redirect("/login", [clearCookie(getAdminCookieName(env))]);
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
    return loginPage(env, {
      returnUrl: sanitizeReturnUrl(url.searchParams.get("return") || "/admin"),
      error: url.searchParams.get("error") || "",
    });
  }

  const form = await request.formData();
  const password = String(form.get("password") || "");
  const returnUrl = sanitizeReturnUrl(String(form.get("return") || "/admin"));

  if (password === env.ADMIN_PASSWORD) {
    const token = await createToken({ type: "admin" }, ADMIN_SESSION_SECONDS, env);
    return redirect(returnUrl, [setCookie(getAdminCookieName(env), token, ADMIN_SESSION_SECONDS, env)]);
  }

  const target = parseTarget(returnUrl);
  if (!target) {
    return loginPage(env, { returnUrl, error: "请输入管理员密码。" }, 401);
  }

  const rule = await findMatchingRule(env, target.host, target.path);
  if (!rule) {
    return redirect(returnUrl);
  }

  if ((rule.mode === "password" || rule.mode === "password_once") && rule.password_hash) {
    const hash = await hashSecret(password, env);
    if (timingSafeEqual(hash, rule.password_hash)) {
      if (rule.mode === "password_once") {
        const grant = await createOneTimeGrant(rule, env);
        return redirect(appendQuery(returnUrl, "ad_grant", grant));
      }

      const seconds = Number(env.DEFAULT_ACCESS_SECONDS || DEFAULT_ACCESS_SECONDS);
      const token = await createToken({ type: "access", ruleId: rule.id, host: rule.host, pathPattern: rule.path_pattern }, seconds, env);
      return redirect(returnUrl, [setCookie(getAccessCookieName(env), token, seconds, env)]);
    }
  }

  const codeResult = await consumeCode(password, rule, env);
  if (codeResult.ok) {
    if (codeResult.sessionSeconds > 0) {
      const token = await createToken({ type: "access", ruleId: rule.id, host: rule.host, pathPattern: rule.path_pattern }, codeResult.sessionSeconds, env);
      return redirect(returnUrl, [setCookie(getAccessCookieName(env), token, codeResult.sessionSeconds, env)]);
    }

    const grant = await createOneTimeGrant(rule, env);
    return redirect(appendQuery(returnUrl, "ad_grant", grant));
  }

  return loginPage(env, { returnUrl, error: codeResult.message || "密码或临时码不正确。" }, 401);
}

async function handleCheck(request, env) {
  const url = new URL(request.url);
  const returnUrl = sanitizeReturnUrl(url.searchParams.get("return") || "");
  const target = parseTarget(returnUrl);
  if (!target) return json({ allowed: false, loginUrl: loginUrl(env, returnUrl), reason: "missing_target" }, 400);

  const rule = await findMatchingRule(env, target.host, target.path);
  if (!rule) return json({ allowed: true, protected: false });

  if (await hasAdminSession(request, env)) return json({ allowed: true, protected: true, role: "admin", rule });
  if (await hasAccessSession(request, env, rule)) return json({ allowed: true, protected: true, role: "access", rule });

  const grantToken = new URL(returnUrl).searchParams.get("ad_grant");
  if (grantToken && await consumeGrant(grantToken, rule, env)) {
    return json({ allowed: true, protected: true, role: "grant", rule });
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
  const autoDisablePasswordConflicts = form.get("autoDisablePasswordConflicts") === "1";

  if (!host || !pathPattern) return redirect("/admin?error=rule_required");

  let passwordHash = null;
  if (isPasswordMode(mode) && password) {
    passwordHash = await hashSecret(password, env);
  }

  if (id > 0) {
    const current = await env.ACCESSDOCK_DB.prepare("SELECT * FROM rules WHERE id = ?").bind(id).first();
    passwordHash = passwordHash || current?.password_hash || null;
    if (isPasswordMode(mode) && !passwordHash) return redirect("/admin?error=password_required");
    if (enabled && isPasswordMode(mode) && autoDisablePasswordConflicts) {
      await disablePasswordRuleConflicts(env, host, pathPattern, id);
    }
    await env.ACCESSDOCK_DB.prepare(
      "UPDATE rules SET host = ?, path_pattern = ?, mode = ?, password_hash = ?, enabled = ?, note = ?, updated_at = ? WHERE id = ?",
    ).bind(host, pathPattern, mode, passwordHash, enabled, note, now, id).run();
  } else {
    if (isPasswordMode(mode) && !passwordHash) return redirect("/admin?error=password_required");
    if (enabled && isPasswordMode(mode) && autoDisablePasswordConflicts) {
      await disablePasswordRuleConflicts(env, host, pathPattern);
    }
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
  await env.ACCESSDOCK_DB.prepare("UPDATE rules SET enabled = ?, updated_at = ? WHERE id = ?").bind(enabled, unix(), id).run();
  return redirect("/admin");
}

async function disablePasswordRuleConflicts(env, host, pathPattern, excludeId = 0) {
  await env.ACCESSDOCK_DB.prepare(
    "UPDATE rules SET enabled = 0, updated_at = ? WHERE lower(host) = lower(?) AND path_pattern = ? AND mode IN ('password', 'password_once') AND enabled = 1 AND id <> ?",
  ).bind(unix(), host, pathPattern, excludeId).run();
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

  return html(layout({
    title: "AccessDock",
    body: `
      <section class="topbar">
        <div>
          <div class="eyebrow">AccessDock</div>
          <h1>访问控制台</h1>
        </div>
        <a class="ghost" href="/logout">退出</a>
      </section>

      ${generatedCode ? `
        <section class="notice">
          <span>临时码已生成：${escapeHtml(generatedDuration)}</span>
          <code>${escapeHtml(generatedCode)}</code>
        </section>
      ` : ""}

      ${errorMessage ? `
        <section class="notice error-notice">
          <span>${escapeHtml(errorMessage)}</span>
        </section>
      ` : ""}

      <section class="grid">
        <form class="panel" method="post" action="/admin/rules" data-rule-form>
          <h2>新增规则</h2>
          <label>域名</label>
          <input name="host" placeholder="img.example.com" required data-rule-host>
          <label>路径规则</label>
          <input name="pathPattern" placeholder="/file/private/*" required data-rule-path>
          <label>访问模式</label>
          <select name="mode" data-rule-mode>
            <option value="password">固定密码</option>
            <option value="password_once">固定密码-每次验证</option>
            <option value="code">临时码</option>
            <option value="admin">仅管理员</option>
          </select>
          <div data-password-field>
            <label>固定密码</label>
            <input name="password" type="password" placeholder="固定密码模式需要" data-rule-password>
          </div>
          <label>备注</label>
          <input name="note" placeholder="笔记文件目录">
          <label class="check"><input name="enabled" type="checkbox" checked data-rule-enabled> 启用</label>
          <input type="hidden" name="autoDisablePasswordConflicts" value="0" data-auto-disable-conflicts>
          <button type="submit">保存规则</button>
        </form>

        <form class="panel" method="post" action="/admin/codes">
          <h2>生成临时码</h2>
          <label>关联规则</label>
          <select name="ruleId" required>
            ${codeRules.map((r) => `<option value="${r.id}">${escapeHtml(r.host)}${escapeHtml(r.path_pattern)}</option>`).join("")}
          </select>
          <label>访问有效期</label>
          <select name="duration">
            ${Object.entries(CODE_DURATIONS).map(([key, value]) => `<option value="${key}">${escapeHtml(value.label)}</option>`).join("")}
          </select>
          <label>备注</label>
          <input name="note" placeholder="发给谁，做什么用">
          <button type="submit" ${codeRules.length ? "" : "disabled"}>生成临时码</button>
        </form>
      </section>

      <section class="panel table-panel">
        <h2>规则列表</h2>
        <div class="table">
          <div class="thead"><span>状态</span><span>匹配范围</span><span>模式</span><span>备注</span><span>操作</span></div>
          ${rules.map(ruleRow).join("") || `<div class="empty">还没有规则。</div>`}
        </div>
      </section>

      <section class="panel table-panel">
        <h2>最近临时码</h2>
        <div class="table codes">
          <div class="thead"><span>状态</span><span>规则</span><span>有效期</span><span>备注</span></div>
          ${codes.map(codeRow).join("") || `<div class="empty">还没有临时码。</div>`}
        </div>
      </section>
      <script>
        const existingRules = ${jsonForScript(rules.map((rule) => ({
          id: rule.id,
          host: rule.host,
          pathPattern: rule.path_pattern,
          mode: rule.mode,
          enabled: Number(rule.enabled || 0),
        })))};

        const ruleForm = document.querySelector("[data-rule-form]");
        const modeSelect = document.querySelector("[data-rule-mode]");
        const passwordField = document.querySelector("[data-password-field]");
        const passwordInput = document.querySelector("[data-rule-password]");
        const hostInput = document.querySelector("[data-rule-host]");
        const pathInput = document.querySelector("[data-rule-path]");
        const enabledInput = document.querySelector("[data-rule-enabled]");
        const autoDisableInput = document.querySelector("[data-auto-disable-conflicts]");

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
          if (!isPasswordRuleMode(modeSelect.value) || !enabledInput.checked || autoDisableInput.value === "1") return;

          const host = normalizeHostInput(hostInput.value);
          const pathPattern = normalizePathInput(pathInput.value);
          const conflicts = existingRules.filter((rule) =>
            rule.enabled &&
            isPasswordRuleMode(rule.mode) &&
            normalizeHostInput(rule.host) === host &&
            normalizePathInput(rule.pathPattern) === pathPattern
          );

          if (!conflicts.length) return;

          const confirmed = confirm("已存在相同域名和路径的启用固定密码规则。是否停用旧规则并保存当前规则？");
          if (!confirmed) {
            event.preventDefault();
            return;
          }

          autoDisableInput.value = "1";
        });
      </script>
    `,
  }));
}

function ruleRow(rule) {
  return `<div class="tr">
    <span><strong class="${rule.enabled ? "ok" : "muted"}">${rule.enabled ? "启用" : "停用"}</strong></span>
    <span><b>${escapeHtml(rule.host)}</b><small>${escapeHtml(rule.path_pattern)}</small></span>
    <span>${modeLabel(rule.mode)}</span>
    <span>${escapeHtml(rule.note || "-")}</span>
    <span class="actions">
      <form method="post" action="/admin/rules/toggle">
        <input type="hidden" name="id" value="${rule.id}">
        <input type="hidden" name="enabled" value="${rule.enabled}">
        <button class="mini ${rule.enabled ? "warning" : "success"}" type="submit">${rule.enabled ? "停用" : "启用"}</button>
      </form>
      <form method="post" action="/admin/rules/delete">
        <input type="hidden" name="id" value="${rule.id}">
        <button class="mini danger" type="submit">删除</button>
      </form>
    </span>
  </div>`;
}

function codeRow(code) {
  const now = unix();
  const used = code.used_count >= code.max_uses;
  const expired = now > code.expires_at;
  const status = used ? "已使用" : expired ? "已过期" : "可用";
  return `<div class="tr">
    <span><strong class="${status === "可用" ? "ok" : "muted"}">${status}</strong></span>
    <span><b>${escapeHtml(code.host || "")}</b><small>${escapeHtml(code.path_pattern || "")}</small></span>
    <span>${formatTime(code.expires_at)}</span>
    <span>${escapeHtml(code.note || "-")}</span>
  </div>`;
}

async function requireAdmin(request, env, next) {
  if (await hasAdminSession(request, env)) return next();
  return redirect(`/login?return=${encodeURIComponent(new URL(request.url).pathname)}`);
}

async function hasAdminSession(request, env) {
  const token = getCookie(request, getAdminCookieName(env));
  const payload = await verifyToken(token, env);
  return payload?.type === "admin";
}

async function hasAccessSession(request, env, rule) {
  const token = getCookie(request, getAccessCookieName(env));
  const payload = await verifyToken(token, env);
  if (payload?.type !== "access") return false;
  return Number(payload.ruleId) === Number(rule.id) || matchScope(rule.host, rule.path_pattern, payload.host, payload.pathPattern);
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

async function findMatchingRule(env, host, path) {
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
  return matches[0] || null;
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

function clearCookie(name) {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function getCookie(request, name) {
  const cookies = request.headers.get("cookie") || "";
  const item = cookies.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? item.slice(name.length + 1) : "";
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

function html(content, status = 200) {
  return new Response(content, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function redirect(location, cookies = []) {
  const headers = new Headers({ location, "cache-control": "no-store" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function notFound() {
  return new Response("Not Found", { status: 404 });
}

function loginPage(env, { returnUrl, error }, status = 200) {
  return html(layout({
    title: "登录",
    body: `<main class="login">
      <form class="panel login-panel" method="post" action="/login">
        <div class="eyebrow">AccessDock</div>
        <h1>访问验证</h1>
        <p>请输入管理员密码、访问密码或临时码。</p>
        ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
        <input type="hidden" name="return" value="${escapeHtml(returnUrl)}">
        <label>访问凭证</label>
        <input name="password" type="password" autocomplete="current-password" autofocus required>
        <button type="submit">继续</button>
      </form>
    </main>`,
  }), status);
}

function layout({ title, body }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root {
  --bg: #f5f7fb;
  --panel: #ffffff;
  --text: #172033;
  --muted: #647084;
  --line: #dfe5ef;
  --ink: #111827;
  --ok: #0f766e;
  --danger: #b42318;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: "Inter", "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
}
body::before {
  content: "";
  position: fixed;
  inset: 0 0 auto 0;
  height: 220px;
  background: linear-gradient(180deg, #eaf0f8, rgba(245, 247, 251, 0));
  pointer-events: none;
}
main, section { position: relative; }
.topbar {
  width: min(1180px, calc(100% - 40px));
  margin: 34px auto 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.eyebrow {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}
h1, h2 { margin: 0; color: var(--ink); }
h1 { margin-top: 4px; font-size: 30px; letter-spacing: 0; }
h2 { margin-bottom: 16px; font-size: 18px; }
p { margin: 0 0 18px; color: var(--muted); line-height: 1.7; }
.grid {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto 18px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(23, 32, 51, .06);
  padding: 22px;
}
.grid > .panel > button[type="submit"] {
  min-width: 108px;
  margin-top: 14px;
}
.table-panel {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto 18px;
}
label { display: block; margin: 12px 0 7px; color: #344054; font-size: 13px; font-weight: 700; }
input, select {
  width: 100%;
  height: 40px;
  padding: 0 11px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: var(--text);
  font: inherit;
}
input:focus, select:focus { outline: 2px solid #111827; outline-offset: 2px; }
.check { display: flex; gap: 8px; align-items: center; }
.check input { width: auto; height: auto; }
button, .ghost {
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 6px;
  background: var(--ink);
  color: #fff;
  padding: 0 14px;
  font: inherit;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}
button:disabled { opacity: .5; cursor: not-allowed; }
.ghost { background: #fff; color: var(--ink); border: 1px solid var(--line); }
.mini { height: 30px; padding: 0 10px; font-size: 12px; }
.success { background: #0f766e; color: #fff; }
.warning { background: #b45309; color: #fff; }
.danger { background: #fff; color: var(--danger); border: 1px solid #f2c6c2; }
[hidden] { display: none !important; }
.table { display: grid; gap: 0; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.thead, .tr { display: grid; grid-template-columns: 90px 1.5fr 110px 1fr 140px; align-items: center; gap: 12px; padding: 12px 14px; }
.codes .thead, .codes .tr { grid-template-columns: 90px 1.6fr 180px 1fr; }
.thead { background: #f8fafc; color: var(--muted); font-size: 12px; font-weight: 800; }
.tr { border-top: 1px solid var(--line); font-size: 14px; }
.tr small { display: block; margin-top: 4px; color: var(--muted); }
.actions { display: flex; gap: 8px; }
.ok { color: var(--ok); }
.muted { color: var(--muted); }
.empty { padding: 18px; color: var(--muted); }
.notice {
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto 18px;
  padding: 16px 18px;
  border: 1px solid #b7e4d8;
  border-radius: 8px;
  background: #ecfdf5;
}
.notice code {
  display: block;
  margin-top: 8px;
  font-size: 22px;
  font-weight: 800;
  color: var(--ink);
}
.error-notice {
  border-color: #f2c6c2;
  background: #fff1f0;
  color: var(--danger);
  font-weight: 700;
}
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
.login-panel {
  width: min(100%, 420px);
  padding: 28px;
}
.login-panel p {
  margin-bottom: 22px;
}
.login-panel label {
  margin-top: 18px;
}
.login-panel input {
  height: 48px;
  font-size: 16px;
}
.login-panel button[type="submit"] {
  width: 100%;
  height: 48px;
  margin-top: 16px;
  font-size: 16px;
}
.error { color: var(--danger); font-weight: 700; }
@media (max-width: 820px) {
  .grid { grid-template-columns: 1fr; }
  .thead { display: none; }
  .tr, .codes .tr { grid-template-columns: 1fr; gap: 6px; }
  .actions { align-items: flex-start; }
}
</style>
</head>
<body>${body}</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
