import os
import re
import sys
import http.server
import socketserver
import mimetypes
import io
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get('PORT', 8081))
DIRECTORY = os.environ.get('DIRECTORY', '.')

if len(sys.argv) > 1:
    PORT = int(sys.argv[1])
if len(sys.argv) > 2:
    DIRECTORY = sys.argv[2]

# Ensure we are serving from the correct root
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

class RangeHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def address_string(self):
        # Override to disable slow reverse DNS lookups on localhost
        return self.client_address[0]

    def send_caching_headers(self, path):
        if path.endswith('.html') or path.endswith('.htm'):
            self.send_header("Cache-Control", "no-cache, must-revalidate")
        else:
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")

    def guess_type(self, path):
        # Serve mjs files correctly
        if path.endswith('.mjs') or path.endswith('.js'):
            return 'application/javascript'
        return super().guess_type(path)

    # Framer clean-URL → HTML file mapping
    CLEAN_ROUTES = {
        '/':                    'index.html',
        '/about-us':            'about.html',
        '/architecture':        'architecture.html',
        '/blog':                'blog.html',
        '/calculator':          'calculator.html',
        '/careers':             'careers.html',
        '/commercial':          'commercial.html',
        '/consult-form':        'consult-form.html',
        '/contact-us':          'contact.html',
        '/interior':            'interior.html',
        '/privacy-policy':      'privacy-policy.html',
        '/residences':          'residences.html',
        '/terms-and-conditions':'terms-and-conditions.html',
        '/thank-you':           'thank-you.html',
    }

    def translate_path(self, path):
        clean_path = path.split('?')[0]

        # Rewrite Framer clean URLs to .html files
        if clean_path in self.CLEAN_ROUTES:
            path = '/' + self.CLEAN_ROUTES[clean_path]
        # Blog post clean URLs: /blog/some-slug → blog/some-slug.html
        elif clean_path.startswith('/blog/') and not clean_path.endswith('.html'):
            slug = clean_path[len('/blog/'):]
            candidate = os.path.join(script_dir, DIRECTORY, 'blog', slug + '.html')
            if os.path.isfile(candidate):
                path = '/blog/' + slug + '.html'

        # Route requests starting with /images/ to /assets/images/
        if clean_path.startswith('/images/'):
            path = '/assets/images/' + path[8:]

        # Map requests to the target directory
        translated = super().translate_path(path)
        rel_path = os.path.relpath(translated, os.getcwd())
        return os.path.join(script_dir, DIRECTORY, rel_path)

    def send_head(self):
        path = self.translate_path(self.path)
        f = None
        if os.path.isdir(path):
            # Check if path (excluding query parameters) ends with a slash
            path_part = self.path.split('?', 1)[0]
            if not path_part.endswith('/'):
                parts = self.path.split('?', 1)
                new_path = parts[0] + '/'
                if len(parts) > 1:
                    new_path += '?' + parts[1]
                self.send_response(301)
                self.send_header("Location", new_path)
                self.end_headers()
                return None
            for index in "index.html", "index.htm":
                index_path = os.path.join(path, index)
                if os.path.exists(index_path):
                    path = index_path
                    break
            else:
                return super().send_head()
                
        ctype = self.guess_type(path)
        
        # Check for custom query parameter "range" (used by Framer's CMS chunk index loader)
        parsed_url = urlparse(self.path)
        query_params = parse_qs(parsed_url.query)
        range_query = query_params.get('range')
        
        if range_query:
            range_str = range_query[0]
            ranges = []
            try:
                for part in range_str.split(','):
                    if '-' in part:
                        start_str, end_str = part.split('-')
                        start = int(start_str)
                        end = int(end_str) if end_str else None
                        ranges.append((start, end))
            except ValueError:
                self.send_error(400, "Invalid range parameter")
                return None

            try:
                size = os.path.getsize(path)
            except OSError:
                self.send_error(404, "File not found")
                return None

            bio = io.BytesIO()
            try:
                with open(path, 'rb') as orig_f:
                    for start, end in ranges:
                        if end is None or end >= size:
                            end = size - 1
                        if start >= size:
                            continue
                        orig_f.seek(start)
                        bio.write(orig_f.read(end - start + 1))
            except OSError:
                self.send_error(404, "File not found")
                return None

            data_length = bio.tell()
            bio.seek(0)
            
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(data_length))
            self.send_caching_headers(path)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            self.range_start = None
            self.range_end = None
            return bio

        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None

        range_header = self.headers.get('Range')
        if range_header:
            match = re.match(r'bytes=(\d+)-(\d*)', range_header)
            if match:
                start = int(match.group(1))
                end = match.group(2)
                end = int(end) if end else None
                
                try:
                    size = os.path.getsize(path)
                except OSError:
                    self.send_error(404, "File not found")
                    f.close()
                    return None
                    
                if end is None or end >= size:
                    end = size - 1
                
                if start >= size:
                    self.send_error(416, "Requested range not satisfiable")
                    f.close()
                    return None
                    
                self.send_response(206)
                self.send_header('Content-Type', ctype)
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
                self.send_header('Content-Length', str(end - start + 1))
                self.send_caching_headers(path)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                
                f.seek(start)
                self.range_start = start
                self.range_end = end
                return f
                
        try:
            size = os.path.getsize(path)
        except OSError:
            self.send_error(404, "File not found")
            f.close()
            return None
            
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(size))
        self.send_header("Accept-Ranges", "bytes")
        self.send_caching_headers(path)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.range_start = None
        self.range_end = None
        return f

    def copyfile(self, source, outputfile):
        if hasattr(self, 'range_start') and self.range_start is not None:
            buffer_size = 256 * 1024  # 256KB chunks for fast local transfers
            bytes_to_send = self.range_end - self.range_start + 1
            while bytes_to_send > 0:
                chunk_size = min(buffer_size, bytes_to_send)
                data = source.read(chunk_size)
                if not data:
                    break
                outputfile.write(data)
                bytes_to_send -= len(data)
        else:
            # 256KB buffer for full-file sends too
            buf_size = 256 * 1024
            while True:
                buf = source.read(buf_size)
                if not buf:
                    break
                outputfile.write(buf)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

# Add JS module mime types
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('application/javascript', '.js')

socketserver.ThreadingTCPServer.allow_reuse_address = True
try:
    with socketserver.ThreadingTCPServer(("", PORT), RangeHTTPRequestHandler) as httpd:
        print(f"✅ Reidius Infra offline legacy MVC server running at http://localhost:{PORT}")
        print(f"📁 Serving files from: {os.path.join(script_dir, DIRECTORY)}")
        httpd.serve_forever()
except Exception as e:
    print(f"❌ Failed to start server: {e}", file=sys.stderr)
    sys.exit(1)
