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
wrangler.toml                Cloudflare Workers config
```

## Deployment Flow

1. Create a Cloudflare D1 database.
2. Copy the D1 `database_id` into `wrangler.toml`.
3. Configure environment variables.
4. Apply the D1 migration.
5. Deploy the Worker.
6. Bind your custom domain to the Worker.
7. Open `/admin` and create protected route rules.
8. Add `client/accessdock-client.js` to the projects that need access control.

## Environment Variables

Set these variables in Cloudflare Workers:

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

Update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "ACCESSDOCK_DB"
database_name = "accessdock"
database_id = "your-real-d1-database-id"
```

Apply migrations:

```powershell
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
code      Temporary access code for the matched route
admin     Admin session required
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
