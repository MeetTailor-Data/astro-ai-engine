# 🚀 Astro AI Engine — ML Training & Data Pipeline

Machine learning modeling, training pipelines, and dataset processing repository for **astro-ai-engine**.

---

## 📂 Project Structure

```text
astro-ai-engine/
├── configs/
│   └── config.yaml          # Model and training hyperparameters
├── data/
│   ├── raw/                 # Raw datasets (kept local, ignored by git)
│   └── processed/           # Cleaned/transformed data
├── models/                  # Saved weights & checkpoints (.pt, .pkl - gitignored)
├── notebooks/               # Team Jupyter notebooks for EDA and experimentation
├── src/
│   ├── __init__.py
│   ├── dataset.py           # Dataset loaders and transforms
│   ├── model.py             # Neural network / ML model architectures
│   ├── train.py             # Training loop and checkpoint saving
│   ├── evaluate.py          # Validation and evaluation metrics
│   └── utils.py             # Seed setting, GPU detection, config loader
├── .gitignore               # Ignores large datasets, caches, model weights
├── requirements.txt         # Python dependencies
└── README.md
```

---

## ⚡ Quickstart

### 1. Clone the repository
```bash
git clone https://github.com/MeetTailor-Data/astro-ai-engine.git
cd astro-ai-engine
```

### 2. Set up virtual environment
```bash
python -m venv venv

# On Windows:
venv\Scripts\activate

# On Linux/macOS:
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

---

## 🏋️‍♂️ Training Models

1. Place your dataset inside `data/raw/`.
2. Configure parameters (epochs, learning rate, batch size) in `configs/config.yaml`.
3. Run training:
```bash
python -m src.train
```

---

## 🤝 Team Contribution Workflow

To avoid code conflicts when working together:
1. Always pull latest changes before starting:
   ```bash
   git pull origin main
   ```
2. Create your own branch for a feature or experiment:
   ```bash
   git checkout -b feature/your-name-model-experiment
   ```
3. Commit and push your branch:
   ```bash
   git add .
   git commit -m "Add feature extraction pipeline"
   git push origin feature/your-name-model-experiment
   ```
4. Open a Pull Request on GitHub to merge into `main`.
