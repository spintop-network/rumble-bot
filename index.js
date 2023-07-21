// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require('discord.js');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { client } = require('./client.js');
const User = require('./models/user');
const { ethers } = require('ethers');
const { pilotRoleId } = require('./constants');

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
  } else if (interaction.isModalSubmit()) {
    if (interaction.customId === 'registerModal') {
      const session = await mongoose.startSession();
      try {
        await session.startTransaction();
        if (!interaction.member.roles.cache.has(pilotRoleId)) {
          const pilotRole = interaction.guild.roles.cache.get(pilotRoleId);
          interaction.member.roles.add(pilotRole).catch(console.error);
        }
        let user = await User.findOne({ discord_id: interaction.user.id });
        if (user) {
          await interaction.reply({
            content: 'You are already registered!',
            ephemeral: true
          });
          return;
        }
        const wallet_id = interaction.fields.getTextInputValue('walletInput');
        if (!wallet_id) {
          await interaction.reply({
            content: 'Please provide your wallet ID!',
            ephemeral: true
          });
          return;
        }
        if (!ethers.utils.isAddress(wallet_id)) {
          await interaction.reply({
            content: 'Please provide a valid wallet ID!',
            ephemeral: true
          });
          return;
        }
        user = await User.findOne({ wallet_id });
        if (user) {
          await interaction.reply({
            content: 'This wallet ID is already registered!',
            ephemeral: true
          });
          return;
        }
        const newUser = new User({
          discord_id: interaction.user.id,
          wallet_id,
          health_points: 100,
          attack_power: 2,
          energy_points: 3,
          gold: 100,
          health_potion_cost: 50,
          weapon: null,
          armor: null
        });
        await newUser.save();
        await interaction.reply({
          content:
            'You have been registered! You can use /play command to play the game after it started.',
          ephemeral: true
        });
        // client.channels.cache.get('1125716788370485308').send('This is a message for private DMs.');
      } catch (error) {
        console.error(error);
        await session.abortTransaction();
      } finally {
        await session.endSession();
      }
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === 'registerButton') {
      const modal = new ModalBuilder()
        .setCustomId('registerModal')
        .setTitle('Register');

      // Create the text input components
      const bscWalletInput = new TextInputBuilder()
        .setCustomId('walletInput')
        // The label is the prompt the user sees for this input
        .setLabel('What is your BSC wallet address?')
        .setPlaceholder('0x...')
        // Short means only a single line of text
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      // An action row only holds one text input,
      // so you need one action row per text input.
      const firstActionRow = new ActionRowBuilder().addComponents(
        bscWalletInput
      );

      // Add inputs to the modal
      modal.addComponents(firstActionRow);

      // Show the modal to the user
      await interaction.showModal(modal);
    }
  }
});
