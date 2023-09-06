const User = require('../models/user');
const {
  ComponentType,
  bold,
  userMention,
  EmbedBuilder,
  italic,
  ButtonStyle,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder
} = require('discord.js');
const mongoose = require('mongoose');
const {
  weapons,
  BASE_ATTACK_POWER,
  armors,
  getRandoms,
  rooms,
  BASE_ENERGY_POINTS,
  BASE_DAMAGE,
  duel_bounds,
  armor_texts,
  weapon_texts,
  duel_texts
} = require('../constants');
const { client } = require('../client');
const Duel = require('../models/duel');
const Death = require('../models/death');
const Stat = require('../models/stat');
const Config = require('../models/config');

const LINE_SEPARATOR = '\n───────────────────────────────────';

const weighted_number = (options) => {
  let i;

  const weights = [options[0].weight];

  for (i = 1; i < options.length; i++) {
    weights[i] = options[i].weight + weights[i - 1];
  }

  const random = Math.random() * weights[weights.length - 1];

  for (i = 0; i < weights.length; i++) {
    if (weights[i] > random) {
      break;
    }
  }

  return i;
};

const createEmbed = async (user) => {
  const weapon = weapons[user.weapon];
  const armor = armors[user.armor];
  let weaponName = 'None';
  let armorName = 'None';
  if (weapon) {
    if (weapon.emoji) weaponName = `${weapon.emoji} ${weapon.name}`;
    else weaponName = weapon.name;
  }
  if (armor) {
    if (armor.emoji) armorName = `${armor.emoji} ${armor.name}`;
    else armorName = armor.name;
  }
  const remaining_player_count = await User.countDocuments({
    health_points: { $gt: 0 }
  });
  return new EmbedBuilder()
    .setTitle('Welcome to the Cobot’s Steam Arena!')
    .setDescription(`${bold('Remaining Players: ' + remaining_player_count)}`)
    .addFields(
      {
        name: ':heart: HP',
        value: `${user.health_points}/100`,
        inline: true
      },
      {
        name: ':crossed_swords: AP',
        value: `${user.attack_power}`,
        inline: true
      },
      {
        name: ':zap: EP',
        value: `${user.energy_points}/${BASE_ENERGY_POINTS}`,
        inline: true
      },
      {
        name: ':coin: Credits',
        value: `${user.gold}`,
        inline: true
      },
      {
        name: '<:repairkit:1138876531691757728> Repair Kit Cost',
        value: `${user.health_potion_cost}`,
        inline: true
      },
      { name: ':dagger: Weapon', value: weaponName, inline: true },
      { name: ':shield: Armor', value: armorName, inline: true }
    );
};

const createConfirmEmbed = (user, type) => {
  const toolText =
    type === 'weapon' ? user.weapon.toUpperCase() : user.armor.toUpperCase();
  const tool = type === 'weapon' ? weapons[user.weapon] : armors[user.armor];

  return new EmbedBuilder().setDescription(
    `You are selling your ${bold(toolText)} for ${bold(
      Math.floor(tool.cost / 2) + ' Credits'
    )}. Are you sure?`
  );
};

const createNotificationEmbed = (title, description) =>
  new EmbedBuilder().setTitle(title).setDescription(description);

