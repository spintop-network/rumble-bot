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
        'Welcome to Spintop’s Cobot Rumble! If I am correct, you want to prove yourself as a capable pilot and win the big prize. That’s fine, but let me remind you this: this is no place for fragile people. You will destroy or be destroyed; there’s nothing in between.\n' +
        '\n' +
        'When you register to be a pilot by pressing the “Register” button, you’ll be given the “Novice Pilot” role. With your new assigned role, you are officially ready to kickstart your journey as a Cobot pilot! You will be ready, but the event starts on the 6th of November, Monday, so you’ll have to wait a little while. Registrations will conclude on the 6th of November, which means no one can register after the 6th of November. After completing your registration process by pressing the “Register” button, visit the #pilots-handbook channel to learn more about Spintop’s Cobot Rumble! Also, you can chill with other pilots on #pilots-lounge and even learn some tricks while developing strategies by chatting with experienced pilots.\n' +
        '\n' +
        '\n' +
        'Oh, and a little reminder: if you manage to be the one in the last 20 pilots, here are the rewards you will get:\n' +
        ':large_orange_diamond: 1st: $150 + Crypto Queen NFT (approx. $60)\n' +
        ':large_orange_diamond: 2nd: $100 + Bridger NFT (approx. $50)\n' +
        ':large_orange_diamond: 3rd: $50 + Sam NFT (approx. $45)\n' +
        ':large_orange_diamond: 4th: $30 + Lunatic NFT (approx. $40)\n' +
        ':large_orange_diamond: 5th: $20 + Shardeus NFT (approx. $40)\n' +
        ':large_orange_diamond: 6th to 10th: $15 + Meda Hero NFT (approx. $5)\n' +
        ':large_orange_diamond: 11th to 15th: $10 + Tier 1 Weapon NFT (approx. $4)\n' +
        ':large_orange_diamond: 16th to 20th: $5 + Tier 1 Weapon NFT (approx. $4)\n'
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
      'The idea of Spintop’s Cobot Rumble is simple, even for you: destroy every opponent you face. You can use different types of weapons and armor to bring your opponents to their knees, and these equipable items can be bought from the Armory if you have enough Credits. Credits are only usable in artificial dimensions and can be earned by defeating opponents only. Or, if you are lucky, you might find some in Random Encounters. Oh, yes, Random Encounters. Between shopping for weapons and armor from the Armory and battling against other Cobot pilots, you have a third option, which I call Random Encounters. If you want to experience a Random Encounter, you will press the button written “Random Encounters” on it, just as you will do with the Armory and Battle buttons. But let me remind you, Random Encounters are really random. Its outcome can be disastrous or miraculous for you and your Cobot. So tread accordingly.\n' +
      '\n' +
      '“But BITS, everything sounds suspiciously awesome. Isn’t there a catch?” There is, of course. In the artificial dimension I’ve created, each action you take will cost an Energy Point (EP), and you have 6 of them. You have to wait 4 hours for an Energy Point to regenerate. I had to implement this energy system because otherwise, there would be vast amounts of glitches all over the artificial dimension, and to be honest, I don’t want to ruin what I’ve created just to be able to entertain you. Deal with it, and use your Energy Points wisely.\n'
  );

  // prettier-ignore
  const rulesEmbed2 = new EmbedBuilder()
    .setTitle('' + 'Rules, Numbers, and Terminology:')
    .setDescription(
      'Now, let me sum up everything and explain some rules, numbers, and terminology as basic as possible:\n' +
        '\n' +
        bold(':diamond_shape_with_a_dot_inside: HP:') +
        ' Health point. You start with 100 HP, but if it reaches 0, you’re (your Cobot, to be more precise) gone.\n' +
        '\n' +
        bold(':diamond_shape_with_a_dot_inside: EP:') +
        'Energy point. Your actions depend on the energy points you have. In total, you have 6 energy points. Unlike visiting the Armory, Battle and Random Encounters cost you an EP each. An EP regenerates every 4 hours, and in addition to an EP, you\'ll receive 10 Credits every 4 hours. If you have 6/6 EP and not taking any action, such as Battle or Random Encounters, you’ll lose 5 HP for every inactive 4-hour cycle.' +
        '\n\n' +
        bold(':diamond_shape_with_a_dot_inside: AP:') +
        ' Attack power. Your attack power is 2 as default; however, you can increase this by buying or earning weapons.\n' +
        '\n' +
        bold(':diamond_shape_with_a_dot_inside: DM:') +
        ' Damage mitigation. Your damage mitigation is 0 as default; however, you can increase this by buying or earning armor.\n' +
        '\n' +
        bold(':diamond_shape_with_a_dot_inside: Credit:') +
        ' The currency for you to buy weapons and armor from the Armory. Also, you need Credit to use the Repair Kit.\n' +
        '\n' +
        bold(':diamond_shape_with_a_dot_inside: Repair Kit:') +
        ' These are items to repair your Cobot and increase its HP by 33. You need Credit to use the Repair Kit, and the Credit cost gets doubled with each kit usage.\n' +
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
      ' The alternative sets of scenarios that happen in the artificial dimension and affect your piloting journey on Discord, good or bad. In total, there are 55 different scenarios that you can encounter, and it’s impossible to know the outcome before it actually happens. Before facing a random encounter, you roll dice from 0 to 100, 0 being the worst and 100 being the best. \n' +
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
      ':large_blue_diamond: Instant elimination*\n' +
      '\n\n' +
      italic(
        '*Instant elimination on Random Encounters will be triggered after the 9th of November.'
      ) +
      '\n\n' +
      bold(':diamond_shape_with_a_dot_inside: Overload Protocol:') +
      ' Spintop’s Cobot Rumble will take 7 days in total; from the 6th of November to the 13th of November, there will be no exception. The main reason is I’ve created this artificial dimension to host you for 7 days tops. After the 13th of November, I will activate my beloved Overload Protocol; this beauty will damage you 5 HP every 4 hours until your HP reaches 0. Your Cobot will eventually become a scrap pile if the rumble doesn’t end in 7 days.\n' +
      '\n' +
      bold('Rewards:') +
      '\n' +
      '\n' +
      ':large_orange_diamond: 1st: $150 + Crypto Queen NFT (approx. $60)\n' +
      ':large_orange_diamond: 2nd: $100 + Bridger NFT (approx. $50)\n' +
      ':large_orange_diamond: 3rd: $50 + Sam NFT (approx. $45)\n' +
      ':large_orange_diamond: 4th: $30 + Lunatic NFT (approx. $40)\n' +
      ':large_orange_diamond: 5th: $20 + Shardeus NFT (approx. $40)\n' +
      ':large_orange_diamond: 6th to 10th: $15 + Meda Hero NFT (approx. $5)\n' +
      ':large_orange_diamond: 11th to 15th: $10 + Tier 1 Weapon NFT (approx. $4)\n' +
      ':large_orange_diamond: 16th to 20th: $5 + Tier 1 Weapon NFT (approx. $4)\n'
  );

  const gameEmbed = new EmbedBuilder().setDescription(
    'Time to show your worth.'
  );

  const register = new ButtonBuilder()
    .setCustomId('registerButton')
    .setLabel('Register')
    .setEmoji('✍️')
    .setStyle(ButtonStyle.Success);

  const playButton = new ButtonBuilder()
    .setCustomId('playButton')
    .setLabel('Play')
    .setEmoji('🎮')
    .setStyle(ButtonStyle.Success);

  const leaderboardButton = new ButtonBuilder()
    .setCustomId('leaderboardButton')
    .setLabel('Leaderboard')
    .setEmoji('🏆')
    .setStyle(ButtonStyle.Success);

  const registerRow = new ActionRowBuilder().addComponents(register);
  const gameRow = new ActionRowBuilder().addComponents(
    playButton,
    leaderboardButton
  );

  for await (const props of [
    {
      channelId: rooms.register,
      embeds: [registerEmbed],
      components: [registerRow]
    },
    {
      channelId: rooms.verification,
      embeds: [registerEmbed2],
      components: []
    },
    {
      channelId: rooms.pilots_handbook,
      embeds: [rulesEmbed, rulesEmbed2, rulesEmbed3],
      components: []
    },
    {
      channelId: rooms.game,
      embeds: [gameEmbed],
      components: [gameRow]
    }
  ]) {
    try {
      const channel =
        (await client.channels.cache.get(props.channelId)) ||
        (await client.channels.fetch(props.channelId));
      if (channel) {
        const messages = await channel.messages.fetch({ limit: 100 });
        if (!messages.find((i) => i.author.id === clientId && i.pinned)) {
          for await (const embed of props.embeds) {
            const message = await channel.send({
              embeds: [embed],
              components: props.components
            });
            await message.pin();
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
});

// Log in to Discord with your client's token
client.login(token);

client.commands = new Collection();

module.exports = { client };
