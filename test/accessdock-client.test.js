import assert from "node:assert/strict";
import test from "node:test";

import { checkAccess } from "../client/accessdock-client.js";

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