const createShopEmbed = (user) => {
  const weapons_shop = Object.values(weapons).map((weapon) => ({
    name: weapon.emoji ? `${weapon.emoji} ${weapon.name}` : weapon.name,
    value: `AP: ${weapon.attack_power} Cost: ${weapon.cost}`,
    inline: true
  }));
  const armors_shop = Object.values(armors).map((armor) => ({
    name: armor.emoji ? `${armor.emoji} ${armor.name}` : armor.name,
    value: `DMG: ${armor.dmg_migration} Cost: ${armor.cost}`,
    inline: true
  }));
  return new EmbedBuilder()
    .setTitle('ARMORY')
    .setDescription(
      `We have precious items!\n
      :coin: You have ${bold(user.gold)} Credits.\n
      You can sell your items here for ${bold(
        'half of the price'
      )} you bought them for.\n\n`
    )
    .addFields(
      {
        name: '\n',
        value: '\n'
      },
      {
        name: '<:repairkit:1138876531691757728> Repair Kit',
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
// eslint-disable-next-line no-unused-vars
const createRow = (custom_ids = ['status'], user) => {
  const buttons = {
    status: {
      customId: 'status',
      label: 'Status/Refresh',
      style: ButtonStyle.Primary
    },
    duel: {
      customId: 'duel',
      label: 'Battle',
      style: ButtonStyle.Danger
    },
    random_encounter: {
      customId: 'random_encounter',
      label: 'Random Encounter',
      style: ButtonStyle.Secondary
    },
    buying: {
      customId: 'buying',
      label: 'Buy',
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
      label: 'Buy Repair Kit',
      style: ButtonStyle.Primary
    },
    shop: {
      customId: 'shop',
      label: 'Armory',
      style: ButtonStyle.Success
    },
    sell_weapon_confirm: {
      customId: 'sell_weapon_confirm',
      label: 'Confirm',
      style: ButtonStyle.Success
    },
    sell_weapon_cancel: {
      customId: 'sell_weapon_cancel',
      label: 'Cancel',
      style: ButtonStyle.Danger
    },
    sell_armor_confirm: {
      customId: 'sell_armor_confirm',
      label: 'Confirm',
      style: ButtonStyle.Success
    },
    sell_armor_cancel: {
      customId: 'sell_armor_cancel',
      label: 'Cancel',
      style: ButtonStyle.Danger
    },
    weapon_list: {
      customId: 'weapon_list',
      placeholder: 'Select a weapon',
      items: [
        new StringSelectMenuOptionBuilder()
          .setLabel('Go Back')
          .setDescription('Go back to the previous menu')
          .setValue('weapon_go_back')
          .setEmoji('⬅️'),
        ...Object.entries(weapons).map(([key, value]) => {
          const menuOption = new StringSelectMenuOptionBuilder()
            .setLabel(`${value.name}`)
            .setDescription(`${value.description}`)
            .setValue(key);
          return menuOption;
        })
      ]
    },
    armor_list: {
      customId: 'armor_list',
      placeholder: 'Select an armor',
      items: [
        new StringSelectMenuOptionBuilder()
          .setLabel('Go Back')
          .setDescription('Go back to the previous menu')
          .setValue('armor_go_back')
          .setEmoji('⬅️'),
        ...Object.entries(armors).map(([key, value]) => {
          const menuOption = new StringSelectMenuOptionBuilder()
            .setLabel(value.name)
            .setDescription(value.description)
            .setValue(key);
          return menuOption;
        })
      ]
    }
  };

  const buttonEmojis = {
    buy_potion: '1136615732931723324',
    status: '🔄',
    duel: '🪓',
    random_encounter: '🎲',
    shop: '🛒',
    buying: '🛒',
    buy_weapon: '🗡️',
    sell_weapon: '🗡️',
    buy_armor: '🛡️',
    sell_armor: '🛡️',
    sell_weapon_confirm: '✅',
    sell_weapon_cancel: '❌',
    sell_armor_confirm: '✅',
    sell_armor_cancel: '❌'
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
      } else if (buttonEmojis[id]) {
        acc.push(
          new ButtonBuilder()
            .setCustomId(rowItem.customId)
            .setLabel(rowItem.label)
            .setStyle(rowItem.style)
            .setEmoji(buttonEmojis[id])
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

const createExtraRows = (obj, key, user) => {
  if (!obj[key]) {
    if (key === 'shop') {
      obj[key] = createRow(
        ['status', 'buying', 'sell_weapon', 'sell_armor'],
        user
      );
    } else if (key === 'buy_weapon') {
      obj[key] = createRow(['weapon_list'], user);
    } else if (key === 'buy_armor') {
      obj[key] = createRow(['armor_list'], user);
    } else if (key === 'buying') {
      obj[key] = createRow(
        ['status', 'buy_potion', 'buy_weapon', 'buy_armor'],
        user
      );
    } else if (key === 'weapon_confirm') {
      obj[key] = createRow(['sell_weapon_confirm', 'sell_weapon_cancel'], user);
    } else if (key === 'armor_confirm') {
      obj[key] = createRow(['sell_armor_confirm', 'sell_armor_cancel'], user);
    }
  }
};

const getChannel = async (channel_id) =>
  (await client.channels.cache.get(channel_id)) ||
  (await client.channels.fetch(channel_id));

const startDuel = async (
  session,
  user,
  i,
  embed,
  row,
  is_random_encounter,
  isThereOtherPlayer = null
) => {
  await session.withTransaction(async () => {
    if (!isThereOtherPlayer) {
      const duel = new Duel({ discord_id: i.user.id });
      await duel.save({ session });
      if (!is_random_encounter) {
        embed = await createEmbed(user);
        await i.update({
          content: '',
          embeds: [
            embed,
            createNotificationEmbed(
              'Hurray!',
              'You have been added to battle queue!'
            )
          ],
          components: [row],
          ephemeral: true
        });
        if (!is_random_encounter) {
          await User.findOneAndUpdate(
            { discord_id: i.user.id, energy_points: { $gt: 0 } },
            { $inc: { energy_points: -1 } },
            { session }
          );
        }
      }
      return;
    }
    const otherDuelPlayer = await User.findOne({
      discord_id: isThereOtherPlayer.discord_id
    }).session(session);
    const playerRoll = Math.random();
    const otherPlayerRoll = Math.random();
    const playerDamage = parseFloat(
      (playerRoll * user.attack_power).toFixed(2)
    );
    const otherPlayerDamage = parseFloat(
      (otherPlayerRoll * otherDuelPlayer.attack_power).toFixed(2)
    );
    const isTie = playerDamage === otherPlayerDamage;
    if (isTie) {
      await Promise.allSettled([
        Duel.deleteMany(
          {
            discord_id: { $in: [i.user.id, otherDuelPlayer.discord_id] }
          },
          { session }
        ),
        User.updateOne(
          { discord_id: i.user.id },
          { $set: { has_seen_tie_message: true } },
          { session }
        )
      ]);
      if (!is_random_encounter) {
        await i.update({
          embeds: [embed, createNotificationEmbed('Ooops!', 'It is a tie!')],
          components: [row],
          ephemeral: true
        });
      }
      return;
    }
    const winner = playerDamage > otherPlayerDamage ? user : otherDuelPlayer;
    const loser = playerDamage > otherPlayerDamage ? otherDuelPlayer : user;
    const winnerRoll =
      winner.discord_id === i.user.id ? playerRoll : otherPlayerRoll;
    const loserRoll =
      loser.discord_id === i.user.id ? playerRoll : otherPlayerRoll;
    const winnerDamage =
      winner.discord_id === i.user.id ? playerDamage : otherPlayerDamage;
    const loserDamage =
      loser.discord_id === i.user.id ? playerDamage : otherPlayerDamage;
    const damageFloat =
      BASE_DAMAGE +
      Math.abs(playerDamage - otherPlayerDamage) *
        (1 - (loser.armor ? armors[loser.armor].dmg_migration : 0)) *
        10;
    const lostHealth =
      loser.health_points - Math.round(loser.health_points - damageFloat);
    loser.health_points = Math.round(loser.health_points - damageFloat);
    await loser.save({ session });
    const isLoserDead = loser.health_points <= 0;
    const perspective = ['getting_damage', 'damaging'][
      Math.floor(Math.random() * 2)
    ];
    const bound = duel_bounds.find(
      (b) => damageFloat >= b.lower_bound && damageFloat < b.upper_bound
    );
    const boundName = isLoserDead ? 'Elimination' : bound.name;
    const armor_text = loser.armor
      ? armor_texts.filter((a) =>
          a['Armor'].includes(loser.armor.toUpperCase())
        )[Math.floor(Math.random() * 2)][bound.name]
      : '';
    const weapon_text = winner.weapon
      ? weapon_texts.filter((w) =>
          w['Weapon'].includes(winner.weapon.toUpperCase())
        )[0][bound.name]
      : '';
    let armory_text = '';
    if (armor_text && weapon_text) {
      armory_text = [armor_text, weapon_text][Math.floor(Math.random() * 2)];
    } else if (armor_text) {
      armory_text = armor_text;
    } else if (weapon_text) {
      armory_text = weapon_text;
    }
    const winnerRollText = `${Math.floor(winnerRoll * 100) + 1}/100`;
    const loserRollText = `${Math.floor(loserRoll * 100) + 1}/100`;
    let duel_text = duel_texts.find((d) => d.name === boundName)[perspective];
    duel_text = isLoserDead
      ? `${armory_text}\n${duel_text}`
      : `${duel_text}\n${armory_text}`;
    duel_text = `\`\`\`diff
-BATTLE-
\`\`\`\n${userMention(winner.discord_id)} :crossed_swords: ${userMention(
      loser.discord_id
    )}\n\n:game_die:@kazanan rolled ${bold(winnerRollText)} and dealt ${bold(
      (winnerDamage * 10).toFixed(2)
    )} damage with ${bold(
      winner.attack_power.toString() + ' AP'
    )}.\n:game_die:@kaybeden rolled ${bold(
      loserRollText
    )} and failed to deal ${bold(
      (loserDamage * 10).toFixed(2)
    )} damage with ${bold(
      loser.attack_power.toString() + ' AP'
    )}.\n\n:axe:${duel_text}`;
    const earnedGold = isLoserDead
      ? Math.floor(
          loser.gold +
            (loser.armor ? armors[loser.armor].cost / 2 : 0) +
            (loser.weapon ? weapons[loser.weapon].cost / 2 : 0)
        )
      : Math.floor(loser.gold / 2);
    duel_text += `\n\n${bold(
      'Result:'
    )}\n:money_with_wings:@kaybeden has lost ${bold(
      earnedGold.toString() + ' Credits.'
    )}\n:mending_heart: @kaybeden has lost ${bold(
      lostHealth.toString() + ' HP.'
    )}`;
    duel_text = duel_text
      .replaceAll('@kazanan', userMention(winner.discord_id))
      .replaceAll('@kaybeden', userMention(loser.discord_id));
    winner.gold += earnedGold;

    if (isLoserDead) {
      const death = new Death({
        type: 'duel',
        discord_id: loser.discord_id,
        death_time: new Date()
      });
      await Promise.all([
        death.save({ session }),
        winner.save({ session }),
        Duel.deleteMany(
          {
            discord_id: { $in: [winner.discord_id, loser.discord_id] }
          },
          { session }
        ),
        Stat.updateOne(
          { discord_id: winner.discord_id },
          { $inc: { kills: 1, inflicted_damage: Math.floor(damageFloat) } },
          { session, upsert: true }
        )
      ]);
      if (!is_random_encounter) {
        await i.update({
          content: duel_text,
          embeds: [embed],
          components: [row],
          ephemeral: true
        });
      }
    } else {
      loser.gold -= earnedGold;
      await Promise.all([
        winner.save({ session }),
        loser.save({ session }),
        Duel.deleteMany(
          {
            discord_id: { $in: [winner.discord_id, loser.discord_id] }
          },
          { session }
        ),
        Stat.updateOne(
          { discord_id: winner.discord_id },
          { $inc: { inflicted_damage: Math.floor(damageFloat) } },
          { session, upsert: true }
        )
      ]);
      if (!is_random_encounter) {
        await i.update({
          content: duel_text,
          embeds: [embed],
          components: [row],
          ephemeral: true
        });
      }
    }
    const channel = await getChannel(rooms.feed);
    if (channel) {
      const duel_text_with_separator = duel_text + '\n' + LINE_SEPARATOR;
      if (!is_random_encounter) {
        await User.findOneAndUpdate(
          { discord_id: i.user.id, energy_points: { $gt: 0 } },
          { $inc: { energy_points: -1 } },
          { session }
        );
      }
      await channel.send(duel_text_with_separator);
    } else if (!is_random_encounter) {
      await User.findOneAndUpdate(
        { discord_id: i.user.id, energy_points: { $gt: 0 } },
        { $inc: { energy_points: -1 } },
        { session }
      );
    }
  });
};

const play = async (interaction) => {
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }
    const user_global = await User.findOne({
      discord_id: interaction.user.id
    });
    if (!user_global) {
      await interaction.editReply({
        content: 'You are not registered!',
        ephemeral: true
      });
      return;
    }
    if (user_global.health_points <= 0) {
      await interaction.editReply({
        content: 'You have died. You cannot play anymore.',
        ephemeral: true
      });
      return;
    }
    user_global.latest_play_button_click = new Date();
    await user_global.save();

    const config = await Config.findOne({ id: 0 }).lean();
    const isGameStarted = config.is_game_started ?? false;
    const isGameOver = config.is_game_over ?? false;
    if (!isGameStarted) {
      await interaction.editReply({
        content: 'The game has not started yet!',
        ephemeral: true
      });
      return;
    }
    if (isGameOver) {
      await interaction.editReply({
        content: 'The game is over!',
        ephemeral: true
      });
      return;
    }
    let embed = await createEmbed(user_global);
    const row = createRow(['status', 'duel', 'random_encounter', 'shop']);
    const extraRows = {};
    createExtraRows(extraRows, 'shop', user_global);
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
        await session.withTransaction(async () => {
          const user = await User.findOne({ discord_id: i.user.id }).session(
            session
          );
          if (user.health_points <= 0) {
            await i.update({
              content: 'You have died. You cannot play anymore.',
              embeds: [],
              components: [],
              ephemeral: true
            });
            throw new Error('User is dead.');
          }
          if (i.customId === 'weapon_list') {
            const weapon = weapons[i.values[0]];
            if (i.values[0] === 'weapon_go_back') {
              await i.update({
                embeds: [createShopEmbed(user)],
                components: [extraRows.buying],
                ephemeral: true
              });
            } else if (user.gold < weapon.cost) {
              await i.update({
                embeds: [
                  createShopEmbed(user),
                  createNotificationEmbed(
                    'Ooops!',
                    'You do not have enough Credits.'
                  )
                ],
                components: [extraRows.shop],
                ephemeral: true
              });
            } else {
              user.gold -= weapon.cost;
              user.weapon = weapon.name;
              user.attack_power = BASE_ATTACK_POWER + weapon.attack_power;
              user.has_ever_bought_weapon = true;
              await user.save({ session });
              await i.update({
                embeds: [
                  createShopEmbed(user),
                  createNotificationEmbed(
                    'Hurray!',
                    'You have bought a weapon!'
                  )
                ],
                components: [extraRows.shop],
                ephemeral: true
              });
            }
          } else if (i.customId === 'armor_list') {
            const armor = armors[i.values[0]];
            if (i.values[0] === 'armor_go_back') {
              await i.update({
                embeds: [createShopEmbed(user)],
                components: [extraRows.buying],
                ephemeral: true
              });
            } else if (user.gold < armor.cost) {
              await i.update({
                embeds: [
                  createShopEmbed(user),
                  createNotificationEmbed(
                    'Ooops!',
                    'You do not have enough Credits.'
                  )
                ],
                components: [extraRows.shop],
                ephemeral: true
              });
            } else {
              user.gold -= armor.cost;
              user.armor = armor.name;
              user.has_ever_bought_armor = true;
              await user.save({ session });
              await i.update({
                embeds: [
                  createShopEmbed(user),
                  createNotificationEmbed(
                    'Hurray!',
                    'You have bought an armor!'
                  )
                ],
                components: [extraRows.shop],
                ephemeral: true
              });
            }
          }
        });
      } catch (error) {
        // await session.abortTransaction();
        console.error('Transaction aborted:', error);
      } finally {
        await session.endSession();
      }
    });

    collector.on('collect', async (i) => {
      if (i.customId === 'duel') {
        let isThereOtherPlayer;
        const session = await mongoose.startSession();
        try {
          if (i.user.id !== interaction.user.id) {
            await i.reply({
              content: 'You are not allowed to use this button!',
              ephemeral: true
            });
            throw new Error('User is not allowed to use this button!');
          }
          const user = await User.findOne({
            discord_id: i.user.id,
            health_points: { $gt: 0 }
          });
          user.is_ever_clicked_battle_button = true;
          await user.save();
          if (!user) {
            await i.update({
              content: 'You have died. You cannot play anymore.',
              embeds: [],
              components: [],
              ephemeral: true
            });
            throw new Error('User is dead.');
          }
          const isUserDueled = await Duel.findOne({
            discord_id: i.user.id
          });
          if (isUserDueled) {
            embed = await createEmbed(user);
            await i.update({
              content: '',
              embeds: [
                embed,
                createNotificationEmbed(
                  'Hurray!',
                  'You are already in battle queue!'
                )
              ],
              components: [row],
              ephemeral: true
            });
            return;
          }
          if (user.energy_points <= 0) {
            embed = await createEmbed(user);
            await i.update({
              embeds: [
                embed,
                createNotificationEmbed('Oops!', 'You do not have enough EP!')
              ],
              components: [row],
              ephemeral: true
            });
            return;
          }
          isThereOtherPlayer = await Duel.findOneAndUpdate(
            {
              discord_id: { $ne: i.user.id },
              is_duel_in_progress: false
            },
            { is_duel_in_progress: true }
          )
            .sort({ doc_created_at: 1 })
            .lean();
          await startDuel(
            session,
            user,
            i,
            embed,
            row,
            false,
            isThereOtherPlayer
          );
        } catch (error) {
          console.error('Transaction aborted:', error);
        } finally {
          if (isThereOtherPlayer) {
            await Duel.findOneAndUpdate(
              { discord_id: isThereOtherPlayer.discord_id },
              { is_duel_in_progress: false },
              { upsert: false }
            );
          }
          await session.endSession();
        }
      } else if (i.customId === 'random_encounter') {
        const randoms = await getRandoms();
        let isThereOtherPlayer;
        const session = await mongoose.startSession();
        try {
          if (i.user.id !== interaction.user.id) {
            await i.reply({
              content: 'You are not allowed to use this button!',
              ephemeral: true
            });
            throw new Error('User is not allowed to use this button!');
          }
          const user = await User.findOne({
            discord_id: i.user.id,
            health_points: { $gt: 0 }
          });
          user.is_ever_clicked_random_button = true;
          await user.save();
          if (!user) {
            await i.update({
              content: 'You have died. You cannot play anymore.',
              embeds: [],
              components: [],
              ephemeral: true
            });
            throw new Error('User is dead.');
          }
          if (user.energy_points <= 0) {
            embed = await createEmbed(user);
            await i.update({
              embeds: [
                embed,
                createNotificationEmbed('Oops!', 'You do not have enough EP!')
              ],
              components: [row],
              ephemeral: true
            });
            return;
          }
          user.energy_points = Math.max(0, user.energy_points - 1);
          let random_number = weighted_number(randoms);
          let random = randoms[random_number];
          const channel =
            (await client.channels.cache.get(rooms.feed)) ||
            (await client.channels.fetch(rooms.feed));

          if (random_number >= 0 && random_number <= 44) {
            await session.withTransaction(async () => {
              const outcomes = random.outcome.split(',');
              const outcomesPrivate = [];
              const outcomesFeed = [];
              const outcomesPrivateZero = [];
              const outcomesFeedZero = [];
              for await (const outcome of outcomes) {
                const out = outcome.trim().toLowerCase();
                if (out.includes('lost')) {
                  if (out.includes('hp')) {
                    const lost_hp = out.split(' ')[1].trim();
                    const lost_hp_capped = Math.min(
                      parseInt(lost_hp),
                      user.health_points
                    );
                    user.health_points -= parseInt(lost_hp);
                    if (user.health_points <= 0) {
                      await Duel.deleteOne(
                        { discord_id: user.discord_id },
                        { session }
                      );
                      const new_death = new Death({
                        type: 'encounter',
                        discord_id: user.discord_id,
                        death_time: new Date()
                      });
                      await new_death.save({ session });
                    }
                    const eliminated_text =
                      user.health_points <= 0
                        ? ` and been ${bold('ELIMINATED!')}`
                        : '';
                    outcomesPrivate.push(
                      `${
                        eliminated_text.length > 0
                          ? ':skull:'
                          : ':mending_heart:'
                      } You have lost ${bold(
                        lost_hp_capped + ' HP'
                      )}${eliminated_text}.\n`
                    );
                    outcomesFeed.push(
                      `${
                        eliminated_text.length > 0
                          ? ':skull:'
                          : ':mending_heart:'
                      } ${userMention(user.discord_id)} has lost ${bold(
                        lost_hp_capped + ' HP'
                      )}${eliminated_text}.\n`
                    );
                  } else if (out.includes('an ep')) {
                    user.energy_points = Math.max(0, user.energy_points - 1);
                    outcomesPrivate.push(
                      `:low_battery: You have lost ${bold('an EP')}.`
                    );
                    outcomesFeed.push(
                      `:low_battery: ${userMention(
                        user.discord_id
                      )} has lost ${bold('an EP')}.\n`
                    );
                  } else if (out.includes('all ep')) {
                    user.energy_points = 0;
                    outcomesPrivate.push(
                      `:low_battery: You have lost all ${bold('EP')}.`
                    );
                    outcomesFeed.push(
                      `:low_battery: ${userMention(
                        user.discord_id
                      )} has lost ${bold('all EP')}.\n`
                    );
                  } else if (out.includes('2 eps')) {
                    user.energy_points = Math.max(0, user.energy_points - 2);
                    outcomesPrivate.push(
                      `:low_battery: You have lost ${bold('two EP')}.`
                    );
                    outcomesFeed.push(
                      `:low_battery: ${userMention(
                        user.discord_id
                      )} has lost ${bold('two EP')}.\n`
                    );
                  } else if (
                    out.includes('credits') &&
                    !out.includes('equipped')
                  ) {
                    const lost_credits = out.split(' ')[1];
                    const lost_credits_capped = Math.min(
                      parseInt(lost_credits),
                      user.gold
                    );
                    user.gold = Math.max(0, user.gold - parseInt(lost_credits));
                    if (lost_credits_capped === 0) {
                      // prettier-ignore
                      outcomesPrivateZero.push(
                        `:exclamation: You have ${bold('0')} Credits. You can't lose what you don't have.
                        `);
                      outcomesFeedZero.push(
                        `:exclamation: ${userMention(
                          user.discord_id
                        )} has ${bold(
                          '0'
                        )} Credits. He can't lose what he doesn't have.`
                      );
                    } else {
                      outcomesPrivate.push(
                        `:money_with_wings: You have lost ${bold(
                          lost_credits_capped + ' Credits'
                        )}.\n`
                      );
                      outcomesFeed.push(
                        `:money_with_wings: ${userMention(
                          user.discord_id
                        )} has lost ${bold(
                          lost_credits_capped + ' Credits'
                        )}.\n`
                      );
                    }
                  } else if (out.includes('armor')) {
                    if (user.armor) {
                      user.armor = null;
                      outcomesPrivate.push('You have lost your armor.\n');
                      outcomesFeed.push(
                        `:shield: ${userMention(
                          user.discord_id
                        )} has lost his armor.\n`
                      );
                    } else {
                      const split_text_arr = out.split(' ');
                      const lost_credit =
                        split_text_arr[split_text_arr.length - 3];
                      const lost_credit_capped = Math.min(
                        parseInt(lost_credit),
                        user.gold
                      );
                      user.gold = Math.max(
                        0,
                        user.gold - parseInt(lost_credit)
                      );
                      if (lost_credit_capped === 0) {
                        // prettier-ignore
                        outcomesPrivateZero.push(
                          `:exclamation: You have ${bold('0 Credits')}. You can't lose what you don't have.`
                        );
                        outcomesFeedZero.push(
                          `:exclamation: ${userMention(
                            user.discord_id
                          )} has ${bold(
                            '0 Credits'
                          )}. He can't lose what he doesn't have.`
                        );
                      } else {
                        outcomesPrivate.push(
                          `:coin: You have lost ${bold(
                            lost_credit_capped + ' Credits'
                          )} because you don't have an armor.\n`
                        );
                        outcomesFeed.push(
                          `:coin: ${userMention(
                            user.discord_id
                          )} has lost ${bold(
                            lost_credit_capped + ' Credits'
                          )} because he doesn't have an armor.\n`
                        );
                      }
                    }
                  } else if (out.includes('weapon')) {
                    if (user.weapon) {
                      user.weapon = null;
                      user.attack_power = BASE_ATTACK_POWER;
                      outcomesPrivate.push(
                        ':dagger: You have lost your weapon.\n'
                      );
                      outcomesFeed.push(
                        `:dagger: ${userMention(
                          user.discord_id
                        )} has lost his weapon.\n`
                      );
                    } else {
                      const split_text_arr = out.split(' ');
                      const lost_credit =
                        split_text_arr[split_text_arr.length - 3];
                      const lost_credit_capped = Math.min(
                        parseInt(lost_credit),
                        user.gold
                      );
                      user.gold = Math.max(
                        0,
                        user.gold - parseInt(lost_credit)
                      );
                      if (lost_credit_capped === 0) {
                        // prettier-ignore
                        outcomesPrivateZero.push(
                          `:exclamation: You have ${bold('0 Credits')}. You can't lose what you don't have.`
                        );
                        outcomesFeedZero.push(
                          `:exclamation: ${userMention(
                            user.discord_id
                          )} has ${bold(
                            '0 Credits'
                          )}. He can't lose what he doesn't have.`
                        );
                      } else {
                        outcomesPrivate.push(
                          `:coin: You have lost ${bold(
                            lost_credit_capped + ' Credits'
                          )} because you don't have a weapon.\n`
                        );
                        outcomesFeed.push(
                          `:coin: ${userMention(
                            user.discord_id
                          )} has lost ${bold(
                            lost_credit_capped + ' Credits'
                          )} because he doesn't have a weapon.\n`
                        );
                      }
                    }
                  }
                } else if (out.includes('replaced')) {
                  if (out.includes('armor')) {
                    const armor = out
                      .split('replaced by a ')[1]
                      .replaceAll('\n', '')
                      .trim();
                    const armor_name = Object.values(armors).find(
                      (a) => a.name.toUpperCase() === armor.toUpperCase()
                    )?.name;
                    if (!armor_name) {
                      // prettier-ignore
                      throw new Error('Armor couldn\'t find');
                    }
                    user.armor = armor_name;
                    outcomesPrivate.push(
                      `:shield: Your armor has been replaced by a ${bold(
                        armor.toUpperCase()
                      )}.\n`
                    );
                    outcomesFeed.push(
                      `:shield: ${userMention(
                        user.discord_id
                      )}’s armor has been replaced by a ${bold(
                        armor.toUpperCase()
                      )}.\n`
                    );
                  } else if (out.includes('weapon')) {
                    const weapon_str = out
                      .split('replaced by a ')[1]
                      .replaceAll('\n', '')
                      .trim();
                    const weapon = Object.values(weapons).find(
                      (a) => a.name.toUpperCase() === weapon_str.toUpperCase()
                    );
                    if (!weapon) {
                      // prettier-ignore
                      throw new Error('Weapon couldn\'t find');
                    }
                    user.weapon = weapon.name;
                    user.attack_power = BASE_ATTACK_POWER + weapon.attack_power;
                    outcomesPrivate.push(
                      `:dagger: Your weapon has been replaced by a ${bold(
                        weapon_str.toUpperCase()
                      )}.\n`
                    );
                    outcomesFeed.push(
                      `:dagger: ${userMention(
                        user.discord_id
                      )}’s weapon has been replaced by a ${bold(
                        weapon_str.toUpperCase()
                      )}.\n`
                    );
                  }
                } else if (out.includes('eliminated')) {
                  user.health_points = 0;
                  const new_death = new Death({
                    type: 'encounter',
                    discord_id: user.discord_id,
                    date: new Date()
                  });
                  await new_death.save({ session });
                  await Duel.deleteOne(
                    { discord_id: user.discord_id },
                    { session }
                  );
                  outcomesPrivate.push(
                    `:skull: You have been ${bold('ELIMINATED!')}`
                  );
                  outcomesFeed.push(
                    `:skull: ${userMention(user.discord_id)} has been ${bold(
                      'ELIMINATED!'
                    )}\n`
                  );
                } else if (out.includes('earned') && out.includes('credits')) {
                  const earned_credits = out.split(' ')[1];
                  user.gold += parseInt(earned_credits);
                  outcomesPrivate.push(
                    `:coin: You have earned ${bold(
                      earned_credits + ' Credits'
                    )}.\n`
                  );
                  outcomesFeed.push(
                    `:coin: ${userMention(user.discord_id)} has earned ${bold(
                      earned_credits + ' Credits'
                    )}.\n`
                  );
                } else if (out.includes('gained') && out.includes('hp')) {
                  const gained_hp = out.split(' ')[1].trim();
                  const new_hp = Math.min(
                    user.health_points + parseInt(gained_hp),
                    100
                  );
                  const gained_hp_capped = new_hp - user.health_points;
                  user.health_points = new_hp;
                  if (gained_hp_capped > 0) {
                    outcomesPrivate.push(
                      `:sparkling_heart: You have gained ${bold(
                        gained_hp_capped + ' HP'
                      )}.\n`
                    );
                    outcomesFeed.push(
                      `:sparkling_heart: ${userMention(
                        user.discord_id
                      )} has gained ${bold(gained_hp_capped + ' HP')}.\n`
                    );
                  } else {
                    outcomesPrivate.push(
                      `:sparkling_heart: You have gained ${bold(
                        gained_hp + ' HP'
                      )}.\n`
                    );
                    outcomesFeed.push(
                      `:sparkling_heart: ${userMention(
                        user.discord_id
                      )} has gained ${bold(gained_hp + ' HP')}.\n`
                    );
                    // prettier-ignore
                    outcomesPrivateZero.push(
                      `:exclamation: You couldn't gain the ${bold('HP')} because your health is already at ${bold('100')}.`
                    );
                    outcomesFeedZero.push(
                      `:exclamation: ${userMention(
                        user.discord_id
                      )} couldn't gain the ${bold(
                        'HP'
                      )} because his health is already at ${bold('100')}.\n`
                    );
                  }
                } else if (out.includes('regenerated')) {
                  if (out.includes('an ep')) {
                    if (user.energy_points === BASE_ENERGY_POINTS) {
                      // prettier-ignore
                      outcomesPrivateZero.push(
                        `:exclamation: You couldn't gain the ${bold('EP')} because his energy is already at maximum.`
                      );
                      outcomesFeedZero.push(
                        `:exclamation: ${userMention(
                          user.discord_id
                        )} couldn't gain the ${bold(
                          'EP'
                        )} because his energy is already at maximum.\n`
                      );
                    } else {
                      user.energy_points = Math.min(
                        user.energy_points + 1,
                        BASE_ENERGY_POINTS
                      );
                      outcomesPrivate.push(
                        `:battery: You have regenerated ${bold('an EP')}.`
                      );
                      outcomesFeed.push(
                        `:battery: ${userMention(
                          user.discord_id
                        )} has regenerated ${bold('an EP')}.\n`
                      );
                    }
                  } else if (out.includes('two eps')) {
                    if (user.energy_points === BASE_ENERGY_POINTS) {
                      // prettier-ignore
                      outcomesPrivateZero.push(
                        `:exclamation: You couldn't gain the ${bold('EP')} because his energy is already at maximum.`
                      );
                      outcomesFeedZero.push(
                        `:exclamation: ${userMention(
                          user.discord_id
                        )} couldn't gain the ${bold(
                          'EP'
                        )} because his energy is already at maximum.\n`
                      );
                    } else {
                      user.energy_points = Math.min(
                        user.energy_points + 2,
                        BASE_ENERGY_POINTS
                      );
                      outcomesPrivate.push(
                        `:battery: You have regenerated ${bold('two EP')}.`
                      );
                      outcomesFeed.push(
                        `:battery: ${userMention(
                          user.discord_id
                        )} has regenerated ${bold('two EP')}.\n`
                      );
                    }
                  } else if (out.includes('all eps')) {
                    if (user.energy_points === BASE_ENERGY_POINTS) {
                      // prettier-ignore
                      outcomesPrivateZero.push(
                        `:exclamation: You couldn't gain the ${bold('EP')} because his energy is already at maximum.`
                      );
                      outcomesFeedZero.push(
                        `:exclamation: ${userMention(
                          user.discord_id
                        )} couldn't gain the ${bold(
                          'EP'
                        )} because his energy is already at maximum.\n`
                      );
                    } else {
                      user.energy_points = BASE_ENERGY_POINTS;
                      outcomesPrivate.push(
                        `:battery: You have regenerated ${bold('all EP')}.`
                      );
                      outcomesFeed.push(
                        `:battery: ${userMention(
                          user.discord_id
                        )} has regenerated ${bold('all EP')}.\n`
                      );
                    }
                  }
                } else if (out.includes('upgraded')) {
                  if (out.includes('armor')) {
                    const armor_str = out
                      .replace('upgraded your armor to ', '')
                      .replaceAll('\n', '')
                      .trim();
                    const armor = Object.values(armors).find(
                      (a) => a.name.toUpperCase() === armor_str.toUpperCase()
                    );
                    if (!armor) {
                      // prettier-ignore
                      throw new Error('Armor couldn\'t find');
                    }
                    if (user.armor === armor.name) {
                      user.gold += Math.floor(armor.cost / 2);
                      outcomesPrivate.push(
                        `:coin: You have found ${bold(
                          armor.name.toUpperCase()
                        )} and sold it for ${bold(
                          armor.cost / 2 + ' Credits'
                        )}.\n`
                      );
                      outcomesFeed.push(
                        `:coin: ${userMention(
                          user.discord_id
                        )} has found ${bold(
                          armor.name.toUpperCase()
                        )} and sold it for ${bold(
                          armor.cost.toString() + ' Credits'
                        )}.\n`
                      );
                    } else {
                      user.armor = armor.name;
                      outcomesPrivate.push(
                        `:shield: Your armor has been upgraded to ${bold(
                          armor_str.toUpperCase()
                        )}.\n`
                      );
                      outcomesFeed.push(
                        `:shield: ${userMention(
                          user.discord_id
                        )}’s armor has been upgraded to ${bold(
                          armor_str.toUpperCase()
                        )}.\n`
                      );
                    }
                  } else if (out.includes('weapon')) {
                    const weapon_str = out
                      .replace('upgraded your weapon to ', '')
                      .trim()
                      .replaceAll('\n', '');
                    const weapon = Object.values(weapons).find(
                      (a) => a.name.toUpperCase() === weapon_str.toUpperCase()
                    );
                    if (!weapon) {
                      // prettier-ignore
                      throw new Error('Weapon couldn\'t find');
                    }
                    if (user.weapon === weapon.name) {
                      user.gold += Math.floor(weapon.cost / 2);
                      outcomesPrivate.push(
                        `:coin: You have found ${bold(
                          weapon.name.toUpperCase()
                        )} and sold it for ${bold(
                          weapon.cost.toString() + ' Credits'
                        )}.\n`
                      );
                      outcomesFeed.push(
                        `:coin: ${userMention(
                          user.discord_id
                        )} has found ${bold(
                          weapon.name.toUpperCase()
                        )} and sold it for ${bold(
                          weapon.cost.toString() + ' Credits'
                        )}.\n`
                      );
                    } else {
                      user.weapon = weapon.name;
                      user.attack_power =
                        BASE_ATTACK_POWER + weapon.attack_power;
                      outcomesPrivate.push(
                        `:dagger: Your weapon has been upgraded to ${bold(
                          weapon_str.toUpperCase()
                        )}.\n`
                      );
                      outcomesFeed.push(
                        `:dagger: ${userMention(
                          user.discord_id
                        )}’s weapon has been upgraded to ${bold(
                          weapon_str.toUpperCase()
                        )}.\n`
                      );
                    }
                  }
                } else if (out.includes('acquired')) {
                  if (out.includes('armor')) {
                    const armor_str = out
                      .replace('-acquired ', '')
                      .replace('(armor)', '')
                      .replaceAll('\n', '')
                      .trim();
                    const armor = Object.values(armors).find(
                      (a) => a.name.toUpperCase() === armor_str.toUpperCase()
                    );
                    if (!armor) {
                      // prettier-ignore
                      throw new Error('Armor couldn\'t find');
                    }
                    if (user.armor === armor.name) {
                      user.gold += Math.floor(armor.cost / 2);
                      outcomesPrivate.push(
                        `:coin: You have acquired ${bold(
                          armor.name.toUpperCase()
                        )} and sold it for ${bold(
                          armor.cost.toString() + ' Credits'
                        )}.\n`
                      );
                      outcomesFeed.push(
                        `:coin: ${userMention(
                          user.discord_id
                        )} has acquired ${bold(
                          armor.name.toUpperCase()
                        )} and sold it for ${bold(
                          armor.cost.toString() + ' Credits'
                        )}.\n`
                      );
                    } else {
                      user.armor = armor.name;
                      outcomesPrivate.push(
                        `:shield: You have acquired ${bold(
                          armor_str.toUpperCase()
                        )}.\n`
                      );
                      outcomesFeed.push(
                        `:shield: ${userMention(
                          user.discord_id
                        )} has acquired ${bold(armor_str.toUpperCase())}.\n`
                      );
                    }
                  } else if (out.includes('weapon')) {
                    const weapon_str = out
                      .replace('-acquired ', '')
                      .replace('(weapon)', '')
                      .replaceAll('\n', '')
                      .trim();
                    const weapon = Object.values(weapons).find(
                      (a) => a.name.toUpperCase() === weapon_str.toUpperCase()
                    );
                    if (!weapon) {
                      // prettier-ignore
                      throw new Error('Weapon couldn\'t find');
                    }
                    if (user.weapon === weapon.name) {
                      user.gold += Math.floor(weapon.cost / 2);
                      outcomesPrivate.push(
                        `:coin: You have acquired ${bold(
                          weapon.name.toUpperCase()
                        )} and sold it for ${bold(
                          weapon.cost.toString() + ' Credits'
                        )}.\n`
                      );
                      outcomesFeed.push(
                        `:coin: ${userMention(
                          user.discord_id
                        )} has acquired ${bold(
                          weapon.name.toUpperCase()
                        )} and sold it for ${bold(
                          weapon.cost.toString() + ' Credits'
                        )}.\n`
                      );
                    } else {
                      user.weapon = weapon.name;
                      user.attack_power =
                        BASE_ATTACK_POWER + weapon.attack_power;
                      outcomesPrivate.push(
                        `:dagger: You have acquired ${bold(
                          weapon_str.toUpperCase()
                        )}.\n`
                      );
                      outcomesFeed.push(
                        `:dagger: ${userMention(
                          user.discord_id
                        )} has acquired ${bold(weapon_str.toUpperCase())}.\n`
                      );
                    }
                  }
                }
              }
              if (channel) {
                const feedWithoutOutcome = random.feed
                  .slice(0, random.feed.indexOf('Outcome:'))
                  .replaceAll('@xxx', userMention(user.discord_id));
                const outcomesFeedZeroText = outcomesFeedZero
                  ? `\n\n${outcomesFeedZero.join('')}`
                  : '';
                await channel.send(
                  '```ansi\n' +
                    '[2;45m[2;37m[2;37m[2;40m-RANDOM ENCOUNTER-[0m[2;37m[2;45m[0m[2;37m[2;45m[2;31m[0m[2;37m[2;45m[0m[2;45m[0m\n' +
                    '```' +
                    '\n' +
                    `:speech_balloon: ${feedWithoutOutcome}\n${bold(
                      'Result:'
                    )}\n${outcomesFeed.join(
                      ''
                    )}${outcomesFeedZeroText}\n${LINE_SEPARATOR}`
                      .replaceAll('\n\n', '\n')
                      .replace(LINE_SEPARATOR, `\n${LINE_SEPARATOR}`)
                      .replaceAll('\n\n\n', '\n')
                );
              }
              const outcomesPrivateText = outcomesPrivate
                ? `\n\n${outcomesPrivate.join('')}`
                : '';
              const outcomesPrivateZeroText = outcomesPrivateZero
                ? `\n\n${outcomesPrivateZero.join('')}`
                : '';
              await i.update({
                embeds: [
                  new EmbedBuilder().setDescription(
                    `:speech_balloon: ${italic(
                      random.scenario
                    )}\n\n<:bits:1138765781065285662>${
                      random.bits
                    }${outcomesPrivateText}${outcomesPrivateZeroText}`
                  )
                ],
                ephemeral: true
              });
              await user.save({ session });
            });
          } else {
            isThereOtherPlayer = await Duel.findOneAndUpdate(
              {
                discord_id: { $ne: i.user.id },
                is_duel_in_progress: false
              },
              { is_duel_in_progress: true }
            )
              .sort({ doc_created_at: 1 })
              .lean();
            if (
              (random_number >= 45 && random_number <= 49) ||
              !isThereOtherPlayer
            ) {
              if (random_number >= 50) {
                random_number = Math.floor(Math.random() * 5 + 45);
                random = randoms[random_number];
              }
              if (channel) {
                const feedWithoutOutcome = random.feed.replaceAll(
                  '@xxx',
                  userMention(user.discord_id)
                );
                await Promise.all([
                  channel.send(
                    '```ansi\n' +
                      '[2;45m[2;37m[2;37m[2;40m-RANDOM ENCOUNTER-[0m[2;37m[2;45m[0m[2;37m[2;45m[2;31m[0m[2;37m[2;45m[0m[2;45m[0m\n' +
                      '```' +
                      '\n' +
                      `:speech_balloon: ${feedWithoutOutcome}\n\n${bold(
                        'Result:'
                      )}\n${random.outcome}\n${LINE_SEPARATOR}`
                  ),
                  i.update({
                    embeds: [
                      new EmbedBuilder().setDescription(
                        `:speech_balloon: ${italic(
                          random.scenario
                        )}\n\n<:bits:1138765781065285662>${
                          random.bits
                        }\n\n${bold('Result:')}\n${random.outcome}`
                      )
                    ],
                    ephemeral: true
                  })
                ]);
              } else {
                await i.update({
                  embeds: [
                    new EmbedBuilder().setDescription(
                      `:speech_balloon: ${italic(
                        random.scenario
                      )}\n\n<:bits:1138765781065285662>${random.bits}\n\n${bold(
                        'Result:'
                      )}${random.outcome}
                      )}`
                    )
                  ],
                  ephemeral: true
                });
              }
            } else if (random_number >= 50) {
              console.log('Battle encounter');
              if (channel) {
                const feedWithMention = random.feed.replaceAll(
                  '@xxx',
                  userMention(user.discord_id)
                );
                await Promise.all([
                  channel.send(
                    '```ansi\n' +
                      '[2;45m[2;37m[2;37m[2;40m-RANDOM ENCOUNTER-[0m[2;37m[2;45m[0m[2;37m[2;45m[2;31m[0m[2;37m[2;45m[0m[2;45m[0m\n' +
                      '```' +
                      '\n' +
                      `:speech_balloon: ${feedWithMention}\n${LINE_SEPARATOR}`
                  ),
                  i.update({
                    embeds: [
                      new EmbedBuilder().setDescription(
                        `:speech_balloon: ${italic(random.scenario)}\n\n`
                      )
                    ],
                    ephemeral: true
                  })
                ]);
              } else {
                await i.update({
                  embeds: [
                    new EmbedBuilder().setDescription(
                      `:speech_balloon: ${italic(random.scenario)}\n\n`
                    )
                  ],
                  ephemeral: true
                });
              }
              await startDuel(
                session,
                user,
                i,
                embed,
                row,
                true,
                isThereOtherPlayer
              );
            }
            await user.save({ session });
          }
        } catch (error) {
          console.error('Transaction aborted:', error);
        } finally {
          if (isThereOtherPlayer) {
            await Duel.findOneAndUpdate(
              { discord_id: isThereOtherPlayer.discord_id },
              { is_duel_in_progress: false },
              { upsert: false }
            );
          }
          await session.endSession();
        }
      } else {
        const session = await mongoose.startSession();
        try {
          await session.withTransaction(async () => {
            // TODO: Other users should not see other users' bot responses. Check this later.
            // Note: Probably we don't need this but I keep it here just in case.
            if (i.user.id !== interaction.user.id) {
              await i.reply({
                content: 'You are not allowed to use this button!',
                ephemeral: true
              });
              throw new Error('User is not allowed to use this button!');
            }
            const user = await User.findOne({
              discord_id: i.user.id,
              health_points: { $gt: 0 }
            }).session(session);
            if (!user) {
              await i.update({
                content: 'You have died. You cannot play anymore.',
                embeds: [],
                components: [],
                ephemeral: true
              });
              throw new Error('User is dead.');
            }
            if (i.customId === 'status') {
              try {
                embed = await createEmbed(user);
                await i.update({
                  embeds: [embed],
                  components: [row],
                  ephemeral: true
                });
              } catch (err) {
                console.error(err);
                embed = await createEmbed(user);
                await i.update({
                  embeds: [embed],
                  components: [row],
                  ephemeral: true
                });
              }
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
                    createShopEmbed(user),
                    createNotificationEmbed(
                      'Ooops!',
                      'You do not have enough Credits to buy a repair kit!'
                    )
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
                    createShopEmbed(user),
                    createNotificationEmbed(
                      'Success!',
                      'You have bought and used a repair kit!'
                    )
                  ],
                  components: [extraRows.shop],
                  ephemeral: true
                });
              }
            } else if (i.customId === 'buying') {
              createExtraRows(extraRows, 'buying', user);
              await i.update({
                embeds: [createShopEmbed(user)],
                components: [extraRows.buying],
                ephemeral: true
              });
            } else if (i.customId === 'buy_weapon') {
              if (user.weapon) {
                await i.update({
                  embeds: [
                    createShopEmbed(user),
                    createNotificationEmbed(
                      'Ooops!',
                      'You already have a weapon. Sell it first to buy another one!'
                    )
                  ],
                  components: [extraRows.shop],
                  ephemeral: true
                });
              } else {
                createExtraRows(extraRows, 'buy_weapon', user);
                await i.update({
                  embeds: [createShopEmbed(user)],
                  components: [extraRows.buy_weapon],
                  ephemeral: true
                });
              }
            } else if (i.customId === 'sell_weapon_confirm') {
              if (!user.weapon) {
                await i.update({
                  embeds: [
                    createShopEmbed(user),
                    createNotificationEmbed(
                      'Ooops!',
                      'You do not have a weapon to sell!'
                    )
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
              user.attack_power = BASE_ATTACK_POWER;
              await user.save({ session });
              await i.update({
                embeds: [
                  createShopEmbed(user),
                  createNotificationEmbed(
                    'Success!',
                    'You have sold your weapon for half of its price!'
                  )
                ],
                components: [extraRows.shop],
                ephemeral: true
              });
            } else if (i.customId === 'sell_weapon_cancel') {
              await i.update({
                embeds: [createShopEmbed(user)],
                components: [extraRows.shop],
                ephemeral: true
              });
            } else if (i.customId === 'sell_weapon') {
              if (!user.weapon) {
                await i.update({
                  embeds: [
                    createShopEmbed(user),
                    createNotificationEmbed(
                      'Ooops!',
                      'You do not have a weapon to sell!'
                    )
                  ],
                  components: [extraRows.shop],
                  ephemeral: true
                });
                return;
              }
              createExtraRows(extraRows, 'weapon_confirm', user);
              await i.update({
                embeds: [createConfirmEmbed(user, 'weapon')],
                components: [extraRows.weapon_confirm],
                ephemeral: true
              });
            } else if (i.customId === 'buy_armor') {
              if (user.armor) {
                await i.update({
                  embeds: [
                    createShopEmbed(user),
                    createNotificationEmbed(
                      'Ooops!',
                      'You already have an armor. Sell it first to buy another one!'
                    )
                  ],
                  components: [extraRows.shop],
                  ephemeral: true
                });
              } else {
                createExtraRows(extraRows, 'buy_armor', user);
                await i.update({
                  embeds: [createShopEmbed(user)],
                  components: [extraRows.buy_armor],
                  ephemeral: true
                });
              }
            } else if (i.customId === 'sell_armor_confirm') {
              if (!user.armor) {
                await i.update({
                  embeds: [
                    createShopEmbed(user),
                    createNotificationEmbed(
                      'Ooops!',
                      'You do not have an armor to sell!'
                    )
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
                  createShopEmbed(user),
                  createNotificationEmbed(
                    'Success!',
                    'You have sold your armor for half of its price!'
                  )
                ],
                components: [extraRows.shop],
                ephemeral: true
              });
            } else if (i.customId === 'sell_armor_cancel') {
              await i.update({
                embeds: [createShopEmbed(user)],
                components: [extraRows.shop],
                ephemeral: true
              });
            } else if (i.customId === 'sell_armor') {
              if (!user.armor) {
                await i.update({
                  embeds: [
                    createShopEmbed(user),
                    createNotificationEmbed(
                      'Ooops!',
                      'You do not have an armor to sell!'
                    )
                  ],
                  components: [extraRows.shop],
                  ephemeral: true
                });
                return;
              }
              createExtraRows(extraRows, 'armor_confirm', user);
              await i.update({
                embeds: [createConfirmEmbed(user, 'armor')],
                components: [extraRows.armor_confirm],
                ephemeral: true
              });
            }
          });
        } catch (error) {
          // await session.abortTransaction();
          console.error('Transaction aborted:', error);
        } finally {
          await session.endSession();
        }
      }
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = play;
