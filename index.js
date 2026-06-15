require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const { setupRolePanel, handleRoleInteraction } = require('./rolePanel');
const { startTikTokLiveChecker } = require('./tiktokLive');

const requiredEnv = [
  'DISCORD_TOKEN',
  'ROLE_PANEL_CHANNEL_ID',
  'TIKTOK_USERNAME',
  'CHANNEL_ID'
];

const missingEnv = requiredEnv.filter(name => !process.env[name]);

if (missingEnv.length > 0) {
  throw new Error(`Environment variable belum diisi: ${missingEnv.join(', ')}`);
}

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

  try {
    await setupRolePanel(client);
  } catch (error) {
    console.error('Gagal menyiapkan role panel:', error);
  }

  startTikTokLiveChecker(client);
});

client.on('interactionCreate', interaction => {
  handleRoleInteraction(interaction).catch(error => {
    console.error('Gagal memproses interaksi role:', error);
  });
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('Gagal login ke Discord:', error);
  process.exitCode = 1;
});
