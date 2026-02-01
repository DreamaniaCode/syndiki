import zipfile
import os

def create_zip():
    files_to_zip = ['index.html', 'styles.css', 'script.js', 'robots.txt', 'sitemap.xml']
    dir_to_zip = 'assets'
    zip_name = 'syndiki_final.zip'

    try:
        if os.path.exists(zip_name):
            os.remove(zip_name)
            
        with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add root files
            for file in files_to_zip:
                if os.path.exists(file):
                    print(f"Adding {file}")
                    zipf.write(file)
                else:
                    print(f"Warning: {file} not found")

            # Add assets folder
            if os.path.exists(dir_to_zip):
                for root, dirs, files in os.walk(dir_to_zip):
                    for file in files:
                        file_path = os.path.join(root, file)
                        # Keep the assets/ prefix
                        print(f"Adding {file_path}")
                        zipf.write(file_path)
        
        print(f"Successfully created {zip_name}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_zip()
