#!/usr/bin/env python3
import os
from PIL import Image

def main():
    # Define directories
    current_dir = os.path.dirname(os.path.abspath(__file__))
    save_dir = os.path.join(current_dir, 'save')
    
    # Create save directory if it doesn't exist
    os.makedirs(save_dir, exist_ok=True)
    
    # Process each image file
    for filename in os.listdir(current_dir):
        # Process both PNG and JPG images
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            input_path = os.path.join(current_dir, filename)
            
            try:
                # Open image
                with Image.open(input_path) as img:
                    width, height = img.size
                    
                    # Split image vertically into two equal columns
                    half_width = width // 2
                    
                    # Crop left column (col1) and right column (col2)
                    col1 = img.crop((0, 0, half_width, height))
                    col2 = img.crop((half_width, 0, width, height))
                    
                    # Create new image: col2 placed under col1
                    new_height = height * 2
                    new_img = Image.new('RGBA' if img.mode == 'RGBA' else 'RGB', (half_width, new_height))
                    
                    # Paste columns vertically
                    new_img.paste(col1, (0, 0))
                    new_img.paste(col2, (0, height))
                    
                    # Save the result
                    base_name = os.path.splitext(filename)[0]
                    output_path = os.path.join(save_dir, f"{base_name}_split.png")
                    new_img.save(output_path, 'PNG')
                    
                    print(f"Processed: {filename} -> {os.path.basename(output_path)}")
                    
            except Exception as e:
                print(f"Error processing {filename}: {str(e)}")

if __name__ == "__main__":
    # Check if Pillow is installed
    try:
        import PIL
    except ImportError:
        print("Pillow library not found. Install it with: pip install pillow")
        exit(1)
    
    main()
    print("\n✅ All images processed successfully!")