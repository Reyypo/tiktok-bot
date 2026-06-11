const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');

const ROLE_PANEL_CHANNEL_ID = process.env.ROLE_PANEL_CHANNEL_ID;

const pendingGenderChoices = new Map();
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

  const oldMessages = await channel.messages.fetch({ limit: 50 });
  const alreadyExists = oldMessages.some(msg =>
    msg.author.id === client.user.id &&
    msg.embeds.length > 0 &&
    msg.embeds[0].title === 'REST AREA'
  );

  if (alreadyExists) {
    console.log('Role panel sudah ada, tidak kirim ulang');
    return;
  }

  const genderEmbed = new EmbedBuilder()
  .setAuthor({
    iconURL: 'https://cdn.discordapp.com/attachments/1514363278615380281/1514689339974746274/standard_6.gif?ex=6a2c47e0&is=6a2af660&hm=633a2c43e95d48e05dfa3c03afca3f6c63f24a8f2d5c0a89a2014cdc7a9f55b1&'
  })
    .setDescription('**Pilih gender kamu, lalu klik ✅ Simpan Gender.**')
    .setColor(0x3498db)
    .setImage('https://cdn.discordapp.com/attachments/1514363278615380281/1514383535916716232/standard_2.gif?ex=6a2b2b12&is=6a29d992&hm=93661b6757ab76125c8f34d5e80b1d6c5168e4c8f8eafaf2994e9131e853ca79&');

  const genderMenu = new StringSelectMenuBuilder()
    .setCustomId('select_gender')
    .setPlaceholder('Pilih Gender Kamu')
    .addOptions(genderRoles);

  const saveGenderButton = new ButtonBuilder()
    .setCustomId('save_gender')
    .setLabel('Simpan Gender')
    .setStyle(ButtonStyle.Success);

  const resetGenderButton = new ButtonBuilder()
    .setCustomId('reset_gender')
    .setLabel('Reset Gender Saya')
    .setStyle(ButtonStyle.Danger);

  const gameEmbed = new EmbedBuilder()
  .setAuthor({
    iconURL: 'https://cdn.discordapp.com/attachments/1514363278615380281/1514689339974746274/standard_6.gif?ex=6a2c47e0&is=6a2af660&hm=633a2c43e95d48e05dfa3c03afca3f6c63f24a8f2d5c0a89a2014cdc7a9f55b1&'
  })
    .setDescription('**Pilih game yang kamu mainkan, lalu klik ✅ Simpan Pilihan.**')
    .setColor(0x3498db)
    .setImage('https://cdn.discordapp.com/attachments/1514363278615380281/1514394569469333566/standard_5.gif?ex=6a2b3559&is=6a29e3d9&hm=e5c250eb89f08ce8498a748732e24737a451a2f96f4a3bed7a8f8aede5163c99&');

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
      new ActionRowBuilder().addComponents(saveGenderButton, resetGenderButton),
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

async function sendPrivateReply(interaction, content) {
  return interaction.reply({
    content,
    flags: MessageFlags.Ephemeral
  });
}

async function handleRoleInteraction(interaction) {
  if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

  const member = interaction.member;

  if (interaction.customId === 'select_gender') {
    pendingGenderChoices.set(interaction.user.id, interaction.values[0]);
    return interaction.deferUpdate();
  }

  if (interaction.customId === 'save_gender') {
    const selectedGender = pendingGenderChoices.get(interaction.user.id);

    if (!selectedGender) {
      return sendPrivateReply(interaction, '⚠️ Pilih gender dulu sebelum klik Simpan Gender.');
    }

    await member.roles.remove(genderRoles.map(role => role.value)).catch(() => {});
    await member.roles.add(selectedGender);

    pendingGenderChoices.delete(interaction.user.id);

    return sendPrivateReply(interaction, '✅ Gender kamu berhasil disimpan.');
  }

  if (interaction.customId === 'select_games') {
    pendingGameChoices.set(interaction.user.id, interaction.values);
    return interaction.deferUpdate();
  }

  if (interaction.customId === 'save_games') {
    const selectedGames = pendingGameChoices.get(interaction.user.id);

    if (!selectedGames) {
      return sendPrivateReply(interaction, '⚠️ Pilih role game dulu sebelum klik Simpan Pilihan.');
    }

    await member.roles.remove(gameRoles.map(role => role.value)).catch(() => {});

    if (selectedGames.length > 0) {
      await member.roles.add(selectedGames);
    }

    pendingGameChoices.delete(interaction.user.id);

    return sendPrivateReply(interaction, '✅ Role game kamu berhasil disimpan.');
  }

  if (interaction.customId === 'reset_gender') {
    await member.roles.remove(genderRoles.map(role => role.value)).catch(() => {});
    pendingGenderChoices.delete(interaction.user.id);

    const newGenderMenu = new StringSelectMenuBuilder()
      .setCustomId('select_gender')
      .setPlaceholder('Pilih Gender Kamu')
      .addOptions(genderRoles);

    const saveGenderButton = new ButtonBuilder()
      .setCustomId('save_gender')
      .setLabel('Simpan Gender')
      .setStyle(ButtonStyle.Success);

    const resetGenderButton = new ButtonBuilder()
      .setCustomId('reset_gender')
      .setLabel('Reset Gender Saya')
      .setStyle(ButtonStyle.Danger);

    await interaction.message.edit({
      components: [
        new ActionRowBuilder().addComponents(saveGenderButton, resetGenderButton),
        new ActionRowBuilder().addComponents(newGenderMenu)
      ]
    });

    return sendPrivateReply(interaction, '✅ Gender kamu berhasil direset.');
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
        new ActionRowBuilder().addComponents(saveGameButton, resetGameButton),
        new ActionRowBuilder().addComponents(newGameMenu)
      ]
    });

    return sendPrivateReply(interaction, '✅ Semua role game kamu berhasil direset.');
  }
}

module.exports = {
  setupRolePanel,
  handleRoleInteraction
};