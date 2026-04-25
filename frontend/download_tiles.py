import os
import math
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

# Bounding box
MIN_LAT = 10.5
MAX_LAT = 11.4
MIN_LNG = 76.8
MAX_LNG = 77.6
ZOOMS = [8, 9, 10, 11, 12]

# Directory to save
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "public", "tiles")

# OSM Tile URL
TILE_SERVER = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
USER_AGENT = "OfflineMapDownloader/1.0 (ideathon-project)"

def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return (xtile, ytile)

def download_tile(z, x, y):
    url = TILE_SERVER.format(z=z, x=x, y=y)
    tile_dir = os.path.join(OUTPUT_DIR, str(z), str(x))
    os.makedirs(tile_dir, exist_ok=True)
    filepath = os.path.join(tile_dir, f"{y}.png")

    if os.path.exists(filepath):
        return f"Skipped {z}/{x}/{y}"

    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    
    retries = 3
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                with open(filepath, 'wb') as f:
                    f.write(response.read())
            time.sleep(0.1) # Responsible rate limiting
            return f"Downloaded {z}/{x}/{y}"
        except Exception as e:
            if attempt == retries - 1:
                return f"Failed {z}/{x}/{y}: {e}"
            time.sleep(1)

def main():
    tiles_to_download = []
    
    for z in ZOOMS:
        x_min, y_max = deg2num(MIN_LAT, MIN_LNG, z)
        x_max, y_min = deg2num(MAX_LAT, MAX_LNG, z)
        
        for x in range(x_min, x_max + 1):
            for y in range(y_min, y_max + 1):
                tiles_to_download.append((z, x, y))

    print(f"Total tiles to download: {len(tiles_to_download)}")

    completed = 0
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(download_tile, z, x, y): (z, x, y) for z, x, y in tiles_to_download}
        for future in as_completed(futures):
            res = future.result()
            completed += 1
            if completed % 10 == 0 or completed == len(tiles_to_download):
                print(f"Progress: {completed}/{len(tiles_to_download)} - {res}")

    print("Download finished.")

if __name__ == "__main__":
    main()
