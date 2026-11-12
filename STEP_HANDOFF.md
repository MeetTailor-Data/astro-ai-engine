# Astro-AI Space Agency — Frontend Step 2 Handoff (VAB Rocket Builder)

This document is the architectural contract for **Step 3 (Launch Control / Live Flight)** and **Step 4 (Mission Outcome)**. Read this file first before modifying or adding modules.

---

## 1. Exact Folder Tree (`./frontend`)

```text
frontend/
├── index.html                          # Orbitron + Rajdhani + JetBrains Mono fonts; overflow-hidden root
├── package.json                        # React 19, Three.js, @react-three/fiber, @react-three/drei, framer-motion, canvas-confetti
├── vite.config.js                      # Tailwind v4 plugin + `/api` proxy -> http://localhost:3000 (changeOrigin: true)
├── STEP_HANDOFF.md                     # This handoff specification (updated for Step 3)
└── src/
    ├── main.jsx                        # React root mount
    ├── index.css                       # 100vw x 100vh game lock, chamfered clip-path HUD panels, scanlines, slanted buttons
    ├── App.jsx                         # MissionProvider + conditional GameWorldCanvas + 100vw x 100vh HUD Router
    ├── context/
    │   └── MissionContext.jsx          # Centralized game state & backend health/profile initialization (unchanged contract)
    ├── data/
    │   ├── rocketAnatomy.js            # 6 canonical Mars Horizon rocket slots + createInitialRocketConfig()
    │   └── vabParts.js                 # ★ NEW — Part catalogues for all 6 slots + propellant options
    ├── services/
    │   └── api.js                      # Dual-mode API service (Live Backend :3000 + Local Physics Fallback)
    ├── utils/
    │   └── soundEffects.js             # Zero-dependency Web Audio API sci-fi synthesizer (SoundEngine)
    └── components/
        ├── TopNavbar.jsx               # Clean HUD bar only: Agency Logo, 3 Resource Counters, Audio toggle, Comms LED
        ├── HudFrame.jsx                # Reusable <ChamferPanel>, animated <CrewPortrait>, and <TypewriterDialogue>
        ├── TactileUI.jsx               # ★ NEW — Custom spacecraft hardware UI: <TactileButton>, <HardwareToggleSwitch>, <HardwareConsolePanel>, <TactileFuelSlider>
        ├── CommandCenter.jsx           # Screen 1 HUD: Commander Rudra dialogue + 3D Rocket Anatomy Inspector + Launch Map CTA
        ├── MissionSelect.jsx           # Screen 2 HUD: Mission carousel + Holographic Dossier + Chief Engineer Maya EDL alerts
        ├── RocketBuilder.jsx           # ★ UPDATED — Mars Horizon Vehicle Designer: 76px visual SVG tile grid, open center 45%+, scrollable royal-blue right readiness panel, Maya advisor
        ├── LaunchControl.jsx           # ★ Step 3 — Full-screen 3D Launchpad, Flight Simulation, HQ Crew PiP, Live Telemetry & Camera Switcher
        ├── StepPlaceholder.jsx         # Chamfered placeholder for MISSION_OUTCOME
        └── three/
            ├── GameWorldCanvas.jsx     # Persistent <Canvas> (daytime sky in COMMAND_CENTER, #020409 deep space in MISSION_SELECT / MISSION_OUTCOME)
            ├── SpaceBaseScene.jsx      # Bright sunny daytime Launch Complex (<Sky /> gated by isDaytime prop)
            ├── SolarSystemScene.jsx    # Procedural 3D Earth, Moon, Mars with Fresnel atmosphere shaders
            ├── VabHangarScene.jsx      # Mars Horizon Royal Blueprint Blue (#1455AD) studio, infinite perspective blueprint grid, 3-point lighting, gantry crane
            ├── FlightSimulationScene.jsx # ★ NEW — 3D Launchpad, Sky-to-Space transition, Stage Separation, EDL, Land/Crash physics & 4-mode Camera Switcher
            ├── MissionControlHQ3D.jsx  # ★ NEW — 3D Mission Control HQ Room with 6 animated flight controllers, curved consoles & trajectory wall
            └── ModularRocket3D.jsx     # Glossy white NASA/ESA stages, stageFilter ('all'|'upper_only'|'booster_only'), deployLegs/deployChute/heatGlow props
```

