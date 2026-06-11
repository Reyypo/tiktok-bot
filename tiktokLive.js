const { WebcastPushConnection } = require('tiktok-live-connector');
const { EmbedBuilder } = require('discord.js');

let sudahNotif = false;

function startTikTokLiveChecker(client) {
  const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME;
  const CHANNEL_ID = process.env.CHANNEL_ID;

  async function cekLive() {
    const tiktok = new WebcastPushConnection(TIKTOK_USERNAME);

    try {
      await tiktok.connect();

      console.log(`${TIKTOK_USERNAME} sedang LIVE`);

      if (!sudahNotif) {
        const channel = await client.channels.fetch(CHANNEL_ID);

        const liveUrl = `https://www.tiktok.com/@${TIKTOK_USERNAME}/live`;

        const embed = new EmbedBuilder()
          .setTitle(`🔴 @${TIKTOK_USERNAME} sedang LIVE di TikTok!`)
          .setDescription(`Klik link di bawah untuk langsung nonton live.\n\n${liveUrl}`)
          .setURL(liveUrl)
          .setTimestamp();

        await channel.send({
          content: `@everyone 🔴 **@${TIKTOK_USERNAME} sedang LIVE!**`,
          embeds: [embed],
          allowedMentions: { parse: ['everyone'] }
        });

        sudahNotif = true;
      }

      tiktok.on('streamEnd', () => {
        console.log('Live selesai');
        sudahNotif = false;
      });

    } catch (err) {
      console.log('Belum live:', err.message);
      sudahNotif = false;
    }
  }

  cekLive();
  setInterval(cekLive, 60 * 1000);
}

module.exports = { startTikTokLiveChecker };