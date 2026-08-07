import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))

print(f"✅ جاري تشغيل السيرفر المحلي (بدون كاش) على: http://localhost:{PORT}")
print("🛑 لإيقاف السيرفر، اقفل النافذة دي أو اضغط Ctrl+C")

webbrowser.open(f"http://localhost:{PORT}")

socketserver.TCPServer.allow_reuse_address = True

try:
    with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n👋 تم إيقاف السيرفر بنجاح.")