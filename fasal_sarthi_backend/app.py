import os
import sys

# Add directory containing this script to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    # Never hardcode debug=True in production
    app.run(host='0.0.0.0', port=port, debug=app.config.get('DEBUG', False))