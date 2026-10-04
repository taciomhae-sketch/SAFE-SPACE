import subprocess
import time
import json
import urllib.request
import os

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(EDGE):
    EDGE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

CDP_PORT = 9444
BASE = f"http://127.0.0.1:{CDP_PORT}"

# Launch headless browser
p = subprocess.Popen([
    EDGE,
    f"--remote-debugging-port={CDP_PORT}",
    "--remote-allow-origins=*",
    "--user-data-dir=C:/tmp/chrome_admin_cases_test",
    "--headless=new",
    "--disable-gpu",
    "about:blank"
])

time.sleep(2)

try:
    tabs = json.loads(urllib.request.urlopen(f"{BASE}/json").read().decode())
    page_ws = tabs[0]["webSocketDebuggerUrl"]

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

    def navigate(url):
        send("Page.navigate", {"url": url})
        time.sleep(3)

    print("\n=== CASE 1: Fresh / Not logged in, No unlocked flag ===")
    navigate("http://localhost:5500/admin.html")
    # clear storage
    eval_js("localStorage.clear(); location.reload();")
    time.sleep(3)

    print("URL:", eval_js("window.location.href"))
    print("Page loader display:", eval_js("document.getElementById('pageLoader')?.style?.display"))
    print("Page loader classList:", eval_js("document.getElementById('pageLoader')?.className"))
    print("Access Denied display:", eval_js("document.getElementById('accessDeniedView')?.style?.display"))
    print("Admin Interface display:", eval_js("document.getElementById('adminInterface')?.style?.display"))

    print("\n=== CASE 2: Student user logged in, No unlocked flag ===")
    eval_js("""
    localStorage.setItem('safe_space_user', JSON.stringify({
        id: '11111111-2222-3333-4444-555555555555',
        email: 'student@school.edu',
        username: 'student123',
        role: 'student'
    }));
    location.reload();
    """)
    time.sleep(3)
    print("URL:", eval_js("window.location.href"))
    print("Page loader display:", eval_js("document.getElementById('pageLoader')?.style?.display"))
    print("Page loader classList:", eval_js("document.getElementById('pageLoader')?.className"))
    print("Access Denied display:", eval_js("document.getElementById('accessDeniedView')?.style?.display"))
    print("Admin Interface display:", eval_js("document.getElementById('adminInterface')?.style?.display"))

    print("\n=== CASE 3: Admin unlocked in localStorage ===")
    eval_js("localStorage.setItem('safe_space_admin_unlocked', 'true'); location.reload();")
    time.sleep(3)
    print("URL:", eval_js("window.location.href"))
    print("Page loader display:", eval_js("document.getElementById('pageLoader')?.style?.display"))
    print("Page loader classList:", eval_js("document.getElementById('pageLoader')?.className"))
    print("Access Denied display:", eval_js("document.getElementById('accessDeniedView')?.style?.display"))
    print("Admin Interface display:", eval_js("document.getElementById('adminInterface')?.style?.display"))
    print("Current Tab Title:", eval_js("document.getElementById('currentTabTitle')?.textContent"))
    print("Tab overview display:", eval_js("document.getElementById('tab-overview')?.style?.display"))
    print("Tab posts display:", eval_js("document.getElementById('tab-posts')?.style?.display"))

    print("\n=== Click 'Community Posts' tab ===")
    eval_js("""
    const postTab = document.querySelector('.admin-nav-item[data-tab=\"posts\"]');
    postTab.click();
    """)
    time.sleep(1)
    print("Current Tab Title:", eval_js("document.getElementById('currentTabTitle')?.textContent"))
    print("Tab overview display:", eval_js("document.getElementById('tab-overview')?.style?.display"))
    print("Tab posts display:", eval_js("document.getElementById('tab-posts')?.style?.display"))
    print("Posts list innerHTML length:", eval_js("document.getElementById('postsListContainer')?.innerHTML?.length"))
    print("Posts list snippet:", eval_js("document.getElementById('postsListContainer')?.innerText?.substring(0, 150)"))

    print("\n=== Checking console errors ===")
    # Capture any errors in console
    res = eval_js("""
    (function() {
        return window.__errors || [];
    })()
    """)
    print("Console errors:", res)

except Exception as ex:
    print("Test exception:", ex)
finally:
    p.kill()
