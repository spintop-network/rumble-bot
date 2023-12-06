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
        }
      ]);
      // Update dead users health points to 0 for display purposes
      deadUsers = deadUsers.map((user) => ({ ...user, health_points: 0 }));
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
    const formattedUsers = first_20_users.map(
      (user, index) =>
        `${index + 1}. ${userMention(user.discord_id)} | ${
          user.health_points
        } | ${user.stats.kills ?? 0} | ${user.stats.inflicted_damage ?? 0}`
    );
    if (!is_user_displayed && currentUserIndex !== -1) {
      const currentUser = users[currentUserIndex];
      formattedUsers.push(
        '\n\n' +
          `${currentUserIndex + 1}. ${userMention(currentUser.discord_id)} | ${
            currentUser.health_points
          } | ${currentUser.stats.kills ?? 0} | ${
            currentUser.stats.inflicted_damage ?? 0
          }`
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
            structuredClone(formattedUsers).join('\n')
        )
      ],
      ephemeral: true
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = leaderboard;
