"""
Reidius Infra — Local Dev Server (Self-Contained)
==================================================
Serves everything from this folder.

Usage:
  python3 serve.py          # default port 8787
  python3 serve.py 9000     # custom port
"""
import http.server, mimetypes, os, sys
from urllib.parse import unquote

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
PORT     = int(sys.argv[1]) if len(sys.argv) > 1 else 8787

mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('font/woff2',             '.woff2')

class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = unquote(path.split('?')[0].split('#')[0]).lstrip('/')
        if not path:
            path = 'index.html'
        return os.path.join(THIS_DIR, path)

    def log_message(self, fmt, *args):
        status = args[1] if len(args) > 1 else '?'
        print(f"  {status}  {self.path[:80]}")

if __name__ == '__main__':
    os.chdir(THIS_DIR)
    print(f"\n  Reidius Infra Dev Server")
    print(f"  {'─'*50}")
    print(f"  http://localhost:{PORT}")
    print(f"  Ctrl+C to stop\n")
    with http.server.ThreadingHTTPServer(('', PORT), Handler) as s:
        s.serve_forever()
