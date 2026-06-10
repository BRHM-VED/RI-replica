import os
import re
import glob
import urllib.request
import urllib.parse
import concurrent.futures
from PIL import Image

# Directory setup
CONVERTED_DIR = "webp_converted"
os.makedirs(CONVERTED_DIR, exist_ok=True)

# Find all Firebase image URLs in HTML and MJS files
URL_PATTERN = re.compile(r'https://firebasestorage\.googleapis\.com/v0/b/ri-website-c476b\.firebasestorage\.app/o/images%2F([^?\s"\'\)]+)\?alt=media')

def process_single_image(item):
    match, filename = item
    if not (filename.lower().endswith('.png') or filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg')):
        return False, filename, "Skipped: not a supported format"
        
    webp_filename = os.path.splitext(filename)[0] + ".webp"
    webp_path = os.path.join(CONVERTED_DIR, webp_filename)
    
    # Check if WebP already exists
    if os.path.exists(webp_path):
        return True, filename, "Skipped: already converted"
        
    url = f"https://firebasestorage.googleapis.com/v0/b/ri-website-c476b.firebasestorage.app/o/images%2F{match}?alt=media"
    temp_path = os.path.join(CONVERTED_DIR, filename)
    
    try:
        # Download the image
        urllib.request.urlretrieve(url, temp_path)
        
        # Convert to WebP
        with Image.open(temp_path) as im:
            # Handle RGBA to RGB conversion if needed for JPEG/WebP or just save WebP
            im.save(webp_path, "WEBP", quality=85)
            
        # Clean up the original downloaded file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return True, filename, "Converted successfully"
    except Exception as e:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        return False, filename, f"Failed: {e}"

def download_and_convert():
    print("Scanning codebase for Firebase Storage image references...")
    files = glob.glob("**/*.html", recursive=True) + glob.glob("**/*.mjs", recursive=True)
    urls = set()
    
    for filepath in files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            for match in URL_PATTERN.findall(content):
                # Unquote the filename (e.g. replacing %2F)
                filename = urllib.parse.unquote(match)
                urls.add((match, filename))
        except Exception:
            pass
            
    print(f"Found {len(urls)} unique image references.")
    
    # Filter only PNG/JPG/JPEG
    valid_urls = [item for item in urls if item[1].lower().endswith(('.png', '.jpg', '.jpeg'))]
    print(f"Of these, {len(valid_urls)} are images to process.")
    
    success_count = 0
    skipped_count = 0
    failed_count = 0
    
    print("Starting concurrent downloads and conversion (using up to 16 workers)...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as executor:
        # Map process_single_image to valid_urls
        results = executor.map(process_single_image, valid_urls)
        
        for success, filename, status in results:
            if success:
                if "already" in status:
                    skipped_count += 1
                else:
                    success_count += 1
                    print(f"[SUCCESS] Converted: {filename}")
            else:
                failed_count += 1
                print(f"[FAILED] {filename}: {status}")
                
    print(f"\nCompleted! Converted {success_count} new images to WebP (skipped {skipped_count}, failed {failed_count}) inside the '{CONVERTED_DIR}/' folder.")
    print("\nNext Steps:")
    print(f"1. Upload all the converted .webp files inside '{CONVERTED_DIR}/' to your Firebase Storage bucket under the 'images' folder.")
    print("2. Run this command to update all codebase references to point to webp:")
    print("   python3 optimize_assets.py replace")

def update_codebase_refs():
    print("Updating codebase references from .png/.jpg to .webp...")
    files = glob.glob("**/*.html", recursive=True) + glob.glob("**/*.mjs", recursive=True)
    
    for filepath in files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            new_content = content
            # Replace image references in URL patterns
            matches = URL_PATTERN.findall(content)
            for match in matches:
                filename = urllib.parse.unquote(match)
                if filename.lower().endswith('.png') or filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg'):
                    new_filename = os.path.splitext(filename)[0] + ".webp"
                    new_match = urllib.parse.quote(new_filename)
                    # Replace in content
                    new_content = new_content.replace(match, new_match)
                    
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated references in: {filepath}")
        except Exception as e:
            print(f"Failed to update {filepath}: {e}")
            
    print("Codebase references successfully updated to .webp!")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "replace":
        update_codebase_refs()
    else:
        # Install Pillow automatically if missing
        try:
            import PIL
        except ImportError:
            print("Installing required Pillow library...")
            os.system("pip3 install Pillow")
        download_and_convert()
