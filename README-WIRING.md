# 🛰️ Astro AI Engine — Data Bridge Wiring Guide

This document explains how the **TypeScript simulation engine** feeds data into the **Python ML training pipeline**.

---

## Overview

```
simulation-work/ (TypeScript)          src/ (Python)
  └─ generate-training-data.ts   →    dataset.py → train.py → model.py
         ↓ runs 5000 missions               ↓ loads CSV
  data/raw/simulation_training_data.csv     ↓ trains
                                       models/best_model.pt
```

---

## Step-by-Step

### Step 1 — Generate Training Data

```bash
cd simulation-work
npm install
npm run generate-data
```

**What it does:**  
Runs 5 000 randomised mission configurations through the physics simulation engine (`custom-mission-runner.ts`). Each mission varies altitude, battery capacity, solar panel area, power consumption, data rate, and duration. Results — including whether the mission succeeded and its score — are written to `data/raw/simulation_training_data.csv`.

> [!NOTE]
> This step takes ~10–60 seconds depending on your machine. Progress is printed every 500 rows.

---

### Step 2 — Train the ML Model

```bash
cd ..
python -m src.train
```

**What it does:**  
Loads the CSV, standardises the 6 input features, and trains `MissionPredictorNet` — a 3-layer feedforward network with batch normalisation and dropout. The best model (lowest validation loss) is saved to `models/best_model.pt`. Epoch-by-epoch train loss, validation loss, and validation accuracy are printed.

> [!TIP]
> Training runs on GPU automatically if CUDA is available; falls back to CPU otherwise.

---

### Step 3 — Evaluate the Saved Model

```bash
python -m src.evaluate
```

**What it does:**  
Loads `models/best_model.pt` and evaluates it on the held-out test split, reporting accuracy, precision, recall, and F1 score.

---

## CSV Schema (`simulation_training_data.csv`)

| Column | Type | Range | Description |
|---|---|---|---|
| `altitude_km` | int | 300–10 000 | Orbital altitude |
| `battery_capacity_wh` | float | 500–5 000 | Battery energy capacity |
| `panel_area_m2` | float | 1–10 | Solar panel surface area |
| `power_consumed_w` | float | 50–800 | Spacecraft power draw |
| `data_rate_mbps` | float | 1–15 | Downlink data rate |
| `duration_seconds` | int | 300–7 200 | Mission duration |
| `mission_success` | int | 0 or 1 | Label (1 = COMPLETED) |
| `total_score` | float | 0–100 | Mission score |
| `grade` | str | S/A/B/C/D/F | Letter grade |

---

## File Map

| File | Role |
|---|---|
| `simulation-work/src/generate-training-data.ts` | Data generator (TypeScript) |
| `src/dataset.py` | PyTorch Dataset + DataLoader factory |
| `src/model.py` | `MissionPredictorNet` architecture |
| `src/train.py` | Training loop + best-model checkpoint |
| `src/utils.py` | `set_seed`, `load_config`, `get_device` |
| `configs/config.yaml` | Hyperparameter config |
| `data/raw/simulation_training_data.csv` | Generated training data |
| `models/best_model.pt` | Saved model weights |
