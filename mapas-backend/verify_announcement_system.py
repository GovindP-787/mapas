"""
Public Announcement System - Verification Script
This script checks if all components are properly configured
"""

import sys
import os
from pathlib import Path

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def print_success(text):
    print(f"✓ {text}")

def print_error(text):
    print(f"✗ {text}")

def print_info(text):
    print(f"ℹ {text}")

def check_python_version():
    """Check Python version"""
    print_header("Python Environment")
    version = sys.version_info
    print_info(f"Python {version.major}.{version.minor}.{version.micro}")
    if version.major >= 3 and version.minor >= 8:
        print_success("Python version compatible")
        return True
    else:
        print_error("Python 3.8+ required")
        return False

def check_environment_file():
    """Check if .env file exists"""
    print_header("Backend Configuration")
    env_path = Path("mapas-backend/.env")
    if env_path.exists():
        print_success(".env file found")
        # Try to read it
        try:
            with open(env_path) as f:
                content = f.read()
                if "MONGODB_URL" in content:
                    print_success("MONGODB_URL configured")
                    return True
                else:
                    print_error("MONGODB_URL not found in .env")
                    return False
        except Exception as e:
            print_error(f"Error reading .env: {e}")
            return False
    else:
        print_error(".env file not found")
        print_info("Create .env from .env.example:")
        print_info("  copy mapas-backend/.env.example mapas-backend/.env")
        return False

def check_python_packages():
    """Check if required Python packages are installed"""
    print_header("Python Dependencies")
    required_packages = {
        "fastapi": "FastAPI framework",
        "pymongo": "MongoDB driver",
        "pyttsx3": "Text-to-Speech",
        "uvicorn": "ASGI server",
    }
    
    all_installed = True
    for package, description in required_packages.items():
        try:
            __import__(package)
            print_success(f"{package} installed ({description})")
        except ImportError:
            print_error(f"{package} not installed - {description}")
            all_installed = False
    
    if not all_installed:
        print_info("Install dependencies: pip install -r requirements.txt")
    
    return all_installed

def check_mongodb_connection():
    """Check MongoDB connection"""
    print_header("MongoDB Connection")
    try:
        from services.database import MongoDBClient
        try:
            client = MongoDBClient()
            db = client.get_db()
            print_success(f"Connected to MongoDB")
            print_info(f"Database: {db.name}")
            collections = db.list_collection_names()
            print_info(f"Collections: {collections}")
            if "announcements" in collections:
                print_success("Announcements collection found")
                return True
            else:
                print_error("Announcements collection not found")
                print_info("Collection will be created on first announcement")
                return True  # Not critical
        except Exception as e:
            print_error(f"Connection failed: {e}")
            print_info("Ensure MongoDB is running on localhost:27017")
            return False
    except ImportError:
        print_error("Cannot import database module")
        print_info("Install dependencies: pip install -r requirements.txt")
        return False

def check_frontend_config():
    """Check frontend configuration"""
    print_header("Frontend Configuration")
    env_path = Path("mapas-dashboard/.env.local")
    if env_path.exists():
        print_success(".env.local file found")
        try:
            with open(env_path) as f:
                content = f.read()
                if "NEXT_PUBLIC_API_URL" in content:
                    print_success("NEXT_PUBLIC_API_URL configured")
                    return True
                else:
                    print_error("NEXT_PUBLIC_API_URL not found")
                    return False
        except Exception as e:
            print_error(f"Error reading .env.local: {e}")
            return False
    else:
        print_error(".env.local file not found")
        print_info("Create .env.local from .env.local.example:")
        print_info("  copy mapas-dashboard/.env.local.example mapas-dashboard/.env.local")
        return False

def check_component_exists():
    """Check if PublicAnnouncementPanel component exists"""
    print_header("Frontend Components")
    component_path = Path("mapas-dashboard/src/components/PublicAnnouncementPanel.tsx")
    if component_path.exists():
        print_success("PublicAnnouncementPanel component found")
        return True
    else:
        print_error("PublicAnnouncementPanel component not found")
        return False

def check_operations_page():
    """Check if operations page exists"""
    print_header("Frontend Pages")
    page_path = Path("mapas-dashboard/src/app/dashboard/operations/page.tsx")
    if page_path.exists():
        print_success("Operations page found")
        return True
    else:
        print_error("Operations page not found")
        return False

def run_all_checks():
    """Run all verification checks"""
    print_header("MAPAS Public Announcement System - Verification")
    
    checks = [
        ("Python Version", check_python_version),
        ("Backend Configuration", check_environment_file),
        ("Python Packages", check_python_packages),
        ("MongoDB Connection", check_mongodb_connection),
        ("Frontend Configuration", check_frontend_config),
        ("Frontend Components", check_component_exists),
        ("Frontend Pages", check_operations_page),
    ]
    
    results = {}
    for check_name, check_func in checks:
        try:
            results[check_name] = check_func()
        except Exception as e:
            print_error(f"Error running {check_name}: {e}")
            results[check_name] = False
    
    # Summary
    print_header("Verification Summary")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for check_name, result in results.items():
        status = "PASS" if result else "FAIL"
        symbol = "✓" if result else "✗"
        print(f"{symbol} {check_name}: {status}")
    
    print(f"\n{passed}/{total} checks passed")
    
    if passed == total:
        print_success("\n🎉 All systems ready!")
        print_info("\nNext steps:")
        print_info("1. Start backend: python main.py")
        print_info("2. Start frontend: npm run dev (in mapas-dashboard)")
        print_info("3. Open: http://localhost:3000/dashboard/operations")
    else:
        print_error("\n⚠️  Some checks failed. See details above.")
        print_info("For help, see: PUBLIC_ANNOUNCEMENT_SYSTEM.md")

if __name__ == "__main__":
    try:
        run_all_checks()
    except KeyboardInterrupt:
        print("\n\nVerification cancelled.")
    except Exception as e:
        print_error(f"\nUnexpected error: {e}")
        sys.exit(1)
