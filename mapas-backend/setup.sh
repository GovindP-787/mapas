#!/bin/bash

# MAPAS Backend Setup Script for Linux/macOS

echo ""
echo "============================================"
echo "MAPAS Food Delivery Backend Setup"
echo "============================================"
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.10+ from https://www.python.org/"
    exit 1
fi

# Check Python version
python3_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "Found Python $python3_version"

echo "[1/4] Creating virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create virtual environment"
    exit 1
fi

echo "[2/4] Activating virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to activate virtual environment"
    exit 1
fi

echo "[3/4] Upgrading pip..."
python3 -m pip install --upgrade pip
if [ $? -ne 0 ]; then
    echo "WARNING: pip upgrade encountered an issue, continuing anyway..."
fi

echo "[4/4] Installing dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "To run the backend:"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
echo "The API will be available at:"
echo "  http://localhost:8000"
echo ""
echo "Interactive API docs:"
echo "  http://localhost:8000/docs"
echo ""
