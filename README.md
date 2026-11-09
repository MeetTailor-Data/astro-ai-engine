# Astro AI Engine

Astro AI Engine is the AI and simulation component of **Mission Forge**, a space mission design game developed for NASA Space Apps Challenge 2026.

The repository contains two main components:

- **ML Pipeline:** Python-based dataset processing, model training, and evaluation.
- **Simulation Engine:** TypeScript-based physics and mission simulation system.

## Project Structure

```text
astro-ai-engine/
├── configs/
├── data/
│   ├── raw/
│   └── processed/
├── models/
├── notebooks/
├── src/                     # Python ML pipeline
│   ├── __init__.py
│   ├── dataset.py
│   ├── model.py
│   ├── train.py
│   ├── evaluate.py
│   └── utils.py
├── simulation-work/          # TypeScript simulation engine
│   ├── src/
│   │   ├── battery.ts
│   │   ├── communications.ts
│   │   ├── demo-mission.ts
│   │   ├── engine.ts
│   │   ├── events.ts
│   │   ├── mass.ts
│   │   ├── mission-profiles.ts
│   │   ├── mission-runner.ts
│   │   ├── mission-validation.ts
│   │   ├── objective-evaluator.ts
│   │   ├── orbit.ts
│   │   ├── power.ts
│   │   ├── propulsion.ts
│   │   ├── scoring.ts
│   │   └── telemetry.ts
│   ├── tests/
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
├── .gitignore
├── README.md
└── requirements.txt
```

## Simulation Engine

The simulation engine models spacecraft systems and mission execution.

### Current Modules

| Module | Responsibility |
|---|---|
| `mass.ts` | Spacecraft mass calculations |
| `power.ts` | Power system calculations |
| `battery.ts` | Battery state and energy management |
| `communications.ts` | Communication system behavior |
| `orbit.ts` | Orbital calculations |
| `propulsion.ts` | Propulsion and fuel calculations |
| `events.ts` | Simulation event handling |
| `engine.ts` | Core simulation engine |
| `mission-runner.ts` | Mission execution |
| `mission-validation.ts` | Mission configuration validation |
| `telemetry.ts` | Simulation telemetry |
| `mission-profiles.ts` | Mission configurations |
| `objective-evaluator.ts` | Mission objective evaluation |
| `scoring.ts` | Mission scoring |
| `demo-mission.ts` | Example mission execution |

### Setup

Requirements:

- Node.js
- npm

Open a terminal:

```powershell
cd simulation-work
npm install
```

### Run Tests

```powershell
npm test
```

### Run Type Checking

```powershell
npm run typecheck
```

### Run Demo Mission

```powershell
npm run demo
```

## Machine Learning Pipeline

The Python ML pipeline handles dataset processing, model training, and evaluation.

### Python Modules

| Module | Responsibility |
|---|---|
| `dataset.py` | Dataset loading and preparation |
| `model.py` | Model architecture |
| `train.py` | Model training |
| `evaluate.py` | Model evaluation |
| `utils.py` | Supporting utilities |

### Setup

Requirements:

- Python
- pip

From the repository root:

```powershell
python -m venv .venv
```

Activate the environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

### Training

```powershell
python -m src.train
```

### Evaluation

```powershell
python -m src.evaluate
```

## Development Workflow

1. Create a feature branch before making changes.
2. Keep ML changes inside the Python pipeline unless shared integration requires otherwise.
3. Keep simulator changes inside `simulation-work/`.
4. Add tests for new simulation functionality.
5. Run tests and type checking before pushing.
6. Open a pull request for team review.

## Team

Developed by **Astro Architects** for NASA Space Apps Challenge 2026.
