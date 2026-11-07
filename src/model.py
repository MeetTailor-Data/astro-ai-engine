import torch
import torch.nn as nn


class MissionPredictorNet(nn.Module):
    """
    Modular neural network backbone for regression or classification.
    Easily adaptable for deep learning experiments.
    """

    def __init__(self, input_dim: int = 16, hidden_dim: int = 64, output_dim: int = 1):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, output_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)
