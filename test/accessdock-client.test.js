import assert from "node:assert/strict";
import test from "node:test";

import { checkAccess } from "../client/accessdock-client.js";
import worker from "../src/index.js";

const protectedRequest = new Request("https://app.example.com/private");

test("uses the ACCESSDOCK service binding when configured", async () => {
  let bindingCalled = false;
  const env = {
    ACCESSDOCK_BASE_URL: "https://auth.example.com",
    ACCESSDOCK: {
      async fetch(request) {
        bindingCalled = true;
        assert.equal(new URL(request.url).pathname, "/api/check");
        return Response.json({ allowed: true, protected: true, role: "access" });
      },
    },
  };

  const result = await checkAccess(protectedRequest, env);

  assert.equal(bindingCalled, true);
  assert.equal(result.ok, true);
  assert.equal(result.result.role, "access");
});

test("falls back to public fetch when no service binding exists", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (request) => {
    assert.equal(new URL(request.url).hostname, "auth.example.com");
    return Response.json({ allowed: true, protected: false });
  };

  const result = await checkAccess(protectedRequest, {
    ACCESSDOCK_BASE_URL: "https://auth.example.com",
  });

  assert.equal(result.ok, true);
});

test("treats a 401 login response as an authentication redirect", async () => {
  const loginUrl =
    "https://auth.example.com/login?return=https%3A%2F%2Fapp.example.com%2Fprivate";
  const env = {
    ACCESSDOCK_BASE_URL: "https://auth.example.com",
    ACCESSDOCK: {
      async fetch() {
        return Response.json(
          { allowed: false, protected: true, loginUrl, reason: "login_required" },
          { status: 401 },
        );
      },
    },
  };

  const result = await checkAccess(protectedRequest, env);

  assert.equal(result.ok, false);
  assert.equal(result.response.status, 302);
  assert.equal(result.response.headers.get("location"), loginUrl);
});

function createAccessDockEnv() {
  const statement = {
    bind() {
      return this;
    },
    async run() {
      return {};
    },
    async all() {
      return { results: [] };
    },
  };

  return {
    ADMIN_PASSWORD: "admin-password",
    COOKIE_DOMAIN: ".example.com",
    SESSION_SECRET: "test-session-secret",
    ACCESSDOCK_DB: {
      prepare() {
        return statement;
      },
    },
  };
}

test("accepts a valid admin cookie when an older duplicate appears first", async () => {
  const env = createAccessDockEnv();
  const login = await worker.fetch(
    new Request("https://auth.example.com/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "password=admin-password&return=%2Fadmin",
    }),
    env,
  );

  assert.equal(login.status, 303);
  const sessionCookie = login.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith("accessdock_admin=") && cookie.includes("Max-Age=2592000"));
  const token = sessionCookie.match(/^accessdock_admin=([^;]+)/)[1];

  const admin = await worker.fetch(
    new Request("https://auth.example.com/admin", {
      headers: { cookie: `accessdock_admin=expired-or-invalid; accessdock_admin=${token}` },
    }),
    env,
  );

  assert.equal(admin.status, 200);
});

test("keeps cross-site login navigation on AccessDock before returning to the target", async () => {
  const response = await worker.fetch(
    new Request("https://auth.example.com/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "password=admin-password&return=https%3A%2F%2Fpaste.example.net%2F",
    }),
    createAccessDockEnv(),
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const body = await response.text();
  assert.match(body, /window\.location\.replace\("https:\/\/paste\.example\.net\//);
  assert.match(body, /http-equiv="refresh"/);
  assert.doesNotMatch(body, /method="post"/);
  assert.equal(response.headers.getSetCookie().some((cookie) => cookie.startsWith("accessdock_admin=") && cookie.includes("Max-Age=2592000")), true);
});

test("clears both host-only and shared-domain administrator cookies on logout", async () => {
  const response = await worker.fetch(new Request("https://auth.example.com/logout"), createAccessDockEnv());

  assert.equal(response.status, 302);
  assert.deepEqual(response.headers.getSetCookie(), [
    "accessdock_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
    "accessdock_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Domain=.example.com",
  ]);
});
