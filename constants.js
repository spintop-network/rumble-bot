const weapons = {
  PLATINUM_PAN: {
    name: 'Platinum Pan',
    description: 'Platinum Pan',
    attack_power: 1,
    cost: 50
  },
  BALLISTIC_MISSILE_LAUNCHER: {
    name: 'Ballistic Missile Launcher',
    description: 'Ballistic Missile Launcher',
    attack_power: 2,
    cost: 150
  },
  NUKA_LASER_CANNON: {
    name: 'N.U.K.A. Laser Cannon',
    description: 'N.U.K.A. Laser Cannon',
    attack_power: 3,
    cost: 250
  },
  ION_HEAVY_ARTILLERY: {
    name: 'Ion Heavy Artillery',
    description: 'Ion Heavy Artillery',
    attack_power: 4,
    cost: 350
  },
  ACRID_PLASMA_CUTTER: {
    name: 'Acrid Plasma Cutter',
    description: 'Acrid Plasma Cutter',
    attack_power: 5,
    cost: 450
  },
  EMP_PARALYZER: {
    name: 'EMP Paralyzer',
    description: 'EMP Paralyzer',
    attack_power: 6,
    cost: 550
  },
  NANOBOT_SWARM_GUIDANCE_SYSTEM: {
    name: 'Nanobot Swarm Guidance System',
    description: 'Nanobot Swarm Guidance System',
    attack_power: 7,
    cost: 650
  },
  NUCLEAR_WARHEAD: {
    name: 'Nuclear Warhead',
    description: 'Nuclear Warhead',
    attack_power: 8,
    cost: 750
  },
  REALITY_WARPER: {
    name: 'Reality Warper',
    description: 'Reality Warper',
    attack_power: 9,
    cost: 850
  },
  SUPER_DUPER_PLANET_BLOWER: {
    name: 'Super Duper Planet Blower',
    description: 'Super Duper Planet Blower',
    attack_power: 10,
    cost: 1000
  }
};

const armors = {
  BALLISTIC_SHIELD: {
    name: 'Ballistic Shield',
    description: 'Ballistic Shield',
    dmg_migration: 0.1,
    cost: 50
  },
  TITANIUM_PLATING: {
    name: 'Titanium Plating',
    description: 'Titanium Plating',
    dmg_migration: 0.2,
    cost: 150
  },
  POSITRON_ENERGY_BARRIER: {
    name: 'Positron Energy Barrier',
    description: 'Positron Energy Barrier',
    dmg_migration: 0.3,
    cost: 350
  },
  QUANTUM_ARMOR: {
    name: 'Quantum Armor',
    description: 'Quantum Armor',
    dmg_migration: 0.4,
    cost: 750
  },
  GRAVITATIONAL_ABSORBER: {
    name: 'Gravitational Absorber',
    description: 'Gravitational Absorber',
    dmg_migration: 0.5,
    cost: 1000
  }
};

const BASE_DAMAGE = 5;

const rooms = {
  register: '1131127969734213652',
  feed: '1131127888054329384',
  game: '1131127996674216006'
};

const pilotRoleId = '1131877359662923817';

module.exports = { weapons, armors, BASE_DAMAGE, rooms, pilotRoleId };
