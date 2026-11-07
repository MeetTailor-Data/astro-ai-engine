import os
import torch
import torch.nn as nn
from src.utils import set_seed, load_config, get_device
from src.model import MissionPredictorNet


def train():
    config = load_config("configs/config.yaml")
    set_seed(config["project"]["seed"])
    device = get_device()

    print(f"Starting training run for {config['project']['name']}...")
    os.makedirs(config["training"]["save_dir"], exist_ok=True)

    # Initialize model
    model = MissionPredictorNet().to(device)
    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=config["training"]["learning_rate"],
        weight_decay=config["training"]["weight_decay"],
    )
    criterion = nn.MSELoss()

    print("Model initialized:")
    print(model)
    print("\nReady to attach training data in src/dataset.py!")


if __name__ == "__main__":
    train()
