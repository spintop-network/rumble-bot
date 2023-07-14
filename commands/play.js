const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ComponentType,
  bold
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

const createNotificationEmbed = (title, description) =>
  new EmbedBuilder().setTitle(title).setDescription(description);

const createShopEmbed = (user) => {
  const weapons_shop = Object.values(weapons).map((weapon) => ({
    name: weapon.name,
    value: `Attack Power:${weapon.attack_power} Cost:${weapon.cost}`,
    inline: true
  }));
  const armors_shop = Object.values(armors).map((armor) => ({
    name: armor.name,
    value: `Damage Migration:${armor.dmg_migration} Cost:${armor.cost}`,
    inline: true
  }));
  return new EmbedBuilder()
    .setTitle('SHOP')
    .setDescription('We have precious items!\n\n')
    .addFields(
      {
        name: 'Health Potion',
        value: `${user.health_potion_cost}`
      },
      {
        name: '---------------------',
        value: bold('Weapons')
      },
      ...weapons_shop,
      {
        name: '---------------------',
        value: bold('Armors')
      },
      ...armors_shop
    );
};

const createRow = (custom_ids = ['status']) => {
  const buttons = {
    status: {
      customId: 'status',
      label: 'Status',
      style: ButtonStyle.Primary
    },
    duel: {
      customId: 'duel',
      label: 'Duel',
      style: ButtonStyle.Danger
    },
    random_encounter: {
      customId: 'random_encounter',
      label: 'Random Encounter',
      style: ButtonStyle.Secondary
    },
    buy_weapon: {
      customId: 'buy_weapon',
      label: 'Buy Weapon',
      style: ButtonStyle.Success
    },
    sell_weapon: {
      customId: 'sell_weapon',
      label: 'Sell Weapon',
      style: ButtonStyle.Danger
    },
    buy_armor: {
      customId: 'buy_armor',
      label: 'Buy Armor',
      style: ButtonStyle.Success
    },
    sell_armor: {
      customId: 'sell_armor',
      label: 'Sell Armor',
      style: ButtonStyle.Danger
    },
    shop: {
      customId: 'shop',
      label: 'Shop',
      style: ButtonStyle.Success
    },
    weapon_list: {
      customId: 'weapon_list',
      placeholder: 'Select a weapon',
      items: Object.entries(weapons).map(([key, value]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(value.name)
          .setDescription(value.description)
          .setValue(key)
      )
    },
    armor_list: {
      customId: 'armor_list',
      placeholder: 'Select an armor',
      items: Object.entries(armors).map(([key, value]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(value.name)
          .setDescription(value.description)
          .setValue(key)
      )
    }
  };

  return new ActionRowBuilder().addComponents(
    ...custom_ids.reduce((acc, id) => {
      const rowItem = buttons[id];
      if (['weapon_list', 'armor_list'].includes(id)) {
        acc.push(
          new StringSelectMenuBuilder()
            .setCustomId(rowItem.customId)
            .setPlaceholder(rowItem.placeholder)
            .addOptions(rowItem.items)
        );
      } else {
        acc.push(
          new ButtonBuilder()
            .setCustomId(rowItem.customId)
            .setLabel(rowItem.label)
            .setStyle(rowItem.style)
        );
      }
      return acc;
    }, [])
  );
};

const createExtraRows = (obj, key) => {
  if (!obj[key]) {
    if (key === 'shop') {
      obj[key] = createRow([
        'status',
        'buy_weapon',
        'sell_weapon',
        'buy_armor',
        'sell_armor'
      ]);
    } else if (key === 'buy_weapon') {
      obj[key] = createRow(['weapon_list']);
    } else if (key === 'buy_armor') {
      obj[key] = createRow(['armor_list']);
    }
  }
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
    const row = createRow(['status', 'duel', 'random_encounter', 'shop']);
    const extraRows = {};
    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });

    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 3_600_000
    });

    const selectMenuCollector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 3_600_000
    });

    selectMenuCollector.on('collect', async (i) => {
      user = await User.findOne({ discord_id: i.user.id });
      if (i.customId === 'weapon_list') {
        const weapon = weapons[i.values[0]];
        if (user.gold < weapon.cost) {
          createExtraRows(extraRows, 'shop');
          await i.update({
            embeds: [
              createNotificationEmbed('Ooops!', 'You do not have enough gold.'),
              createShopEmbed(user)
            ],
            components: [extraRows.shop],
            ephemeral: true
          });
        } else {
          user.gold -= weapon.cost;
          user.weapon = weapon.name;
          user.attack_power += weapon.attack_power;
          await user.save();
          createExtraRows(extraRows, 'shop');
          await i.update({
            embeds: [
              createNotificationEmbed('Hurray!', 'You have bought a weapon!'),
              createShopEmbed(user)
            ],
            components: [extraRows.shop],
            ephemeral: true
          });
        }
      } else if (i.customId === 'armor_list') {
        const armor = armors[i.values[0]];
        if (user.gold < armor.cost) {
          createExtraRows(extraRows, 'shop');
          await i.update({
            embeds: [
              createNotificationEmbed('Ooops!', 'You do not have enough gold.'),
              createShopEmbed(user)
            ],
            components: [extraRows.shop],
            ephemeral: true
          });
        } else {
          user.gold -= armor.cost;
          user.armor = armor.name;
          await user.save();
          createExtraRows(extraRows, 'shop');
          await i.update({
            embeds: [
              createNotificationEmbed('Hurray!', 'You have bought an armor!'),
              createShopEmbed(user)
            ],
            components: [extraRows.shop],
            ephemeral: true
          });
        }
      }
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
      user = await User.findOne({ discord_id: i.user.id });
      // TODO: Add a status button to refresh the status of the user. Also, show if user is in duel queue.
      if (i.customId === 'status') {
        try {
          embed = createEmbed(user);
          await i.update({
            embeds: [embed],
            components: [row],
            ephemeral: true
          });
        } catch (err) {
          console.error(err);
          embed = createEmbed(user);
          await i.update({
            embeds: [embed],
            components: [row],
            ephemeral: true
          });
        }
      } else if (i.customId === 'duel') {
        // TODO: Send a message to the feed channel.
        // TODO: Use transaction here to block user actions.
        // TODO: Add defer in case of long running operations.
        // await i.deferUpdate();
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
      } else if (i.customId === 'shop') {
        try {
          createExtraRows(extraRows, 'shop');
          await i.update({
            embeds: [createShopEmbed(user)],
            components: [extraRows.shop],
            ephemeral: true
          });
        } catch (err) {
          console.error(err);
          await i.update({
            content: 'There has been an error!',
            embeds: [createShopEmbed(user)],
            components: [row],
            ephemeral: true
          });
        }
      } else if (i.customId === 'buy_weapon') {
        if (user.weapon) {
          createExtraRows(extraRows, 'shop');
          await i.update({
            embeds: [
              createNotificationEmbed(
                'Ooops!',
                'You already have a weapon. Sell it first to buy another one!'
              ),
              createShopEmbed(user)
            ],
            components: [extraRows.shop],
            ephemeral: true
          });
        } else {
          createExtraRows(extraRows, 'buy_weapon');
          await i.update({
            embeds: [createShopEmbed(user)],
            components: [extraRows.buy_weapon],
            ephemeral: true
          });
        }
      } else if (i.customId === 'sell_weapon') {
        if (!user.weapon) {
          createExtraRows(extraRows, 'shop');
          await i.update({
            embeds: [
              createNotificationEmbed(
                'Ooops!',
                'You do not have a weapon to sell!'
              ),
              createShopEmbed(user)
            ],
            components: [extraRows.shop],
            ephemeral: true
          });
          return;
        }
        createExtraRows(extraRows, 'shop');
        const weapon = Object.values(weapons).find(
          (w) => w.name === user.weapon
        );
        user.gold += Math.floor(weapon.cost / 2);
        user.weapon = null;
        user.attack_power -= weapon.attack_power;
        await user.save();
        await i.update({
          embeds: [
            createNotificationEmbed(
              'Success!',
              'You have sold your weapon for half of its price!'
            ),
            createShopEmbed(user)
          ],
          components: [extraRows.shop],
          ephemeral: true
        });
      } else if (i.customId === 'buy_armor') {
        if (user.armor) {
          createExtraRows(extraRows, 'shop');
          await i.update({
            embeds: [
              createNotificationEmbed(
                'Ooops!',
                'You already have an armor. Sell it first to buy another one!'
              ),
              createShopEmbed(user)
            ],
            components: [extraRows.shop],
            ephemeral: true
          });
        } else {
          createExtraRows(extraRows, 'buy_armor');
          await i.update({
            embeds: [createShopEmbed(user)],
            components: [extraRows.buy_armor],
            ephemeral: true
          });
        }
      } else if (i.customId === 'sell_armor') {
        console.log('sell armor');
        if (!user.armor) {
          createExtraRows(extraRows, 'shop');
          await i.update({
            embeds: [
              createNotificationEmbed(
                'Ooops!',
                'You do not have an armor to sell!'
              ),
              createShopEmbed(user)
            ],
            components: [extraRows.shop],
            ephemeral: true
          });
          return;
        }
        createExtraRows(extraRows, 'shop');
        const armor = Object.values(armors).find((a) => a.name === user.armor);
        user.gold += Math.floor(armor.cost / 2);
        user.armor = null;
        await user.save();
        await i.update({
          embeds: [
            createNotificationEmbed(
              'Success!',
              'You have sold your armor for half of its price!'
            ),
            createShopEmbed(user)
          ],
          components: [extraRows.shop],
          ephemeral: true
        });
      }
    });
    // client.channels.cache.get('1125716788370485308').send('This is a message for private DMs.');
  }
};
