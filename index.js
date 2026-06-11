require('dotenv').config();

const express = require('express');
const { setupRolePanel, handleRoleInteraction } = require('./rolePanel');
const { startTikTokLiveChecker } = require('./tiktokLive');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();

app.get('/', (req, res) => {
  res.send('Bot TikTok Live berjalan!');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server hidup');
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('clientReady', async () => {
  console.log(`Discord bot online: ${client.user.tag}`);

  client.user.setPresence({
    status: 'online',
    activities: [{
      name: 'Wellcome',
      type: 3
    }]
  });

  await setupRolePanel(client);

  startTikTokLiveChecker(client);
});

client.on('interactionCreate', async interaction => {
  await handleRoleInteraction(interaction);
});

client.login(DISCORD_TOKEN);