---

## 2. What Changed in Step 2

### `TopNavbar.jsx` — Stepper Removed

- **Removed**: `STEPPER_STAGES` wizard stepper (01 BRIEFING | 02 VAB ASSEMBLY | ...). The stepper was removed to enforce progression only through in-game actions.
- **Kept**: Agency Logo, FUNDS / SCIENCE / SUPPORT resource counters (always visible), AUDIO toggle, Comms LED ping button.
- All resource counters now use `whitespace-nowrap` to prevent 2-line wrapping on any viewport width.

### `App.jsx` — Conditional Canvas

- `GameWorldCanvas` is now **only rendered** when `currentStep` is `COMMAND_CENTER`, `MISSION_SELECT`, or `MISSION_OUTCOME`.
- During `ROCKET_BUILDER` and `LAUNCH_CONTROL`, the global background canvas is hidden — each screen manages its own Three.js `<Canvas>`.

### New: `src/data/vabParts.js`

Part catalogue exporting:
- `NOSECONE_PARTS` — 3 parts (Standard Ogive, Reinforced Shroud, Heavy Thermal Fairing)
- `AVIONICS_PARTS` — 4 parts (Weather Sat, Lunar Lander, Mars Rover, Crew Capsule)
- `EDL_PARTS` — 4 parts (None, Chutes Only, Heat+Chute, Full EDL Package)
- `UPPER_STAGE_PARTS` — 3 parts (Solid Kick, Hydrolox, Methalox)
- `PROPELLANT_OPTIONS` — 3 options (Solid, RP-1, Methane)
- `BOOSTER_PARTS` — 4 parts (Single Core, Tri-Cluster, Heavy+2 SRBs, Super Heavy+4 SRBs)
- `FUEL_MASS_MIN = 10000`, `FUEL_MASS_MAX = 120000`, `FUEL_MASS_DEFAULT = 45000`

### New: `src/components/three/ModularRocket3D.jsx`

- Renders a fully modular 3D rocket from `rocketConfig` with per-slot geometry:
  - Nosecone (`NoseconeGeom`) — cone + fairing flange; thermal stripe for heavy fairing
  - Avionics Bay (`AvionicsBayGeom`) — cylinder + solar panels + antenna; crew capsule variant
  - EDL System (`EdlSystemGeom`) — bay + heatshield disc + folding legs + chute canister
  - Upper Stage (`UpperStageGeom`) — tank + vacuum nozzle; scales height by propellant type
  - Propellant Tank (`PropellantTankGeom`) — **visually stretches** via Y scale as `fuelMass` increases (10t → 120t)
  - Main Booster (`MainBoosterGeom`) — core + engine nozzle(s) with gimbal ring; strap-on SRBs for heavy configs
- **X-Ray mode**: All hull meshes switch to `wireframe + transparent`. Internal details appear: AI computer block (cyan), LOX/fuel tank divider, cryo pipe, turbopump (orange), combustion chamber.
- **Highlight ring**: Spinning holographic cyan torus around the active slot with animated opacity pulse.
- Exports `computeSlotWorldPositions(rocketConfig)` for camera targeting in Step 3.

### New: `src/components/three/VabHangarScene.jsx`

- Full VAB hangar environment using `@react-three/fiber`:
  - `SteelTrussWall` — steel lattice walls with horizontal beams and diagonal cross-bracing
  - `GantryCrane` — slowly sliding overhead crane with trolley, hook cable, and rail wheels
  - `AssemblyTurntable` — slowly rotating platform (0.04 rad/s) holding the rocket; alignment grid lines glow cyan
  - `EngineerFigure` — 5 low-poly engineer figures on catwalks with helmets, visors, and clipboards
  - `Catwalk` — 3 horizontal walkways with safety railings at Y=1.8, 3.6, 5.4
  - `VolumetricSpotlight` — 3 animated spotlights with intensity oscillation aimed at the rocket
  - `HangarFloor` / `HangarCeiling` — dark metallic surfaces with ceiling trusses
  - `Sparkles` — cryogenic vapor particles around the rocket base
  - Orange safety light ring on floor
  - `OrbitControls` locked to `minDistance=3.5, maxDistance=14`

