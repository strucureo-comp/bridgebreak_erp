
import os
from PIL import Image
from collections import Counter
import colorsys

def is_neutral(rgb):
    r, g, b = rgb
    max_c = max(r, g, b)
    min_c = min(r, g, b)
    if (max_c - min_c) < 20 and max_c > 200: # Near white
        return True
    if (max_c - min_c) < 20 and max_c < 50: # Near black
        return True
    return False

def get_accent_colors(image_path, num_colors=10):
    try:
        image = Image.open(image_path)
        image = image.convert('RGB')
        image = image.resize((200, 200)) 
        pixels = list(image.getdata())
        
        # Filter out neutrals
        pixels = [p for p in pixels if not is_neutral(p)]
        
        counts = Counter(pixels)
        dominant = counts.most_common(num_colors)
        return dominant
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return []

def rgb_to_hex(rgb):
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

def rgb_to_hsl(r, g, b):
    r /= 255.0
    g /= 255.0
    b /= 255.0
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return int(h * 360), int(s * 100), int(l * 100)

image_dir = '/Users/user/.gemini/antigravity/brain/78cb5778-3c49-4193-a8e1-8139506b8f05'
files = [f for f in os.listdir(image_dir) if f.startswith('uploaded_media') and (f.endswith('.png') or f.endswith('.jpg'))]

print("Analyzing images for accents...")
all_colors = []

for file in files:
    path = os.path.join(image_dir, file)
    print(f"\nFile: {file}")
    colors = get_accent_colors(path)
    for color, count in colors:
        hex_val = rgb_to_hex(color)
        hsl_val = rgb_to_hsl(*color)
        print(f"  Color: RGB{color} HEX: {hex_val} HSL: {hsl_val} Count: {count}")
        all_colors.append((color, count))

# Aggregate
print("\nGlobal Accent Colors:")
global_counts = Counter()
for color, count in all_colors:
    global_counts[color] += count

for color, count in global_counts.most_common(15):
    hex_val = rgb_to_hex(color)
    hsl_val = rgb_to_hsl(*color)
    print(f"  Color: RGB{color} HEX: {hex_val} HSL: {hsl_val} Count: {count}")
