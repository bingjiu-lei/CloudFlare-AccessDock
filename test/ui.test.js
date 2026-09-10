import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

function createAccessDockEnv(rules = [], codes = []) {
  return {
    ADMIN_PASSWORD: "admin-password",
    COOKIE_DOMAIN: ".example.com",
    SESSION_SECRET: "test-session-secret",
    ACCESSDOCK_DB: {
      prepare(query) {
        return {
          bind() {
            return this;
          },
          async run() {
            return {};
          },
          async all() {
            if (query.includes("FROM rules")) {
              return { results: rules };
            }
            if (query.includes("FROM access_codes")) {
              return { results: codes };
            }
            return { results: [] };
          },
          async first() {
            return null;
          },
        };
      },
    },
  };
}

test("login page renders modern layout and target info", async () => {
  const env = createAccessDockEnv();
  const request = new Request("https://auth.example.com/login?return=https%3A%2F%2Fimg.example.com%2Fprivate%2Ftest.png");
  const response = await worker.fetch(request, env);

  assert.equal(response.status, 200);
  const text = await response.text();
  assert.match(text, /AccessDock/);
  assert.match(text, /Protected Target/);
  assert.match(text, /img\.example\.com\/private\/test\.png/);
  assert.match(text, /togglePasswordVisibility/);
});

test("admin console renders modern dashboard, stats, and modals", async () => {
  const sampleRules = [
    { id: 1, host: "img.example.com", path_pattern: "/upload/*", mode: "admin", enabled: 1, note: "图床上传接口" },
    { id: 2, host: "paste.example.com", path_pattern: "/*", mode: "password", enabled: 1, note: "剪贴板" },
  ];
  const sampleCodes = [
    { id: 10, host: "paste.example.com", path_pattern: "/*", max_uses: 1, used_count: 0, expires_at: Math.floor(Date.now() / 1000) + 3600, note: "分享给朋友" }
  ];

  const env = createAccessDockEnv(sampleRules, sampleCodes);

  // Perform login to obtain admin token
  const login = await worker.fetch(
    new Request("https://auth.example.com/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "password=admin-password&return=%2Fadmin",
    }),
    env,
  );
  const sessionCookie = login.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith("accessdock_admin=") && cookie.includes("Max-Age=2592000"));
  const token = sessionCookie.match(/^accessdock_admin=([^;]+)/)[1];

  // Request admin console
  const admin = await worker.fetch(
    new Request("https://auth.example.com/admin?code=AD-TEST-CODE&duration=1%20%E5%B0%8F%E6%97%B6", {
      headers: { cookie: `accessdock_admin=${token}` },
    }),
    env,
  );

  assert.equal(admin.status, 200);
  const html = await admin.text();

  // Verify modern components
  assert.match(html, /受保护域名/);
  assert.match(html, /活跃防护规则/);
  assert.match(html, /可用临时码/);
  assert.match(html, /TEMPORARY ACCESS CODE/);
  assert.match(html, /AD-TEST-CODE/);
  assert.match(html, /copyText/);
  assert.match(html, /openModal\('ruleModal'\)/);
  assert.match(html, /openModal\('codeModal'\)/);
  assert.match(html, /filterRules/);
  assert.match(html, /filterCodes/);
  assert.match(html, /img\.example\.com/);
  assert.match(html, /paste\.example\.com/);
});
