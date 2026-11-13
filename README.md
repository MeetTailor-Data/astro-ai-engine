# Astro AI Engine

A space mission design and simulation platform combining a TypeScript physics simulator, an interactive 3D frontend, synthetic mission data generation, and a machine learning prediction pipeline.

Developed by **Astro Architects** for the NASA Space Apps Challenge 2026 — Space Mission Design Game.

> **Project scope:** This is an educational mission simulation and design tool. Its physics models are simplified and are not intended for real spacecraft flight operations or NASA-certified engineering analysis.

---

## Table of Contents

- [Overview](#overview)
- [NASA Space Apps Challenge Alignment](#nasa-space-apps-challenge-alignment)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Simulation Engine](#simulation-engine)
- [Machine Learning Pipeline](#machine-learning-pipeline)
- [API Integration](#api-integration)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Team Contribution Workflow](#team-contribution-workflow)
- [Limitations](#limitations)
- [Acknowledgments](#acknowledgments)

---

## Overview

Astro AI Engine brings together three major components:

| Component | Purpose |
|---|---|
| Simulation Engine | Simulates mission physics, spacecraft subsystems, and mission outcomes |
| Interactive Frontend | Provides mission selection, rocket configuration, 3D visualization, and telemetry |
| Machine Learning Pipeline | Generates synthetic mission datasets and trains models to predict mission outcomes |

The project aims to make space mission design more interactive and understandable through simulation, visualization, and data-driven analysis.

---

## NASA Space Apps Challenge Alignment

Astro AI Engine is developed for the **NASA Space Apps Challenge 2026 — Space Mission Design Game**.

The project explores educational space mission design through simulation, visualization, and machine learning.

### Mission Design Concepts

The platform incorporates concepts related to:

- **Launch Segment:** Rocket configuration, propulsion, fuel consumption, and mission launch simulation.
- **Space Segment:** Orbital motion, spacecraft power, communications, and mission objectives.
- **Ground Segment:** Mission telemetry and communication interfaces.
- **User Segment:** Mission visualization, results, and scientific data presentation.

### Trajectory and Mission Analysis

The simulator incorporates simplified mission analysis concepts, including:

- Orbital propagation and gravitational motion.
- Atmospheric drag and orbital decay.
- Propulsion and delta-v calculations.
- Solar power generation and eclipse effects.
- Mission objectives, validation, and scoring.

### Machine Learning for Mission Analysis

The machine learning pipeline generates synthetic mission datasets and trains predictive models to analyze mission outcomes.

These predictions are experimental and are not substitutes for numerical physics simulation or real-world mission analysis.

> The project is inspired by space mission design concepts and is not an official NASA, JPL, or Goddard Space Flight Center software product.

---

## Architecture

```text
                    ASTRO AI ENGINE
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
   Simulation Engine   Frontend       ML Pipeline
    TypeScript         React           Python
          |                |                |
          v                v                v
    Mission Physics   3D Visuals     Training Data
    Mission Runner    Rocket Builder  Model Training
    Objectives        Telemetry       Evaluation
    Scoring           Mission UI       Predictions
          |
          v
     Express API
    REST + SSE
          |
          v
     Live Frontend
```

### Component Interaction

- The frontend provides mission configuration and interactive visualization.
- The simulation engine calculates mission progression, subsystem states, and mission outcomes.
- The Express API exposes simulator functionality to the frontend.
- The synthetic dataset generator produces mission data for the ML pipeline.
- The Python pipeline trains and evaluates predictive models using generated data.

---

## Features

### Simulation Engine

- Orbital propagation using Velocity Verlet integration.
- Earth gravity and orbital motion.
- Atmospheric drag and orbital decay.
- Earth impact and mission failure handling.
- Propulsion, fuel consumption, and delta-v calculations.
- Solar power generation and eclipse handling.
- Battery energy management.
- Communication and data buffering.
- Mission objectives and validation.
- Mission scoring and grading.
- Telemetry and simulation events.
- Mission execution and completion tracking.

### Interactive Frontend

- Interactive 3D solar system visualization.
- Mission selection interface.
- Vehicle Assembly Building (VAB) rocket configuration.
- Rocket staging and configuration.
- Launch control interface.
- Telemetry visualization.
- Mission outcome and scorecard presentation.

### Machine Learning

- Synthetic mission training data generation.
- Feature normalization.
- PyTorch neural network training.
- Validation and test evaluation.
- Mission outcome prediction.
- Classification metrics including accuracy, precision, recall, and F1-score.

---

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React 19, Vite |
| 3D Graphics | Three.js, React Three Fiber, Drei |
| Styling | Tailwind CSS |
| Backend | Node.js, Express |
| Simulation | TypeScript |
| Validation | Zod |
| Testing | Vitest |
| Machine Learning | Python, PyTorch |
| Data Processing | NumPy, Pandas, Scikit-learn |
| Visualization | Matplotlib |
| Version Control | Git, GitHub |

---

## Repository Structure

```text
astro-ai-engine/
|
+-- configs/
|   +-- config.yaml
|
+-- data/
|   +-- raw/
|   +-- processed/
|
+-- frontend/
|   +-- src/
|   |   +-- components/
|   |   |   +-- three/
|   |   +-- context/
|   |   +-- services/
|   |   +-- utils/
|   +-- package.json
|   +-- vite.config.js
|   +-- .gitignore
|
+-- models/
|
+-- notebooks/
|
+-- simulation-work/
|   +-- src/
|   |   +-- engine.ts
|   |   +-- orbit.ts
|   |   +-- orbital-propagator.ts
|   |   +-- atmospheric-drag.ts
|   |   +-- battery.ts
|   |   +-- power.ts
|   |   +-- propulsion.ts
|   |   +-- communications.ts
|   |   +-- telemetry.ts
|   |   +-- mission-runner.ts
|   |   +-- generate-training-data.ts
|   |   +-- api/
|   |       +-- server.ts
|   +-- tests/
|   +-- package.json
|   +-- tsconfig.json
|
+-- src/
|   +-- dataset.py
|   +-- model.py
|   +-- train.py
|   +-- evaluate.py
|   +-- utils.py
|
+-- requirements.txt
+-- README.md
+-- README-WIRING.md
+-- .gitignore
```

---

## Prerequisites

Install the following before running the project.

- **Node.js:** Compatible with the installed frontend and simulator dependencies.
- **npm:** Included with Node.js.
- **Python:** 3.10 or newer recommended.
- **Git:** For repository management.
- **NVIDIA GPU:** Optional; CUDA-compatible hardware can accelerate model training.

Check installations:

```bash
node --version
npm --version
python --version
git --version
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/MeetTailor-Data/astro-ai-engine.git
```

Navigate into the repository:

```bash
cd astro-ai-engine
```

### Install Simulator Dependencies

```bash
cd simulation-work
npm install
```

### Install Frontend Dependencies

Open another terminal:

```bash
cd astro-ai-engine/frontend
npm install
```

### Install Python Dependencies

Return to the repository root:

```bash
cd astro-ai-engine
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

---

## Running the Project

### 1. Run the Simulation Demo

```bash
cd simulation-work
npm run demo
```

This executes the demonstration mission and prints mission progress, objective completion, and final scoring information.

### 2. Start the Simulation API

```bash
cd simulation-work
npm run api
```

The API server runs at:

```text
http://localhost:3000
```

### 3. Start the Frontend

Open a separate terminal:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

### 4. Generate Synthetic Training Data

```bash
cd simulation-work
npm run generate-data
```

The generated dataset is used by the Python machine learning pipeline.

### 5. Train the ML Model

From the repository root:

```bash
python -m src.train
```

### 6. Evaluate the ML Model

```bash
python -m src.evaluate
```

---

## Simulation Engine

The simulator is implemented in TypeScript under `simulation-work/`.

### Physics and Subsystems

| Subsystem | Responsibility |
|---|---|
| Orbital Mechanics | Orbital motion, gravity, propagation |
| Atmospheric Drag | Atmospheric resistance and orbital decay |
| Propulsion | Fuel consumption and delta-v |
| Power | Solar generation and spacecraft power consumption |
| Battery | Energy storage and battery state |
| Communications | Data transmission and buffering |
| Telemetry | Mission state and subsystem monitoring |
| Mission Runner | Mission execution and lifecycle |
| Scoring | Objective evaluation and mission grading |

### Mission Execution

The mission runner coordinates simulation steps, subsystem updates, telemetry, objective evaluation, and mission termination conditions.

Mission outcomes may include:

- Mission completion.
- Mission duration reached.
- Objective completion or failure.
- Spacecraft subsystem failures.
- Orbital failure conditions.

### Simulation Accuracy

The engine uses simplified physics models suitable for interactive educational simulation.

It is not a replacement for high-fidelity orbital analysis software or professional spacecraft mission design tools.

---

## Machine Learning Pipeline

The machine learning pipeline is implemented in Python.

### Pipeline

```text
Simulation Engine
       |
       v
Synthetic Dataset Generation
       |
       v
Data Preprocessing
       |
       v
Model Training
       |
       v
Validation
       |
       v
Model Evaluation
       |
       v
Mission Outcome Prediction
```

### Main Files

| File | Responsibility |
|---|---|
| `src/dataset.py` | Dataset loading and preprocessing |
| `src/model.py` | Neural network architecture |
| `src/train.py` | Model training |
| `src/evaluate.py` | Model evaluation |
| `src/utils.py` | Configuration, reproducibility, device selection |
| `configs/config.yaml` | Training configuration |
| `simulation-work/src/generate-training-data.ts` | Synthetic dataset generation |

### Model Training

The pipeline uses PyTorch to train a neural network on generated mission data.

Training includes:

- Feature normalization.
- Training and validation splits.
- Model optimization.
- Validation loss monitoring.
- Model checkpointing.

### Model Evaluation

The evaluation pipeline reports classification metrics such as:

- Accuracy
- Precision
- Recall
- F1-score
- ROC-AUC, when supported by the evaluation task and dataset

> Machine learning predictions are learned from generated data. They are not guaranteed mission outcomes or independent physics calculations.

For the detailed simulation-to-ML data flow, see [README-WIRING.md](README-WIRING.md).

---

## API Integration

The Express API is implemented under:

```text
simulation-work/src/api/server.ts
```

Start it with:

```bash
cd simulation-work
npm run api
```

Base URL:

```text
http://localhost:3000
```

### API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Server health check |
| GET | `/api/missions/profiles` | Retrieve mission profiles |
| POST | `/api/missions/custom` | Validate and create custom missions |
| GET | `/api/missions/:id/stream` | Stream mission telemetry using SSE |

### Server-Sent Events

The mission stream endpoint uses Server-Sent Events (SSE) to deliver telemetry updates to connected clients.

The frontend API integration is located at:

```text
frontend/src/services/api.js
```

For request payloads, response structures, and integration details, consult the API implementation and [README-WIRING.md](README-WIRING.md).

---

## Testing

The simulator uses Vitest.

Run tests:

```bash
cd simulation-work
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run TypeScript type checking:

```bash
npm run typecheck
```

Run the mission demo:

```bash
npm run demo
```

Frontend production build:

```bash
cd frontend
npm run build
```

Before submitting simulator changes, run type checking and the complete simulator test suite.

---

## Environment Variables

Do not commit secrets or private environment configuration.

Environment files should remain local. If a component requires environment variables, document their names in an `.env.example` file without including real credentials.

---

## Team Contribution Workflow

Astro AI Engine is developed collaboratively.

### 1. Update Your Local Branch

```bash
git pull origin main
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make and Test Your Changes

Simulator:

```bash
cd simulation-work
npm run typecheck
npm test
```

Frontend:

```bash
cd frontend
npm run build
```

### 4. Stage Only Your Changes

Do not blindly stage the entire repository.

```bash
git add simulation-work/src/your-file.ts
git add simulation-work/tests/your-file.test.ts
```

### 5. Commit

```bash
git commit -m "feat: describe your change"
```

### 6. Push

```bash
git push origin feature/your-feature-name
```

### 7. Open a Pull Request

Review changes before merging into the main branch.

---

## Limitations

- Orbital and subsystem physics use simplified models.
- Results depend on mission configuration and simulation assumptions.
- Synthetic training data does not represent a complete real-world mission dataset.
- ML predictions may not generalize beyond the training data.
- Visualization is intended for interactive mission design and educational use.
- The platform is not flight-certified or NASA-certified software.

---

## Acknowledgments

Developed by **Astro Architects** for the **NASA International Space Apps Challenge 2026**.

Challenge: **Space Mission Design Game**

NASA Space Apps Challenge is an international hackathon. Astro AI Engine is an independent team project and is not an official NASA operational system.