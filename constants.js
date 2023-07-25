const { parse } = require('csv-parse/sync');
const dotenv = require('dotenv');
const { readFileSync } = require('fs');
dotenv.config();

const weapons = {
  'Platinum Pan': {
    name: 'Platinum Pan',
    description: 'Platinum Pan',
    attack_power: 1,
    cost: 50
  },
  'Ballistic Missile Launcher': {
    name: 'Ballistic Missile Launcher',
    description: 'Ballistic Missile Launcher',
    attack_power: 2,
    cost: 150
  },
  'N.U.K.A. Laser Cannon': {
    name: 'N.U.K.A. Laser Cannon',
    description: 'N.U.K.A. Laser Cannon',
    attack_power: 3,
    cost: 250
  },
  'Ion Heavy Artillery': {
    name: 'Ion Heavy Artillery',
    description: 'Ion Heavy Artillery',
    attack_power: 4,
    cost: 350
  },
  'Acrid Plasma Cutter': {
    name: 'Acrid Plasma Cutter',
    description: 'Acrid Plasma Cutter',
    attack_power: 5,
    cost: 450
  },
  'EMP Paralyzer': {
    name: 'EMP Paralyzer',
    description: 'EMP Paralyzer',
    attack_power: 6,
    cost: 550
  },
  'Nanobot Swarm Guidance System': {
    name: 'Nanobot Swarm Guidance System',
    description: 'Nanobot Swarm Guidance System',
    attack_power: 7,
    cost: 650
  },
  'Nuclear Warhead': {
    name: 'Nuclear Warhead',
    description: 'Nuclear Warhead',
    attack_power: 8,
    cost: 750
  },
  'Reality Warper': {
    name: 'Reality Warper',
    description: 'Reality Warper',
    attack_power: 9,
    cost: 850
  },
  'Super Duper Planet Blower': {
    name: 'Super Duper Planet Blower',
    description: 'Super Duper Planet Blower',
    attack_power: 10,
    cost: 1000
  }
};

const armor_texts = parse(readFileSync('./data/armor.tsv', 'utf8'), {
  columns: true,
  skip_empty_lines: true,
  skip_records_with_empty_values: true,
  delimiter: '\t'
});

const weapon_texts = parse(readFileSync('./data/weapon.tsv', 'utf8'), {
  columns: true,
  skip_empty_lines: true,
  skip_records_with_empty_values: true,
  delimiter: '\t'
});

const armors = {
  'Ballistic Shield': {
    name: 'Ballistic Shield',
    description: 'Ballistic Shield',
    dmg_migration: 0.1,
    cost: 50
  },
  'Titanium Plating': {
    name: 'Titanium Plating',
    description: 'Titanium Plating',
    dmg_migration: 0.2,
    cost: 150
  },
  'Positron Energy Barrier': {
    name: 'Positron Energy Barrier',
    description: 'Positron Energy Barrier',
    dmg_migration: 0.3,
    cost: 350
  },
  'Quantum Armor': {
    name: 'Quantum Armor',
    description: 'Quantum Armor',
    dmg_migration: 0.4,
    cost: 750
  },
  'Gravitational Absorber': {
    name: 'Gravitational Absorber',
    description: 'Gravitational Absorber',
    dmg_migration: 0.5,
    cost: 1000
  }
};

const duel_bounds = [
  { name: 'Very Low', lower_bound: 0, upper_bound: 10 },
  { name: 'Low', lower_bound: 10, upper_bound: 20 },
  { name: 'Normal', lower_bound: 20, upper_bound: 35 },
  { name: 'Critical', lower_bound: 35, upper_bound: 50 },
  { name: 'Fatal', lower_bound: 50, upper_bound: 100 }
];

const duel_texts = [
  {
    name: 'Very Low',
    getting_damage:
      '@kaybeden has a new scratch mark on his Cobot after @kazanan’s attack.',
    damaging:
      '@kazanan has made an attack but, apparently, forgot to add power to it. @kaybeden has only been shaken.'
  },
  {
    name: 'Low',
    getting_damage:
      '@kaybeden has taken an average amount of damage from @kazanan’s attack.',
    damaging:
      '@kazanan’s attack has connected, but @kaybeden is still standing strong.'
  },
  {
    name: 'Normal',
    getting_damage: '@kaybeden has been slightly injured by @kazanan.',
    damaging:
      '@kazanan’s attack was powerful enough to injure @kaybeden slightly.'
  },
  {
    name: 'Critical',
    getting_damage:
      '@kaybeden has taken a critical hit from @kazanan’s attack. Ouch.',
    damaging:
      '@kazanan’s attack was devastating! @kaybeden took a critical hit.'
  },
  {
    name: 'Fatal',
    getting_damage: '@kaybeden has taken a fatal hit from @kazanan. Uh oh.',
    damaging:
      '@kazanan nearly managed to malfunction @kaybeden’s Cobot with a fatal attack!'
  },
  {
    name: 'Elimination',
    getting_damage:
      '@kaybeden’s Cobot gives hundreds of system malfunction warnings. It can’t even stand still, shaking from its legs to the head. It looks like it is the end of the road. ELIMINATED',
    damaging:
      // prettier-ignore
      '@kazanan’s attack was so powerful and devastating that the entire Cobot\'s Steam Arena (sponsored by BITS Artificial Services) has felt the impact! His opponent is finished. ELIMINATED'
  }
];

const BASE_DAMAGE = 5;

const isProduction = process.env.NODE_ENV === 'production';

const rooms = {
  register: isProduction
    ? '1131127969734213652'
    : process.env.REGISTER_CHANNEL_ID,
  feed: isProduction ? '1131127888054329384' : process.env.FEED_CHANNEL_ID,
  game: isProduction ? '1131127996674216006' : process.env.GAME_CHANNEL_ID,
  pilots_handbook: isProduction
    ? '1131860456097714218'
    : process.env.PILOTS_HANDBOOK_CHANNEL_ID
};

const pilotRoleId = '1131877359662923817';

module.exports = {
  weapons,
  armors,
  BASE_DAMAGE,
  rooms,
  pilotRoleId,
  duel_texts,
  armor_texts,
  weapon_texts,
  duel_bounds
};
