"""
evaluate.py — Evaluate the trained MissionPredictorNet on the test split.

Usage:
    python -m src.evaluate
"""

import os
import sys
import torch
import torch.nn as nn
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

from src.utils import set_seed, load_config, get_device
from src.dataset import get_data_loaders
from src.model import MissionPredictorNet


def evaluate(model_path: str = "models/best_model.pt") -> None:
    config = load_config("configs/config.yaml")
    set_seed(config["project"]["seed"])
    device = get_device()

    csv_path = "data/raw/simulation_training_data.csv"
    if not os.path.isfile(csv_path):
        print(f"❌ Training data not found at {csv_path}!")
        print("   Generate it with: cd simulation-work && npm run generate-data")
        sys.exit(1)

    if not os.path.isfile(model_path):
        print(f"❌ Model checkpoint not found at {model_path}!")
        print("   Train the model first with: python -m src.train")
        sys.exit(1)

    print(f"📂 Loading test data from: {csv_path}")
    _, _, test_loader, _ = get_data_loaders(csv_path, batch_size=config["training"]["batch_size"])

    model = MissionPredictorNet(input_dim=6, hidden_dim=128, output_dim=1).to(device)
    checkpoint = torch.load(model_path, map_location=device)
    model.load_state_dict(checkpoint)
    model.eval()
    print(f"✅ Loaded checkpoint: {model_path}")

    criterion = nn.BCEWithLogitsLoss()
    total_loss = 0.0
    all_preds = []
    all_targets = []
    all_probs = []

    with torch.no_grad():
        for features, targets in test_loader:
            features = features.to(device)
            targets = targets.to(device).unsqueeze(1)

            logits = model(features)
            loss = criterion(logits, targets)
            total_loss += loss.item() * len(targets)

            probs = torch.sigmoid(logits).cpu().numpy().flatten()
            preds = (probs >= 0.5).astype(int)

            all_probs.extend(probs)
            all_preds.extend(preds)
            all_targets.extend(targets.cpu().numpy().flatten().astype(int))

    test_loss = total_loss / len(all_targets)
    acc = accuracy_score(all_targets, all_preds)
    prec = precision_score(all_targets, all_preds, zero_division=0)
    rec = recall_score(all_targets, all_preds, zero_division=0)
    f1 = f1_score(all_targets, all_preds, zero_division=0)
    try:
        auc = roc_auc_score(all_targets, all_probs)
    except Exception:
        auc = float("nan")

    print("\n" + "=" * 50)
    print("📊 MODEL EVALUATION RESULTS ON TEST SET")
    print("=" * 50)
    print(f"   Test Loss:      {test_loss:.4f}")
    print(f"   Accuracy:       {acc * 100:.2f}%")
    print(f"   Precision:      {prec * 100:.2f}%")
    print(f"   Recall:         {rec * 100:.2f}%")
    print(f"   F1-Score:       {f1 * 100:.2f}%")
    print(f"   ROC-AUC:        {auc:.4f}")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    evaluate()
