// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Events, EmbedBuilder, userMention } = require('discord.js');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { client } = require('./client.js');
const User = require('./models/user');
const Notification = require('./models/notification');
const { rooms, roles } = require('./constants');

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
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const user = await User.findOne({
            discord_id: interaction.user.id
          }).session(session);
          if (user) {
            await interaction.reply({
              content: 'You are already registered!',
              ephemeral: true
            });
            return;
          }
          const newUser = new User({
            discord_id: interaction.user.id,
            health_points: 100,
            attack_power: 2,
            energy_points: 3,
            gold: 100,
            health_potion_cost: 50,
            weapon: null,
            armor: null
          });
          await newUser.save({ session });
          if (process.env.NODE_ENV === 'production') {
            if (
              !interaction.member.roles.cache.has(roles.pilot) ||
              !interaction.member.roles.cache.has(roles.normie)
            ) {
              const rolesArray = [
                ...Array.from(interaction.member.roles.cache.keys()),
                roles.pilot,
                roles.normie
              ];
              const uniqueRolesArray = [...new Set(rolesArray)];
              await interaction.member.roles.set(uniqueRolesArray);
            }
          }
          await interaction.reply({
            content:
              // prettier-ignore
              'Congratulations, pilot; you have been registered successfully! To learn everything about Spintop\'s Cobot Rumble, check out the Pilot\'s Handbook:\n' +
              'https://discord.com/channels/893489228502167615/1131860456097714218',
            ephemeral: true
          });
        });
      } catch (error) {
        console.error(error);
      } finally {
        await session.endSession();
      }
    }
  }
});

setInterval(async () => {
  if (mongoose.connection.readyState !== 1) return;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const sudden_deaths = await Notification.find({ type: 'sudden_death' })
        .session(session)
        .limit(20)
        .lean();

      const inactivity_deaths = await Notification.find({
        type: 'inactivity_death'
      })
        .session(session)
        .limit(20)
        .lean();

      try {
        const channel =
          (await client.channels.cache.get(rooms.feed)) ||
          (await client.channels.fetch(rooms.feed));
        if (channel) {
          if (sudden_deaths.length) {
            const suddenDeathEmbed = new EmbedBuilder()
              .setTitle('Sudden Deaths')
              .setDescription(
                `Some players have suddenly died!\n\n${sudden_deaths.map(
                  (i) => `${userMention(i.discord_id)}\n`
                )}`
              );
            await channel.send({ embeds: [suddenDeathEmbed] });
          }
          if (inactivity_deaths.length) {
            const inactivityDeathEmbed = new EmbedBuilder()
              .setTitle('Inactivity Deaths')
              .setDescription(
                `Some players have died because of inactivity!\n\n${inactivity_deaths.map(
                  (i) => `${userMention(i.discord_id)}\n`
                )}`
              );
            await channel.send({ embeds: [inactivityDeathEmbed] });
          }
          if (sudden_deaths.length || inactivity_deaths.length) {
            await Notification.deleteMany(
              {
                discord_id: {
                  $in: [
                    ...sudden_deaths.map((i) => i.discord_id),
                    ...inactivity_deaths.map((i) => i.discord_id)
                  ]
                }
              },
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
}, 10000);
