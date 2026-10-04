import subprocess
import time
import json
import urllib.request
import websocket
import os

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(EDGE_PATH):
    EDGE_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

print("Using browser:", EDGE_PATH)

# Start Edge with remote debugging
proc = subprocess.Popen([
    EDGE_PATH,
    "--remote-debugging-port=9222",
    "--remote-allow-origins=*",
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=C:\\Users\\tacio\\AppData\\Local\\Temp\\edge_test_mod2",
    "about:blank"
])

time.sleep(2)

try:
    # Get WebSocket debugger URL
    resp = urllib.request.urlopen("http://localhost:9222/json")
    tabs = json.loads(resp.read().decode("utf-8"))
    ws_url = tabs[0]["webSocketDebuggerUrl"]
    print("Connected to CDP at:", ws_url)

    ws = websocket.create_connection(ws_url)

    msg_id = 0
    def send_cmd(method, params=None):
        global msg_id
        msg_id += 1
        payload = {"id": msg_id, "method": method, "params": params or {}}
        ws.send(json.dumps(payload))
        while True:
            res = json.loads(ws.recv())
            if res.get("id") == msg_id:
                return res

    def eval_js(expr):
        res = send_cmd("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
        result = res.get("result", {}).get("result", {})
        if "value" in result:
            return result["value"]
        if "description" in result:
            return result["description"]
        return result

    # Enable Page and Runtime
    send_cmd("Page.enable")
    send_cmd("Runtime.enable")

    # Navigate to welcome.html first (public page) to initialize auth in localStorage
    welcome_path = os.path.abspath("welcome.html").replace("\\", "/")
    print("Navigating to welcome.html to initialize auth session...")
    send_cmd("Page.navigate", {"url": f"file:///{welcome_path}"})
    time.sleep(2)

    # Set up test user session in localStorage
    setup_res = eval_js("""
    (() => {
        const testUser = {
            id: '2601f814-23a4-4785-80aa-50f9d0c2e4f6',
            email: 'student_tester@asu.edu.ph',
            username: 'SafeSpaceStudent',
            first_name: 'Noriel',
            last_name: 'Acosta',
            avatar_url: null,
            bio: 'Thesis tester'
        };
        localStorage.setItem('safe_space_user', JSON.stringify(testUser));
        localStorage.setItem('safe_space_session_active', 'true');
        return { ok: true, user: testUser.username };
    })()
    """)
    print("Test user session initialized:", setup_res)

    # Now navigate to home.html
    file_path = os.path.abspath("home.html").replace("\\", "/")
    url = f"file:///{file_path}"
    print("Navigating to:", url)
    send_cmd("Page.navigate", {"url": url})
    time.sleep(3)

    # 1. Verify Feed Loaded
    feed_count = eval_js("document.querySelectorAll('#feedContainer .post-card').length")
    print(f"1. Feed Post Cards rendered: {feed_count}")
    assert feed_count > 0, "Expected at least 1 post card in feed"

    # 2. Test Category Pill Filter
    filter_test = eval_js("""
    (() => {
        const supportPill = document.querySelector('.pill[data-category=\"support\"]');
        if (supportPill) supportPill.click();
        const activeText = document.querySelector('.pill.active').textContent.trim();
        const count = document.querySelectorAll('#feedContainer .post-card').length;
        // Switch back to All
        const allPill = document.querySelector('.pill[data-category=\"all\"]');
        if (allPill) allPill.click();
        return { pillClicked: activeText, countAfterFilter: count };
    })()
    """)
    print("2. Category Filter Test:", filter_test)

    # 3. Test Create Post Modal
    modal_test = eval_js("""
    (async () => {
        // Open modal
        document.getElementById('openCreatePostBtn').click();
        const isOpen = document.getElementById('createPostModal').classList.contains('open');
        
        // Select category: Support
        const supChip = document.querySelector('#postCategoryChips .category-chip[data-category=\"support\"]');
        if (supChip) supChip.click();
        
        // Select mood: haha
        const moodChip = document.querySelector('#moodChipList .mood-chip[data-mood=\"haha\"]');
        if (moodChip) moodChip.click();
        
        // Fill content
        const testContent = 'Automated Verification: Testing Module 2 Community Feed and DB alignment at ' + Date.now();
        document.getElementById('postContentInput').value = testContent;
        
        // Submit post
        document.getElementById('submitPostBtn').click();
        
        // Wait 1.5s for post to insert & render
        await new Promise(r => setTimeout(r, 1500));
        
        const topPostCard = document.querySelector('#feedContainer .post-card');
        const topContent = topPostCard ? topPostCard.querySelector('.post-content').textContent : '';
        const hasCategoryTag = topPostCard ? Boolean(topPostCard.querySelector('.post-category-tag.support')) : false;
        
        return {
            modalOpened: isOpen,
            postCreated: topContent.includes('Automated Verification'),
            hasCategoryTag: hasCategoryTag,
            topContent: topContent.slice(0, 50)
        };
    })()
    """)
    print("3. Create Post Test:", modal_test)
    assert modal_test.get("postCreated") == True, "New post was not created or rendered at top of feed!"

    # 4. Test Like Toggle
    like_test = eval_js("""
    (async () => {
        const topPost = document.querySelector('#feedContainer .post-card');
        const postId = topPost.id.substring(5);
        const likeBtn = topPost.querySelector('.post-action-btn:nth-child(1)');
        
        const initialLikes = parseInt(document.getElementById('like-count-' + postId).textContent.trim()) || 0;
        
        // Trigger handleLike
        await handleLike(postId);
        await new Promise(r => setTimeout(r, 600));
        
        const isLikedNow = likeBtn.classList.contains('liked');
        const countAfterLike = parseInt(document.getElementById('like-count-' + postId).textContent.trim()) || 0;
        
        return {
            postId: postId,
            initialLikes: initialLikes,
            isLikedNow: isLikedNow,
            countAfterLike: countAfterLike
        };
    })()
    """)
    print("4. Like Toggle Test:", like_test)
    assert like_test.get("isLikedNow") == True, "Like toggle failed!"

    # 5. Test Bookmark Toggle
    save_test = eval_js("""
    (async () => {
        const topPost = document.querySelector('#feedContainer .post-card');
        const postId = topPost.id.substring(5);
        const saveBtn = topPost.querySelector('.post-action-btn:nth-child(3)');
        
        await handleSave(postId);
        await new Promise(r => setTimeout(r, 600));
        
        const isSavedNow = saveBtn.classList.contains('saved');
        return { postId: postId, isSavedNow: isSavedNow };
    })()
    """)
    print("5. Bookmark Save Test:", save_test)
    assert save_test.get("isSavedNow") == True, "Bookmark toggle failed!"

    # 6. Test Comments Drawer
    comment_test = eval_js("""
    (async () => {
        const topPost = document.querySelector('#feedContainer .post-card');
        const postId = topPost.id.substring(5);
        const commentBtn = topPost.querySelector('.post-action-btn:nth-child(2)');
        
        commentBtn.click();
        await new Promise(r => setTimeout(r, 500));
        
        const drawerOpen = document.getElementById('commentsDrawer').classList.contains('open');
        
        // Add comment
        const commentInput = document.getElementById('newCommentInput');
        commentInput.value = 'Wonderful initiative! Keep it up 🌟';
        document.getElementById('sendCommentBtn').click();
        await new Promise(r => setTimeout(r, 1000));
        
        const commentsList = document.querySelectorAll('#commentsListContainer .comment-item');
        const commentAuthor = commentsList.length > 0 ? commentsList[commentsList.length - 1].querySelector('.comment-author').textContent.trim() : '';
        const commentCountOnPost = document.getElementById('comment-count-' + postId).textContent.trim();
        
        // Close drawer
        document.getElementById('closeCommentsBtn').click();
        
        return {
            drawerOpened: drawerOpen,
            commentRendered: commentsList.length > 0,
            commentAuthor: commentAuthor,
            commentCountOnPost: commentCountOnPost
        };
    })()
    """)
    print("6. Comments Drawer Test:", comment_test)
    assert comment_test.get("commentRendered") == True, "Comment submission failed!"
    assert "@" not in comment_test.get("commentAuthor", ""), "Comment author displayed an email instead of username!"
    print("Verified comment author is username (no email shown):", comment_test.get("commentAuthor"))

    # 7. Test Profile Page Subviews
    profile_path = os.path.abspath("profile.html").replace("\\", "/")
    send_cmd("Page.navigate", {"url": f"file:///{profile_path}"})
    time.sleep(3)

    profile_test = eval_js("""
    (async () => {
        // Open My Posts
        document.getElementById('myPostsRow').click();
        await new Promise(r => setTimeout(r, 1200));
        const myPostsCount = document.querySelectorAll('#subViewContent .post-card').length;
        
        // Open Saved Posts
        document.getElementById('savedPostsRow').click();
        await new Promise(r => setTimeout(r, 1200));
        const savedPostsCount = document.querySelectorAll('#subViewContent .post-card').length;
        
        return {
            myPostsCount: myPostsCount,
            savedPostsCount: savedPostsCount
        };
    })()
    """)
    print("7. Profile Subviews Test (My Posts & Saved Posts):", profile_test)
    assert profile_test.get("myPostsCount") > 0, "My Posts view in profile failed to load posts"
    assert profile_test.get("savedPostsCount") > 0, "Saved Posts view in profile failed to load bookmarks"

    print("\n=======================================================")
    print("ALL MODULE 2 AUTOMATED INTEGRATION TESTS PASSED 100%!")
    print("=======================================================")

finally:
    try:
        ws.close()
    except:
        pass
    proc.terminate()
