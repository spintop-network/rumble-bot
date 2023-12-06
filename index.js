// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Events, EmbedBuilder, userMention, bold } = require('discord.js');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { client } = require('./client.js');
const Notification = require('./models/notification');
const User = require('./models/user');
const Duel = require('./models/duel');
const Config = require('./models/config');
const register = require('./buttons/register');
const play = require('./buttons/play');
const leaderboard = require('./buttons/leaderboard');
const { rooms } = require('./constants');

dotenv.config();
mongoose.connect(process.env.MONGODB_URI);
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while executing this command!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true
        });
      }
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === 'registerButton') {
      await register(interaction);
    } else if (interaction.customId === 'playButton') {
      await play(interaction);
    } else if (interaction.customId === 'leaderboardButton') {
      await leaderboard(interaction);
    }
  }
});

const sendMessageAndPin = async (channel, message) => {
  const sentMessage = await channel.send(message);
  await sentMessage.pin();
  return sentMessage;
};

setInterval(async () => {
  if (mongoose.connection.readyState !== 1) return;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const [
        sudden_deaths,
        inactivity_deaths,
        inactivity_health,
        sudden_health
      ] = await Promise.all([
        Notification.find({ type: 'sudden_death' })
          .session(session)
          .limit(20)
          .lean(),
        Notification.find({
          type: 'inactivity_death'
        })
          .session(session)
          .limit(20)
          .lean(),
        Notification.find({
          type: 'inactivity_health'
        })
          .session(session)
          .limit(20)
          .lean(),
        Notification.find({
          type: 'sudden_health'
        })
          .session(session)
          .limit(20)
          .lean()
      ]);

      const inactivity_health_reduced = inactivity_health.filter(
        (i) =>
          !sudden_deaths.some((j) => j.discord_id === i.discord_id) &&
          !inactivity_deaths.some((j) => j.discord_id === i.discord_id)
      );
      const sudden_health_reduced = sudden_health.filter(
        (i) =>
          !sudden_deaths.some((j) => j.discord_id === i.discord_id) &&
          !inactivity_deaths.some((j) => j.discord_id === i.discord_id)
      );

      const embeds = [
        {
          title: ':rotating_light: Overload Protocol :rotating_light:',
          description: `These players have suddenly died:\n\n${sudden_deaths
            .map((i) => `${userMention(i.discord_id)}\n`)
            .join('')}`,
          array: sudden_deaths,
          array_reduced: sudden_deaths
        },
        {
          title: ':skull: Inactivity Deaths :skull:',
          description: `These players have died since they were inactive:\n\n${inactivity_deaths
            .map((i) => `${userMention(i.discord_id)}\n`)
            .join('')}`,
          array: inactivity_deaths,
          array_reduced: inactivity_deaths
        },
        {
          title: '',
          description: `:mending_heart: These players have lost ${bold(
            '5 HP'
          )} since they were inactive:\n\n${inactivity_health_reduced
            .map((i) => `${userMention(i.discord_id)}\n`)
            .join('')}`,
          array: inactivity_health,
          array_reduced: inactivity_health_reduced
        },
        {
          title: '',
          description: `:mending_heart: These players have lost ${bold(
            '5 HP'
          )} since overload protocol is active:\n\n${sudden_health_reduced
            .map((i) => `${userMention(i.discord_id)}\n`)
            .join('')}`,
          array: sudden_health,
          array_reduced: sudden_health_reduced
        }
      ];

      try {
        const channel =
          (await client.channels.cache.get(rooms.feed)) ||
          (await client.channels.fetch(rooms.feed));
        if (channel) {
          // Winner message

          const alive_count = await User.countDocuments({
            health_points: { $gt: 0 }
          }).session(session);

          if (alive_count <= 1) {
            const config = await Config.findOne({ id: 0 }).session(session);
            const winner = (
              await User.aggregate(
                [
                  {
                    $match: {
                      health_points: { $gt: 0 }
                    }
                  },
                  {
                    $lookup: {
                      from: 'stats',
                      localField: 'discord_id',
                      foreignField: 'discord_id',
                      as: 'stats'
                    }
                  },
                  {
                    $set: {
                      stats: {
                        $first: '$stats'
                      }
                    }
                  }
                ],
                { session }
              )
            )?.at(0);
            const is_game_started = config?.game_start_date
              ? new Date() >= config?.game_start_date
              : false;
            if (is_game_started && !config?.is_game_over) {
              let deadUsers = await User.aggregate([
                {
                  $lookup: {
                    from: 'stats',
                    localField: 'discord_id',
                    foreignField: 'discord_id',
                    as: 'stats'
                  }
                },
                {
                  $lookup: {
                    from: 'deaths',
                    localField: 'discord_id',
                    foreignField: 'discord_id',
                    as: 'deaths'
                  }
                },
                {
                  $set: {
                    deaths: {
                      $first: '$deaths'
                    }
                  }
                },
                {
                  $match: {
                    deaths: {
                      $exists: true
                    }
                  }
                },
                {
                  $set: {
                    stats: {
                      $first: '$stats'
                    }
                  }
                },
                {
                  $sort: {
                    'deaths.doc_created_at': -1,
                    health_points: -1,
                    'stats.kills': -1,
                    'stats.inflicted_damage': -1
                  }
                },
                {
                  $limit: 20
                }
              ]);
              // Update the health points of the dead users to 0 for display purposes
              deadUsers = deadUsers.map((i) => ({ ...i, health_points: 0 }));
              const prizes = [
                '$150 + Spinner NFT',
                '$100 + Spinner NFT',
                '$50 + Spinner NFT',
                '$30 + Spinner NFT',
                '$20 + Spinner NFT',
                '$15 + Spinner NFT',
                '$15 + Spinner NFT',
                '$15 + Spinner NFT',
                '$15 + Spinner NFT',
                '$15 + Spinner NFT',
                '$10 + Tier 1 Weapon NFT',
                '$10 + Tier 1 Weapon NFT',
                '$10 + Tier 1 Weapon NFT',
                '$10 + Tier 1 Weapon NFT',
                '$10 + Tier 1 Weapon NFT',
                '$5 + Tier 1 Weapon NFT',
                '$5 + Tier 1 Weapon NFT',
                '$5 + Tier 1 Weapon NFT',
                '$5 + Tier 1 Weapon NFT',
                '$5 + Tier 1 Weapon NFT'
              ];
              const embedBuilder = new EmbedBuilder()
                .setTitle(':tada: We have a winner! :tada:')
                .setDescription(
                  `${userMention(
                    winner ? winner.discord_id : deadUsers[0].discord_id
                  )} has won the game! \n\n` +
                    bold(
                      'Pilot Name | Health Points | Kill Count | Damage Inflicted | Prize\n\n'
                    ) +
                    (winner ? [winner, ...deadUsers] : deadUsers)
                      .slice(0, 20)
                      .map(
                        (user, index) =>
                          `${index + 1}. ${userMention(user.discord_id)} | ${
                            user.health_points
                          } | ${user.stats?.kills ?? 0} | ${
                            user.stats?.inflicted_damage ?? 0
                          } | ${bold(prizes[index])}`
                      )
                      .join('\n')
                );
              await sendMessageAndPin(channel, { embeds: [embedBuilder] });
              config.is_game_over = true;
              await config.save({ session });
            }
          }

          for await (const embed of embeds) {
            if (embed.array_reduced.length) {
              if (embed.title) {
                const embedBuilder = new EmbedBuilder()
                  .setTitle(embed.title)
                  .setDescription(embed.description);
                await channel.send({ embeds: [embedBuilder] });
              } else {
                const embedBuilder = new EmbedBuilder().setDescription(
                  embed.description
                );
                await channel.send({ embeds: [embedBuilder] });
              }
            }
          }
          const arraysCombined = embeds.reduce((acc, cur) => {
            acc.push(...cur.array);
            return acc;
          }, []);
          if (arraysCombined.length) {
            await Notification.deleteMany(
              { discord_id: { $in: arraysCombined.map((i) => i.discord_id) } },
              { session }
            );
          }
        }
      } catch (error) {
        console.error(error);
      }
    });
  } catch (error) {
    // await session.abortTransaction();
    console.error('Transaction aborted:', error);
  } finally {
    await session.endSession();
  }
}, 5000);

