"""
model.py — MissionPredictorNet
Binary classifier: given 6 mission parameters, predict mission success (1/0).
Uses BCEWithLogitsLoss, so no sigmoid in the forward pass.
"""

import torch
import torch.nn as nn


class MissionPredictorNet(nn.Module):
    """
    Feedforward network for mission success prediction.

    Architecture
    ------------
    Linear(input_dim → hidden_dim)
      └─ BatchNorm1d → ReLU → Dropout(0.3)
         └─ Linear(hidden_dim → 64)
            └─ ReLU → Dropout(0.2)
               └─ Linear(64 → output_dim)   [raw logit, no sigmoid]
    """

    def __init__(
        self,
        input_dim: int = 6,
        hidden_dim: int = 128,
        output_dim: int = 1,
    ) -> None:
        super().__init__()

        self.network = nn.Sequential(
            # Block 1
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            # Block 2
            nn.Linear(hidden_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            # Output
            nn.Linear(64, output_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)
