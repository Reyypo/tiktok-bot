const express = require('express');
const { WebcastPushConnection } = require('tiktok-live-connector');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();

app.get('/', (req, res) => {
  res.send('Bot TikTok Live berjalan!');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server hidup');
});

const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

let sudahNotif = false;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('clientReady', () => {
  console.log(`Discord bot online: ${client.user.tag}`);

  cekLive();
  setInterval(cekLive, 60 * 1000);
});

async function cekLive() {
  const tiktok = new WebcastPushConnection(TIKTOK_USERNAME);

  try {
    await tiktok.connect();

    console.log(`${TIKTOK_USERNAME} sedang LIVE`);

    if (!sudahNotif) {
      const channel = await client.channels.fetch(CHANNEL_ID);

      await channel.send(
        `🔴 @${TIKTOK_USERNAME} sedang LIVE di TikTok!\nhttps://www.tiktok.com/@${TIKTOK_USERNAME}/live`
      );

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

client.login(DISCORD_TOKEN);