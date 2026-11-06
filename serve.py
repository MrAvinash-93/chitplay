"""ChitPlay dev server: plain static files, but tells the browser not to cache
them, so edited ES modules are always picked up on a normal reload.

    python serve.py          # http://127.0.0.1:8000
    python serve.py 9000     # custom port
"""
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript'}

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = http.server.ThreadingHTTPServer(('0.0.0.0', port), NoCacheHandler)
    print(f'ChitPlay running at http://127.0.0.1:{port}  (Ctrl+C to stop)')
    server.serve_forever()
