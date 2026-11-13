"""
dataset.py — AstroAI training data loader
Loads simulation_training_data.csv produced by the TypeScript generator,
scales features, and returns PyTorch DataLoaders.
"""

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from typing import Tuple

# ---------------------------------------------------------------------------
# Column definitions
# ---------------------------------------------------------------------------

FEATURE_COLS = [
    "altitude_km",
    "battery_capacity_wh",
    "panel_area_m2",
    "power_consumed_w",
    "data_rate_mbps",
    "duration_seconds",
]

TARGET_COL = "mission_success"


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------

class AstroDataset(Dataset):
    """Wraps a feature tensor and a target tensor into a PyTorch Dataset."""

    def __init__(self, features: torch.Tensor, targets: torch.Tensor) -> None:
        assert len(features) == len(targets), "features and targets must have the same length"
        self.features = features
        self.targets = targets

    def __len__(self) -> int:
        return len(self.features)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        return self.features[idx], self.targets[idx]


# ---------------------------------------------------------------------------
# Data loading helpers
# ---------------------------------------------------------------------------

def load_mission_data(
    csv_path: str,
    test_size: float = 0.2,
    val_size: float = 0.1,
    seed: int = 42,
) -> Tuple[
    np.ndarray, np.ndarray, np.ndarray,
    np.ndarray, np.ndarray, np.ndarray,
    StandardScaler,
]:
    """
    Load, clean, scale, and split mission data.

    Returns
    -------
    X_train, X_val, X_test, y_train, y_val, y_test, scaler
    """
    df = pd.read_csv(csv_path)

    # Drop rows where the target is missing
    df = df.dropna(subset=[TARGET_COL])

    X = df[FEATURE_COLS].values.astype(np.float32)
    y = df[TARGET_COL].values.astype(np.float32)

    # Scale features
    scaler = StandardScaler()
    X = scaler.fit_transform(X).astype(np.float32)

    # First split: train+val vs test
    X_trainval, X_test, y_trainval, y_test = train_test_split(
        X, y, test_size=test_size, random_state=seed, stratify=y
    )

    # Second split: train vs val (val_size is fraction of original data)
    relative_val_size = val_size / (1.0 - test_size)
    X_train, X_val, y_train, y_val = train_test_split(
        X_trainval, y_trainval,
        test_size=relative_val_size,
        random_state=seed,
        stratify=y_trainval,
    )

    return X_train, X_val, X_test, y_train, y_val, y_test, scaler


def get_data_loaders(
    csv_path: str,
    batch_size: int = 64,
) -> Tuple[DataLoader, DataLoader, DataLoader, StandardScaler]:
    """
    Build train / val / test DataLoaders from a CSV file.

    Returns
    -------
    train_loader, val_loader, test_loader, scaler
    """
    X_train, X_val, X_test, y_train, y_val, y_test, scaler = load_mission_data(csv_path)

    def _make_loader(X: np.ndarray, y: np.ndarray, shuffle: bool) -> DataLoader:
        feat_tensor = torch.tensor(X, dtype=torch.float32)
        tgt_tensor = torch.tensor(y, dtype=torch.float32).unsqueeze(1)
        ds = AstroDataset(feat_tensor, tgt_tensor)
        return DataLoader(ds, batch_size=batch_size, shuffle=shuffle)

    train_loader = _make_loader(X_train, y_train, shuffle=True)
    val_loader   = _make_loader(X_val,   y_val,   shuffle=False)
    test_loader  = _make_loader(X_test,  y_test,  shuffle=False)

    return train_loader, val_loader, test_loader, scaler
