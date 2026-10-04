import subprocess, time, json, os, urllib.request, base64
import websocket # type: ignore

PORT = 8103
DEBUG_PORT = 9246
CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
ARTIFACT_DIR = r'C:\Users\tacio\.gemini\antigravity-ide\brain\094dc3e2-889c-4541-b290-139b3893febb'

server_proc = subprocess.Popen(['python', '-m', 'http.server', str(PORT)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
time.sleep(1.2)

chrome_proc = subprocess.Popen([
    CHROME_PATH,
    f'--remote-debugging-port={DEBUG_PORT}',
    f'--user-data-dir=C:/temp/chrome_prof_{PORT}',
    '--remote-allow-origins=*',
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,900',
    f'http://localhost:{PORT}/register.html'
])
time.sleep(2.5)

try:
    req = urllib.request.urlopen(f'http://localhost:{DEBUG_PORT}/json')
    tabs = json.loads(req.read().decode())
    target_tab = next((t for t in tabs if 'register' in t.get('url', '') or str(PORT) in t.get('url', '')), tabs[0])
    ws = websocket.create_connection(target_tab['webSocketDebuggerUrl'])
    msg_id = 1

    def send_cmd(method, params=None):
        global msg_id
        cmd = {'id': msg_id, 'method': method, 'params': params or {}}
        msg_id += 1
        ws.send(json.dumps(cmd))
        while True:
            resp = json.loads(ws.recv())
            if resp.get('id') == cmd['id']:
                return resp

    def evaluate(expr):
        resp = send_cmd('Runtime.evaluate', {'expression': expr, 'returnByValue': True, 'awaitPromise': True})
        return resp.get('result', {}).get('result', {}).get('value')

    def screenshot(filename):
        resp = send_cmd('Page.captureScreenshot', {'format': 'png'})
        with open(os.path.join(ARTIFACT_DIR, filename), 'wb') as f:
            f.write(base64.b64decode(resp['result']['data']))
        print(f'Captured: {filename}')

    evaluate('localStorage.clear(); sessionStorage.clear(); location.reload();')
    time.sleep(1.5)

    options_info = evaluate('''
        Array.from(document.querySelectorAll('#gender option')).map(opt => ({
            text: opt.textContent,
            value: opt.value,
            color: window.getComputedStyle(opt).color,
            bgColor: window.getComputedStyle(opt).backgroundColor,
            inlineColor: opt.style.color,
            inlineBg: opt.style.backgroundColor
        }))
    ''')
    print('Options info:')
    for opt in options_info:
        print(f"  {opt['text']}: color={opt['color']}, inlineColor={opt['inlineColor']}")
        if opt['value']:
            assert 'rgb(17, 24, 39)' in opt['color'] or opt['color'] in ['rgb(0, 0, 0)', 'rgb(26, 26, 46)']

    print('PASS: All gender options have visible black/dark color!')

    # Focus gender select
    evaluate("document.getElementById('gender').focus();")
    screenshot('gender_select_visible_black_text.png')

finally:
    try: chrome_proc.terminate()
    except: pass
    try: server_proc.terminate()
    except: pass
