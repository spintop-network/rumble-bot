const User = require('../models/user');
const { EmbedBuilder, userMention, bold } = require('discord.js');
const leaderboard = async (interaction) => {
  console.log('leaderboard', interaction);
  let users;
  const aliveUsers = await User.aggregate([
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
          $exists: false
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
        health_points: -1,
        'stats.kills': -1,
        'stats.inflicted_damage': -1
      }
    },
    {
      $limit: 20
    }
  ]);
  if (aliveUsers.length < 20) {
    const deadUsers = await User.aggregate([
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
          'deaths.death_time': -1
        }
      },
      {
        $limit: 20
      }
    ]);
    users = [...aliveUsers, ...deadUsers];
  } else {
    users = aliveUsers;
  }
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('Leaderboard')
        .setDescription(
          bold('Pilot Name | Health Points | Kill Count | Damage Inflicted') +
            '\n\n' +
            users
              .map(
                (user, index) =>
                  `${index + 1}. ${userMention(user.discord_id)} | ${
                    user.health_points
                  } | ${user.stats.kills ?? 0} | ${
                    user.stats.inflicted_damage ?? 0
                  }`
              )
              .join('\n')
        )
    ],
    ephemeral: true
  });
};

module.exports = leaderboard;
