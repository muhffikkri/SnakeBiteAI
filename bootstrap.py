import os
import sys
import urllib.request
import zipfile
import shutil

NODE_VERSION = "20.12.2"
ZIP_URL = f"https://nodejs.org/dist/v{NODE_VERSION}/node-v{NODE_VERSION}-win-x64.zip"
TARGET_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tools")
NODE_DIR = os.path.join(TARGET_DIR, "node")
ZIP_PATH = os.path.join(TARGET_DIR, "node.zip")

def main():
    if not os.path.exists(TARGET_DIR):
        os.makedirs(TARGET_DIR)

    if os.path.exists(NODE_DIR):
        print(f"Node.js directory already exists: {NODE_DIR}")
        return

    print(f"Downloading Node.js v{NODE_VERSION} from {ZIP_URL}...")
    try:
        # User-agent header to avoid potential blocks
        req = urllib.request.Request(
            ZIP_URL,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response, open(ZIP_PATH, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
        print("Download complete.")
    except Exception as e:
        print(f"Error downloading Node.js: {e}")
        sys.exit(1)

    print(f"Extracting Node.js to {TARGET_DIR}...")
    try:
        with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
            zip_ref.extractall(TARGET_DIR)
        print("Extraction complete.")
    except Exception as e:
        print(f"Error extracting Node.js: {e}")
        sys.exit(1)

    # Rename extracted directory to 'node'
    extracted_folder = os.path.join(TARGET_DIR, f"node-v{NODE_VERSION}-win-x64")
    if os.path.exists(extracted_folder):
        os.rename(extracted_folder, NODE_DIR)
        print(f"Renamed extracted folder to {NODE_DIR}")
    else:
        print(f"Could not find extracted folder: {extracted_folder}")
        sys.exit(1)

    # Clean up zip file
    if os.path.exists(ZIP_PATH):
        os.remove(ZIP_PATH)

    print("Node.js portable setup successfully completed.")

if __name__ == "__main__":
    main()
