const crypto = require('crypto');
const http = require('http');
const { EmbedBuilder } = require('discord.js');

const MAX_BODY_SIZE = 10_000;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeEqual(actual, expected) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function getCookie(req, name) {
  const cookies = (req.headers.cookie || '').split(';');

  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }

  return '';
}

function getSessionToken() {
  const username = process.env.DASHBOARD_USERNAME || 'admin';
  const password = process.env.DASHBOARD_PASSWORD || '';

  return crypto
    .createHmac('sha256', password)
    .update(`rest-area-dashboard:${username}`)
    .digest('hex');
}

function isAuthorized(req) {
  const session = getCookie(req, 'dashboard_session');
  return Boolean(session) && safeEqual(session, getSessionToken());
}

function renderLogin(error = '') {
  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Login REST AREA Dashboard</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: radial-gradient(circle at top, #30204a, #111218 55%); color: #f4f4f5; font-family: Arial, sans-serif; }
    main { width: min(420px, 100%); padding: 34px; background: rgba(35, 36, 40, .97); border: 1px solid #454750; border-radius: 22px; box-shadow: 0 24px 70px rgba(0, 0, 0, .45); }
    .logo { width: 62px; height: 62px; display: grid; place-items: center; margin: 0 auto 20px; border-radius: 18px; background: linear-gradient(135deg, #5865f2, #fe2c55); font-size: 25px; font-weight: 900; }
    h1 { margin: 0; text-align: center; font-size: 30px; }
    .subtitle { margin: 10px 0 26px; color: #b5bac1; text-align: center; line-height: 1.5; }
    label { display: block; margin: 16px 0 8px; font-weight: 700; }
    input { width: 100%; padding: 14px; border: 1px solid #4e5058; border-radius: 10px; background: #1e1f22; color: #f2f3f5; font: inherit; outline: none; }
    input:focus { border-color: #5865f2; box-shadow: 0 0 0 3px rgba(88, 101, 242, .18); }
    button { width: 100%; margin-top: 24px; padding: 15px; border: 0; border-radius: 10px; background: #5865f2; color: white; font: inherit; font-weight: 800; cursor: pointer; }
    button:hover { background: #4752c4; }
    .error { margin-bottom: 18px; padding: 12px; border-radius: 9px; background: #542f35; color: #ffb4b4; text-align: center; }
  </style>
</head>
<body>
  <main>
    <div class="logo">RA</div>
    <h1>Dashboard Login</h1>
    <p class="subtitle">Masuk untuk mengirim pesan melalui REST AREA Bot.</p>
    ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
    <form method="post" action="/dashboard/login">
      <label for="username">Username</label>
      <input id="username" name="username" autocomplete="username" required autofocus>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required>
      <button type="submit">Masuk ke Dashboard</button>
    </form>
  </main>
</body>
</html>`;
}

function getSendableChannels(client) {
  return [...client.channels.cache.values()]
    .filter(channel => channel.isTextBased?.() && channel.isSendable?.() && channel.guild)
    .sort((a, b) => {
      const guildCompare = a.guild.name.localeCompare(b.guild.name);
      return guildCompare || a.name.localeCompare(b.name);
    });
}

function isHttpUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseColor(value) {
  const normalized = value.replace('#', '');
  return /^[0-9a-f]{6}$/i.test(normalized)
    ? Number.parseInt(normalized, 16)
    : null;
}

function renderDashboard(channels, notice = '') {
  const options = channels.map(channel => (
    `<option value="${channel.id}">${escapeHtml(channel.guild.name)} / #${escapeHtml(channel.name)}</option>`
  )).join('');

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>REST AREA Bot Dashboard</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: radial-gradient(circle at top, #30204a, #111218 55%); color: #f4f4f5; font-family: Arial, sans-serif; }
    main { width: min(680px, 100%); background: rgba(35, 36, 40, .96); border: 1px solid #454750; border-radius: 22px; padding: 30px; box-shadow: 0 24px 70px rgba(0, 0, 0, .4); }
    .eyebrow { color: #fe2c55; font-size: 13px; font-weight: 800; letter-spacing: 1.6px; }
    h1 { margin: 8px 0; font-size: clamp(28px, 5vw, 42px); }
    .subtitle { margin: 0 0 26px; color: #b5bac1; line-height: 1.6; }
    label { display: block; margin: 18px 0 8px; font-weight: 700; }
    select, textarea, input { width: 100%; border: 1px solid #4e5058; border-radius: 10px; background: #1e1f22; color: #f2f3f5; padding: 14px; font: inherit; outline: none; }
    select:focus, textarea:focus, input:focus { border-color: #5865f2; box-shadow: 0 0 0 3px rgba(88, 101, 242, .18); }
    textarea { min-height: 170px; resize: vertical; line-height: 1.5; }
    input[type="color"] { width: 64px; height: 54px; padding: 5px; cursor: pointer; }
    .embed-fields { margin-top: 18px; padding: 18px; border: 1px solid #454750; border-radius: 12px; background: #292b2f; }
    .embed-fields label:first-child { margin-top: 0; }
    .hidden { display: none; }
    .row { display: flex; justify-content: space-between; gap: 12px; margin-top: 8px; color: #949ba4; font-size: 13px; }
    button { width: 100%; margin-top: 22px; border: 0; border-radius: 10px; padding: 15px; background: #5865f2; color: white; font: inherit; font-weight: 800; cursor: pointer; }
    button:hover { background: #4752c4; }
    .notice { margin: 0 0 20px; padding: 13px 15px; border-radius: 10px; background: #214d38; color: #b8f7d1; }
    .empty { color: #ffb4b4; }
    .topbar { display: flex; align-items: start; justify-content: space-between; gap: 20px; }
    .logout { color: #b5bac1; text-decoration: none; font-size: 14px; font-weight: 700; }
    .logout:hover { color: white; }
  </style>
</head>
<body>
  <main>
    <div class="topbar"><div class="eyebrow">REST AREA BOT</div><a class="logout" href="/dashboard/logout">Keluar</a></div>
    <h1>Kirim Pesan Discord</h1>
    <p class="subtitle">Pilih channel yang dapat diakses bot, tulis pesan, lalu kirim langsung dari dashboard.</p>
    ${notice ? `<div class="notice">${escapeHtml(notice)}</div>` : ''}
    ${channels.length ? `
    <form method="post" action="/dashboard/send">
      <label for="channelId">Channel tujuan</label>
      <select id="channelId" name="channelId" required>
        <option value="" selected disabled>Pilih channel tujuan...</option>
        ${options}
      </select>

      <label for="messageType">Tipe pesan</label>
      <select id="messageType" name="messageType">
        <option value="plain">Pesan biasa</option>
        <option value="embed">Embed</option>
      </select>

      <div id="plainFields">
        <label for="message">Pesan</label>
        <textarea id="message" name="message" maxlength="2000" required placeholder="Tulis pesan yang akan dikirim..."></textarea>
        <div class="row"><span>Mention otomatis dinonaktifkan</span><span>Maksimal 2.000 karakter</span></div>
      </div>

      <div id="embedFields" class="embed-fields hidden">
        <strong>EMBED</strong>

        <label for="embedContent">Teks di luar embed (opsional)</label>
        <textarea id="embedContent" name="embedContent" maxlength="2000" placeholder="Contoh: @restareaserver sedang LIVE di TikTok!"></textarea>

        <label for="embedTitle">Judul (opsional)</label>
        <input id="embedTitle" name="embedTitle" maxlength="256" placeholder="Contoh: Informasi terbaru">

        <label for="embedDescription">Teks di dalam embed (opsional)</label>
        <textarea id="embedDescription" name="embedDescription" maxlength="4096" placeholder="Tulis informasi yang tampil di dalam embed..."></textarea>

        <label for="embedColor">Warna embed</label>
        <input id="embedColor" name="embedColor" type="color" value="#fe2c55">

        <label for="embedImage">URL gambar utama (opsional)</label>
        <input id="embedImage" name="embedImage" type="url" placeholder="https://...">

        <label for="embedThumbnail">URL thumbnail kanan atas (opsional)</label>
        <input id="embedThumbnail" name="embedThumbnail" type="url" placeholder="https://...">

        <label for="embedBanner">URL banner kecil bawah (opsional)</label>
        <input id="embedBanner" name="embedBanner" type="url" placeholder="https://...">

        <label for="embedFooter">Footer (opsional)</label>
        <input id="embedFooter" name="embedFooter" maxlength="2048" value="REST AREA Live Notification" placeholder="REST AREA Live Notification">
      </div>

      <button type="submit">Kirim ke Discord</button>
    </form>` : '<p class="empty">Bot belum siap atau tidak memiliki channel teks yang bisa dikirimi pesan.</p>'}
  </main>
  <script>
    const messageType = document.getElementById('messageType');
    const plainFields = document.getElementById('plainFields');
    const embedFields = document.getElementById('embedFields');
    const message = document.getElementById('message');

    messageType?.addEventListener('change', () => {
      const useEmbed = messageType.value === 'embed';
      plainFields.classList.toggle('hidden', useEmbed);
      embedFields.classList.toggle('hidden', !useEmbed);
      message.required = !useEmbed;
    });
  </script>
</body>
</html>`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) reject(new Error('Request terlalu besar'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(html);
}

function startHealthServer(client) {
  const port = Number(process.env.PORT) || 3000;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/' || url.pathname === '/health') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      });
      res.end(JSON.stringify({
        status: 'ok',
        service: 'rest-area-bot',
        discord: client.isReady() ? 'online' : 'connecting',
        uptime: Math.floor(process.uptime())
      }));
      return;
    }

    if (url.pathname.startsWith('/dashboard')) {
      if (!process.env.DASHBOARD_PASSWORD) {
        sendHtml(res, 503, renderDashboard([], 'DASHBOARD_PASSWORD belum diatur di Render.'));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/dashboard/login') {
        if (isAuthorized(req)) {
          res.writeHead(303, { Location: '/dashboard' });
          res.end();
          return;
        }

        sendHtml(res, 200, renderLogin());
        return;
      }

      if (req.method === 'POST' && url.pathname === '/dashboard/login') {
        if (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') {
          res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Request ditolak');
          return;
        }

        try {
          const body = new URLSearchParams(await readBody(req));
          const username = body.get('username') || '';
          const password = body.get('password') || '';
          const expectedUsername = process.env.DASHBOARD_USERNAME || 'admin';
          const expectedPassword = process.env.DASHBOARD_PASSWORD;

          if (!safeEqual(username, expectedUsername) || !safeEqual(password, expectedPassword)) {
            sendHtml(res, 401, renderLogin('Username atau password salah.'));
            return;
          }

          res.writeHead(303, {
            Location: '/dashboard',
            'Set-Cookie': `dashboard_session=${getSessionToken()}; Path=/dashboard; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
          });
          res.end();
        } catch (error) {
          console.error('Login dashboard gagal:', error);
          sendHtml(res, 400, renderLogin('Login gagal. Silakan coba lagi.'));
        }
        return;
      }

      if (req.method === 'GET' && url.pathname === '/dashboard/logout') {
        res.writeHead(303, {
          Location: '/dashboard/login',
          'Set-Cookie': 'dashboard_session=; Path=/dashboard; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
        });
        res.end();
        return;
      }

      if (!isAuthorized(req)) {
        res.writeHead(303, { Location: '/dashboard/login' });
        res.end();
        return;
      }

      if (req.method === 'GET' && url.pathname === '/dashboard') {
        sendHtml(res, 200, renderDashboard(getSendableChannels(client)));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/dashboard/send') {
        if (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') {
          res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Request ditolak');
          return;
        }

        try {
          const body = new URLSearchParams(await readBody(req));
          const channelId = body.get('channelId') || '';
          const messageType = body.get('messageType') === 'embed' ? 'embed' : 'plain';
          const message = (body.get('message') || '').trim();
          const channel = getSendableChannels(client).find(item => item.id === channelId);

          if (!channel) {
            sendHtml(res, 400, renderDashboard(getSendableChannels(client), 'Channel atau pesan tidak valid.'));
            return;
          }

          if (messageType === 'plain') {
            if (!message || message.length > 2000) {
              sendHtml(res, 400, renderDashboard(getSendableChannels(client), 'Pesan biasa harus berisi 1-2.000 karakter.'));
              return;
            }

            await channel.send({ content: message, allowedMentions: { parse: [] } });
          } else {
            const content = (body.get('embedContent') || '').trim();
            const title = (body.get('embedTitle') || '').trim();
            const description = (body.get('embedDescription') || '').trim();
            const imageUrl = (body.get('embedImage') || '').trim();
            const thumbnailUrl = (body.get('embedThumbnail') || '').trim();
            const bannerUrl = (body.get('embedBanner') || '').trim();
            const footer = (body.get('embedFooter') || '').trim();
            const color = parseColor(body.get('embedColor') || '#fe2c55');

            const hasEmbedContent = title || description || imageUrl || thumbnailUrl || bannerUrl;

            if (!hasEmbedContent || content.length > 2000 || title.length > 256
              || description.length > 4096
              || footer.length > 2048
              || color === null || !isHttpUrl(imageUrl)
              || !isHttpUrl(thumbnailUrl) || !isHttpUrl(bannerUrl)) {
              sendHtml(res, 400, renderDashboard(getSendableChannels(client), 'Data embed tidak valid. Periksa warna dan semua URL gambar.'));
              return;
            }

            const embed = new EmbedBuilder()
              .setColor(color)
              .setTimestamp();

            if (title) embed.setTitle(title);
            if (description) embed.setDescription(description);
            if (imageUrl) embed.setImage(imageUrl);
            if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);
            if (footer) embed.setFooter({ text: footer });

            const embeds = [embed];

            if (bannerUrl) {
              embeds.push(new EmbedBuilder().setColor(color).setImage(bannerUrl));
            }

            await channel.send({
              ...(content && { content }),
              embeds,
              allowedMentions: { parse: [] }
            });
          }

          sendHtml(res, 200, renderDashboard(getSendableChannels(client), `Pesan berhasil dikirim ke #${channel.name}.`));
        } catch (error) {
          console.error('Gagal mengirim pesan dashboard:', error);
          sendHtml(res, 500, renderDashboard(getSendableChannels(client), 'Pesan gagal dikirim. Periksa izin bot di channel tersebut.'));
        }
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'not_found' }));
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Health server dan dashboard aktif di port ${port}`);
  });

  server.on('error', error => {
    console.error('Health server gagal:', error);
  });

  return server;
}

module.exports = { startHealthServer };
