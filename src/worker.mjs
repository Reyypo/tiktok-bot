const MAX_TEXT_LENGTH = 2000;
const MAX_PHOTO_SIZE = 8_000_000;
const DISCORD_API = 'https://discord.com/api/v10';

const channelTypes = {
  GUILD_TEXT: 0,
  GUILD_ANNOUNCEMENT: 5
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getCookie(request, name) {
  const cookies = request.headers.get('Cookie') || '';

  for (const cookie of cookies.split(';')) {
    const [key, ...value] = cookie.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }

  return '';
}

async function hmacHex(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));

  return [...new Uint8Array(signature)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function getSessionToken(env) {
  const username = env.DASHBOARD_USERNAME || 'admin';
  const password = env.DASHBOARD_PASSWORD || '';

  return hmacHex(password, `rest-area-dashboard:${username}`);
}

async function isAuthorized(request, env) {
  const session = getCookie(request, 'dashboard_session');
  return Boolean(session) && session === await getSessionToken(env);
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function redirect(location, headers = {}) {
  return new Response(null, {
    status: 303,
    headers: { Location: location, ...headers }
  });
}

function getAssetUrl(pathname) {
  return `/assets/${pathname}`;
}

function renderLanding(env, error = '', showLogin = false) {
  const tiktokUsername = env.TIKTOK_USERNAME || 'restareaserver';

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
    footer { margin-top: 28vh; font-size: 13px; font-weight: 700; opacity: .9; }
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
    .login-submit { width: 100%; margin-top: 24px; padding: 15px; border: 0; border-radius: 10px; background: #5865f2; color: white; font: inherit; font-weight: 800; cursor: pointer; }
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
        <img src="${getAssetUrl('rest-area-banner.gif')}" alt="TikTok REST AREA">
      </a>
    </section>
    <section class="links">
      <a class="link-card" href="https://discord.gg/FN3CQcTNQx" target="_blank" rel="noopener">
        <img src="${getAssetUrl('rest-area.gif')}" alt="Discord REST AREA">
        <span class="link-copy">REST AREA<small>Discord Server - Free to join</small></span>
        <span class="dots">&#8942;</span>
      </a>
      <a class="link-card" href="https://www.tiktok.com/@${encodeURIComponent(tiktokUsername)}" target="_blank" rel="noopener">
        <img src="${getAssetUrl('rest-area.gif')}" alt="TikTok REST AREA">
        <span class="link-copy">TikTok @${escapeHtml(tiktokUsername)}<small>Follow dan tonton live terbaru</small></span>
        <span class="dots">&#8942;</span>
      </a>
      <a class="link-card" href="https://sociabuzz.com/restareaserver/donate" target="_blank" rel="noopener">
        <img src="${getAssetUrl('rest-area.gif')}" alt="Sociabuzz REST AREA">
        <span class="link-copy">Sociabuzz REST AREA<small>Support dan kirim donasi</small></span>
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
        <input id="password" name="password" type="password" autocomplete="current-password" required>
        <button class="login-submit" type="submit">Masuk ke Dashboard</button>
      </form>
    </section>
  </div>
  <script>
    const modal = document.getElementById('loginModal');
    document.getElementById('adminButton').addEventListener('click', () => modal.classList.add('open'));
    document.getElementById('closeLogin').addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', event => {
      if (event.target === modal) modal.classList.remove('open');
    });
    document.getElementById('shareButton').addEventListener('click', async () => {
      if (navigator.share) await navigator.share({ title: document.title, url: location.href }).catch(() => {});
      else await navigator.clipboard?.writeText(location.href);
    });
  </script>
</body>
</html>`;
}

function renderDashboard(channels, notice = '', error = '') {
  const options = channels.map(channel => (
    `<option value="${channel.id}">${escapeHtml(channel.guildName || 'Discord')} / #${escapeHtml(channel.name)}</option>`
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
    main { width: min(720px, 100%); background: rgba(35, 36, 40, .96); border: 1px solid #454750; border-radius: 22px; padding: 30px; box-shadow: 0 24px 70px rgba(0, 0, 0, .4); }
    .eyebrow { color: #fe2c55; font-size: 13px; font-weight: 800; letter-spacing: 1.6px; }
    h1 { margin: 8px 0; font-size: clamp(28px, 5vw, 42px); }
    .subtitle { margin: 0 0 26px; color: #b5bac1; line-height: 1.6; }
    label { display: block; margin: 18px 0 8px; font-weight: 700; }
    select, textarea, input { width: 100%; border: 1px solid #4e5058; border-radius: 10px; background: #1e1f22; color: #f2f3f5; padding: 14px; font: inherit; outline: none; }
    textarea { min-height: 170px; resize: vertical; line-height: 1.5; }
    input[type="color"] { width: 64px; height: 54px; padding: 5px; cursor: pointer; }
    button { width: 100%; margin-top: 22px; border: 0; border-radius: 10px; padding: 15px; background: #5865f2; color: white; font: inherit; font-weight: 800; cursor: pointer; }
    .notice { margin: 0 0 20px; padding: 13px 15px; border-radius: 10px; background: #214d38; color: #b8f7d1; }
    .error { margin: 0 0 20px; padding: 13px 15px; border-radius: 10px; background: #542f35; color: #ffb4b4; }
    .empty { color: #ffb4b4; }
    .topbar { display: flex; align-items: start; justify-content: space-between; gap: 20px; }
    .logout { color: #b5bac1; text-decoration: none; font-size: 14px; font-weight: 700; }
    .embed-fields { margin-top: 18px; padding: 18px; border: 1px solid #454750; border-radius: 12px; background: #292b2f; }
    .hidden { display: none; }
    .row { display: flex; justify-content: space-between; gap: 12px; margin-top: 8px; color: #949ba4; font-size: 13px; }
  </style>
</head>
<body>
  <main>
    <div class="topbar"><div class="eyebrow">REST AREA BOT</div><a class="logout" href="/dashboard/logout">Keluar</a></div>
    <h1>Kirim Pesan Discord</h1>
    <p class="subtitle">Dashboard ini berjalan di Cloudflare Workers dan mengirim pesan lewat Discord REST API.</p>
    ${notice ? `<div class="notice">${escapeHtml(notice)}</div>` : ''}
    ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
    ${channels.length ? `
    <form method="post" action="/dashboard/send" enctype="multipart/form-data">
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
        <label for="photo">Upload foto (opsional)</label>
        <input id="photo" name="photo" type="file" accept="image/*">
        <div class="row"><span>Mention otomatis dinonaktifkan</span><span>Maksimal 2.000 karakter</span></div>
      </div>
      <div id="embedFields" class="embed-fields hidden">
        <strong>EMBED</strong>
        <label for="embedContent">Teks di luar embed (opsional)</label>
        <textarea id="embedContent" name="embedContent" maxlength="2000"></textarea>
        <label for="embedTitle">Judul (opsional)</label>
        <input id="embedTitle" name="embedTitle" maxlength="256">
        <label for="embedDescription">Teks di dalam embed (opsional)</label>
        <textarea id="embedDescription" name="embedDescription" maxlength="4096"></textarea>
        <label for="embedColor">Warna embed</label>
        <input id="embedColor" name="embedColor" type="color" value="#fe2c55">
        <label for="embedImage">URL gambar utama (opsional)</label>
        <input id="embedImage" name="embedImage" type="url" placeholder="https://...">
        <label for="embedPhoto">Upload gambar utama (opsional)</label>
        <input id="embedPhoto" name="embedPhoto" type="file" accept="image/*">
        <label for="embedThumbnail">URL thumbnail kanan atas (opsional)</label>
        <input id="embedThumbnail" name="embedThumbnail" type="url" placeholder="https://...">
        <label for="embedFooter">Footer (opsional)</label>
        <input id="embedFooter" name="embedFooter" maxlength="2048" value="REST AREA Live Notification">
      </div>
      <button type="submit">Kirim ke Discord</button>
    </form>` : '<p class="empty">DISCORD_GUILD_ID belum benar atau bot belum punya akses ke channel teks.</p>'}
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

async function discordFetch(env, path, init = {}) {
  if (!env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN belum diatur');

  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bot ${env.DISCORD_TOKEN}`);
  headers.set('User-Agent', 'REST AREA Worker (https://workers.cloudflare.com)');

  const response = await fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Discord API ${response.status}: ${text || response.statusText}`);
  }

  return response;
}

async function getGuildName(env) {
  if (!env.DISCORD_GUILD_ID) return '';
  const response = await discordFetch(env, `/guilds/${env.DISCORD_GUILD_ID}`);
  const guild = await response.json();
  return guild.name || 'Discord';
}

async function getSendableChannels(env) {
  if (!env.DISCORD_GUILD_ID) return [];

  const [channelsResponse, guildName] = await Promise.all([
    discordFetch(env, `/guilds/${env.DISCORD_GUILD_ID}/channels`),
    getGuildName(env).catch(() => 'Discord')
  ]);
  const channels = await channelsResponse.json();

  return channels
    .filter(channel => channelTypes.GUILD_TEXT === channel.type || channelTypes.GUILD_ANNOUNCEMENT === channel.type)
    .sort((a, b) => (a.position - b.position) || a.name.localeCompare(b.name))
    .map(channel => ({
      id: channel.id,
      name: channel.name,
      guildName
    }));
}

function parseColor(value) {
  const normalized = String(value || '').replace('#', '');
  return /^[0-9a-f]{6}$/i.test(normalized)
    ? Number.parseInt(normalized, 16)
    : null;
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

function isValidPhoto(file) {
  return file instanceof File
    && file.size > 0
    && file.size <= MAX_PHOTO_SIZE
    && file.type.startsWith('image/');
}

async function sendDiscordMessage(env, channelId, payload, file) {
  const headers = {};
  let body = JSON.stringify(payload);

  if (file) {
    body = new FormData();
    body.append('payload_json', JSON.stringify(payload));
    body.append('files[0]', file, file.name || 'foto.jpg');
  } else {
    headers['Content-Type'] = 'application/json';
  }

  await discordFetch(env, `/channels/${channelId}/messages`, {
    method: 'POST',
    headers,
    body
  });
}

async function handleDashboardSend(request, env) {
  const channels = await getSendableChannels(env);
  const form = await request.formData();
  const channelId = form.get('channelId') || '';
  const channel = channels.find(item => item.id === channelId);
  const messageType = form.get('messageType') === 'embed' ? 'embed' : 'plain';

  if (!channel) {
    return htmlResponse(renderDashboard(channels, '', 'Channel tidak valid.'), 400);
  }

  if (messageType === 'plain') {
    const message = String(form.get('message') || '').trim();
    const photo = form.get('photo');
    const hasPhoto = isValidPhoto(photo);

    if ((!message && !hasPhoto) || message.length > MAX_TEXT_LENGTH) {
      return htmlResponse(renderDashboard(channels, '', 'Pesan biasa harus berisi teks, foto, atau keduanya.'), 400);
    }

    if (photo instanceof File && photo.size > 0 && !hasPhoto) {
      return htmlResponse(renderDashboard(channels, '', 'Foto harus berupa gambar dan maksimal 8 MB.'), 400);
    }

    await sendDiscordMessage(env, channelId, {
      ...(message && { content: message }),
      ...(hasPhoto && { attachments: [{ id: 0, filename: photo.name || 'foto.jpg' }] }),
      allowed_mentions: { parse: [] }
    }, hasPhoto ? photo : null);
  } else {
    const content = String(form.get('embedContent') || '').trim();
    const title = String(form.get('embedTitle') || '').trim();
    const description = String(form.get('embedDescription') || '').trim();
    const imageUrl = String(form.get('embedImage') || '').trim();
    const thumbnailUrl = String(form.get('embedThumbnail') || '').trim();
    const footer = String(form.get('embedFooter') || '').trim();
    const color = parseColor(form.get('embedColor') || '#fe2c55');
    const embedPhoto = form.get('embedPhoto');
    const hasEmbedPhoto = isValidPhoto(embedPhoto);
    const hasEmbedContent = title || description || imageUrl || thumbnailUrl || hasEmbedPhoto;

    if (!hasEmbedContent || content.length > MAX_TEXT_LENGTH || title.length > 256
      || description.length > 4096 || footer.length > 2048 || color === null
      || !isHttpUrl(imageUrl) || !isHttpUrl(thumbnailUrl)) {
      return htmlResponse(renderDashboard(channels, '', 'Data embed tidak valid.'), 400);
    }

    if (embedPhoto instanceof File && embedPhoto.size > 0 && !hasEmbedPhoto) {
      return htmlResponse(renderDashboard(channels, '', 'Upload embed harus berupa gambar dan maksimal 8 MB.'), 400);
    }

    const embed = {
      color,
      timestamp: new Date().toISOString(),
      ...(title && { title }),
      ...(description && { description }),
      ...(hasEmbedPhoto ? { image: { url: `attachment://${embedPhoto.name || 'foto.jpg'}` } } : imageUrl && { image: { url: imageUrl } }),
      ...(thumbnailUrl && { thumbnail: { url: thumbnailUrl } }),
      ...(footer && { footer: { text: footer } })
    };

    await sendDiscordMessage(env, channelId, {
      ...(content && { content }),
      embeds: [embed],
      ...(hasEmbedPhoto && { attachments: [{ id: 0, filename: embedPhoto.name || 'foto.jpg' }] }),
      allowed_mentions: { parse: [] }
    }, hasEmbedPhoto ? embedPhoto : null);
  }

  return htmlResponse(renderDashboard(channels, `Pesan berhasil dikirim ke #${channel.name}.`));
}

async function handleDashboard(request, env, url) {
  if (!env.DASHBOARD_PASSWORD) {
    return htmlResponse(renderDashboard([], '', 'DASHBOARD_PASSWORD belum diatur di Cloudflare Workers.'), 503);
  }

  if (request.method === 'POST' && url.pathname === '/dashboard/login') {
    if (request.headers.get('Sec-Fetch-Site') && request.headers.get('Sec-Fetch-Site') !== 'same-origin') {
      return new Response('Request ditolak', { status: 403 });
    }

    const body = await request.formData();
    const username = String(body.get('username') || '');
    const password = String(body.get('password') || '');
    const expectedUsername = env.DASHBOARD_USERNAME || 'admin';

    if (username !== expectedUsername || password !== env.DASHBOARD_PASSWORD) {
      return htmlResponse(renderLanding(env, 'Username atau password salah.', true), 401);
    }

    return redirect('/dashboard', {
      'Set-Cookie': `dashboard_session=${await getSessionToken(env)}; Path=/dashboard; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
    });
  }

  if (request.method === 'GET' && url.pathname === '/dashboard/logout') {
    return redirect('/', {
      'Set-Cookie': 'dashboard_session=; Path=/dashboard; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    });
  }

  if (!await isAuthorized(request, env)) {
    return redirect('/');
  }

  if (request.method === 'GET' && url.pathname === '/dashboard') {
    try {
      return htmlResponse(renderDashboard(await getSendableChannels(env)));
    } catch (error) {
      return htmlResponse(renderDashboard([], '', error.message), 500);
    }
  }

  if (request.method === 'POST' && url.pathname === '/dashboard/send') {
    if (request.headers.get('Sec-Fetch-Site') && request.headers.get('Sec-Fetch-Site') !== 'same-origin') {
      return new Response('Request ditolak', { status: 403 });
    }

    try {
      return await handleDashboardSend(request, env);
    } catch (error) {
      const channels = await getSendableChannels(env).catch(() => []);
      return htmlResponse(renderDashboard(channels, '', `Pesan gagal dikirim: ${error.message}`), 500);
    }
  }

  return new Response('Not found', { status: 404 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname.startsWith('/assets/')) {
      const assetUrl = new URL(url);
      assetUrl.pathname = url.pathname.replace(/^\/assets\//, '/');
      return env.ASSETS.fetch(assetUrl.toString());
    }

    if (url.pathname === '/') {
      return htmlResponse(renderLanding(env, '', url.searchParams.get('admin') === '1'));
    }

    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        service: 'rest-area-worker',
        runtime: 'cloudflare-workers',
        dashboard: Boolean(env.DASHBOARD_PASSWORD),
        discord: env.DISCORD_TOKEN && env.DISCORD_GUILD_ID ? 'configured' : 'missing_config'
      }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    if (url.pathname.startsWith('/dashboard')) {
      return handleDashboard(request, env, url);
    }

    return Response.json({ status: 'not_found' }, { status: 404 });
  }
};
