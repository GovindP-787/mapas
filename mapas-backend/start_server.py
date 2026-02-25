#!/usr/bin/env python3
"""
Start backend on port 8002
"""
import os
os.environ['PORT'] = '3000'

import uvicorn
from main import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000, log_level="info")