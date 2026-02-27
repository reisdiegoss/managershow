import traceback
import sys

try:
    import app.main
    print("API Loaded OK - NO ERRORS")
except Exception as e:
    print("=== FULL TRACEBACK ===")
    traceback.print_exc()
    sys.exit(1)
