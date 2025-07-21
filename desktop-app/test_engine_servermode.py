import subprocess
import json
import sys

# Test script for ChimixCheatEngine server mode
# Usage: python test_engine_servermode.py

engine_path = r"build/ChimixCheatEngine.exe"

# Prepare a test command (getProcessList)
cmd = {"id": 1, "type": "getProcessList"}

proc = subprocess.Popen([engine_path, "--server"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

try:
    # Send JSON command
    proc.stdin.write(json.dumps(cmd) + "\n")
    proc.stdin.flush()
    # Read response
    response = proc.stdout.readline()
    print("Engine response:", response.strip())
finally:
    proc.terminate()
    proc.wait()
