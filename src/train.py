"""
train.py — End-to-end training script for MissionPredictorNet.

Usage (from project root):
    python -m src.train

Requires the simulation CSV first. If missing, run:
    cd simulation-work && npm run generate-data
"""

import os
import sys

import torch
import torch.nn as nn

from src.utils import set_seed, load_config, get_device
from src.dataset import get_data_loaders
from src.model import MissionPredictorNet


def train() -> None:
    # ------------------------------------------------------------------
    # Config & reproducibility
    # ------------------------------------------------------------------
    config = load_config("configs/config.yaml")
    seed: int = config["project"]["seed"]
    set_seed(seed)
    device = get_device()

    # ------------------------------------------------------------------
    # Data
    # ------------------------------------------------------------------
    csv_path = "data/raw/simulation_training_data.csv"

    if not os.path.isfile(csv_path):
        print("❌ Training data not found!")
        print(f"   Expected: {csv_path}")
        print()
        print("   Please generate it first:")
        print("     cd simulation-work && npm install && npm run generate-data")
        sys.exit(1)

    batch_size: int = config["training"]["batch_size"]
    print(f"📂 Loading data from: {csv_path}")
    train_loader, val_loader, test_loader, scaler = get_data_loaders(
        csv_path, batch_size=batch_size
    )
    print(
        f"   Splits — train: {len(train_loader.dataset)} | "  # type: ignore[arg-type]
        f"val: {len(val_loader.dataset)} | "                   # type: ignore[arg-type]
        f"test: {len(test_loader.dataset)}"                    # type: ignore[arg-type]
    )

    # ------------------------------------------------------------------
    # Model
    # ------------------------------------------------------------------
    model = MissionPredictorNet(input_dim=6, hidden_dim=128, output_dim=1).to(device)
    print(f"\n🧠 Model: {model.__class__.__name__}")
    print(f"   Parameters: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")

    lr: float = config["training"]["learning_rate"]
    wd: float = config["training"]["weight_decay"]
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=wd)
    criterion = nn.BCEWithLogitsLoss()

    # ------------------------------------------------------------------
    # Training loop
    # ------------------------------------------------------------------
    epochs: int = config["training"]["epochs"]
    save_dir: str = config["training"]["save_dir"]
    os.makedirs(save_dir, exist_ok=True)
    best_model_path = os.path.join(save_dir, "best_model.pt")

    best_val_loss = float("inf")
    print(f"\n🚀 Training for {epochs} epochs...\n")

    for epoch in range(1, epochs + 1):
        # ---- Train ----
        model.train()
        train_loss = 0.0
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            optimizer.zero_grad()
            logits = model(X_batch)
            loss = criterion(logits, y_batch)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(X_batch)
        train_loss /= len(train_loader.dataset)  # type: ignore[arg-type]

        # ---- Validation ----
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch, y_batch = X_batch.to(device), y_batch.to(device)
                logits = model(X_batch)
                loss = criterion(logits, y_batch)
                val_loss += loss.item() * len(X_batch)
                preds = (torch.sigmoid(logits) >= 0.5).float()
                val_correct += (preds == y_batch).sum().item()
                val_total += len(y_batch)

        val_loss /= len(val_loader.dataset)      # type: ignore[arg-type]
        val_acc = val_correct / val_total if val_total else 0.0

        print(
            f"Epoch {epoch:3d}/{epochs} | "
            f"train_loss: {train_loss:.4f} | "
            f"val_loss: {val_loss:.4f} | "
            f"val_acc: {val_acc:.4f}"
        )

        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), best_model_path)

    # ------------------------------------------------------------------
    # Test evaluation
    # ------------------------------------------------------------------
    print(f"\n📊 Evaluating best model on test set ({best_model_path})...")
    model.load_state_dict(torch.load(best_model_path, map_location=device))
    model.eval()

    test_correct = 0
    test_total = 0
    with torch.no_grad():
        for X_batch, y_batch in test_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            logits = model(X_batch)
            preds = (torch.sigmoid(logits) >= 0.5).float()
            test_correct += (preds == y_batch).sum().item()
            test_total += len(y_batch)

    test_acc = test_correct / test_total if test_total else 0.0
    print(f"\n✅ Final test accuracy: {test_acc:.4f} ({test_correct}/{test_total})")
    print(f"   Best model saved to: {best_model_path}")


if __name__ == "__main__":
    train()
