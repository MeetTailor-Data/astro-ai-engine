"""
utils.py — Shared utilities for the AstroAI training pipeline.
"""

import os
import random
import numpy as np
import torch
import yaml
from typing import Any, Dict


def set_seed(seed: int = 42) -> None:
    """Seed Python, NumPy, and PyTorch for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def get_device() -> torch.device:
    """Return CUDA device if available, otherwise CPU."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"🖥️  Using device: {device}")
    return device


def load_config(config_path: str) -> Dict[str, Any]:
    """Load a YAML config file and return it as a dict."""
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    return config
