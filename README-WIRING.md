# Astro AI Engine — Simulation-to-ML Wiring Guide

This document describes how the TypeScript simulation engine connects to the Python machine learning pipeline.

## Overview

```text
simulation-work/
    |
    v
generate-training-data.ts
    |
    v
Synthetic Mission Dataset (CSV)
    |
    v
src/dataset.py
    |
    v
src/train.py
    |
    v
src/model.py
    |
    v
models/best_model.pt
    |
    v
src/evaluate.py
```

The simulation engine generates mission configurations and outcomes. The Python pipeline uses this generated dataset to train and evaluate a predictive model.

---

## 1. Generate Training Data

From the repository root:

```bash
cd simulation-work
npm install
npm run generate-data
```

The generator executes mission configurations through the simulation engine and exports the resulting dataset.

The generated data is intended for machine learning experiments and is synthetic.

### Dataset Features

The dataset is designed around mission parameters such as:

- Orbital altitude
- Battery capacity
- Solar panel area
- Power consumption
- Communication data rate
- Mission duration

### Target Variables

The generated dataset may include:

- Mission success
- Mission score
- Mission grade

The exact column names, ranges, and output location are defined by the dataset generator.

---

## 2. Train the Model

Return to the repository root:

```bash
cd ..
```

Activate the Python environment if necessary:

```powershell
.\.venv\Scripts\Activate.ps1
```

Run training:

```bash
python -m src.train
```

The training pipeline:

1. Loads the generated dataset.
2. Preprocesses and normalizes features.
3. Splits data into training and validation sets.
4. Trains the neural network.
5. Evaluates validation performance.
6. Saves the best model checkpoint.

The training configuration is defined in:

```text
configs/config.yaml
```

---

## 3. Evaluate the Model

Run:

```bash
python -m src.evaluate
```

The evaluation pipeline loads the saved model and evaluates it using the configured test dataset.

Reported metrics may include:

- Accuracy
- Precision
- Recall
- F1-score
- ROC-AUC

Metric availability depends on the evaluation implementation and target labels.

---

## 4. Pipeline Components

| Component | Responsibility |
|---|---|
| `simulation-work/src/generate-training-data.ts` | Generate synthetic mission data |
| `simulation-work/src/engine.ts` | Execute simulation steps |
| `simulation-work/src/mission-runner.ts` | Coordinate mission execution |
| `src/dataset.py` | Load and preprocess training data |
| `src/model.py` | Define neural network architecture |
| `src/train.py` | Train and checkpoint model |
| `src/evaluate.py` | Evaluate model performance |
| `src/utils.py` | Configuration and training utilities |
| `configs/config.yaml` | ML configuration |

---

## 5. Important Distinction

The physics simulator and machine learning model serve different purposes.

| Simulation Engine | Machine Learning Model |
|---|---|
| Executes configured mission simulation | Learns patterns from generated data |
| Calculates subsystem behavior | Predicts outcomes based on trained parameters |
| Produces mission telemetry and outcomes | Produces model predictions |
| Uses simulation rules and physics models | Uses learned statistical relationships |

The ML model does not replace the physics simulator.

Predictions are only as reliable as the generated data, model training, and evaluation methodology.

---

## 6. Troubleshooting

### Dataset Not Found

Ensure the dataset generator has been executed successfully.

```bash
cd simulation-work
npm run generate-data
```

Check the output path configured by the generator.

### Model Checkpoint Missing

Train the model before evaluating:

```bash
python -m src.train
```

### Python Dependencies Missing

Activate the Python environment and install dependencies:

```bash
pip install -r requirements.txt
```

### Simulator Tests Failing

Run:

```bash
cd simulation-work
npm run typecheck
npm test
```

Resolve simulator errors before generating training data.
