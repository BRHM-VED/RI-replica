"""
Reidius Infra — Local Dev Server (Self-Contained)
==================================================
Features:
  - Gzip compression for HTML, JS, CSS, SVG (10-15x smaller transfers)
  - Clean URL routing (/about-us → about.html, etc.)
  - Aggressive caching for assets (1 year), no-cache for HTML
  - CORS headers for local development
  - Blog slug routing

Usage:
  python3 serve.py          # default port 8787
  python3 serve.py 9000     # custom port
"""
import gzip
import http.server
import io
import mimetypes
import os
import sys
from urllib.parse import unquote

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
PORT     = int(sys.argv[1]) if len(sys.argv) > 1 else 8787

mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('font/woff2',             '.woff2')
mimetypes.add_type('image/webp',             '.webp')
mimetypes.add_type('image/avif',             '.avif')

# Types that benefit significantly from gzip compression
GZIP_TYPES = {
    'application/javascript',
    'text/css',
    'text/html',
    'text/plain',
    'application/json',
    'image/svg+xml',
    'font/woff',          # woff2 is already compressed, skip
}

# Framer clean-URL → HTML file mapping
CLEAN_ROUTES = {
    '/':                     'index.html',
    '/about-us':             'about.html',
    '/architecture':         'architecture.html',
    '/blog':                 'blog.html',
    '/calculator':           'calculator.html',
    '/careers':              'careers.html',
    '/commercial':           'commercial.html',
    '/consult-form':         'consult-form.html',
    '/contact-us':           'contact.html',
    '/interior':             'interior.html',
    '/privacy-policy':       'privacy-policy.html',
    '/residences':           'residences.html',
    '/terms-and-conditions': 'terms-and-conditions.html',
    '/thank-you':            'thank-you.html',
}


class Handler(http.server.SimpleHTTPRequestHandler):

    def translate_path(self, path):
        # Strip query string and fragment
        clean = unquote(path.split('?')[0].split('#')[0])

        # Resolve Framer clean URLs (e.g. /about-us → about.html)
        if clean in CLEAN_ROUTES:
            return os.path.join(THIS_DIR, CLEAN_ROUTES[clean])

        # Blog posts: /blog/some-slug → blog/some-slug.html
        if clean.startswith('/blog/') and not clean.endswith('.html'):
            candidate = os.path.join(THIS_DIR, 'blog', clean[len('/blog/'):] + '.html')
            if os.path.isfile(candidate):
                return candidate

        # Default: serve file as-is
        rel = clean.lstrip('/')
        if not rel:
            rel = 'index.html'
        return os.path.join(THIS_DIR, rel)

    def do_GET(self):
        # --- Firebase Storage Proxy ---
        if self.path.startswith('/v0/b/ri-website-c476b.firebasestorage.app/'):
            import urllib.request
            firebase_url = "https://firebasestorage.googleapis.com" + self.path
            try:
                req = urllib.request.Request(
                    firebase_url,
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(req) as response:
                    data = response.read()
                    self.send_response(200)
                    ctype = response.headers.get('Content-Type', 'application/octet-stream')
                    self.send_header('Content-Type', ctype)
                    self.send_header('Content-Length', str(len(data)))
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
                    self.end_headers()
                    self.wfile.write(data)
                    return
            except Exception as e:
                self.send_error(500, f"Firebase proxy error: {str(e)}")
                return

        path = self.translate_path(self.path)

        # --- 404 check ---
        if not os.path.isfile(path):
            self.send_error(404, 'File not found')
            return

        ctype = self.guess_type(path)
        is_html = path.endswith('.html') or path.endswith('.htm')

        # --- Read file ---
        with open(path, 'rb') as f:
            raw_data = f.read()

        # --- Gzip compression ---
        accept_enc = self.headers.get('Accept-Encoding', '')
        use_gzip = 'gzip' in accept_enc and ctype in GZIP_TYPES

        if use_gzip:
            buf = io.BytesIO()
            with gzip.GzipFile(fileobj=buf, mode='wb', compresslevel=6) as gz:
                gz.write(raw_data)
            data = buf.getvalue()
        else:
            data = raw_data

        # --- Send response ---
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Vary', 'Accept-Encoding')

        # Cache headers: HTML = no-cache, assets = 1 year
        if is_html:
            self.send_header('Cache-Control', 'no-cache, must-revalidate')
        else:
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')

        # Force download for PDF files (prevents browser from opening inline)
        if path.endswith('.pdf'):
            import os as _os
            filename = _os.path.basename(path)
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')

        if use_gzip:
            self.send_header('Content-Encoding', 'gzip')

        self.end_headers()
        self.wfile.write(data)

    def guess_type(self, path):
        if path.endswith('.mjs') or path.endswith('.js'):
            return 'application/javascript'
        return super().guess_type(path)

    def log_message(self, fmt, *args):
        status = args[1] if len(args) > 1 else '?'
        enc = ' [gz]' if status == '200' else ''
        print(f"  {status}  {self.path[:80]}")


if __name__ == '__main__':
    os.chdir(THIS_DIR)
    print(f"\n  Reidius Infra Dev Server")
    print(f"  {'─'*50}")
    print(f"  http://localhost:{PORT}")
    print(f"  Gzip compression: ON")
    print(f"  Asset caching: ON (1 year)")
    print(f"  Ctrl+C to stop\n")
    with http.server.ThreadingHTTPServer(('', PORT), Handler) as s:
        s.serve_forever()
