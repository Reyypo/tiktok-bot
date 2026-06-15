const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');
const { WebcastPushConnection } = require('tiktok-live-connector');

const CHECK_INTERVAL_MS = 60_000;
const TIKTOK_COLOR = 0xfe2c55;
const LIVE_BANNER_URL = 'https://cdn.discordapp.com/attachments/1514363278615380281/1516071949464506389/standard_8.gif?ex=6a314f88&is=6a2ffe08&hm=b41abe3bc03608fda8acf74fcddc9e17410954ecfc7bc57da237a43f041fd196&';
const LIVE_THUMBNAIL_URL = 'https://cdn.discordapp.com/attachments/1514363278615380281/1514696314208653544/standard_7.gif?ex=6a30eb9f&is=6a2f9a1f&hm=97461db3c5a9cf597b04a16be49997c641cf9a7d34d5600ec6a74ede637138d2&';

function firstUrl(image) {
  return image?.urlList?.[0]
    || image?.url_list?.[0]
    || image?.urls?.[0]
    || null;
}

function getLiveDetails(roomInfo, username) {
  const room = roomInfo?.data || roomInfo || {};
  const owner = room.owner || room.user || {};

  return {
    nickname: owner.nickname || owner.displayId || username,
    title: room.title || `Live bersama @${username}`,
    avatarUrl: firstUrl(owner.avatarThumb || owner.avatar_thumb || owner.avatarMedium)
  };
}

function buildLiveMessage(username, roomInfo) {
  const liveUrl = `https://www.tiktok.com/@${username}/live`;
  const profileUrl = `https://www.tiktok.com/@${username}`;
  const details = getLiveDetails(roomInfo, username);

  const embed = new EmbedBuilder()
    .setColor(TIKTOK_COLOR)
    .setAuthor({
      name: `${details.nickname} sedang LIVE`,
      ...(details.avatarUrl && { iconURL: details.avatarUrl })
    })
    .setTitle(details.title)
    .setURL(liveUrl)
    .setDescription([
      `**@${username}** baru saja memulai siaran langsung di TikTok.`,
      '',
      'Gabung sekarang dan ramaikan live-nya!'
    ].join('\n'))
    .addFields(
      { name: 'Platform', value: 'TikTok LIVE', inline: true },
      { name: 'Status', value: 'LIVE SEKARANG', inline: true }
    )
    .setThumbnail(LIVE_THUMBNAIL_URL)
    .setImage(LIVE_BANNER_URL)
    .setFooter({ text: 'REST AREA Live Notification' })
    .setTimestamp();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Tonton LIVE')
      .setStyle(ButtonStyle.Link)
      .setURL(liveUrl),
    new ButtonBuilder()
      .setLabel('Buka Profil')
      .setStyle(ButtonStyle.Link)
      .setURL(profileUrl)
  );

  return {
    content: `@everyone **@${username} sedang LIVE di TikTok!**`,
    embeds: [embed],
    components: [buttons],
    allowedMentions: { parse: ['everyone'] }
  };
}

function startTikTokLiveChecker(client) {
  const username = process.env.TIKTOK_USERNAME;
  const channelId = process.env.CHANNEL_ID;
  let activeConnection = null;
  let notificationSent = false;
  let isChecking = false;

  async function checkLive() {
    if (isChecking || activeConnection) return;

    isChecking = true;
    const connection = new WebcastPushConnection(username);

    try {
      await connection.connect();
      activeConnection = connection;

      connection.once('streamEnd', () => {
        console.log(`${username} sudah selesai LIVE`);
        activeConnection = null;
        notificationSent = false;
      });

      connection.once('disconnected', () => {
        activeConnection = null;
      });

      if (!notificationSent) {
        const roomInfo = await connection.fetchRoomInfo().catch(() => null);
        const channel = await client.channels.fetch(channelId);

        await channel.send(buildLiveMessage(username, roomInfo));
        notificationSent = true;

        console.log(`${username} sedang LIVE, notifikasi terkirim`);
      }
    } catch (error) {
      console.log('Belum live:', error.message);
      activeConnection = null;
      notificationSent = false;
      await connection.disconnect().catch(() => {});
    } finally {
      isChecking = false;
    }
  }

  checkLive();
  setInterval(checkLive, CHECK_INTERVAL_MS);
}

module.exports = { startTikTokLiveChecker };
