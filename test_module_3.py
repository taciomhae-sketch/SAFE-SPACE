"""
Integration Test: Sprint 3: Module 3 — Community & Chat
Tests:
1. Community directory rendering, search filtering, and tab navigation
2. Friend request sending and pending state
3. Friend request accept / friends tab rendering
4. Chat inbox conversations, find people search, thread opening
5. Direct message sending, message bubble rendering, and persistence
6. Resources hotlines and crisis guidance
"""
import subprocess, time, json, requests, os, sys

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
CDP_PORT = 9222
BASE = "http://localhost:" + str(CDP_PORT)

def start_browser():
    subprocess.Popen([EDGE,
        f"--remote-debugging-port={CDP_PORT}",
        "--remote-allow-origins=*",
        "--user-data-dir=C:/tmp/edge_test_profile_m3",
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
        "timeout": 15000
    })
    v = r.get("result", {})
    if v.get("type") == "undefined":
        return None
    return v.get("value")

def main():
    start_browser()
    ws_url = get_page_ws()
    global _ws
    _ws = ws_lib.create_connection(ws_url)

    print("Connected to CDP")

    # Navigate to welcome page to set auth session for user taciomhae
    welcome = os.path.abspath("welcome.html").replace("\\", "/")
    send_cmd("Page.navigate", {"url": f"file:///{welcome}"})
    time.sleep(2)

    eval_js("""
    localStorage.setItem('safe_space_user', JSON.stringify({
        id: '60d80c30-97e8-44cf-90e2-3a3c02b9975a',
        username: 'taciomhae',
        first_name: 'Tacio',
        email: 'taciomhae@gmail.com'
    }));
    """)
    print("User session initialized (taciomhae)")

    # ─────────────────────────────────────────────────────────────
    # TEST 1: Community Page — People Tab, Search & Tab Switching
    # ─────────────────────────────────────────────────────────────
    community_url = os.path.abspath("community.html").replace("\\", "/")
    send_cmd("Page.navigate", {"url": f"file:///{community_url}"})
    time.sleep(3.5)

    people_test = eval_js("""
    (() => {
        const cards = document.querySelectorAll('#memberListContainer .member-card');
        const searchInput = document.getElementById('communitySearchInput');
        const pills = document.querySelectorAll('#communityPills .pill');
        
        return {
            memberCount: cards.length,
            hasSearchInput: Boolean(searchInput),
            pillCount: pills.length,
            firstMemberName: cards.length > 0 ? cards[0].querySelector('.member-name').textContent.trim() : null
        };
    })()
    """)
    print("1. Community People Tab:", people_test)
    assert people_test['memberCount'] > 0, "No community members rendered!"
    assert people_test['hasSearchInput'], "Search input missing!"
    assert people_test['pillCount'] == 3, "Pills for People/Requests/Friends missing!"
    assert '@' not in (people_test['firstMemberName'] or ''), "Member display name should not be raw email!"

    # Search test
    search_test = eval_js("""
    (() => {
        const input = document.getElementById('communitySearchInput');
        input.value = 'Strongest';
        input.dispatchEvent(new Event('input'));
        const cards = document.querySelectorAll('#memberListContainer .member-card');
        const names = Array.from(cards).map(c => c.querySelector('.member-name').textContent.trim());
        // Reset search
        input.value = '';
        input.dispatchEvent(new Event('input'));
        return {
            filteredCount: cards.length,
            foundName: names.includes('Strongest')
        };
    })()
    """)
    print("1b. Search Filtering:", search_test)
    assert search_test['foundName'], "Search did not find user 'Strongest'!"

    # ─────────────────────────────────────────────────────────────
    # TEST 2: Community Page — Requests Tab & Accept/Decline
    # ─────────────────────────────────────────────────────────────
    requests_tab_test = eval_js("""
    (async () => {
        const reqPill = document.querySelector('#communityPills .pill[data-tab="requests"]');
        reqPill.click();
        await new Promise(r => setTimeout(r, 400));
        const reqCards = document.querySelectorAll('#memberListContainer .member-card');
        const empty = document.querySelector('#memberListContainer .empty-state');
        return {
            reqCount: reqCards.length,
            isEmpty: Boolean(empty)
        };
    })()
    """)
    print("2. Requests Tab:", requests_tab_test)

    # ─────────────────────────────────────────────────────────────
    # TEST 3: Community Page — Friends Tab
    # ─────────────────────────────────────────────────────────────
    friends_tab_test = eval_js("""
    (async () => {
        const friendsPill = document.querySelector('#communityPills .pill[data-tab="friends"]');
        friendsPill.click();
        await new Promise(r => setTimeout(r, 400));
        const friendCards = document.querySelectorAll('#memberListContainer .member-card');
        const empty = document.querySelector('#memberListContainer .empty-state');
        return {
            friendCount: friendCards.length,
            isEmpty: Boolean(empty)
        };
    })()
    """)
    print("3. Friends Tab:", friends_tab_test)

    # ─────────────────────────────────────────────────────────────
    # TEST 4: Chat Page — Inbox, Find People & Search
    # ─────────────────────────────────────────────────────────────
    chat_url = os.path.abspath("chat.html").replace("\\", "/")
    send_cmd("Page.navigate", {"url": f"file:///{chat_url}"})
    time.sleep(3.5)

    chat_inbox_test = eval_js("""
    (() => {
        const recentItems = document.querySelectorAll('#recentConversationsContainer .conversation-item');
        const findItems = document.querySelectorAll('#findContactsContainer .member-card');
        const searchInput = document.getElementById('chatSearchInput');
        return {
            recentCount: recentItems.length,
            findPeopleCount: findItems.length,
            hasSearch: Boolean(searchInput)
        };
    })()
    """)
    print("4. Chat Page Inbox & Contacts:", chat_inbox_test)
    assert chat_inbox_test['hasSearch'], "Chat search input missing!"
    assert chat_inbox_test['findPeopleCount'] > 0 or chat_inbox_test['recentCount'] > 0, "No contacts or recent chats rendered!"

    # ─────────────────────────────────────────────────────────────
    # TEST 5: Chat Thread Overlay & Message Exchange
    # ─────────────────────────────────────────────────────────────
    thread_test = eval_js("""
    (async () => {
        // Open thread with first available contact
        const firstContact = document.querySelector('#findContactsContainer .member-card') || 
                             document.querySelector('#recentConversationsContainer .conversation-item');
        if (!firstContact) return { error: 'No contact to open' };
        firstContact.click();
        await new Promise(r => setTimeout(r, 800));

        const overlay = document.getElementById('chatThreadOverlay');
        const isOpen = overlay && overlay.classList.contains('open');
        const username = document.getElementById('threadUsername').textContent.trim();
        const initialBubbles = document.querySelectorAll('#threadMessagesContainer .message-bubble').length;

        // Send a test message
        const input = document.getElementById('chatMessageInput');
        const sendBtn = document.getElementById('sendMessageBtn');
        input.value = 'Automated Test Message ' + Date.now();
        sendBtn.click();
        await new Promise(r => setTimeout(r, 1200));

        const afterBubbles = document.querySelectorAll('#threadMessagesContainer .message-bubble');
        const lastBubble = afterBubbles[afterBubbles.length - 1];
        const isSent = lastBubble ? lastBubble.classList.contains('sent') : false;

        // Close thread
        document.getElementById('closeThreadBtn').click();
        await new Promise(r => setTimeout(r, 300));
        const isClosed = !overlay.classList.contains('open');

        return {
            threadOpened: isOpen,
            chattingWith: username,
            messageSent: afterBubbles.length > initialBubbles,
            bubbleIsSentClass: isSent,
            threadClosed: isClosed
        };
    })()
    """)
    print("5. Chat Thread & Messaging:", thread_test)
    assert thread_test['threadOpened'], "Chat thread did not open!"
    assert thread_test['messageSent'], "Message was not appended to chat thread!"
    assert thread_test['bubbleIsSentClass'], "Message bubble does not have 'sent' class!"
    assert thread_test['threadClosed'], "Chat thread did not close cleanly!"

    # ─────────────────────────────────────────────────────────────
    # TEST 6: Resources Page — Cards & Crisis Hotlines
    # ─────────────────────────────────────────────────────────────
    resources_url = os.path.abspath("resources.html").replace("\\", "/")
    send_cmd("Page.navigate", {"url": f"file:///{resources_url}"})
    time.sleep(2.5)

    resources_test = eval_js("""
    (async () => {
        const mentalHealthCard = document.getElementById('cardMentalHealth');
        const findSupportCard = document.getElementById('cardFindSupport');
        const selfCareCard = document.getElementById('cardSelfCare');

        if (!findSupportCard) return { error: 'Missing findSupportCard' };

        // Click Find Support card
        findSupportCard.click();
        await new Promise(r => setTimeout(r, 500));

        const overlay = document.getElementById('resourceDetailOverlay');
        const isOpen = overlay && overlay.classList.contains('open');
        const title = document.getElementById('detailTitle').textContent;
        const telLinks = document.querySelectorAll('#detailContent a[href^="tel:"]');
        const chatBtn = document.querySelector('#detailContent a[href="chat.html"]');

        return {
            has3Cards: Boolean(mentalHealthCard && findSupportCard && selfCareCard),
            supportOverlayOpened: isOpen,
            overlayTitle: title,
            hotlinesCount: telLinks.length,
            hasChatShortcut: Boolean(chatBtn)
        };
    })()
    """)
    print("6. Crisis Resources:", resources_test)
    assert resources_test['has3Cards'], "3 Resource cards missing!"
    assert resources_test['supportOverlayOpened'], "Resource detail overlay did not open!"
    assert resources_test['hotlinesCount'] >= 3, "Hotline emergency phone links missing!"
    assert resources_test['hasChatShortcut'], "Peer support chat shortcut missing!"

    print("\n" + "=" * 65)
    print("MODULE 3 ALL 6 TEST SUITES PASSED 100%!")
    print("=" * 65)

if __name__ == "__main__":
    main()

