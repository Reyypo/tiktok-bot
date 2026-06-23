const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const MAX_BODY_SIZE = 10_000;
const REST_AREA_GIF_URL = '/assets/rest-area.gif';
const REST_AREA_GIF_PATH = path.join(__dirname, 'assets', 'rest-area.gif');
const REST_AREA_LOGO_URL = '/assets/rest-area-logo.gif';
const REST_AREA_LOGO_PATH = path.join(__dirname, 'assets', 'rest-area-logo.gif');
const REST_AREA_BANNER_URL = '/assets/rest-area-banner.gif';
const REST_AREA_BANNER_PATH = path.join(__dirname, 'assets', 'rest-area-banner.gif');

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

function renderLanding(error = '', showLogin = false) {
  const tiktokUsername = process.env.TIKTOK_USERNAME || 'restareaserver';
  const profileImage = REST_AREA_GIF_URL;
  const bannerImage = REST_AREA_BANNER_URL;

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#17243d">
  <title>REST AREA</title>
  <style>
    * { box-sizing: border-box; }
    html { min-height: 100%; background: #142238; }
    body { margin: 0; min-height: 100vh; color: white; font-family: Arial, sans-serif; background: linear-gradient(180deg, #142238 0%, #513f68 31%, #c36acc 61%, #3e6d88 100%); }
    .page { width: min(720px, 100%); min-height: 100vh; margin: 0 auto; padding: 28px 28px 40px; position: relative; text-align: center; }
    .icon-button { width: 44px; height: 44px; display: grid; place-items: center; position: absolute; top: 28px; border: 0; border-radius: 15px; background: rgba(238, 241, 248, .72); color: #152033; font-size: 21px; cursor: pointer; box-shadow: 0 8px 24px rgba(0, 0, 0, .12); }
    .admin-button { left: 28px; }
    .share-button { right: 28px; }
    .profile { padding-top: 76px; }
    h1 { margin: 0 0 5px; font-size: clamp(25px, 6vw, 34px); }
    .bio { margin: 0 auto; max-width: 600px; font-weight: 700; line-height: 1.5; }
    .social { width: min(360px, 82vw); height: 52px; display: inline-flex; align-items: center; justify-content: center; margin: 22px 0 26px; text-decoration: none; }
    .social img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; background: #111827; }
    .links { display: grid; gap: 16px; }
    .link-card { min-height: 72px; display: grid; grid-template-columns: 54px 1fr 30px; align-items: center; gap: 14px; padding: 9px; border: 1px solid rgba(255, 255, 255, .82); color: white; text-decoration: none; background: rgba(54, 43, 78, .20); backdrop-filter: blur(8px); transition: transform .2s, background .2s; }
    .link-card:hover { transform: translateY(-2px); background: rgba(255, 255, 255, .12); }
    .link-card img { width: 54px; height: 54px; object-fit: cover; background: #111827; }
    .link-copy { text-align: center; font-weight: 800; }
    .link-copy small { display: block; margin-top: 4px; opacity: .72; font-weight: 600; }
    .dots { font-size: 20px; opacity: .7; }
    footer { margin-top: 34vh; font-size: 13px; font-weight: 700; opacity: .9; }
    .modal { position: fixed; inset: 0; display: none; place-items: center; padding: 20px; background: rgba(8, 10, 16, .72); backdrop-filter: blur(8px); z-index: 10; }
    .modal.open { display: grid; }
    .login-card { width: min(430px, 100%); position: relative; padding: 34px; border: 1px solid #4e5058; border-radius: 22px; background: #232428; color: #f4f4f5; text-align: left; box-shadow: 0 25px 80px rgba(0, 0, 0, .55); }
    .close { position: absolute; top: 14px; right: 16px; border: 0; background: transparent; color: #b5bac1; font-size: 28px; cursor: pointer; }
    .login-logo { width: 62px; height: 62px; display: grid; place-items: center; margin: 0 auto 20px; border-radius: 18px; background: linear-gradient(135deg, #7c5cff, #fe2c55); font-size: 25px; font-weight: 900; }
    .login-card h2 { margin: 0; text-align: center; font-size: 30px; }
    .login-subtitle { margin: 10px 0 24px; color: #c6c8ce; text-align: center; line-height: 1.5; }
    label { display: block; margin: 16px 0 8px; font-weight: 700; }
    input { width: 100%; padding: 14px; border: 1px solid #4e5058; border-radius: 10px; background: #1e1f22; color: #f2f3f5; font: inherit; outline: none; }
    input:focus { border-color: #5865f2; box-shadow: 0 0 0 3px rgba(88, 101, 242, .18); }
    .password-wrap { position: relative; }
    .password-wrap input { padding-right: 52px; }
    .password-toggle { width: 42px; height: 42px; position: absolute; right: 5px; top: 5px; border: 0; background: transparent; color: #b5bac1; font-size: 20px; cursor: pointer; }
    .login-submit { width: 100%; margin-top: 24px; padding: 15px; border: 0; border-radius: 10px; background: #5865f2; color: white; font: inherit; font-weight: 800; cursor: pointer; }
    .login-submit:hover { background: #4752c4; }
    .error { margin-bottom: 18px; padding: 12px; border-radius: 9px; background: #542f35; color: #ffb4b4; text-align: center; }
    @media (max-width: 560px) { .page { padding: 20px 18px 34px; } .icon-button { top: 20px; } .admin-button { left: 18px; } .share-button { right: 18px; } .profile { padding-top: 82px; } footer { margin-top: 25vh; } .login-card { padding: 30px 22px; } }
  </style>
</head>
<body>
  <main class="page">
    <button class="icon-button admin-button" id="adminButton" type="button" aria-label="Login admin" title="Admin">&#9881;</button>
    <button class="icon-button share-button" id="shareButton" type="button" aria-label="Bagikan halaman" title="Bagikan">&#8593;</button>

    <section class="profile">
      <h1>RESTAREASERVER</h1>
      <p class="bio">Thanks for your support.</p>
      <a class="social" href="https://www.tiktok.com/@${encodeURIComponent(tiktokUsername)}" target="_blank" rel="noopener" aria-label="TikTok">
        <img src="${bannerImage}" alt="TikTok REST AREA">
      </a>
    </section>

    <section class="links">
      <a class="link-card" href="https://discord.gg/FN3CQcTNQx" target="_blank" rel="noopener">
        <img src="${profileImage}" alt="Discord REST AREA">
        <span class="link-copy">REST AREA<small>Discord Server - Free to join</small></span>
        <span class="dots">&#8942;</span>
      </a>
      <a class="link-card" href="https://www.tiktok.com/@${encodeURIComponent(tiktokUsername)}" target="_blank" rel="noopener">
        <img src="${profileImage}" alt="TikTok REST AREA">
        <span class="link-copy">TikTok @${escapeHtml(tiktokUsername)}<small>Follow dan tonton live terbaru</small></span>
        <span class="dots">&#8942;</span>
      </a>
      <a class="link-card" href="https://sociabuzz.com/restareaserver/donate" target="_blank" rel="noopener">
        <img src="${profileImage}" alt="Sociabuzz REST AREA">
        <span class="link-copy">Sociabuzz REST AREA<small>Support dan kirim donasi</small></span>
        <span class="dots">&#8942;</span>
      </a>
      <a class="link-card" href="https://rest-area-turnamen.onrender.com" target="_blank" rel="noopener">
        <img src="${profileImage}" alt="Turnamen REST AREA">
        <span class="link-copy">Bracket Turnamen</span>
        <span class="dots">&#8942;</span>
      </a>
    </section>

    <footer>REST AREA &bull; Discord Community &bull; TikTok Live</footer>
  </main>

  <div class="modal${showLogin || error ? ' open' : ''}" id="loginModal" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
    <section class="login-card">
      <button class="close" id="closeLogin" type="button" aria-label="Tutup">&times;</button>
      <div class="login-logo">RA</div>
      <h2 id="loginTitle">Dashboard Login</h2>
      <p class="login-subtitle">Khusus admin REST AREA.</p>
      ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
      <form method="post" action="/dashboard/login">
        <label for="username">Username</label>
        <input id="username" name="username" autocomplete="username" required>
        <label for="password">Password</label>
        <div class="password-wrap">
          <input id="password" name="password" type="password" autocomplete="current-password" required>
          <button class="password-toggle" id="passwordToggle" type="button" aria-label="Tampilkan password">&#128065;</button>
        </div>
        <button class="login-submit" type="submit">Masuk ke Dashboard</button>
      </form>
    </section>
  </div>
  <script>
    const modal = document.getElementById('loginModal');
    const adminButton = document.getElementById('adminButton');
    const closeLogin = document.getElementById('closeLogin');
    const password = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');

    adminButton.addEventListener('click', () => modal.classList.add('open'));
    closeLogin.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', event => {
      if (event.target === modal) modal.classList.remove('open');
    });
    passwordToggle.addEventListener('click', () => {
      const visible = password.type === 'text';
      password.type = visible ? 'password' : 'text';
      passwordToggle.setAttribute('aria-label', visible ? 'Tampilkan password' : 'Sembunyikan password');
    });
    document.getElementById('shareButton').addEventListener('click', async () => {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: location.href }).catch(() => {});
      } else {
        await navigator.clipboard?.writeText(location.href);
      }
    });
  </script>
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

    if (url.pathname === '/') {
      sendHtml(res, 200, renderLanding('', url.searchParams.get('admin') === '1'));
      return;
    }

    if (req.method === 'GET' && url.pathname === REST_AREA_GIF_URL) {
      fs.readFile(REST_AREA_GIF_PATH, (error, file) => {
        if (error) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('GIF tidak ditemukan');
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'image/gif',
          'Cache-Control': 'public, max-age=31536000, immutable'
        });
        res.end(file);
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === REST_AREA_LOGO_URL) {
      fs.readFile(REST_AREA_LOGO_PATH, (error, file) => {
        if (error) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Logo tidak ditemukan');
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'image/gif',
          'Cache-Control': 'public, max-age=31536000, immutable'
        });
        res.end(file);
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === REST_AREA_BANNER_URL) {
      fs.readFile(REST_AREA_BANNER_PATH, (error, file) => {
        if (error) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Banner tidak ditemukan');
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'image/gif',
          'Cache-Control': 'public, max-age=31536000, immutable'
        });
        res.end(file);
      });
      return;
    }

    if (url.pathname === '/health') {
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

        res.writeHead(303, { Location: '/' });
        res.end();
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
            sendHtml(res, 401, renderLanding('Username atau password salah.', true));
            return;
          }

          res.writeHead(303, {
            Location: '/dashboard',
            'Set-Cookie': `dashboard_session=${getSessionToken()}; Path=/dashboard; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
          });
          res.end();
        } catch (error) {
          console.error('Login dashboard gagal:', error);
          sendHtml(res, 400, renderLanding('Login gagal. Silakan coba lagi.', true));
        }
        return;
      }

      if (req.method === 'GET' && url.pathname === '/dashboard/logout') {
        res.writeHead(303, {
          Location: '/',
          'Set-Cookie': 'dashboard_session=; Path=/dashboard; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
        });
        res.end();
        return;
      }

      if (!isAuthorized(req)) {
        res.writeHead(303, { Location: '/' });
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
