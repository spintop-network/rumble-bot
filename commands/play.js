const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ComponentType,
  bold,
  userMention
} = require('discord.js');
const mongoose = require('mongoose');

const User = require('../models/user.js');
const Duel = require('../models/duel.js');
const { weapons, armors, BASE_DAMAGE } = require('../constants.js');

const createEmbed = (user) => {
  return new EmbedBuilder().setTitle('Welcome to the game!').addFields(
    {
      name: 'Health Points',
      value: `${user.health_points}/100`,
      inline: true
    },
    { name: 'Attack Power', value: `${user.attack_power}`, inline: true },
    { name: 'Energy Points', value: `${user.energy_points}/3`, inline: true },
    {
      name: '<:zpintop:1129374515365945364> Gold',
      value: `${user.gold}`,
      inline: true
    },
    {
      name: 'Health Potion Cost',
      value: `${user.health_potion_cost}`,
      inline: true
    },
    { name: 'Weapon', value: user.weapon ?? 'None', inline: true },
    { name: 'Armor', value: user.armor ?? 'None', inline: true }
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
      label: 'Main Menu',
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
    buying: {
      customId: 'buying',
      label: 'Buying',
      style: ButtonStyle.Success
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
    buy_potion: {
      customId: 'buy_potion',
      label: 'Buy Potion',
      style: ButtonStyle.Primary
    },
    shop: {
      customId: 'shop',
      label: 'Armory',
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
            .setEmoji('695955554199142421')
        );
      }
      return acc;
    }, [])
  );
};