### New: `src/components/RocketBuilder.jsx`

The main VAB HUD with:

**Left Panel (220px / 260px XL)**:
- Mission banner (name + code)
- 6 vertical slot buttons (order 1–6, top-to-bottom) with colored slot indicators, part name, completion checkmark
- X-RAY ANATOMY MODE toggle button (cyan when active, game-btn-slanted)

**Center Panel (flex-1)**:
- Blueprint card for active slot: category, label, role description, Mars Horizon engineering note
- Part card grid: each card shows label, description, and badges (Mass, Thrust, Reliability, Cost, ISP, etc.)
- **Propellant Tank special UI**: dropdown of 3 propellant types + range slider for fuel mass (10–120t)

**Right Panel (220px / 260px XL)**:
- Live Engineering metrics with animated progress bars: Total Mass, Thrust, Delta-V, TWR (large colored display), Reliability %
- Mission Readiness Checklist with per-check pass/warn/critical indicators and failure reason messages
- Overall status badge: ALL SYSTEMS GO / SUBOPTIMAL / CRITICAL FAILURES

**Bottom Action Bar**:
- `← BACK TO MISSION MAP` button
- `AUTO-BUILD RECOMMENDED` quick-fill helper
- `CONFIRM & ROLLOUT TO LAUNCHPAD >>` orange thruster-glow button

### New: `src/components/LaunchControl.jsx`

Clean placeholder screen for Step 3 showing confirmed `activeMissionId`. Includes "Return to VAB" and "Skip to Outcome" dev buttons.

---

## 3. `rocketConfig` Schema (Step 2 Expanded)

```js
{
  // 6 slot objects — null until selected:
  nosecone:        { id, label, shortLabel, dryMassKg, dragCoeff, reliabilityBonus, costM, description, role, color },
  avionicsPayload: { id, label, shortLabel, payloadMassKg, guidanceReliability, reliabilityBonus, costM, targetPayload, description, role, color },
  edlSystem:       { id, label, shortLabel, dryMassKg, heatshield, parachute, retroThrusters, landingLegs, touchdownSpeedMs, reliabilityPenalty, costM, description, role, color },
  upperStage:      { id, label, shortLabel, thrustKn, ispVac, dryMassKg, propMassKg, reliabilityBonus, costM, description, role, color },
  propellantTank:  { id: 'propellant_tank', shortLabel, fuelMassKg: number, propellantType: 'solid'|'rp1_kerosene'|'liquid_methane' },
  mainBooster:     { id, label, shortLabel, thrustKn, ispSL, dryMassKg, straponCount, reliabilityBonus, costM, description, role, color },

  // Computed physics (via computeRocketPhysics, merged by updateRocketMetrics):
  totalMassKg:    number,   // dryMass + fuelMass + upperStagePropMass
  thrustKn:       number,   // boosterThrust + 15% upper stage contribution
  twr:            number,   // (thrustKn * 1000) / (totalMassKg * selectedMission.gravityMs2)
  deltaV:         number,   // combinedIsp * 9.81 * ln(wetMass / dryMass)   [Tsiolkovsky]
  reliabilityPct: number,   // 72 base + slot bonuses/penalties, clamped 10–99
}
```

---

## 4. Physics Equations

```
TWR   = (booster.thrustKn × 1000) / (totalMassKg × mission.gravityMs2)
Δv    = combinedIsp × 9.81 × ln(wetMass / dryMass)
combinedIsp = (fuelMass × boosterIsp + upperPropMass × upperIsp) / totalProp
reliability = 72 + Σ(slot bonuses) − Σ(slot penalties), clamp(10, 99)
```

---

## 5. Mission Readiness Checks

| Check | Required | Fail Consequence |
|-------|----------|------------------|
| TWR ≥ minTwr | mission.minTwr (1.25–1.45) | Gravity loss / pad stall |
| Delta-V ≥ targetDeltaV | mission.targetDeltaV (9,400–15,800 m/s) | Won't reach destination |
| Payload matches mission | mission.requiredPayloadName | Science objectives missed |
| Retro-Thrusters (Moon/Mars) | edlRequirements.retroThrustersRequired | Hard impact crash |
| Heatshield (Mars) | edlRequirements.heatshieldRequired | Entry plasma burn-up |
| Parachute (Earth/Mars) | edlRequirements.parachuteEffective | High terminal velocity |
| Chutes in vacuum warning | atmosphereType !== 'VACUUM' | Completely useless EDL |

