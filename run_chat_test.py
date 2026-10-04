import http.server
import socketserver
import subprocess
import threading
import time
import urllib.request
import json
import os
import sys

PORT = 8765

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

test_runner_html = """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Test Chat Logic</title></head>
<body>
<div id="results">Running tests...</div>
<script src="js/config.js"></script>
<script src="js/supabase-client.js"></script>
<script>
window.testOutput = [];
function log(msg, pass) {
    window.testOutput.push({ msg: msg, pass: pass });
    console.log((pass ? 'PASS: ' : 'FAIL: ') + msg);
}

async function runAllTests() {
    try {
        localStorage.clear();
        initLocalStorage();

        // Set current logged-in user
        const currentUser = INITIAL_DEMO_DATA.currentUser;
        localStorage.setItem('safe_space_user', JSON.stringify(currentUser));

        // Test 1: SafeSpaceDB.users.isOnline
        const onlineUser = { last_active: new Date().toISOString(), is_online: true };
        const offlineUser = { last_active: new Date(Date.now() - 3600000).toISOString(), is_online: false };
        const aiBot = { id: 'safe-space-ai-bot', isAi: true };

        log("Test 1 - Online user returns true", SafeSpaceDB.users.isOnline(onlineUser) === true);
        log("Test 2 - Offline user returns false", SafeSpaceDB.users.isOnline(offlineUser) === false);
        log("Test 2b - AI Bot returns true", SafeSpaceDB.users.isOnline(aiBot) === true);

        // Test 3: Find People filtering rules
        const findPeople = await SafeSpaceDB.community.getFindPeopleUsers();
        const ids = findPeople.map(u => u.id);
        const names = findPeople.map(u => u.username);

        log("Test 3 - Current user excluded", !ids.includes(currentUser.id));
        log("Test 4 - Safe Space AI Bot excluded", !ids.includes('safe-space-ai-bot'));
        log("Test 5 - Friend 'Lovely' excluded", !names.includes('Lovely'));
        log("Test 6 - Friend 'jordan_lee' excluded", !names.includes('jordan_lee'));
        log("Test 7 - Chat partner 'Strongest' excluded", !names.includes('Strongest'));
        log("Test 8 - Chat partner 'Daddyrob' excluded", !names.includes('Daddyrob'));
        log("Test 9 - Chat partner 'counselor_sam' excluded", !names.includes('counselor_sam'));
        log("Test 10 - Blocked user 'John' excluded", !names.includes('John'));

        // Test 11: Eligible users Maria & Anna included
        const maria = findPeople.find(u => u.username === 'Maria');
        const anna = findPeople.find(u => u.username === 'Anna');

        log("Test 11 - Eligible user Maria included", Boolean(maria));
        log("Test 12 - Maria is online", maria && maria.is_online === true);
        log("Test 13 - Eligible user Anna included", Boolean(anna));
        log("Test 14 - Anna is offline", anna && anna.is_online === false);

        // Test 15: Search bar filtering (existing friends/chats never leak)
        const searchStrongest = await SafeSpaceDB.community.getFindPeopleUsers('Strongest');
        log("Test 15 - Search for existing chat 'Strongest' returns 0 in Find People", searchStrongest.length === 0);
        const searchLovely = await SafeSpaceDB.community.getFindPeopleUsers('Lovely');
        log("Test 16 - Search for friend 'Lovely' returns 0 in Find People", searchLovely.length === 0);
        const searchMaria = await SafeSpaceDB.community.getFindPeopleUsers('Maria');
        log("Test 17 - Search for eligible user 'Maria' returns Maria", searchMaria.length === 1 && searchMaria[0].username === 'Maria');

        // Test 18: Dynamic transition - User messages Maria
        await SafeSpaceDB.messages.sendMessage('user-maria', 'Hi Maria! Welcome to Safe Space.');
        const updatedFindPeople = await SafeSpaceDB.community.getFindPeopleUsers();
        const updatedNames = updatedFindPeople.map(u => u.username);
        log("Test 18 - Maria removed from Find People after chatting", !updatedNames.includes('Maria'));

        const convos = await SafeSpaceDB.messages.getConversations();
        const mariaConvo = convos.find(c => c.user_id === 'user-maria');
        log("Test 19 - Maria present in Recent Conversations", Boolean(mariaConvo));

        // Test 20: No duplicate conversations
        await SafeSpaceDB.messages.sendMessage('user-maria', 'Second message to Maria');
        const convosAfterSecondMsg = await SafeSpaceDB.messages.getConversations();
        const mariaConvos = convosAfterSecondMsg.filter(c => c.user_id === 'user-maria');
        log("Test 20 - No duplicate conversations created for Maria", mariaConvos.length === 1);

        // Also message taylor_sky (who had a pending friend request)
        await SafeSpaceDB.messages.sendMessage('user-demo-3', 'Hi Taylor!');
        // Message Anna
        await SafeSpaceDB.messages.sendMessage('user-anna', 'Hi Anna!');
        const emptyFindPeople = await SafeSpaceDB.community.getFindPeopleUsers();
        log("Test 21 - Find People is 0 when all eligible users connected", emptyFindPeople.length === 0);

        document.getElementById('results').textContent = JSON.stringify(window.testOutput);
        window.testFinished = true;
    } catch (err) {
        log("Exception in tests: " + err.message, false);
        document.getElementById('results').textContent = JSON.stringify(window.testOutput);
        window.testFinished = true;
    }
}
runAllTests();
</script>
</body>
</html>
"""

with open("test_chat_runner.html", "w", encoding="utf-8") as f:
    f.write(test_runner_html)

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
user_data_dir = os.path.abspath("temp_chrome_profile")

cmd = [
    chrome_path,
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=6000",
    "--dump-dom",
    f"--user-data-dir={user_data_dir}",
    f"http://localhost:{PORT}/test_chat_runner.html"
]

res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
output = res.stdout

import re
match = re.search(r'<div id="results">(.*?)</div>', output, re.DOTALL)
if match:
    raw = match.group(1).strip()
    try:
        data = json.loads(raw)
        all_passed = True
        for item in data:
            status = "[PASS]" if item.get("pass") else "[FAIL]"
            print(f"{status}: {item.get('msg')}")
            if not item.get("pass"):
                all_passed = False
        print("\n" + ("="*40))
        if all_passed:
            print("ALL TESTS PASSED SUCCESSFULLY!")
        else:
            print("SOME TESTS FAILED")
        print("="*40)
    except Exception as e:
        print("Could not parse results JSON:", raw, e)
else:
    print("Could not find results div in output:\n", output[:500])

# Clean up
if os.path.exists("test_chat_runner.html"):
    os.remove("test_chat_runner.html")
if os.path.exists(user_data_dir):
    import shutil
    try:
        shutil.rmtree(user_data_dir)
    except Exception:
        pass

