const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  ComponentType
} = require('discord.js');

const { client } = require('../client.js');
const { guildId } = require('../config.json');
const User = require('../models/user.js');
const Duel = require('../models/duel.js');
const { weapons, armors } = require('../constants.js');

const createEmbed = (user) => {
  return new EmbedBuilder()
    .setTitle('Welcome to the game!')
    .addFields(
      { name: 'Health Points', value: `${user.health_points}/100` },
      { name: 'Attack Power', value: `${user.attack_power}` },
      { name: 'Energy Points', value: `${user.energy_points}/3` },
      { name: 'Gold', value: `${user.gold}` },
      { name: 'Health Potion Cost', value: `${user.health_potion_cost}` },
      { name: 'Weapon', value: user.weapon ?? 'None' },
      { name: 'Armor', value: user.armor ?? 'None' }
    );
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play the game!'),
  async execute(interaction) {
    // TODO: Check if user is registered (Use transaction or atomic operation)
    let user = await User.findOne({ discord_id: interaction.user.id });
    if (!user) {
      await interaction.reply({
        content:
          'You are not registered! Please use /register command to register.',
        ephemeral: true
      });
      return;
    }
    let embed = createEmbed(user);

    const duel = new ButtonBuilder()
      .setCustomId('duel')
      .setLabel('Duel')
      .setStyle(ButtonStyle.Danger);

    const random_encounter = new ButtonBuilder()
      .setCustomId('random_encounter')
      .setLabel('Random Encounter')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(duel, random_encounter);

    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 3_600_000
    });
    collector.on('collect', async (i) => {
      // TODO: Other users should not see other users' bot responses. Check this later.
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          content: 'You are not allowed to use this button!',
          ephemeral: true
        });
        return;
      }
      if (i.customId === 'duel') {
        // TODO: Send a message to the feed channel.
        // TODO: Use transaction here to block user actions.
        // TODO: Add defer in case of long running operations.
        // await i.deferUpdate();
        user = await User.findOne({ discord_id: i.user.id });
        const isUserDueled = await Duel.findOne({ discord_id: i.user.id });
        if (isUserDueled) {
          embed = createEmbed(user);
          await i.update({
            content: 'You are already in duel queue!',
            embeds: [embed],
            components: [row],
            ephemeral: true
          });
          return;
        }
        user = await User.findOne({ discord_id: i.user.id });
        if (user.energy_points <= 0) {
          embed = createEmbed(user);
          await i.update({
            content: 'You do not have enough energy points!',
            embeds: [embed],
            components: [row],
            ephemeral: true
          });
          return;
        }
        // TODO: Use aggregation pipeline to reduce energy points.
        user = await User.findOneAndUpdate(
          { discord_id: i.user.id },
          { energy_points: Math.max(user.energy_points - 1, 0) },
          { new: true }
        );
        let otherDuelPlayer = await Duel.findOne({
          discord_id: { $ne: i.user.id }
        }).sort({ doc_created_at: 1 });
        if (!otherDuelPlayer) {
          embed = createEmbed(user);
          await Duel.create({ discord_id: i.user.id });
          await i.update({
            content: 'You have been added to duel queue!',
            embeds: [embed],
            components: [row],
            ephemeral: true
          });
          return;
        }
        otherDuelPlayer = await User.findOne({
          discord_id: otherDuelPlayer.discord_id
        });
        const playerDamage = parseFloat(
          (Math.random() * user.attack_power).toFixed(2)
        );
        const otherPlayerDamage = parseFloat(
          (Math.random() * otherDuelPlayer.attack_power).toFixed(2)
        );
        // TODO: Decrease health points.
        const isTie = playerDamage === otherPlayerDamage;
        if (isTie) {
          await Duel.deleteMany({
            discord_id: { $in: [i.user.id, otherDuelPlayer.discord_id] }
          });
          await i.update({
            content: 'It is a tie!',
            embeds: [embed],
            components: [row],
            ephemeral: true
          });
          return;
        }
        const winner =
          playerDamage > otherPlayerDamage ? user : otherDuelPlayer;
        const loser = playerDamage > otherPlayerDamage ? otherDuelPlayer : user;
        loser.health_points = Math.round(
          Math.max(
            loser.health_points -
              Math.abs(playerDamage - otherPlayerDamage) *
                (1 - (loser.armor ? armors[loser.armor].dmg_migration : 0)),
            0
          )
        );
        await loser.save();
        const isLoserDead = loser.health_points === 0;
        const guild = await client.guilds.cache.get(guildId);
        const winnerName = guild
          ? await guild.members.cache.get(winner.discord_id)?.displayName
          : await guild?.members?.fetch(winner.discord_id)?.displayName;
        const loserName = guild
          ? await guild.members.cache.get(loser.discord_id)?.displayName
          : await guild?.members?.fetch(loser.discord_id)?.displayName;
        if (isLoserDead) {
          const earnedGold = Math.floor(
            loser.gold +
              (loser.armor ? armors[loser.armor].cost : 0) +
              (loser.weapon ? weapons[loser.weapon].cost : 0)
          );
          winner.gold += earnedGold;
          await winner.save();
          await Duel.deleteMany({
            discord_id: { $in: [winner.discord_id, loser.discord_id] }
          });
          // TODO: Use usernames instead of discord ids.
          // TODO: Use gold instead of golds when it is 1.
          await i.update({
            content: `${winnerName} has won the duel and gained ${earnedGold} golds! ${loserName} has died!`,
            embeds: [embed],
            components: [row],
            ephemeral: true
          });
        } else {
          const earnedGold = Math.floor(loser.gold / 2);
          winner.gold += earnedGold;
          loser.gold -= earnedGold;
          await Promise.all([winner.save(), loser.save()]);
          await Duel.deleteMany({
            discord_id: { $in: [winner.discord_id, loser.discord_id] }
          });
          await i.update({
            content: `${winnerName} has won the duel and gained ${earnedGold} golds! ${loserName} has lost the duel and lost ${earnedGold} golds!`,
            embeds: [embed],
            components: [row],
            ephemeral: true
          });
        }
      } else if (i.customId === 'random_encounter') {
        await i.reply('You have selected random encounter!');
      }
    });
    // client.channels.cache.get('1125716788370485308').send('This is a message for private DMs.');
  }
};
