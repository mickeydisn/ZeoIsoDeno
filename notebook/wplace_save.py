import requests
import time
import os
import hashlib
from datetime import datetime
from PIL import Image, ImageChops
from io import BytesIO

# =============================
# CONFIG
# =============================
INTERVAL = 60 * 60  # 5 minutes in seconds


def get_image_hash(img: Image.Image) -> str:
    """Compute MD5 hash of an image."""
    return hashlib.md5(img.tobytes()).hexdigest()


def download_image(url) -> Image.Image:
    """Download PNG from URL and return as PIL Image."""
    response = requests.get(url)
    response.raise_for_status()
    img = Image.open(BytesIO(response.content)).convert("RGBA")
    return img


def get_latest_file(directory):
    """Return path of the most recent file in SAVE_DIR, or None."""
    files = [os.path.join(directory, f) for f in os.listdir(directory) if f.endswith(".webp")]
    return max(files, key=os.path.getmtime) if files else None


def store_image(img, directory, prefix):
    """Save image with datetime-based filename in WebP format."""
    filename = datetime.now().strftime(f"{prefix}_%Y-%m-%d_%H-%M.webp")
    filepath = os.path.join(directory, filename)
    img.save(filepath, "WEBP", lossless=True, quality=100)
    # print(f"Saved: {filepath}")


def save_diff_image(prev_img, new_img, directory):
    """Save only differences between two images, in WebP format."""
    diff = ImageChops.difference(new_img, prev_img)
    mask = diff.convert("L").point(lambda x: 255 if x > 0 else 0)
    output = Image.new("RGBA", new_img.size, (0, 0, 0, 0))
    output.paste(new_img, mask=mask)
    store_image(output, directory, 'diff')


# =============================
# MAIN LOGIC
# =============================
def process_image(url, save_dir):
    try:
        # latest_file = get_latest_file(save_dir)
        # prev_img = Image.open(latest_file).convert("RGBA") if latest_file else None
        # prev_hash = get_image_hash(prev_img) if prev_img else None

        img = download_image(url)
        store_image(img, save_dir, 'tile')  # first image

        # img_hash = get_image_hash(img)
        # if prev_img is not None and img_hash != prev_hash:
        #     save_diff_image(prev_img, img, save_diff_dir)  # only differences

    except Exception as e:
        print(f"Error: {e}")


def save_tile_image(tile_idX, tile_idY):
    url = f"https://backend.wplace.live/files/s0/tiles/{tile_idX}/{tile_idY}.png"

    save_dir = f"images_save/{tile_idX}-{tile_idY}"
    os.makedirs(save_dir, exist_ok=True)

    # save_diff_dir = f"images_save_diff/{tile_idX}-{tile_idY}"
    # os.makedirs(save_diff_dir, exist_ok=True)

    process_image(url, save_dir)


i = 0
while True:
    now = datetime.now().strftime(f"%Y-%m-%d_%H-%M.webp")
    print('Now', now)
    # Example run
    # Paris
    save_tile_image("1036", "703")
    save_tile_image("1036", "704")
    save_tile_image("1036", "705")

    save_tile_image("1037", "703")
    save_tile_image("1037", "704")
    save_tile_image("1037", "705")
    
    if i > 0:
        i = i - 1
    else:
        i = 2
        # Gaza
        save_tile_image("1219", "835")
        save_tile_image("1219", "836")

        # Londre
        save_tile_image("1023", "680")
        save_tile_image("1023", "681")

        # Washinton
        save_tile_image("585", "783")
        save_tile_image("586", "783")

        # Madride
        save_tile_image("1003", "772")
        # 1003/772.

    time.sleep(INTERVAL)  # 300 seconds = 5 minutes


# caffeinate -i python3 your_script.py