setInterval(async () => {
  if (mongoose.connection.readyState !== 1) return;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Duel.updateMany(
        {
          is_duel_in_progress: true,
          doc_updated_at: { $lt: new Date(Date.now() - 1000 * 60) }
        },
        { is_duel_in_progress: false },
        { session }
      );
    });
  } catch (error) {
    console.error('Transaction aborted:', error);
  } finally {
    await session.endSession();
  }
}, 10000);

setInterval(async () => {
  if (mongoose.connection.readyState !== 1) return;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const config = await Config.findOne({ id: 0 }).session(session);
      const channel =
        (await client.channels.cache.get(rooms.game)) ||
        (await client.channels.fetch(rooms.game));
      if (!channel) return;
      let next_ep_regen_date = new Date(config?.game_start_date);
      // TODO: Add another variable to config for the EP regen interval
      next_ep_regen_date.setHours(next_ep_regen_date.getHours() - 1);
      while (next_ep_regen_date < Date.now()) {
        const new_date = new Date(next_ep_regen_date);
        new_date.setTime(new_date.getTime() + 4 * 60 * 60 * 1000);
        next_ep_regen_date = new_date;
      }
      const messageContent = `Next EP regen <t:${Math.floor(
        next_ep_regen_date.getTime() / 1000
      )}:R>`;
      const messages = await channel.messages.fetchPinned();
      const epRegenMessages = messages.filter((i) =>
        i.content.startsWith('Next EP regen')
      );
      // TODO: Test this code block.
      if (config?.is_game_over) {
        for await (const message of epRegenMessages.values()) {
          await message.delete();
        }
        return;
      }
      if (epRegenMessages.size > 1) {
        for await (const message of epRegenMessages.values()) {
          await message.delete();
        }
        await sendMessageAndPin(channel, messageContent);
      } else if (epRegenMessages.size === 1) {
        const message = epRegenMessages.first();
        const timestampSecond = message.content
          .slice(message.content.indexOf('<t:'), messageContent.indexOf(':R>'))
          .replace('<t:', '');
        if (
          Math.floor(next_ep_regen_date.getTime() / 1000) >
          parseInt(timestampSecond)
        ) {
          await message.edit(messageContent);
        }
      } else {
        const isGameStarted = config.game_start_date
          ? new Date() >= config.game_start_date
          : false;
        if (isGameStarted) {
          await sendMessageAndPin(channel, messageContent);
        }
      }
    });
  } catch (error) {
    console.error('Transaction aborted:', error);
  } finally {
    await session.endSession();
  }
}, 10000);
