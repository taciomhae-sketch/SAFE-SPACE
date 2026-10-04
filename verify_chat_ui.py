import http.server
import socketserver
import subprocess
import threading
import time
import os

PORT = 8766

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

def run_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()
time.sleep(1)

test_entry = """<!DOCTYPE html>
<html>
<body>
<script src="js/config.js"></script>
<script src="js/supabase-client.js"></script>
<script>
localStorage.setItem('safe_space_user', JSON.stringify(INITIAL_DEMO_DATA.currentUser));
window.location.href = 'chat.html';
</script>
</body>
</html>
"""

with open("test_entry.html", "w", encoding="utf-8") as f:
    f.write(test_entry)

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
user_data_dir = os.path.abspath("temp_chrome_profile_ui")
screenshot_path = os.path.abspath("chat_page_rendered.png")

cmd = [
    chrome_path,
    "--headless=new",
    "--disable-gpu",
    "--window-size=1280,800",
    "--virtual-time-budget=6000",
    f"--screenshot={screenshot_path}",
    f"--user-data-dir={user_data_dir}",
    f"http://localhost:{PORT}/test_entry.html"
]

subprocess.run(cmd, timeout=15)

if os.path.exists("test_entry.html"):
    os.remove("test_entry.html")

if os.path.exists(screenshot_path):
    print("Screenshot generated:", os.path.getsize(screenshot_path), "bytes")
else:
    print("Screenshot failed")

# Cleanup temp profile
if os.path.exists(user_data_dir):
    import shutil
    try:
        shutil.rmtree(user_data_dir)
    except Exception:
        pass
