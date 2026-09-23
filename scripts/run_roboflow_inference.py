#!/usr/bin/env python3
"""
Roboflow Serverless Cloud API Inference Runner for BorderGuard AI.
Model: people-detection-o4rdr-3yyvd/1 (Object Detection)

Usage:
  python scripts/run_roboflow_inference.py --image path/to/image.jpg
  python scripts/run_roboflow_inference.py --image "https://example.com/image.jpg"
  python scripts/run_roboflow_inference.py --image test.jpg --api-key YOUR_KEY
"""

import os
import sys
import json
import argparse
from pathlib import Path

# Try to load .env from project root or backend directory if python-dotenv is available
try:
    from dotenv import load_dotenv
    root_dir = Path(__file__).resolve().parent.parent
    load_dotenv(root_dir / ".env")
    load_dotenv(root_dir / "backend" / ".env")
except ImportError:
    pass

try:
    from inference_sdk import InferenceHTTPClient, InferenceConfiguration
except ImportError:
    print("Error: 'inference-sdk' is not installed.")
    print("Please install it with: pip install inference-sdk")
    sys.exit(1)


DEFAULT_MODEL_ID = "people-detection-o4rdr-3yyvd/1"
DEFAULT_API_URL = "https://serverless.roboflow.com"


def get_api_key(cli_key: str = None) -> str:
    """Retrieve the Roboflow API key from CLI args, environment, or .env files."""
    if cli_key:
        return cli_key.strip()
    
    env_key = os.getenv("ROBOFLOW_API_KEY", "").strip()
    if env_key:
        return env_key

    # Also check backend config settings if importable
    try:
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
        from app.core.config import settings
        if getattr(settings, "ROBOFLOW_API_KEY", ""):
            return settings.ROBOFLOW_API_KEY.strip()
    except Exception:
        pass

    return ""


def run_roboflow_inference(image_input: str, model_id: str = DEFAULT_MODEL_ID, api_key: str = None, api_url: str = DEFAULT_API_URL):
    """
    Executes Roboflow Serverless Cloud API inference on a local image path or URL.
    Uses header-based authentication (api_key_transport="header").
    """
    resolved_api_key = get_api_key(api_key)
    if not resolved_api_key:
        print("\n" + "=" * 70)
        print("ERROR: Roboflow API Key not found!")
        print("=" * 70)
        print("Please provide your Roboflow API Key using one of the following methods:")
        print("  1. In PowerShell:")
        print('     $env:ROBOFLOW_API_KEY="your_api_key_here"')
        print("  2. In your .env file:")
        print("     ROBOFLOW_API_KEY=your_api_key_here")
        print("  3. Via the command-line flag:")
        print("     python scripts/run_roboflow_inference.py --image ... --api-key your_api_key_here")
        print("=" * 70 + "\n")
        sys.exit(1)

    print(f"[*] Initializing Roboflow Inference Client...")
    print(f"    - Endpoint: {api_url}")
    print(f"    - Auth Mode: Header-based ('Authorization: Bearer')")
    print(f"    - Model ID: {model_id}")
    print(f"    - Target Image: {image_input}")

    # Header-based authentication (inference v1.5.0+)
    client = InferenceHTTPClient(
        api_url=api_url,
        api_key=resolved_api_key
    ).configure(InferenceConfiguration(
        api_key_transport="header"
    ))

    print("[*] Running inference via Serverless Cloud API...")
    try:
        result = client.infer(image_input, model_id=model_id)
        return result
    except Exception as e:
        print(f"\n[!] Roboflow Inference Failed: {e}")
        raise


def annotate_image(image_path: str, predictions: list, output_path: str):
    """Draws bounding boxes and labels onto the image and saves it."""
    try:
        from PIL import Image, ImageDraw, ImageFont
        img = Image.open(image_path).convert("RGB")
        draw = ImageDraw.Draw(img)

        for p in predictions:
            # Roboflow bounding box is [center_x, center_y, width, height]
            x_center = p.get("x", 0)
            y_center = p.get("y", 0)
            width = p.get("width", 0)
            height = p.get("height", 0)
            confidence = p.get("confidence", 0.0)
            cls_name = p.get("class", "person")

            x_min = max(0, int(x_center - width / 2))
            y_min = max(0, int(y_center - height / 2))
            x_max = int(x_center + width / 2)
            y_max = int(y_center + height / 2)

            # Draw cyan bounding box
            draw.rectangle([x_min, y_min, x_max, y_max], outline="#00E5FF", width=3)

            # Draw label banner
            label = f"{cls_name.upper()} {int(confidence * 100)}%"
            draw.rectangle([x_min, max(0, y_min - 20), x_min + len(label) * 9, y_min], fill="#0B0F17")
            draw.text((x_min + 4, max(0, y_min - 18)), label, fill="#00E5FF")

        img.save(output_path)
        print(f"[+] Saved annotated visualization to: {output_path}")
    except Exception as err:
        print(f"[-] Could not generate annotated image: {err}")


def main():
    parser = argparse.ArgumentParser(description="Run inference using Roboflow model 'people-detection-o4rdr-3yyvd/1'")
    parser.add_argument("--image", "-i", type=str, required=True, help="Path to local image file or remote image URL")
    parser.add_argument("--model-id", "-m", type=str, default=DEFAULT_MODEL_ID, help=f"Roboflow model ID (default: {DEFAULT_MODEL_ID})")
    parser.add_argument("--api-key", "-k", type=str, default=None, help="Roboflow API key (defaults to ROBOFLOW_API_KEY env var)")
    parser.add_argument("--api-url", "-u", type=str, default=DEFAULT_API_URL, help=f"Roboflow API URL (default: {DEFAULT_API_URL})")
    parser.add_argument("--output-json", "-o", type=str, default=None, help="Optional path to save JSON predictions")
    parser.add_argument("--save-annotated", "-s", action="store_true", help="Draw bounding boxes and save annotated output image")

    args = parser.parse_args()

    # Run inference
    result = run_roboflow_inference(
        image_input=args.image,
        model_id=args.model_id,
        api_key=args.api_key,
        api_url=args.api_url
    )

    # Display JSON results
    print("\n" + "=" * 70)
    print("ROBOFLOW INFERENCE RESULT")
    print("=" * 70)
    print(json.dumps(result, indent=2))
    print("=" * 70)

    # Summary table
    predictions = result.get("predictions", [])
    print(f"\nTotal People/Objects Detected: {len(predictions)}")
    for i, pred in enumerate(predictions, 1):
        cls = pred.get("class", "unknown")
        conf = pred.get("confidence", 0.0)
        x = pred.get("x", 0)
        y = pred.get("y", 0)
        w = pred.get("width", 0)
        h = pred.get("height", 0)
        print(f"  [{i}] Class: {cls:<10} Confidence: {conf*100:>5.1f}% | Center: ({x:.1f}, {y:.1f}) Size: {w:.1f}x{h:.1f}")

    # Save output JSON if requested
    if args.output_json:
        with open(args.output_json, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
        print(f"[+] Predictions saved to: {args.output_json}")

    # Draw annotated image if requested and image is local file
    if args.save_annotated and os.path.exists(args.image):
        out_img_path = str(Path(args.image).with_name(f"{Path(args.image).stem}_roboflow_detected.jpg"))
        annotate_image(args.image, predictions, out_img_path)


if __name__ == "__main__":
    main()
