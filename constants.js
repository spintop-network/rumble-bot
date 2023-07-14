const weapons = {
  TRAINING_SWORD: {
    name: 'Training Sword',
    description:
      'A simple wooden sword used for basic combat training. Low durability and damage.',
    attack_power: 1,
    cost: 50
  }
};

const armors = {
  TRAINING_ARMOR: {
    name: 'Training Armor',
    description: 'A simple set of armor used for basic combat training.',
    dmg_migration: 0.1,
    cost: 50
  }
};

module.exports = { weapons, armors };
