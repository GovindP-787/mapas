#!/usr/bin/env python3
"""
Start backend on port 8002
"""
import os
os.environ['PORT'] = '8002'

import uvicorn
from main import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")