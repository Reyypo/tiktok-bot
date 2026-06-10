const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const ROLE_PANEL_CHANNEL_ID = process.env.ROLE_PANEL_CHANNEL_ID;

const pendingGameChoices = new Map();

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
    .setDescription('Pilih game yang kamu mainkan, lalu klik **✅ Simpan Pilihan**.')
    .setColor(0x3498db);

  const gameMenu = new StringSelectMenuBuilder()
    .setCustomId('select_games')
    .setPlaceholder('Pilih Role Game Kamu')
    .setMinValues(0)
    .setMaxValues(gameRoles.length)
    .addOptions(gameRoles);

  const saveGameButton = new ButtonBuilder()
    .setCustomId('save_games')
    .setLabel('Simpan Pilihan')
    .setStyle(ButtonStyle.Success);

  const resetGameButton = new ButtonBuilder()
    .setCustomId('reset_games')
    .setLabel('Reset Role Game Saya')
    .setStyle(ButtonStyle.Danger);

  await channel.send({
  embeds: [genderEmbed],
  components: [
    new ActionRowBuilder().addComponents(resetGenderButton),
    new ActionRowBuilder().addComponents(genderMenu)
  ]
});

  await channel.send({
  embeds: [gameEmbed],
  components: [
    new ActionRowBuilder().addComponents(saveGameButton, resetGameButton),
    new ActionRowBuilder().addComponents(gameMenu)
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
    pendingGameChoices.set(interaction.user.id, interaction.values);

    return interaction.reply({
      content: '✅ Pilihan game kamu sudah dipilih. Klik **Simpan Pilihan** untuk memasang role.',
      ephemeral: true
    });
  }

  if (interaction.customId === 'save_games') {
    const selectedGames = pendingGameChoices.get(interaction.user.id) || [];

    await member.roles.remove(gameRoles.map(role => role.value)).catch(() => {});

    if (selectedGames.length > 0) {
      await member.roles.add(selectedGames);
    }

    pendingGameChoices.delete(interaction.user.id);

    return interaction.reply({
      content: '✅ Role game kamu berhasil disimpan.',
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
    pendingGameChoices.delete(interaction.user.id);

    const newGameMenu = new StringSelectMenuBuilder()
      .setCustomId('select_games')
      .setPlaceholder('Pilih Role Game Kamu')
      .setMinValues(0)
      .setMaxValues(gameRoles.length)
      .addOptions(gameRoles);

    const saveGameButton = new ButtonBuilder()
      .setCustomId('save_games')
      .setLabel('Simpan Pilihan')
      .setStyle(ButtonStyle.Success);

    const resetGameButton = new ButtonBuilder()
      .setCustomId('reset_games')
      .setLabel('Reset Role Game Saya')
      .setStyle(ButtonStyle.Danger);

    await interaction.message.edit({
      components: [
        new ActionRowBuilder().addComponents(newGameMenu),
        new ActionRowBuilder().addComponents(saveGameButton, resetGameButton)
      ]
    });

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