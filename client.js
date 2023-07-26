// Require the necessary discord.js classes
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  bold,
  italic
} = require('discord.js');
const { token, clientId } = require('./config.json');
const { rooms } = require('./constants.js');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  // prettier-ignore
  const registerEmbed = new EmbedBuilder()
    .setTitle('Registration for Spintop\'s Cobot Rumble')
    .setDescription(
      'Hello, pilots. It’s me, BITS. Long time no see. \n' +
        '\n' +
        'Welcome to Spintop’s Cobot Rumble! If I am correct, you want to prove yourself as a capable pilot and win the big prize. That’s fine, but let me remind you this; this is no place for fragile people. You will destroy or be destroyed; there’s nothing in between.\n' +
        '\n' +
        'When you register to be a pilot by pressing the “Register” button, you’ll be enrolled in the roster and will enter your BSC wallet address. Your rewards will be sent to this wallet address, so giving an actual and working BSC wallet address is essential. After filling in your BSC wallet address info, you are officially ready to kickstart your journey as a Cobot pilot! You will be ready, but the event starts on the 9th of August, Monday, so you’ll have to wait a little while. Registrations will conclude on the 9th of August, which means no one can register after the 9th of August. After completing your registration process by pressing the “Register” button, and filling in your BSC wallet address, visit #pilots-handbook channel to learn more about Spintop’s Cobot Rumble!\n' +
        '\n' +
        'Oh, and a little reminder; if you manage to be the one in the last 20 pilots, here are the rewards you will get:\n' +
        '\n' +
        ':large_orange_diamond: 1st: $1500\n' +
        ':large_orange_diamond: 2nd: $1000\n' +
        ':large_orange_diamond: 3rd: $800\n' +
        ':large_orange_diamond: 4th to 6th: $500\n' +
        ':large_orange_diamond: 7th to 10th: $150\n' +
        ':large_orange_diamond: 11th to 15th: $100\n' +
        ':large_orange_diamond: 16th to 20th: $20\n'
    );

  // prettier-ignore
  const registerEmbed2 = new EmbedBuilder()
    .setTitle('Registration for Spintop\'s Cobot Rumble')
    .setDescription('Are you here for Cobot Rumble? Click the link and go to registration channel!' + '\n\n' + 'https://discord.com/channels/893489228502167615/1131127969734213652');

  const rulesEmbed = new EmbedBuilder().setDescription(
    'Hello, pilots!\n' +
      '\n' +
      'Let me give you some idea about what will happen next. You are now an official pilot, ready to get your hands dirty. You got your Cobot, your gigantic cooperative war machine robot, and you’ll face other Cobot pilots with it. However, the event occurs on Spintop’s Discord channel, and you don’t actually own a Cobot. Still, thanks to the artificial dimension I’ve created, I can picture everything for you and tell you what is happening in the artificial dimension where Cobot’s Steam Arena (sponsored by BITS Artificial Services) is located. You take action on Discord by pressing some buttons, and I’ll let you know the reflection of your actions within the artificial dimension I’ve created. As you understand, you need me desperately to navigate. I’ll provide the information to you without twisting it. You can position me as your bridge between Discord and the artificial dimension, so listening to every word I say to know what’s happening in Spintop’s Cobot Rumble is crucial. Do you understand? Is it too complicated for you to understand? I don’t care, and I am moving on.\n' +
      '\n' +
      'The idea of Spintop’s Cobot Rumble is simple, even for you; destroy every opponent you face. You can use different types of weapons and armor to bring your opponents to their knees, and these equipable items can be bought from the Armory if you have enough Credits. Credits are only usable in artificial dimension and can be earned by defeating opponents only. Or, if you are lucky, you might find some in Random Encounters. Oh, yes, Random Encounters. Between shopping for weapons and armor from Armory and battling against other Cobot pilots, you have a third option which I call Random Encounters. If you want to experience a Random Encounter, you will press the button written “Random Encounters” on it, just as you will do with Armory and Battle buttons. But let me remind you, Random Encounters are really random. Its outcome can be disastrous or miraculous for you and your Cobot. So tread accordingly.\n' +
      '\n' +
      '“But BITS, everything sounds suspiciously awesome. Isn’t there a catch?” There is, of course. In the artificial dimension I’ve created, each action you take will cost an Energy Point (EP), and you have 3 of them. You have to wait 8 hours for an Energy Point to regenerate. I had to implement this energy system because otherwise, there would be vast amounts of glitches all over the artificial dimension, and to be honest; I don’t want to ruin what I’ve created just to be able to entertain you. Deal with it, and use your Energy Points wisely.\n'
  );

  const rulesEmbed2 = new EmbedBuilder()
    .setTitle('' + 'Rules, Numbers, and Terminology:')
    .setDescription(
      'Now, let me sum up everything, and explain some rules, numbers, and terminology as basic as possible:\n' +
        '\n' +
        bold(':diamond_shape_with_a_dot_inside: HP:') +
        ' Health point. You start with 100 HP, but if it reaches 0, you’re (your Cobot, to be more precise) gone.\n' +
        '\n' +
        bold(':diamond_shape_with_a_dot_inside: EP:') +
        ' Energy point. Your actions depend on the energy points you have. In total, you have 3 energy points. Unlike visiting the Armory, Battle and Random Encounters cost you an EP each. An EP regenerates every 8 hours. If you have 3/3 EP and not taking any action, such as Battle or Random Encounters, you’ll lose 10 HP for every inactive 8-hour cycle. \n' +
        '\n' +
        bold(':diamond_shape_with_a_dot_inside: AP:') +
        ' Attack power. Your attack power is 2 as default; however, you can increase this by buying or earning weapons.\n' +
        '\n' +
        bold(':diamond_shape_with_a_dot_inside: DM:') +
        ' Damage migration. Your damage migration is 0 as default; however, you can increase this by buying or earning armor.\n' +
        '\n' +
        bold(':diamond_shape_with_a_dot_inside: Credit:') +
        ' The currency for you to buy weapons and armor from the Armory. Also, you need Credit to use Repair Kit.\n' +
        '\n' +
        bold(':diamond_shape_with_a_dot_inside: Repair Kit:') +
        ' These are items to repair your Cobot and increase its HP by 33. You need Credit to use Repair Kit and the Credit cost gets doubled with each kit usage.\n' +
        '\n' +
        // prettier-ignore
        bold(':diamond_shape_with_a_dot_inside: Armory:') +
        ' A pilot’s happy place. You can buy or sell weapons and armor from here. You pay the full price when you buy a weapon or armor, but you only get half of it back when you sell one. Oof.\n\n' +
        bold('\t:diamond_shape_with_a_dot_inside: Weapons:') +
        ' Your Cobot’s main damage amplifier. In total, there are 10 different types of weapons. Each weapon has different APs, and their cost also differs. The higher Credit cost for a weapon means higher AP. Each pilot can only equip one weapon at a time.\n\n' +
        bold(':diamond_shape_with_a_dot_inside: Armor:') +
        ' Your Cobot’s main damage reducer. In total, there are 5 different types of armor. Each armor has a different DM. The higher Credit cost for armor means higher DM. Each pilot can only equip one armor at a time.\n' +
        '\n' +
        bold(':diamond_shape_with_a_dot_inside: Battle:') +
        ' Your most convenient way to eliminate other pilots is by facing them on a fierce one-on-one Cobot battle. When you press the “Battle” button, you enter a battling queue to face a pilot. If there’s another pilot on the queue with you, you’re instantly matched, and the battle commences. Your victory is not guaranteed; it is based on your luck and the quality of your weapon and/or armor. If you beat the opponent pilot by inflicting damage, you get half his Credit. If you cause his HP to reach 0 or below, you get all of his Credit and half of his weapon’s and/or armor’s worth in Credit. If you want to know more about the calculations behind the battle system:\n' +
        ' \n' +
        italic(
          'Roll1(0-100) * AP1 > Roll2(0-100) * AP2  , Pilot1 wins the battle and Pilot2 loses:'
        ) +
        '\n' +
        italic(
          'Base attack + (Roll1(0-100) * AP1 - Roll2(0-100) * AP2) * 10 * (1 - DM2)  HP'
        ) +
        '\n' +
        '\n'
    );

  const rulesEmbed3 = new EmbedBuilder().setDescription(
    bold(':diamond_shape_with_a_dot_inside: Random Encounters:') +
      ' The alternative sets of scenarios that happen in the artificial dimension and affect your piloting journey on Discord, good or bad. In total, there are 55 different scenarios that you can encounter, and it’s impossible to know the outcome before it actually happens. Before facing a random encounter, you roll dice from 0 to 100; 0 being the worst and 100 being the best. \n' +
      '\n' +
      bold('The possible outcomes from various scenarios are:') +
      '\n\n' +
      ':large_blue_diamond: Win X amount of Credit\n' +
      ':large_blue_diamond: Lose X amount of Credit\n' +
      ':large_blue_diamond: Regenerate X amount of EP\n' +
      ':large_blue_diamond: Regenerate all EP\n' +
      ':large_blue_diamond: Lose X amount of EP\n' +
      ':large_blue_diamond: Lose all EP\n' +
      ':large_blue_diamond: Win X armor\n' +
      ':large_blue_diamond: Lose armor\n' +
      ':large_blue_diamond: Win X weapon\n' +
      ':large_blue_diamond: Lose weapon\n' +
      ':large_blue_diamond: Get a Repair Kit\n' +
      ':large_blue_diamond: Lose X amount of HP\n' +
      ':large_blue_diamond: Instant elimination\n' +
      '\n' +
      bold(':diamond_shape_with_a_dot_inside: Overload Protocol:') +
      ' Spintop’s Cobot Rumble will take 7 days in total; from the 9th of August to the 16th of August, there will be no exception. The main reason is I’ve created this artificial dimension to host you for 7 days tops. After the 16th of August, I will activate my beloved Overload Protocol; this beauty will damage you 10 HP every 8 hours until your HP reaches 0. Your Cobot will eventually become a scrap pile if the rumble doesn’t end in 7 days.\n' +
      '\n' +
      bold('Rewards:') +
      '\n' +
      '\n' +
      ':large_orange_diamond: 1st: $1500\n' +
      ':large_orange_diamond: 2nd: $1000\n' +
      ':large_orange_diamond: 3rd: $800\n' +
      ':large_orange_diamond: 4th to 6th: $500\n' +
      ':large_orange_diamond: 7th to 10th: $150\n' +
      ':large_orange_diamond: 11th to 15th: $100\n' +
      ':large_orange_diamond: 16th to 20th: $20\n'
  );

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
        await channel.send({ embeds: [registerEmbed], components: [row] });
      }
    }
    const verificationChannel =
      (await client.channels.cache.get(rooms.verification)) ||
      (await client.channels.fetch(rooms.verification));
    if (verificationChannel) {
      const messages = await verificationChannel.messages.fetch({ limit: 100 });
      if (!messages.find((i) => i.author.id === clientId && i.pinned)) {
        await verificationChannel.send({
          embeds: [registerEmbed2],
          components: []
        });
      }
    }
  } catch (error) {
    console.error(error);
  }

  try {
    const channel =
      (await client.channels.cache.get(rooms.pilots_handbook)) ||
      (await client.channels.fetch(rooms.pilots_handbook));
    if (channel) {
      const messages = await channel.messages.fetch({ limit: 100 });
      if (!messages.find((i) => i.author.id === clientId && i.pinned)) {
        await channel.send({ embeds: [rulesEmbed], components: [] });
        await channel.send({ embeds: [rulesEmbed2], components: [] });
        await channel.send({ embeds: [rulesEmbed3], components: [] });
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
