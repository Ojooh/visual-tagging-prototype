import sys
import json
import torch
import logging
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

# silence warning messages
logging.getLogger("transformers").setLevel(logging.ERROR)

# Define labels/tags you want to detect (can be dynamic too)
CANDIDATE_LABELS = [
    "person", "car", "tree", "cat", "dog", "building", "food",
    "computer", "laptop", "mobile phone", "table", "office",
    "indoor", "outdoor", "nature", "technology", "security camera",
    "storefront", "logo", "product"
]

class ImageAnalyzer:
    def __init__(self, model_name="openai/clip-vit-base-patch32"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = CLIPModel.from_pretrained(model_name).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(model_name)

    def analyze_image(self, image_path, labels=CANDIDATE_LABELS, top_k=5):
        try:
            image = Image.open(image_path).convert("RGB")

            inputs = self.processor(
                text=labels,
                images=image,
                return_tensors="pt",
                padding=True
            ).to(self.device)

            outputs = self.model(**inputs)
            logits_per_image = outputs.logits_per_image  # shape: [1, num_labels]
            probs = logits_per_image.softmax(dim=1).detach().cpu().numpy()[0]

            results = sorted(
                [{"label": label, "score": float(score)} for label, score in zip(labels, probs)],
                key=lambda x: x["score"],
                reverse=True
            )[:top_k]

            return results
        except Exception as e:
            return [{"error": f"Failed to process {image_path}: {str(e)}"}]

    def analyze_batch(self, image_paths):
        result = {}
        for path in image_paths:
            result[path] = self.analyze_image(path)
        return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image paths provided"}))
        sys.exit(1)

    image_paths = sys.argv[1:]
    analyzer = ImageAnalyzer()
    result = analyzer.analyze_batch(image_paths)

    print("###### Pyhton Result start")
    print(json.dumps(result))
    print("###### Python Result end")