> Warnings are shown in amber/red but launch is **always allowed** — the player can experience real failure!

---

## 6. Next-Step Plug-in Checklist

- **Step 3 (`LaunchControl.jsx`) — IMPLEMENTED**:
  1. Full-screen 3D `FlightSimulationScene.jsx` with sunny daytime launchpad (`#38BDF8`), lattice tower with retracting clamp arms, flame trench, cryogenic vapor, liftoff smoke, flickering exhaust, sky-to-space transition (`#38BDF8` -> `#0F172A` -> `#020409` + 4,200 stars + curved Earth horizon), 3D stage separation, EDL parachute/legs/retro-burn, and real `LANDED` vs `CRASHED` physics (`TWR_LOW`, `OVER_G`, `DELTAV_LOW`, `NO_HEATSHIELD`, `EDL_FAIL`).
  2. Live 4-mode Camera Switcher (`TRACKING`, `PAD`, `ROCKET_CAM`, `HQ_CAM`).
  3. `MissionControlHQ3D.jsx` PiP & full-screen HQ view with 6 animated controllers + live scrolling Flight Director Radio Log.
  4. `runMission(activeMissionId)` + `streamMissionTelemetry()` with 60fps `createLocalPhysicsStream()` fallback in `api.js` and `validateRocketForMission()` in `src/utils/missionPhysics.js`.
  5. Procedural launch audio in `soundEffects.js`: `playCountdownBeep()`, `startThrusterRumble()`, `updateThrusterRumble()`, `stopThrusterRumble()`, `playStageSeparationSound()`, `playRadioChirp()`, `playExplosionBoom()`, `playLandingFanfare()`.

- **Step 4 (`MissionOutcome.jsx`) — IMPLEMENTED**:
  1. Replaced `<StepPlaceholder stepName={MISSION_STEPS.MISSION_OUTCOME} />` in `src/App.jsx` with `<MissionOutcome />`.
  2. Full-screen 3D `OutcomeCinematicScene.jsx` with Case A (LEO Weather Satellite orbit + unfolding solar wings + green radar scan cone + drifting fairing halves), Case B (Moon/Mars touchdown with deployed landing legs + rolling 3D rover + laser scanner + dust/celebration particles), and Case C (3D impact crater + glowing debris + rotating red-wireframe hologram highlighting the exact failed rocket slot).
  3. Mars Horizon Post-Flight Debrief HUD with Verdict Banner, Rewards & Telemetry Scorecard, and AI Black-Box Recorder / Engineer Maya Diagnostic Report (`Kya Galti Thi` / `Kya Karna Chahiye` on crash, 6-stage synthesis on success).
  4. Seamless 3-second slow-motion finale + auto-advance in `LaunchControl.jsx` (including 400 km orbital hold for `leo-sat-01`), and live Agency Funds/Science/Support updates in `MissionContext.jsx` & `TopNavbar.jsx`.
  5. Deterministic 4-Constraint VAB physics in `src/utils/missionPhysics.js` + live Engineer Maya Constraint Solver Guide in `RocketBuilder.jsx`.

---

## 7. `soundEffects.js` — Available Sounds for Step 3+

| Method | Use |
|--------|-----|
| `playHoverChirp()` | UI button hover |
| `playClickSound()` | Button press / part snap |
| `playCameraWhoosh()` | Screen-to-screen camera fly |
| `playDialogueBlip(offset)` | Typewriter blip |
| `playHangarDoorSound()` | VAB rollout / door open |
| `playPartInstallSound()` | Pneumatic hiss + metallic clank + electric arc weld sizzle on part snap |
| `playCraneServoSound()` | Gantry crane servo whirr when switching rocket slots |
| `playHydraulicHum(ratio)` | Throttled hydraulic pressure hum when dragging fuel mass slider |
| `playKlaxonChirp()` | Warning klaxon chirp when TWR < 1.0 |
| `playRolloutSiren()` | Deep hangar siren + heavy crawler-transporter rumble on Launchpad Rollout |
| `startAmbientHum()` / `stopAmbientHum()` | Control room ambient |
