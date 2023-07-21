// Require the necessary discord.js classes
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');
const { token, clientId } = require('./config.json');
const { rooms } = require('./constants.js');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  const registerEmbed = new EmbedBuilder()
    .setTitle('REGISTER')
    .setDescription('Register text placeholder');

  const register = new ButtonBuilder()
    .setCustomId('registerButton')
    .setLabel('Register')
    .setEmoji('✍️')
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(register);

  try {
    const channel =
      (await client.channels.cache.get(rooms.register)) ||
      (await client.channels.fetch(rooms.register));
    if (channel) {
      const messages = await channel.messages.fetch({ limit: 100 });
      if (!messages.find((i) => i.author.id === clientId && i.pinned)) {
        channel.send({ embeds: [registerEmbed], components: [row] });
      }
    }
  } catch (error) {
    console.error(error);
  }
});

// Log in to Discord with your client's token
client.login(token);

client.commands = new Collection();

module.exports = { client };
