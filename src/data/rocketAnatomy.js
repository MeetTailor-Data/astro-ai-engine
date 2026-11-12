/**
 * Canonical 6-part anatomical rocket slots inspired by Mars Horizon Vehicles.
 * Shared across CommandCenter (Step 1), MissionContext, and VAB Builder (Step 2).
 */
export const ROCKET_ANATOMY_SLOTS = [
  {
    key: 'nosecone',
    order: 1,
    label: 'Nosecone / Payload Fairing',
    shortLabel: 'Nosecone',
    category: 'AERODYNAMICS',
    role: 'Reduces atmospheric drag through Max-Q and shields delicate orbital payloads during hypersonic ascent.',
    telemetryImpact: 'Drag Coefficient, Thermal Ascent Shielding, Dry Mass',
    marsHorizonNote:
      'Essential for dense-atmosphere launches (Earth). Undersized or blunt fairings increase aerodynamic losses and structural vibration.',
    accent: '#00F0FF',
    defaultSpec: 'Composite Ogive Fairing (Unconfigured)',
  },
  {
    key: 'avionicsPayload',
    order: 2,
    label: 'Avionics & Payload Bay',
    shortLabel: 'Avionics & Payload',
    category: 'GNC & MISSION',
    role: 'Houses the flight guidance computer, star-tracker navigation, telemetry array, and the mission-specific spacecraft.',
    telemetryImpact: 'Payload Mass Capacity, Guidance Reliability %, Pitch Control',
    marsHorizonNote:
      'Must match the target mission payload (Satellite, Lunar Lander, or Mars Rover). Upgrading avionics boosts mission reliability.',
    accent: '#38BDF8',
    defaultSpec: 'Standard Flight Computer (Unconfigured)',
  },
  {
    key: 'edlSystem',
    order: 3,
    label: 'EDL System (Entry, Descent & Landing)',
    shortLabel: 'EDL System',
    category: 'SURVIVABILITY',
    role: 'Combines ablative heatshields, supersonic/drogue parachutes, and terminal retro-thrusters for planetary arrival.',
    telemetryImpact: 'Thermal Entry Survival, Touchdown Velocity (m/s), Dry Mass',
    marsHorizonNote:
      'Planetary atmosphere dictates EDL: Parachutes work on Earth/Mars, fail in Lunar vacuum (0 kPa), and Mars requires Heatshield + Supersonic Chute + Retro-Thrusters.',
    accent: '#F59E0B',
    defaultSpec: 'Modular EDL Bay (Unconfigured)',
  },
  {
    key: 'upperStage',
    order: 4,
    label: 'Upper Stage Engine',
    shortLabel: 'Upper Stage',
    category: 'ORBITAL INSERTION',
    role: 'Vacuum-optimized high-Isp propulsion executing orbital circularization, trans-lunar, and trans-Mars injection burns.',
    telemetryImpact: 'Vacuum Delta-V (m/s), Stage Mass, Burn Reliability %',
    marsHorizonNote:
      'High specific impulse (Isp) upper stages unlock deep-space Δv budgets (12,200+ m/s for Moon, 15,800+ m/s for Mars).',
    accent: '#818CF8',
    defaultSpec: 'Vacuum Restartable Thruster (Unconfigured)',
  },
  {
    key: 'propellantTank',
    order: 5,
    label: 'Propellant Tank',
    shortLabel: 'Propellant Tank',
    category: 'ENERGY BUDGET',
    role: 'Pressurized cryogenic or hypergolic fuel & oxidizer storage supplying chemical energy via the Tsiolkovsky rocket equation.',
    telemetryImpact: 'Total Wet Mass (kg), Available Delta-V (m/s), TWR Balance',
    marsHorizonNote:
      'More propellant raises Δv exponentially up to structural limits, but excessive fuel mass lowers liftoff TWR unless paired with stronger boosters.',
    accent: '#10B981',
    defaultSpec: 'Cryogenic Core Tank (Unconfigured)',
  },
  {
    key: 'mainBooster',
    order: 6,
    label: 'Main Booster / Sea-Level Engines',
    shortLabel: 'Main Booster',
    category: 'LIFTOFF THRUST',
    role: 'High-thrust first-stage engine cluster generating liftoff Thrust-to-Weight Ratio (TWR) to clear the launch tower.',
    telemetryImpact: 'Liftoff Thrust (kN), TWR, Pad Clearance & Gravity Losses',
    marsHorizonNote:
      'If liftoff TWR < 1.0, the vehicle stays clamped or falls back to the pad. Target ≥ 1.25–1.45 depending on mission mass.',
    accent: '#FB7185',
    defaultSpec: 'Sea-Level Booster Cluster (Unconfigured)',
  },
];

export function createInitialRocketConfig() {
  return {
    nosecone: null,
    avionicsPayload: null,
    edlSystem: null,
    upperStage: null,
    propellantTank: null,
    mainBooster: null,
    totalMassKg: 0,
    thrustKn: 0,
    twr: 0,
    deltaV: 0,
    reliabilityPct: 0,
  };
}
