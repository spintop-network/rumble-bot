const mongoose = require('mongoose');
const User = require('../models/user');
const {
  BASE_ATTACK_POWER,
  BASE_ENERGY_POINTS,
  STARTER_GOLD,
  roles
} = require('../constants');
const register = async (interaction) => {
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
        attack_power: BASE_ATTACK_POWER,
        energy_points: BASE_ENERGY_POINTS,
        gold: STARTER_GOLD,
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
};

module.exports = register;
