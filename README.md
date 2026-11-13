# 🚀 Astro AI Engine

> **A physics-grounded space mission design simulator, synthetic training data engine, and deep learning neural network pipeline with an interactive 3D command center.**

---

## 🌟 Architecture Overview

Astro AI Engine bridges **spaceflight physics simulation**, **machine learning modeling**, and **tactile 3D command controls**:

```text
                               ┌──────────────────────────────────────────────┐
                               │  simulation-work/ (TypeScript Engine)        │
                               │  • Orbital mechanics & gravity wells         │
                               │  • Power budgets (Solar irradiance + DoD)    │
                               │  • Communication latency & data buffers      │
                               │  • Mission scoring & failure constraints     │
                               └──────────────────────┬───────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       │ npm run generate-data                                       │
                       ▼                                                             ▼
         ┌───────────────────────────┐                                 ┌───────────────────────────┐
         │ data/raw/                 │                                 │ simulation-work/ API      │
         │ simulation_training_data  │                                 │ (Express REST + SSE)      │
         │ (5,000 mission rows)      │                                 │ http://localhost:3000     │
         └─────────────┬─────────────┘                                 └─────────────┬─────────────┘
                       │                                                             │
                       ▼                                                             ▼
         ┌───────────────────────────┐                                 ┌───────────────────────────┐
         │ src/ (PyTorch Deep Learn) │                                 │ frontend/ (React 19)      │
         │ • StandardScaler feature  │                                 │ • Three.js 3D Solar System│
         │   normalization           │                                 │ • VAB Rocket Builder      │
         │ • MissionPredictorNet     │                                 │ • Launch Control & Telemetry│
         │ • Training & Evaluation   │                                 │ • Mission Outcome Scorecard│
         │ ➔ models/best_model.pt   │                                 │ http://localhost:5173     │
         └───────────────────────────┘                                 └───────────────────────────┘
```

---

## 📁 Repository Structure

```text
astro-ai-engine/
├── configs/
│   └── config.yaml               # ML hyperparameters (batch size, epochs, lr, seed)
├── data/
│   ├── raw/                      # Raw datasets & simulation CSVs (gitignored)
│   └── processed/                # Normalized & split datasets
├── frontend/                     # Interactive Web Application
│   ├── src/
│   │   ├── components/           # UI Screens (MissionSelect, RocketBuilder, LaunchControl)
│   │   ├── components/three/     # Three.js 3D Scenes (Solar System, VAB Hangar, Flight)
│   │   ├── context/              # Global state (MissionContext.jsx)
│   │   ├── services/api.js       # Live backend connector + offline physics fallback
│   │   └── utils/                # Rocket flight validation & audio synthesizer
│   ├── package.json
│   └── vite.config.js
├── models/                       # Saved PyTorch checkpoints (best_model.pt)
├── notebooks/                    # Jupyter notebooks for exploratory data analysis
├── simulation-work/              # TypeScript Physics Simulation Engine
│   ├── src/
│   │   ├── engine.ts             # Core simulation stepper
│   │   ├── battery.ts / power.ts # Solar array calculation & battery DoD
│   │   ├── orbit.ts              # Orbital period, velocity, eclipse equation
│   │   ├── custom-mission-runner.ts # Headless mission executor
│   │   ├── generate-training-data.ts# 5,000-mission synthetic dataset generator
│   │   └── api/server.ts         # Simulation REST & SSE stream server
│   ├── tests/                    # Vitest unit test suite (17 test specs)
│   └── package.json
├── src/                          # Production Python ML Pipeline
│   ├── dataset.py                # PyTorch Dataset, StandardScaler, stratified loaders
│   ├── model.py                  # MissionPredictorNet (Deep MLP with BatchNorm + Dropout)
│   ├── train.py                  # Training loop with validation & best-model checkpointing
│   ├── evaluate.py               # Evaluation metrics (Accuracy, Precision, Recall, F1, ROC-AUC)
│   └── utils.py                  # GPU/CUDA device selector, seed management, config loader
├── requirements.txt              # Python ML dependencies
├── README-WIRING.md              # In-depth simulation-to-ML wiring specifications
├── README.md                     # Master project documentation
└── .gitignore                    # Comprehensive ignores for Python, Node, data, and models
```

---

## ⚡ End-to-End Workflow Guide

Follow these sequential steps to run the complete pipeline from data generation through model training and interactive simulation.

### Prerequisites

* **Node.js** (v18+ recommended)
* **Python** (v3.10 or v3.11)
* **PyTorch** with CUDA (for NVIDIA GPUs) or CPU fallback:
  ```bash
  # For NVIDIA GPUs (CUDA 12.4+):
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124

  # Or lightweight CPU-only:
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
  ```
* Install remaining Python dependencies:
  ```bash
  pip install -r requirements.txt
  ```

---

### Step 1: Generate Synthetic Mission Training Data

The TypeScript simulation engine runs 5,000 realistic mission permutations across varying altitudes, battery capacities, solar arrays, power loads, and flight durations:

```bash
cd simulation-work
npm install
npm run generate-data
```

* **Output**: Generated CSV at `data/raw/simulation_training_data.csv`
* **Features generated**:
  * `altitude_km`, `battery_capacity_wh`, `panel_area_m2`, `power_consumed_w`, `data_rate_mbps`, `duration_seconds`
* **Targets generated**:
  * `mission_success` (0 or 1), `total_score` (0–100), `grade` (S/A/B/C/D/F)

---

### Step 2: Train the Deep Learning Model

Return to the root directory and start the neural network training loop:

```bash
cd ..
python -m src.train
```

