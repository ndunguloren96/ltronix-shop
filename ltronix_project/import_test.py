import sys
import os

project_dir = os.path.dirname(os.path.abspath('manage.py'))
sys.path.append(project_dir)

try:
    import core
    print("Core module imported successfully!")
except ModuleNotFoundError as e:
    print(f"Core module import failed: {e}")