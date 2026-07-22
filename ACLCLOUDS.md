# Deploy Bot Discord ke ACLClouds

Gunakan ACLClouds untuk menjalankan bot Discord yang harus online terus.
Cloudflare Workers tetap dipakai untuk website, dashboard, domain, dan endpoint HTTP.

## Settings ACLClouds

- Runtime: `Node.js`
- Install command: `npm install`
- Start command: `npm start`

Jika ACLClouds meminta command langsung, gunakan:

```text
node index.js
```

## Environment variables ACLClouds

Tambahkan variable berikut di panel ACLClouds:

```text
DISCORD_TOKEN=token_bot_discord
ROLE_PANEL_CHANNEL_ID=id_channel_role_panel
CHANNEL_ID=id_channel_notifikasi_tiktok
TIKTOK_USERNAME=restareaserver
DASHBOARD_USERNAME=Reyypo
DASHBOARD_PASSWORD=password_dashboard
PORT=3000
```

`DISCORD_GUILD_ID` tidak wajib untuk bot Node lama, tapi boleh tetap ditambahkan agar sama dengan Cloudflare Workers:

```text
DISCORD_GUILD_ID=755800147065176224
```

## Alur deployment

Satu repo ini dipakai oleh dua hosting:

```text
Cloudflare Workers -> src/worker.mjs -> npx wrangler deploy
ACLClouds          -> index.js       -> npm start
```

## Cek berhasil

Bot berhasil jalan jika log menampilkan:

```text
Discord bot online: nama_bot
Health server dan dashboard aktif di port 3000
```

Kalau muncul error environment variable belum diisi, cek lagi nama variable di ACLClouds.
