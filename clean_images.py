import os
from PIL import Image
from rembg import remove

images_dir = "public/images"
images = ["earth_happy.webp", "earth_sweating.webp", "earth_thinking.webp"]

for img_name in images:
    path = os.path.join(images_dir, img_name)
    if os.path.exists(path):
        print(f"Processing {img_name}...")
        with open(path, "rb") as i:
            input_data = i.read()
        
        output_data = remove(input_data)
        
        with open(path, "wb") as o:
            o.write(output_data)
        print(f"Saved {img_name}.")
    else:
        print(f"Skipping {img_name}, not found.")
