# CloudFlare-AccessDock

CloudFlare-AccessDock is a lightweight access-control service for Cloudflare Workers. It provides a small admin console where you can configure protected hosts and routes at runtime, then let different projects call the same access-check API.

It does not bind itself to any fixed domain or business project. Deploy it to any domain you own, for example:

```text
https://auth.example.com
https://gate.example.com
https://access.example.com
```

## Features

- Runtime rule management from `/admin`
- Host + path pattern matching, such as `files.example.com/private/*`
- Fixed password access
- Fixed password access that requires re-authentication after refresh
- Temporary access codes
- Admin-only access
- One-time access flow: refresh after access will require login again
- Minute/hour/day level temporary access duration
- Reusable client helper for Pages Functions or Workers projects

## Project Structure

```text
src/index.js                 Worker service and admin console
client/accessdock-client.js  Reusable client-side Worker helper
migrations/0001_init.sql     D1 database schema
wrangler.toml                Local template config
scripts/render-wrangler.mjs  Generates deploy config from build variables
```

## Deployment Flow

1. Create a Cloudflare D1 database.
2. Create a Cloudflare Worker connected to this GitHub repository.
3. Add the build variable `D1_DATABASE_ID` in Cloudflare.
4. Configure runtime environment variables.
5. Deploy the Worker.
6. Apply the D1 migration.
7. Bind your custom domain to the Worker.
8. Open `/admin` and create protected route rules.
9. Add `client/accessdock-client.js` to the projects that need access control.

## Cloudflare Git Deploy

Use these settings when deploying from Cloudflare Workers + GitHub:

```text
Deploy command: npm run deploy
```

Cloudflare will install dependencies automatically. If the dashboard also asks for a build command, leave it empty unless your project page requires one.

If Cloudflare only asks for one deploy command, use:

```text
npm run deploy
```

Add these build environment variables in Cloudflare:

```text
D1_DATABASE_ID=your-real-d1-database-id
D1_DATABASE_NAME=accessdock
WORKER_NAME=cloudflare-accessdock
```

Only `D1_DATABASE_ID` is required. `D1_DATABASE_NAME` and `WORKER_NAME` are optional.

The repository keeps `wrangler.toml` as a template. During deployment, `scripts/render-wrangler.mjs` creates an ignored `wrangler.generated.toml` file and Wrangler deploys with that generated config. This keeps the real D1 database id out of Git.

## Environment Variables

Set these runtime variables in Cloudflare Workers:

```text
PUBLIC_BASE_URL=https://auth.example.com
COOKIE_DOMAIN=.example.com
ADMIN_PASSWORD=your-admin-password
SESSION_SECRET=a-long-random-secret
```

Notes:

- `PUBLIC_BASE_URL` is the public URL of AccessDock.
- `COOKIE_DOMAIN` is optional. Use it only when AccessDock and protected projects are under the same parent domain.
- `ADMIN_PASSWORD` is used for the `/admin` console.
- `SESSION_SECRET` signs cookies and access tokens. Use a long random string.

## D1 Setup

Create the database:

```powershell
wrangler d1 create accessdock
```

Apply migrations:

```powershell
npm run db:migrate
```

When running migrations from Cloudflare Git deploy, make sure `D1_DATABASE_ID` exists as a build environment variable. When running locally, set it in your shell first:

```powershell
$env:D1_DATABASE_ID="your-real-d1-database-id"
npm run db:migrate
```

For local development:

```powershell
npm run db:migrate:local
npm run dev
```

## Admin Console

Open:

```text
https://auth.example.com/admin
```

You can create rules like:

```text
host: files.example.com
pathPattern: /private/*
mode: password
```

Or:

```text
host: paste.example.com
pathPattern: /p/*
mode: code
```

Rules are stored in D1 and become effective immediately after saving. No redeploy is required.

## Rule Modes

```text
password  Fixed password for the matched route
password_once  Fixed password without persistent login; refresh requires login again
code           Temporary access code for the matched route
admin          Admin session required
```

Temporary codes can be created from the admin console. They support:

- one-time access without persistent login
- 1/2/3/5/10/30 minutes
- 1/2 hours
- 1 day

## Integrating a Project

Copy this file into the protected project:

```text
client/accessdock-client.js
```

Configure the protected project:

```text
ACCESSDOCK_BASE_URL=https://auth.example.com
```

Optionally add a Service Binding named `ACCESSDOCK` that targets the
AccessDock Worker. The helper prefers the binding when present and falls back
to the public URL when it is absent:

```toml
[[services]]
binding = "ACCESSDOCK"
service = "cloudflare-accessdock"
```

Use the actual deployed Worker name for non-production environments, for
example `cloudflare-accessdock-staging`.

Call `checkAccess` before returning protected content:

```js
import { checkAccess } from "./accessdock-client.js";

export default {
  async fetch(request, env) {
    const access = await checkAccess(request, env);
    if (!access.ok) return access.response;

    return new Response("Continue original business logic");
  },
};
```

For a file service, call `checkAccess` only before protected file responses. Public files, upload routes, and admin routes can remain unchanged.

## Matching Rules

Rules match `host + path`.

Wildcard `*` is supported:

```text
/private/*
/files/report.pdf
/p/*
```

If no enabled rule matches a request, AccessDock returns `allowed: true`.
When a protected request needs authentication, AccessDock intentionally
returns `401` with a JSON `loginUrl`. The reusable helper parses that response
and redirects the browser instead of treating the status as a service error.

## Example

Admin rule:

```text
host: files.example.com
pathPattern: /private/*
mode: code
```

User opens:

```text
https://files.example.com/private/report.pdf
```

The protected project calls:

```text
https://auth.example.com/api/check?return=https%3A%2F%2Ffiles.example.com%2Fprivate%2Freport.pdf
```

If the user is not authorized, AccessDock returns a login URL. The protected project redirects the user there.

## Security Notes

- AccessDock cannot protect websites that do not call its check API or do not route traffic through your Cloudflare account.
- Do not edit bundled Worker code in the Cloudflare dashboard if the project is deployed by GitHub Actions or Wrangler. Edit the source repo instead.
- Keep `SESSION_SECRET` private.
