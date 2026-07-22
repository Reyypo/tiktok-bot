# Deploy ke Cloudflare Workers

Project ini sekarang punya entrypoint Cloudflare Workers di `src/worker.mjs`.
Worker menjalankan landing page, `/health`, dan dashboard `/dashboard` lewat Discord REST API.

## Build settings Cloudflare

- Build command: kosongkan
- Deploy command: `npx wrangler deploy`
- Root directory: `/`

## Environment variables

Tambahkan variable berikut di Cloudflare Workers:

- `DISCORD_TOKEN` sebagai secret
- `DISCORD_GUILD_ID` sebagai variable biasa atau secret
- `DASHBOARD_USERNAME` sebagai variable biasa atau secret
- `DASHBOARD_PASSWORD` sebagai secret
- `TIKTOK_USERNAME` sebagai variable biasa
- `CHANNEL_ID` opsional, hanya dipakai oleh bot Node lama
- `ROLE_PANEL_CHANNEL_ID` opsional, hanya dipakai oleh bot Node lama

`DISCORD_GUILD_ID` wajib untuk dashboard Worker karena Workers tidak menjalankan cache Discord gateway seperti `discord.js`.

## Batasan migrasi

Cloudflare Workers cocok untuk request HTTP, assets, dashboard, dan cron pendek.
Kode lama `index.js` tetap ada untuk runtime Node yang selalu hidup, karena login Discord Gateway dan TikTok live checker memakai proses long-running.
