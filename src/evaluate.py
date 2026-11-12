import torch
from src.utils import load_config, get_device
from src.model import MissionPredictorNet


def evaluate(model_checkpoint_path: str = "models/best_model.pt"):
    config = load_config("configs/config.yaml")
    device = get_device()
    print(f"Loading checkpoint from: {model_checkpoint_path}")

    model = MissionPredictorNet().to(device)
    # model.load_state_dict(torch.load(model_checkpoint_path, map_location=device))
    model.eval()
    print("Evaluation pipeline initialized.")


if __name__ == "__main__":
    evaluate()
