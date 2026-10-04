import subprocess
import time
import json
import urllib.request
import os

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(EDGE):
    EDGE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

CDP_PORT = 9333
BASE = f"http://127.0.0.1:{CDP_PORT}"

# Launch headless browser
p = subprocess.Popen([
    EDGE,
    f"--remote-debugging-port={CDP_PORT}",
    "--remote-allow-origins=*",
    "--user-data-dir=C:/tmp/chrome_admin_debug_test",
    "--headless=new",
    "--disable-gpu",
    "http://localhost:5500/admin.html"
])

time.sleep(3)

try:
    tabs = json.loads(urllib.request.urlopen(f"{BASE}/json").read().decode())
    page_ws = None
    for t in tabs:
        if t.get("type") == "page":
            page_ws = t["webSocketDebuggerUrl"]
            break

    print("Found page WS:", page_ws)
    import websocket
    ws = websocket.create_connection(page_ws)

    msg_id = 0
    def send(method, params=None):
        global msg_id
        msg_id += 1
        ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
        while True:
            raw = ws.recv()
            d = json.loads(raw)
            if d.get("id") == msg_id:
                return d.get("result", {})

    send("Runtime.enable")
    send("Log.enable")
    send("Page.enable")

    def eval_js(code):
        res = send("Runtime.evaluate", {"expression": code, "returnByValue": True, "awaitPromise": True})
        return res.get("result", {}).get("value")

    print("Current URL:", eval_js("window.location.href"))
    print("Page loader display:", eval_js("document.getElementById('pageLoader')?.style?.display"))
    print("Page loader classList:", eval_js("document.getElementById('pageLoader')?.className"))
    print("Access denied display:", eval_js("document.getElementById('accessDeniedView')?.style?.display"))
    print("Admin interface display:", eval_js("document.getElementById('adminInterface')?.style?.display"))

    # Unlock admin if locked
    unlocked = eval_js("localStorage.getItem('safe_space_admin_unlocked')")
    print("Is unlocked:", unlocked)
    if not unlocked:
        print("Setting unlocked in localStorage...")
        eval_js("localStorage.setItem('safe_space_admin_unlocked', 'true'); location.reload();")
        time.sleep(3)
        print("After reload URL:", eval_js("window.location.href"))
        print("Page loader classList after reload:", eval_js("document.getElementById('pageLoader')?.className"))
        print("Page loader display:", eval_js("document.getElementById('pageLoader')?.style?.display"))
        print("Admin interface display:", eval_js("document.getElementById('adminInterface')?.style?.display"))

    # Wait a bit and check again
    time.sleep(2)
    print("2s later loader classList:", eval_js("document.getElementById('pageLoader')?.className"))
    print("Active tab title:", eval_js("document.getElementById('currentTabTitle')?.textContent"))

    # Now simulate clicking Community Posts
    print("Clicking Community Posts tab...")
    eval_js("""
    const postTab = document.querySelector('.admin-nav-item[data-tab=\"posts\"]');
    if (postTab) postTab.click();
    """)
    time.sleep(1)
    print("After clicking posts:")
    print("Current URL:", eval_js("window.location.href"))
    print("Page loader classList:", eval_js("document.getElementById('pageLoader')?.className"))
    print("Page loader display:", eval_js("document.getElementById('pageLoader')?.style?.display"))
    print("Tab-posts display:", eval_js("document.getElementById('tab-posts')?.style?.display"))
    print("Tab title:", eval_js("document.getElementById('currentTabTitle')?.textContent"))
    print("Posts list innerHTML length:", eval_js("document.getElementById('postsListContainer')?.innerHTML?.length"))
    print("Posts list text:", eval_js("document.getElementById('postsListContainer')?.innerText?.substring(0, 200)"))

    # Check console errors
    # Let's see if there are any window errors
    errors = eval_js("window.__errors || []")
    print("Errors:", errors)

except Exception as ex:
    print("Exception during test:", ex)
finally:
    p.kill()
