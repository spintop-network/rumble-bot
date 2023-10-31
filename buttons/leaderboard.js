const User = require('../models/user');
const { EmbedBuilder, userMention, bold } = require('discord.js');
const leaderboard = async (interaction) => {
  try {
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
            'deaths.doc_created_at': -1,
            health_points: -1,
            'stats.kills': -1,
            'stats.inflicted_damage': -1
          }
        }
      ]);
      users = [...aliveUsers, ...deadUsers];
    } else {
      users = aliveUsers;
    }
    const remaining_player_count = await User.countDocuments({
      health_points: { $gt: 0 }
    });
    const first_20_users = users.slice(0, 20);
    const is_user_displayed = first_20_users?.find(
      (user) => user.discord_id === interaction.user.id
    );
    let currentUserIndex;
    if (!is_user_displayed) {
      currentUserIndex = users.findIndex(
        (user) => user.discord_id === interaction.user.id
      );
    }
    await interaction.reply({
      embeds: [
        new EmbedBuilder().setDescription(
          bold('Remaining Players: ') +
            `${remaining_player_count}\n\n` +
            bold('Leaderboard') +
            '\n\n' +
            bold('Pilot Name | Health Points | Kill Count | Damage Inflicted') +
            '\n\n' +
            [
              ...first_20_users.map(
                (user, index) =>
                  `${index + 1}. ${userMention(user.discord_id)} | ${
                    user.health_points
                  } | ${user.stats.kills ?? 0} | ${
                    user.stats.inflicted_damage ?? 0
                  }`
              ),
              ...(!is_user_displayed && currentUserIndex !== -1
                ? [
                    `${currentUserIndex + 1}. ${userMention(
                      users[currentUserIndex].discord_id
                    )} | ${users[currentUserIndex].health_points} | ${
                      users[currentUserIndex].stats.kills ?? 0
                    } | ${users[currentUserIndex].stats.inflicted_damage ?? 0}`
                  ]
                : [])
            ].join('\n')
        )
      ],
      ephemeral: true
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = leaderboard;
