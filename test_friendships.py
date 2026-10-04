import http.server
import socketserver
import threading
import time
import subprocess
import json
import os
import re

PORT = 8997
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

server = socketserver.TCPServer(('', PORT), H)
threading.Thread(target=server.serve_forever, daemon=True).start()
time.sleep(1)

test_html = """<!DOCTYPE html>
<html>
<body>
<div id="res"></div>
<script src="js/lib/supabase.js"></script>
<script src="js/config.js"></script>
<script src="js/supabase-client.js"></script>
<script>
async function test() {
    // Set logged in user as tacio (60d80c30-97e8-44cf-90e2-3a3c02b9975a)
    const tacioUser = {
        id: '60d80c30-97e8-44cf-90e2-3a3c02b9975a',
        email: 'taciomhae@gmail.com',
        username: 'taciomhae'
    };
    localStorage.setItem('safe_space_user', JSON.stringify(tacioUser));
    
    try {
        const friendships = await SafeSpaceDB.community.getFriendships();
        const members = await SafeSpaceDB.community.getMembers();
        document.getElementById('res').textContent = JSON.stringify({
            friendshipsCount: friendships.length,
            friendships: friendships,
            membersCount: members.length,
            members: members.map(m => ({ id: m.id, username: m.username }))
        });
    } catch (e) {
        document.getElementById('res').textContent = JSON.stringify({ error: e.message || String(e) });
    }
}
test();
</script>
</body>
</html>"""

with open('test_friendships.html', 'w', encoding='utf-8') as f:
    f.write(test_html)

cmd = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '--headless=new',
    '--disable-gpu',
    '--virtual-time-budget=6000',
    '--dump-dom',
    f'http://localhost:{PORT}/test_friendships.html'
]
proc = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')

m = re.search(r'<div id="res">(.*?)</div>', proc.stdout)
if m:
    print('RESULT:')
    try:
        print(json.dumps(json.loads(m.group(1)), indent=2))
    except Exception:
        print(m.group(1))
else:
    print('No result found in DOM')

if os.path.exists('test_friendships.html'):
    os.remove('test_friendships.html')
