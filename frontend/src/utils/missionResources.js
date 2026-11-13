const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

export const MISSION_BUDGETS = {
  'leo-sat-01': { capM: 150, deadlineMonths: 24 },
  'lunar-lander-02': { capM: 340, deadlineMonths: 36 },
  'mars-rover-03': { capM: 640, deadlineMonths: 60 },
};
const DEFAULT_BUDGET = { capM: 340, deadlineMonths: 36 };

const FUEL_COST_PER_TON = { solid: 0.1, rp1_kerosene: 0.08, liquid_methane: 0.11 };

// Game-scaled values (not real hardware numbers).
const PAYLOAD_SYSTEMS = {
  weather_sat: { genW: 1800, useW: 1400, dataMbps: 40, antennaMbps: 80 },
  lunar_lander: { genW: 1900, useW: 1350, dataMbps: 18, antennaMbps: 60 },
  mars_rover: { genW: 2500, useW: 1900, dataMbps: 20, antennaMbps: 200 },
  crew_capsule: { genW: 3000, useW: 2900, dataMbps: 60, antennaMbps: 150 },
};
const UPPER_AVIONICS_W = { solid_kick_motor: 20, liquid_hydrolox: 120, methalox_deep_space: 180 };
const LINK_DISTANCE_FACTOR = { 'leo-sat-01': 1, 'lunar-lander-02': 0.5, 'mars-rover-03': 0.15 };

export const MISSION_HERITAGE = {
  'leo-sat-01': {
    name: 'NOAA-20 / JPSS and the TIROS lineage',
    note: 'Polar-orbiting weather satellites in sun-synchronous orbit.',
  },
  'lunar-lander-02': {
    name: 'Surveyor 1 and the Apollo Lunar Module',
    note: 'Soft lunar landings using retro-thrusters in vacuum.',
  },
  'mars-rover-03': {
    name: 'Mars 2020 Perseverance and Curiosity (MSL)',
    note: 'Heatshield, supersonic parachute and powered descent at Mars.',
  },
};

export function computeResources(rocketConfig, mission) {
  const { nosecone, avionicsPayload, edlSystem, upperStage, propellantTank, mainBooster } = rocketConfig || {};
  const budget = MISSION_BUDGETS[mission?.id] || DEFAULT_BUDGET;

  // Budget
  const fuelTons = (propellantTank?.fuelMassKg ?? 0) / 1000;
  const fuelCost = fuelTons * (FUEL_COST_PER_TON[propellantTank?.propellantType] ?? 0.08);
  const partsCost = [nosecone, avionicsPayload, edlSystem, upperStage, mainBooster].reduce(
    (sum, p) => sum + (p?.costM ?? 0),
    0
  );
  const costM = Math.round((partsCost + fuelCost) * 10) / 10;

  // Time
  const months = Math.round(6 + costM / 12 + (mainBooster?.straponCount ?? 0) * 2);

  // Power
  const pay = PAYLOAD_SYSTEMS[avionicsPayload?.id];
  const genW = pay?.genW ?? 0;
  const useW =
    (pay?.useW ?? 0) +
    (edlSystem?.retroThrusters ? 150 : 0) +
    (edlSystem?.parachute ? 20 : 0) +
    (UPPER_AVIONICS_W[upperStage?.id] ?? 0);
  const powerMarginPct = genW > 0 ? Math.round(((genW - useW) / genW) * 100) : -100;

  // Data / comms
  const dataGen = pay?.dataMbps ?? 0;
  const linkMbps = (pay?.antennaMbps ?? 0) * (LINK_DISTANCE_FACTOR[mission?.id] ?? 0.5);
  const linkMarginDb =
    dataGen > 0 && linkMbps > 0 ? Math.round(10 * Math.log10(linkMbps / dataGen) * 10) / 10 : -99;

  return {
    costM,
    capM: budget.capM,
    overBudget: costM > budget.capM,
    time: { months, deadline: budget.deadlineMonths, late: months > budget.deadlineMonths },
    power: { genW, useW, marginPct: powerMarginPct },
    data: { genMbps: dataGen, linkMbps: Math.round(linkMbps * 10) / 10, marginDb: linkMarginDb },
  };
}

export function gradeFor(total) {
  if (total >= 900) return 'S';
  if (total >= 800) return 'A';
  if (total >= 700) return 'B';
  if (total >= 600) return 'C';
  if (total >= 450) return 'D';
  return 'F';
}

export function computeScore({ physics, resources, mission, willLand }) {
  const minTwr = mission?.minTwr ?? 1.25;
  const targetDv = mission?.targetDeltaV ?? 9400;
  const dvRatio = physics?.deltaV ? physics.deltaV / targetDv : 0;

  const breakdown = {
    reliability: Math.round((physics?.reliabilityPct ?? 0) * 3),
    deltaV: Math.round(250 * (dvRatio < 1 ? clamp(dvRatio) * 0.5 : 1 - clamp((dvRatio - 1.15) / 0.85))),
    budget: Math.round(250 * clamp(1 - (resources.costM / resources.capM - 0.7) / 0.3)),
    twr: Math.round(100 * clamp(1 - Math.abs((physics?.twr ?? 0) - minTwr * 1.4) / (minTwr * 1.4))),
    power: Math.round(100 * clamp(resources.power.marginPct / 25)),
  };
  let total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (!willLand) total = Math.round(total * 0.25);
  return { total, breakdown, grade: gradeFor(total) };
}

const LB_KEY = 'astro-leaderboard-v1';
export function loadLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(LB_KEY)) || [];
  } catch {
    return [];
  }
}
export function saveRun(run) {
  try {
    const all = [...loadLeaderboard(), run].sort((a, b) => b.score - a.score).slice(0, 20);
    localStorage.setItem(LB_KEY, JSON.stringify(all));
    return all;
  } catch {
    return [run];
  }
}
