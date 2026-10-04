"""
Integration test: Comment Reactions + Reply-To Feature
Tests: heart reaction toggle on comment, Reply button sets banner, reply comment is threaded.
"""
import subprocess, time, json, requests, os, urllib.parse, sys

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
CDP_PORT = 9222
BASE = "http://localhost:" + str(CDP_PORT)

# ─── Browser helpers ─────────────────────────────────────────
def start_browser():
    subprocess.Popen([EDGE,
        f"--remote-debugging-port={CDP_PORT}",
        "--remote-allow-origins=*",
        "--user-data-dir=C:/tmp/edge_test_profile",
        "--no-first-run", "--start-maximized"])
    time.sleep(2)

def get_page_ws():
    tabs = requests.get(f"{BASE}/json").json()
    for t in tabs:
        if t.get("type") == "page":
            return t["webSocketDebuggerUrl"]
    raise RuntimeError("No CDP page found")

import websocket as ws_lib

_ws = None
_msg_id = 0

def send_cmd(method, params=None):
    global _ws, _msg_id
    _msg_id += 1
    msg = json.dumps({"id": _msg_id, "method": method, "params": params or {}})
    _ws.send(msg)
    while True:
        raw = _ws.recv()
        d = json.loads(raw)
        if d.get("id") == _msg_id:
            return d.get("result", {})

def eval_js(expr):
    r = send_cmd("Runtime.evaluate", {
        "expression": expr,
        "awaitPromise": True,
        "returnByValue": True,
        "timeout": 12000
    })
    v = r.get("result", {})
    if v.get("type") == "undefined":
        return None
    return v.get("value")

