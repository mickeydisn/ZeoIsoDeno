import os
import numpy as np
from PIL import Image, ImageFilter

# =========================
# CONFIGURATION VARIABLES
# =========================
COLOR_TOLERANCE = 25
FADE_THRESHOLD = 5

INPUT_DIR = "./"
OUTPUT_DIR = "./clean"


def get_background_color(img):
    """Estimate background color from all 4 borders"""
    pixels = np.array(img)

    top = pixels[0, :, :3]
    bottom = pixels[-1, :, :3]
    left = pixels[:, 0, :3]
    right = pixels[:, -1, :3]

    border_pixels = np.concatenate((top, bottom, left, right), axis=0)

    # Median is more robust than mean
    return np.median(border_pixels, axis=0)


def create_alpha_mask(img, bg_color):
    """Create smooth alpha mask"""
    pixels = np.array(img).astype(np.float32)

    # Distance from background
    dist = np.linalg.norm(pixels[:, :, :3] - bg_color, axis=2)

    # Normalize mask
    mask = (dist - COLOR_TOLERANCE) / FADE_THRESHOLD
    mask = np.clip(mask, 0, 1)

    # Convert to alpha
    alpha = (mask * 255).astype(np.uint8)

    return alpha


def remove_color_halo(img, alpha):
    """Reduce white/black fringe (edge decontamination)"""
    pixels = np.array(img).astype(np.float32)

    # Avoid division by zero
    alpha_norm = np.clip(alpha / 255.0, 0.01, 1.0)

    # Decontaminate colors (un-premultiply effect)
    pixels[:, :, :3] = pixels[:, :, :3] / alpha_norm[:, :, None]
    pixels[:, :, :3] = np.clip(pixels[:, :, :3], 0, 255)

    result = pixels.astype(np.uint8)
    result[:, :, 3] = alpha

    return Image.fromarray(result, "RGBA")


def process_image(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")

    bg_color = get_background_color(img)

    alpha = create_alpha_mask(img, bg_color)

    # Smooth edges slightly (important for clean assets)
    alpha_img = Image.fromarray(alpha).filter(
        ImageFilter.GaussianBlur(radius=1)
    )

    alpha = np.array(alpha_img)

    clean_img = remove_color_halo(img, alpha)

    clean_img.save(output_path)


def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    for filename in os.listdir(INPUT_DIR):
        if filename.lower().endswith(".png"):
            input_path = os.path.join(INPUT_DIR, filename)
            output_path = os.path.join(OUTPUT_DIR, filename)

            print(f"Processing: {filename}")
            process_image(input_path, output_path)

    print("Done. Ultra-clean assets saved in ./clean/")


if __name__ == "__main__":
    main()