const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const ROLE_PANEL_CHANNEL_ID = process.env.ROLE_PANEL_CHANNEL_ID;

const genderRoles = [
  { label: 'Male', value: '1116103483632922805' },
  { label: 'Female', value: '1128513360674173018' }
];

const gameRoles = [
  { label: 'Apex Legends', value: '1416824781252202527' },
  { label: 'Brawlhalla', value: '1495862996268749063' },
  { label: 'Delta Force', value: '1416825597166096501' },
  { label: 'Genshin Impact', value: '1192104720601464923' },
  { label: 'GTAV', value: '1192839977713815632' },
  { label: 'Minecraft', value: '1416825345381892157' },
  { label: 'Mobile Legends', value: '1192104141443567728' },
  { label: 'Pubg', value: '1192104524467413052' },
  { label: 'Roblox', value: '1416825769782411450' },
  { label: 'Valorant', value: '1192104384008572978' }
];

async function setupRolePanel(client) {
  const channel = await client.channels.fetch(ROLE_PANEL_CHANNEL_ID);

  const genderEmbed = new EmbedBuilder()
    .setTitle('Pilih Gender Kamu!')
    .setDescription('Klik menu di bawah ini untuk memilih gender kamu.')
    .setColor(0x3498db);

  const genderMenu = new StringSelectMenuBuilder()
    .setCustomId('select_gender')
    .setPlaceholder('Pilih Gender Kamu')
    .addOptions(genderRoles);

  const resetGenderButton = new ButtonBuilder()
    .setCustomId('reset_gender')
    .setLabel('Reset Gender Saya')
    .setStyle(ButtonStyle.Danger);

  const gameEmbed = new EmbedBuilder()
    .setTitle('Pilih Role Game Kamu!')
    .setDescription('Klik menu di bawah ini untuk memilih game yang kamu mainkan. Bisa pilih lebih dari satu.')
    .setColor(0x3498db);

  const gameMenu = new StringSelectMenuBuilder()
    .setCustomId('select_games')
    .setPlaceholder('Pilih Role Game Kamu')
    .setMinValues(0)
    .setMaxValues(gameRoles.length)
    .addOptions(gameRoles);

  const resetGameButton = new ButtonBuilder()
    .setCustomId('reset_games')
    .setLabel('Reset Role Game Saya')
    .setStyle(ButtonStyle.Danger);

  await channel.send({
    embeds: [genderEmbed],
    components: [
      new ActionRowBuilder().addComponents(genderMenu),
      new ActionRowBuilder().addComponents(resetGenderButton)
    ]
  });

  await channel.send({
    embeds: [gameEmbed],
    components: [
      new ActionRowBuilder().addComponents(gameMenu),
      new ActionRowBuilder().addComponents(resetGameButton)
    ]
  });

  console.log('Role panel terkirim');
}

async function handleRoleInteraction(interaction) {
  if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

  const member = interaction.member;

  if (interaction.customId === 'select_gender') {
    await member.roles.remove(genderRoles.map(role => role.value)).catch(() => {});
    await member.roles.add(interaction.values[0]);

    return interaction.reply({
      content: '✅ Gender kamu berhasil diperbarui.',
      ephemeral: true
    });
  }

  if (interaction.customId === 'select_games') {
    await member.roles.remove(gameRoles.map(role => role.value)).catch(() => {});

    if (interaction.values.length > 0) {
      await member.roles.add(interaction.values);
    }

    return interaction.reply({
      content: '✅ Role game kamu berhasil diperbarui.',
      ephemeral: true
    });
  }

  if (interaction.customId === 'reset_gender') {
    await member.roles.remove(genderRoles.map(role => role.value)).catch(() => {});

    return interaction.reply({
      content: '✅ Gender kamu berhasil direset.',
      ephemeral: true
    });
  }

  if (interaction.customId === 'reset_games') {
    await member.roles.remove(gameRoles.map(role => role.value)).catch(() => {});

    return interaction.reply({
      content: '✅ Semua role game kamu berhasil direset.',
      ephemeral: true
    });
  }
}

module.exports = {
  setupRolePanel,
  handleRoleInteraction
};