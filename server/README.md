# Sync server

Single-file, dependency-free Node server that stores the app's **end-to-end-encrypted** sync blobs. It never sees workout data — the app encrypts everything on-device with the sync key before uploading, and the storage id + auth token are one-way derived from that key.

## Run on a VPS

Requires Node 18+ (`apt install nodejs` or [nodesource](https://github.com/nodesource/distributions)).

```bash
mkdir -p /opt/workout-sync && cp server.js /opt/workout-sync/
cd /opt/workout-sync
PORT=8790 DATA_DIR=/opt/workout-sync/data node server.js
```

### Keep it running (systemd)

`/etc/systemd/system/workout-sync.service`:

```ini
[Unit]
Description=Workout tracker sync server
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/workout-sync/server.js
Environment=PORT=8790
Environment=DATA_DIR=/opt/workout-sync/data
Restart=always
User=www-data
DynamicUser=yes
StateDirectory=workout-sync

[Install]
WantedBy=multi-user.target
```

Then `systemctl enable --now workout-sync`.

### HTTPS (required)

The app is served over HTTPS (GitHub Pages), so browsers refuse to call a plain-HTTP sync server. Point a (sub)domain at the VPS and put [Caddy](https://caddyserver.com) in front — it handles certificates automatically:

`/etc/caddy/Caddyfile`:

```
sync.your-domain.com {
    reverse_proxy localhost:8790
}
```

The sync server URL to enter in the app is then `https://sync.your-domain.com`.

## API

- `GET /v1/blob/:id` → ciphertext or 404
- `PUT /v1/blob/:id` → stores ciphertext (2 MB cap)

`:id` is SHA-256-derived from the sync key; every request must send `X-Sync-Auth`, a second derived secret. The first PUT for an id registers its auth hash; later reads/writes must match it, so knowing an id alone grants nothing.

## Backup

Everything lives in flat files under `DATA_DIR` — back that directory up like any other. Losing it only loses the synced copy; every device still has its full local data and will re-upload on next sync.