const createExtraRows = (obj, key) => {
  if (!obj[key]) {
    if (key === 'shop') {
      obj[key] = createRow(['status', 'buying', 'sell_weapon', 'sell_armor']);
    } else if (key === 'buy_weapon') {
      obj[key] = createRow(['weapon_list']);
    } else if (key === 'buy_armor') {
      obj[key] = createRow(['armor_list']);
    } else if (key === 'buying') {
      obj[key] = createRow(['status', 'buy_potion', 'buy_weapon', 'buy_armor']);
    }
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play the game!'),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      let user = await User.findOne({ discord_id: interaction.user.id });
      if (!user) {
        await interaction.editReply({
          content:
            'You are not registered! Please use /register command to register.',
          ephemeral: true
        });
        return;
      }
      if (user.health_points <= 0) {
        await interaction.editReply({
          content: 'You have died. You cannot play anymore.',
          ephemeral: true
        });
        return;
      }
      let embed = createEmbed(user);
      const row = createRow(['status', 'duel', 'random_encounter', 'shop']);
      const extraRows = {};
      createExtraRows(extraRows, 'shop');
      const response = await interaction.editReply({
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
        const session = await mongoose.startSession();
        try {
          session.startTransaction();
          user = await User.findOne({ discord_id: i.user.id }).session(session);
          if (i.customId === 'weapon_list') {
            const weapon = weapons[i.values[0]];
            if (user.gold < weapon.cost) {
              await i.update({
                embeds: [
                  createNotificationEmbed(
                    'Ooops!',
                    'You do not have enough gold.'
                  ),
                  createShopEmbed(user)
                ],
                components: [extraRows.shop],
                ephemeral: true
              });
            } else {
              user.gold -= weapon.cost;
              user.weapon = weapon.name;
              user.attack_power += weapon.attack_power;
              await user.save({ session });
              await i.update({
                embeds: [
                  createNotificationEmbed(
                    'Hurray!',
                    'You have bought a weapon!'
                  ),
                  createShopEmbed(user)
                ],
                components: [extraRows.shop],
                ephemeral: true
              });
            }
          } else if (i.customId === 'armor_list') {
            const armor = armors[i.values[0]];
            if (user.gold < armor.cost) {
              await i.update({
                embeds: [
                  createNotificationEmbed(
                    'Ooops!',
                    'You do not have enough gold.'
                  ),
                  createShopEmbed(user)
                ],
                components: [extraRows.shop],
                ephemeral: true
              });
            } else {
              user.gold -= armor.cost;
              user.armor = armor.name;
              await user.save({ session });
              await i.update({
                embeds: [
                  createNotificationEmbed(
                    'Hurray!',
                    'You have bought an armor!'
                  ),
                  createShopEmbed(user)
                ],
                components: [extraRows.shop],
                ephemeral: true
              });
            }
          }
        } catch (error) {
          await session.abortTransaction();
          console.error('Transaction aborted:', error);
        } finally {
          await session.endSession();
        }
      });

      collector.on('collect', async (i) => {
        const session = await mongoose.startSession();
        try {
          session.startTransaction();
          // TODO: Other users should not see other users' bot responses. Check this later.
          if (i.user.id !== interaction.user.id) {
            await i.reply({
              content: 'You are not allowed to use this button!',
              ephemeral: true
            });
            await session.abortTransaction();
            console.error(
              'Transaction aborted: User is not allowed to use this button!'
            );
            return;
          }
          user = await User.findOne({ discord_id: i.user.id }).session(session);
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
            const isUserDueled = await Duel.findOne({
              discord_id: i.user.id
            }).session(session);
            if (isUserDueled) {
              embed = createEmbed(user);
              await i.update({
                embeds: [
                  createNotificationEmbed(
                    'Hurray!',
                    'You are already in duel queue!'
                  ),
                  embed
                ],
                components: [row],
                ephemeral: true
              });
              return;
            }
            if (user.energy_points <= 0) {
              embed = createEmbed(user);
              await i.update({
                embeds: [
                  createNotificationEmbed(
                    'Oops!',
                    'You do not have enough energy points!'
                  ),
                  embed
                ],
                components: [row],
                ephemeral: true
              });
              return;
            }
            user = await User.findOneAndUpdate(
              { discord_id: i.user.id },
              { energy_points: Math.max(user.energy_points - 1, 0) },
              { new: true }
            ).session(session);
            let otherDuelPlayer = await Duel.findOne({
              discord_id: { $ne: i.user.id }
            })
              .sort({ doc_created_at: 1 })
              .session(session);
            if (!otherDuelPlayer) {
              embed = createEmbed(user);
              await Duel.create({ discord_id: i.user.id });
              await i.update({
                embeds: [
                  createNotificationEmbed(
                    'Hurray!',
                    'You have been added to duel queue!'
                  ),
                  embed
                ],
                components: [row],
                ephemeral: true
              });
              return;
            }
            otherDuelPlayer = await User.findOne({
              discord_id: otherDuelPlayer.discord_id
            }).session(session);
            const playerDamage = parseFloat(
              (Math.random() * user.attack_power).toFixed(2)
            );
            const otherPlayerDamage = parseFloat(
              (Math.random() * otherDuelPlayer.attack_power).toFixed(2)
            );
            const isTie = playerDamage === otherPlayerDamage;
            if (isTie) {
              await Duel.deleteMany({
                discord_id: { $in: [i.user.id, otherDuelPlayer.discord_id] }
              }).session(session);
              await i.update({
                embeds: [
                  createNotificationEmbed('Ooops!', 'It is a tie!'),
                  embed
                ],
                components: [row],
                ephemeral: true
              });
              return;
            }
            const winner =
              playerDamage > otherPlayerDamage ? user : otherDuelPlayer;
            const loser =
              playerDamage > otherPlayerDamage ? otherDuelPlayer : user;
            loser.health_points = Math.round(
              Math.max(
                loser.health_points -
                  BASE_DAMAGE -
                  Math.abs(playerDamage - otherPlayerDamage) *
                    (1 - (loser.armor ? armors[loser.armor].dmg_migration : 0)),
                0
              )
            );
            await loser.save({ session });
            const isLoserDead = loser.health_points === 0;
            if (isLoserDead) {
              const earnedGold = Math.floor(
                loser.gold +
                  (loser.armor ? armors[loser.armor].cost : 0) +
                  (loser.weapon ? weapons[loser.weapon].cost : 0)
              );
              winner.gold += earnedGold;
              await Duel.deleteMany({
                discord_id: { $in: [winner.discord_id, loser.discord_id] }
              }).session(session);
              // TODO: Use usernames instead of discord ids.
              // TODO: Use gold instead of golds when it is 1.
              await i.update({
                content: `${userMention(
                  winner.discord_id
                )} has won the duel and gained ${earnedGold} golds! ${userMention(
                  loser.discord_id
                )} has died!`,
                embeds: [embed],
                components: [row],
                ephemeral: true
              });
            } else {
              const earnedGold = Math.floor(loser.gold / 2);
              winner.gold += earnedGold;
              loser.gold -= earnedGold;
              await Promise.all([
                winner.save({ session }),
                loser.save({ session })
              ]);
              await Duel.deleteMany({
                discord_id: { $in: [winner.discord_id, loser.discord_id] }
              }).session(session);
              await i.update({
                content: `${userMention(
                  winner.discord_id
                )} has won the duel and gained ${earnedGold} golds! ${userMention(
                  loser.discord_id
                )} has lost the duel and lost ${earnedGold} golds!`,
                embeds: [embed],
                components: [row],
                ephemeral: true
              });
            }
          } else if (i.customId === 'random_encounter') {
            await i.reply('You have selected random encounter!');
          } else if (i.customId === 'shop') {
            try {
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
          } else if (i.customId === 'buy_potion') {
            if (user.gold < user.health_potion_cost) {
              await i.update({
                embeds: [
                  createNotificationEmbed(
                    'Ooops!',
                    'You do not have enough gold to buy a health potion!'
                  ),
                  createShopEmbed(user)
                ],
                components: [extraRows.shop],
                ephemeral: true
              });
            } else {
              user.gold -= user.health_potion_cost;
              user.health_points = Math.min(user.health_points + 33, 100);
              user.health_potion_cost *= 2;
              await user.save({ session });
              await i.update({
                embeds: [
                  createNotificationEmbed(
                    'Success!',
                    'You have bought and used a health potion!'
                  ),
                  createShopEmbed(user)
                ],
                components: [extraRows.shop],
                ephemeral: true
              });
            }
          } else if (i.customId === 'buying') {
            createExtraRows(extraRows, 'buying');
            await i.update({
              embeds: [createShopEmbed(user)],
              components: [extraRows.buying],
              ephemeral: true
            });
          } else if (i.customId === 'buy_weapon') {
            if (user.weapon) {
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
            const weapon = Object.values(weapons).find(
              (w) => w.name === user.weapon
            );
            user.gold += Math.floor(weapon.cost / 2);
            user.weapon = null;
            user.attack_power -= weapon.attack_power;
            await user.save({ session });
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
            if (!user.armor) {
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
            const armor = Object.values(armors).find(
              (a) => a.name === user.armor
            );
            user.gold += Math.floor(armor.cost / 2);
            user.armor = null;
            await user.save({ session });
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
          await session.commitTransaction();
        } catch (error) {
          await session.abortTransaction();
          console.error('Transaction aborted:', error);
        } finally {
          await session.endSession();
        }
      });
    } catch (err) {
      console.error(err);
    }
  }
};