# ─── Main test ───────────────────────────────────────────────
def main():
    start_browser()

    ws_url = get_page_ws()
    global _ws
    _ws = ws_lib.create_connection(ws_url)

    print("Connected to CDP")

    # Set up auth session on welcome page
    welcome = os.path.abspath("welcome.html").replace("\\", "/")
    send_cmd("Page.navigate", {"url": f"file:///{welcome}"})
    time.sleep(2)

    eval_js("""
    localStorage.setItem('safe_space_user', JSON.stringify({
        id: 'test-user-' + Date.now(),
        username: 'TestStudent',
        first_name: 'Test',
        email: 'test@demo.com',
        avatar_url: null
    }));
    """)
    print("Auth session set")

    home = os.path.abspath("home.html").replace("\\", "/")
    send_cmd("Page.navigate", {"url": f"file:///{home}"})
    time.sleep(3)

    # ─── 1. Feed loaded ─────────────────────────────────────
    feed_count = eval_js("document.querySelectorAll('#feedContainer .post-card').length")
    print(f"1. Feed Post Cards: {feed_count}")
    assert feed_count > 0, "No posts rendered!"

    # ─── 2. Open Comments Drawer ─────────────────────────────
    comment_open = eval_js("""
    (async () => {
        const firstPost = document.querySelector('#feedContainer .post-card');
        const postId = firstPost.id.substring(5);
        const commentBtn = firstPost.querySelector('.post-action-btn:nth-child(2)');
        commentBtn.click();
        await new Promise(r => setTimeout(r, 600));
        return {
            drawerOpen: document.getElementById('commentsDrawer').classList.contains('open'),
            postId
        };
    })()
    """)
    print(f"2. Comments Drawer Opened: {comment_open}")
    assert comment_open['drawerOpen'], "Comments drawer didn't open!"

    # ─── 3. Post a top-level comment ─────────────────────────
    new_comment = eval_js("""
    (async () => {
        const input = document.getElementById('newCommentInput');
        input.value = 'Test top-level comment at ' + Date.now();
        document.getElementById('sendCommentBtn').click();
        await new Promise(r => setTimeout(r, 1500));
        const items = document.querySelectorAll('#commentsListContainer .comment-item');
        const lastItem = items[items.length - 1];
        return {
            commentCount: items.length,
            hasActionsRow: Boolean(lastItem && lastItem.querySelector('.comment-actions-row')),
            hasHeartBtn: Boolean(lastItem && lastItem.querySelector('[id^="comment-react-btn-"]')),
            hasReplyBtn: Boolean(lastItem && lastItem.querySelector('.comment-action-btn:last-child'))
        };
    })()
    """)
    print(f"3. Comment Posted: {new_comment}")
    assert new_comment['commentCount'] > 0, "No comments rendered!"
    assert new_comment['hasActionsRow'], "Actions row (reaction/reply) missing on comment!"
    assert new_comment['hasHeartBtn'], "Heart reaction button missing!"
    assert new_comment['hasReplyBtn'], "Reply button missing!"

    # ─── 4. React (heart) to the last comment ────────────────
    react_result = eval_js("""
    (async () => {
        const items = document.querySelectorAll('#commentsListContainer .comment-item');
        const lastItem = items[items.length - 1];
        const reactBtn = lastItem ? lastItem.querySelector('[id^="comment-react-btn-"]') : null;
        if (!reactBtn) return { error: 'No react button' };
        const commentId = reactBtn.id.replace('comment-react-btn-', '');
        reactBtn.click();
        await new Promise(r => setTimeout(r, 1200));
        const btn = document.getElementById('comment-react-btn-' + commentId);
        return {
            commentId,
            reacted: btn ? btn.classList.contains('reacted') : false,
            heartSolid: btn ? btn.querySelector('i').classList.contains('fas') : false
        };
    })()
    """)
    print(f"4. Comment Reaction Toggle: {react_result}")
    assert react_result.get('reacted'), "Heart reaction didn't toggle to reacted state!"
    assert react_result.get('heartSolid'), "Heart icon didn't turn solid (fas)!"

    # ─── 5. Click Reply and check banner ─────────────────────
    reply_banner = eval_js("""
    (async () => {
        const items = document.querySelectorAll('#commentsListContainer .comment-item');
        const lastItem = items[items.length - 1];
        const replyBtn = lastItem ? lastItem.querySelector('.comment-action-btn:last-child') : null;
        if (!replyBtn) return { error: 'No reply button' };
        replyBtn.click();
        await new Promise(r => setTimeout(r, 300));
        const banner = document.getElementById('replyingBanner');
        const userLabel = document.getElementById('replyingTargetUser');
        const input = document.getElementById('newCommentInput');
        return {
            bannerVisible: banner ? banner.style.display !== 'none' : false,
            targetUserShown: userLabel ? userLabel.textContent.startsWith('@') : false,
            inputPlaceholderChanged: input ? input.placeholder.includes('Replying') : false
        };
    })()
    """)
    print(f"5. Reply Banner: {reply_banner}")
    assert reply_banner.get('bannerVisible'), "Replying banner didn't appear!"
    assert reply_banner.get('targetUserShown'), "Reply target username not shown in banner!"
    assert reply_banner.get('inputPlaceholderChanged'), "Input placeholder didn't update for reply!"

    # ─── 6. Post a reply comment and check threading ─────────
    reply_result = eval_js("""
    (async () => {
        const input = document.getElementById('newCommentInput');
        input.value = 'This is a reply comment!';
        document.getElementById('sendCommentBtn').click();
        await new Promise(r => setTimeout(r, 1500));
        const banner = document.getElementById('replyingBanner');
        const replyItems = document.querySelectorAll('#commentsListContainer .comment-item.is-reply');
        return {
            bannerHidden: banner ? banner.style.display === 'none' : false,
            replyThreaded: replyItems.length > 0,
            replyCount: replyItems.length
        };
    })()
    """)
    print(f"6. Reply Comment Posted: {reply_result}")
    assert reply_result.get('bannerHidden'), "Reply banner wasn't dismissed after posting!"
    assert reply_result.get('replyThreaded'), "Reply wasn't rendered as a threaded is-reply item!"

    # ─── 7. Cancel reply via banner X ────────────────────────
    cancel_result = eval_js("""
    (async () => {
        // Open reply again first
        const items = document.querySelectorAll('#commentsListContainer .comment-item');
        if (items.length === 0) return { error: 'No comments' };
        const firstItem = items[0];
        const replyBtn = firstItem.querySelector('.comment-action-btn:last-child');
        if (replyBtn) replyBtn.click();
        await new Promise(r => setTimeout(r, 300));
        
        const cancelBtn = document.getElementById('cancelReplyBtn');
        if (cancelBtn) cancelBtn.click();
        await new Promise(r => setTimeout(r, 200));
        
        const banner = document.getElementById('replyingBanner');
        const input = document.getElementById('newCommentInput');
        return {
            bannerGone: banner ? banner.style.display === 'none' : false,
            placeholderReset: input ? input.placeholder === 'Write a kind comment...' : false
        };
    })()
    """)
    print(f"7. Cancel Reply: {cancel_result}")
    assert cancel_result.get('bannerGone'), "Banner didn't hide after cancel!"
    assert cancel_result.get('placeholderReset'), "Input placeholder didn't reset after cancel!"

    print()
    print("=" * 60)
    print("ALL COMMENT REACTIONS & REPLY TESTS PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    main()

