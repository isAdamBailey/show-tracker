# Deploying to Laravel Forge

This is a standalone Nuxt 4 site. Forge should run the Nitro server as a
background process managed by Supervisor, with nginx proxying to its dedicated
localhost port.

```text
browser → nginx (HTTPS) → 127.0.0.1:<port> → Node 24 / Nuxt Nitro
```

## Forge site

Create or configure the Forge site for `show-tracker.adambailey.io`, connected
to this repository and the production branch (`main`). Enable zero-downtime
deployments when creating the site. Install/select Node.js 24 for the site.
The site root should be `/home/forge/show-tracker.adambailey.io`, with releases
under `releases/` and `current` pointing to the active release.

Current target: server `stunning-fern` (`134.199.176.96`), site
`show-tracker.adambailey.io`. Forge assigned daemon ID `1196613` to the Nuxt
process; confirm the ID again after editing the process.

## Shared runtime environment

Forge's daemon does not automatically load the site's environment file. Put
these values in Forge's site environment editor, saved in the site's shared
`/home/forge/show-tracker.adambailey.io/.env` file (outside release
directories):

```dotenv
TICKETMASTER_API_KEY=...
SETLIST_FM_KEY=...
SEATGEEK_CLIENT_ID=...
NUXT_PUBLIC_GTAG_ID=G-...
```

The three API keys are required. `NUXT_PUBLIC_GTAG_ID` is optional. Keep the
API keys out of `NUXT_PUBLIC_*` variables; Nuxt reads them through
server-only `runtimeConfig`. The daemon launcher reads the shared dotenv file
with Node's `--env-file`, validates the required values, and maps them to the
matching private `NUXT_*` runtime-config names without printing their contents.

## Nuxt daemon

Choose a dedicated port only after verifying it is free on the Forge server:

```bash
sudo ss -tlnp | grep ':3005\b' || true
```

If it is already occupied, choose another unused port and use that same port
in the daemon command, nginx config, and deploy script below. In Forge's site
**Background processes**, create a custom process with:

- **User:** `forge`
- **Directory:** `/home/forge/show-tracker.adambailey.io/current`
- **Command** (for port `3005`):

  ```bash
  env PORT=3005 SITE_ENV_FILE=/home/forge/show-tracker.adambailey.io/.env bash deploy/start-nuxt.sh
  ```

The launcher reads the shared environment, binds Nitro to `127.0.0.1`, and
executes `node .output/server/index.mjs`. It does not rely on a PM2 process
name. Start the daemon in Forge and verify its assigned `daemon-<id>` and
`RUNNING` state with `sudo supervisorctl status`. Record that ID for the deploy
script; Forge can assign a new ID when a daemon is edited, so check it again
after any edit and remove orphaned entries.

## Deploy script

In Forge's site **Deployments** tab, use this script, replacing `1196613` with
the current daemon ID and `3005` if a different port was selected:

```bash
$CREATE_RELEASE()

cd "$FORGE_RELEASE_DIRECTORY"
npm ci
export NUXT_PUBLIC_GTAG_ID="$(node --env-file=/home/forge/show-tracker.adambailey.io/.env -p 'process.env.NUXT_PUBLIC_GTAG_ID || ""')"
npm run build

$ACTIVATE_RELEASE()

sudo supervisorctl restart daemon-1196613:*
```

`npm ci` is intentionally strict and uses the committed lockfile. The daemon
directory follows `current`, so restart it only after activation to make it
load the new release.

## nginx and TLS

In Forge's nginx configuration, replace the site's catch-all `location /`
block with the following, preserving the rest of Forge's SSL and server
configuration. Use the selected daemon port consistently:

```nginx
location / {
    proxy_pass http://127.0.0.1:3005;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_cache_bypass $http_upgrade;
}
```

Provision and verify a TLS certificate for `show-tracker.adambailey.io` in
Forge. Check the rendered nginx configuration and reload nginx after validating
it with `sudo nginx -t`. Forge may regenerate nginx configuration after site or
certificate changes, so recheck the proxy block afterward.

## Cutover and rollback

Before changing DNS or routing, deploy the site and verify all of the following:

- The Forge daemon is `RUNNING` and listening on the selected localhost port.
- `curl -I http://127.0.0.1:3005/` returns a successful response on the server.
- The Forge nginx config proxies `/` to the same port and preserves host and
  forwarded protocol headers.
- HTTPS requests to the domain return the Nuxt app and a valid certificate.
- `/`, `/artist/<artist>`, `/genre/<genre>`, `/show/<event-id>`, and the
  event/setlist API flows work. Confirm API requests succeed while browser
  responses do not contain the server-side API keys.
- The daemon is managed by Supervisor and is configured to restart after a
  server reboot.

Keep the previous server and its DNS/routing details available until the new
site is healthy after cutover. If deployment or smoke checks fail, point DNS or
the upstream route back to the previous server, then restore its prior TLS and
nginx configuration if those were changed. Leave the old server running until
the new route passes the same checks.