* Reads parameters from `configs/config.yaml`.
* Automatically detects and uses **NVIDIA CUDA GPU** (fallback to CPU).
* Standardizes features using `StandardScaler`.
* Trains `MissionPredictorNet` (Linear ➔ BatchNorm ➔ ReLU ➔ Dropout ➔ Linear).
* Evaluates validation loss each epoch and checkpoints the best weights to `models/best_model.pt`.

---

### Step 3: Evaluate Model Performance

Run the evaluation suite on the held-out test split (20% of data):

```bash
python -m src.evaluate
```

Reports comprehensive classification metrics:
* **Test Loss & Accuracy**
* **Precision & Recall**
* **F1-Score**
* **ROC-AUC Score**

---

### Step 4: Launch the Physics Simulation API Server (Optional Backend)

To power real-time server-side simulation telemetry:

```bash
cd simulation-work
npm run api
```

* Runs on **`http://localhost:3000`**
* Endpoints:
  * `GET /api/health` — Simulator status check
  * `GET /api/missions/profiles` — Preconfigured mission profiles
  * `POST /api/missions/custom` — Validate and create custom missions
  * `GET /api/missions/:id/stream` — Real-time Server-Sent Events (SSE) telemetry

---

### Step 5: Start the 3D Interactive Frontend

In a separate terminal, launch the React 19 + Three.js application:

```bash
cd frontend
npm install
npm run dev
```

* Open your browser at **`http://localhost:5173`**
* **Features**:
  * **3D Solar System View**: Interactive planetary orbit visualizer.
  * **Vehicle Assembly Building (VAB)**: Modular rocket staging, mass calculation, and TWR verification.
  * **Launch Control**: Real-time telemetry monitoring with audio synthesizer callouts.
  * **Mission Debrief**: Flight score, performance breakdown, and letter grade certification.
  * **Offline Resilience**: Automatically falls back to client-side physics simulation if the backend server is offline.

---

## 🛰️ NASA Space Apps Challenge 2026 Alignment & Systems Engineering

Astro AI Engine is specifically engineered to address the **NASA Space Apps Challenge: Space Mission Design Game**, adhering directly to NASA's systems engineering standards, JPL development frameworks, and Goddard trajectory trade principles:

### 1. The 4 Major NASA Mission Segments
As outlined in NASA's *Design and Develop Science Missions (SP-2025/04)*:
* **Launch Segment**: High-fidelity propulsion staging, TWR constraints, structural dynamic pressure limits ($q_{max}$ at Max-Q), and propellant mass ratios ($m_0 / m_f$).
* **Space Segment**: Mission-specific spacecraft buses (LEO Weather Satellite, Lunar Surface Lander, Mars Sample Rover) with thermal protection, power subsystems, and scientific instruments.
* **Ground Segment**: Pad-39A orbital integration facility, real-time command telemetry downlink, and tracking station communications.
* **User Segment**: Science data product dissemination, flight recorder reconstruction, and Science RP (Research Points) monetization.

### 2. NASA JPL Concept Maturity Levels (CML 1–4)
The user progression directly mirrors the Jet Propulsion Laboratory (JPL) CML maturity framework:
* **CML 1 (Mission Concept)**: Define scientific objectives and planetary destinations on the 3D Solar System Map.
* **CML 2 (Feasibility & Trade Studies)**: Assess Delta-V requirements ($\Delta V \ge 9,400\text{ m/s}$), atmospheric scale heights, and liftoff margins ($TWR \ge 1.25$).
* **CML 3 (Subsystem Point Design)**: Rapid assembly in the Vehicle Assembly Building (VAB), balancing structural dry mass, vacuum engine efficiency ($I_{sp}$), and EDL thermal shields.
* **CML 4 (Verification & Trajectory Telemetry)**: Pad rollout, simulated countdown, orbital insertion verification, and black-box anomaly forensics.

### 3. Trajectory & Trade Study Realism (NASA GMAT & MDL Inspired)
Inspired by NASA's **General Mission Analysis Tool (GMAT)** and the **Mission Design Lab (MDL)** at Goddard Space Flight Center:
* Implements the Tsiolkovsky Rocket Equation: $\Delta V = I_{sp} \cdot g_0 \cdot \ln(m_0 / m_f)$
* Non-linear atmospheric drag deceleration across varying planetary air densities ($101.3\text{ kPa}$ Earth vs $0.6\text{ kPa}$ Mars thin $\text{CO}_2$).
* Multi-objective trade studies balancing project cost (\$M), launch reliability (%), payload mass capacity, and science yield.

### 4. Neural Surrogate Modeling (The Machine Learning Advantage)
Traditional mission design requires computationally heavy numerical propagators. Astro AI Engine introduces a **PyTorch Deep Neural Surrogate (`AstroFlightPredictor`)**:
* **Sub-Millisecond Flight Solvers**: Evaluates rocket configuration feasibility ($P_{success}$) instantaneously during interactive CAD assembly.
* **Automated Failure Mode Classification**: Categorizes flight hazards before liftoff (`TWR_LOW`, `OVER_G`, `DELTAV_DEPLETED`, `THERMAL_BURNUP`, `FAIRING_FAIL`).
* **Synthetic Training Generator**: Generates 5,000+ multi-planetary mission permutations to train robust regression and classification weights.

---

## 🤝 Team Contribution Workflow

To keep the repository clean and avoid merge conflicts:

1. **Pull latest changes before starting work**:
   ```bash
   git pull origin main
   ```
2. **Create a branch for your feature**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit with clear messages**:
   ```bash
   git add .
   git commit -m "Brief description of changes"
   ```
4. **Push your branch & open a Pull Request**:
   ```bash
   git push origin feature/your-feature-name
   ```

---

## 📜 License & Credits

Built for the **NASA International Space Apps Challenge / Space Mission Design Game**.  
Maintained by the **Astro AI Engine Team**.
