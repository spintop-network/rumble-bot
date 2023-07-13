const { SlashCommandBuilder } = require('discord.js');
const { ethers } = require('ethers');

const User = require('../models/user.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register using this command to play!')
    .addStringOption((option) =>
      option
        .setName('wallet_id')
        .setDescription('Your BSC wallet address')
        .setRequired(true)
    ),
  async execute(interaction) {
    // TODO: Check if user is already registered (Use transaction or atomic operation)
    console.log(interaction.user);
    let user = await User.findOne({ discord_id: interaction.user.id });
    if (user) {
      await interaction.reply({
        content: 'You are already registered!',
        ephemeral: true
      });
      return;
    }
    const wallet_id = interaction.options.getString('wallet_id');
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
  }
};
