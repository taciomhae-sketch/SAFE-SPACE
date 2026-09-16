# Safe Space — Feature Tracker & Change Log

> **Purpose**: This document is the single source of truth for all features, changes, updates, and rollback plans in the Safe Space PWA project. Every modification to the codebase **must** be logged here with its implementation plan, affected files, and database alignment notes before and after execution.

---

## Quick Reference Index

| Section | Jump To |
|---|---|
| System Architecture | [→ Architecture](#system-architecture) |
| Database Map | [→ Database](#database-map) |
| Component-DB Alignment | [→ Alignment](#component-to-database-alignment) |
| Feature Status | [→ Features](#feature-status-tracker) |
| Change History | [→ Changelog](#change-history) |
| Pending Items | [→ Backlog](#backlog--pending-improvements) |
| Rollback Guide | [→ Rollback](#rollback-guide) |

---

## System Architecture

```
SAFE SPACE THESIS/
├── index.html              → Community Feed (Posts, Likes, Comments)
├── login.html              → Auth: Sign In
├── register.html           → Auth: Sign Up + Avatar Upload
├── community.html          → Member Directory + Friend Requests
├── chat.html               → Inbox + Private Messaging + Counselor Chat
├── profile.html            → User Profile + Saved & My Posts
├── resources.html          → Mental Health Resources (Static)
├── offline.html            → PWA Offline Fallback (Static)
├── manifest.webmanifest    → PWA Manifest
├── manifest.json           → PWA Manifest (Apple/fallback copy)
├── sw.js                   → Service Worker: Caching & Offline
│
├── css/
│   └── style.css           → Global responsive mobile-first styles
│
├── js/
│   ├── config.js           → Supabase URL + Anon Key (edit this to go live)
│   ├── supabase-client.js  → Unified DB/Auth/Storage API + Demo Fallback
│   ├── app.js              → Shared UI: toasts, nav, helpers, auth guard
│   └── pwa.js              → Service Worker + Install Banner controller
│
├── database/
│   └── supabase_schema.sql → Supabase PostgreSQL DDL, RLS, Triggers, Storage
│
├── assets/
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       ├── icon.svg
│       └── favicon.png
│
├── .env.example            → Environment variable guide (never commit secrets)
├── .gitignore
├── schema.sql              → Root schema pointer file
└── README.md               → Full project documentation
```

---

## Database Map

**Backend**: Supabase (PostgreSQL) | **File**: [`database/supabase_schema.sql`](file:///c:/Users/tacio/OneDrive/Desktop/SAFE%20SPACE%20THESIS/database/supabase_schema.sql)

| Table | Primary Key | Key Columns | Foreign Keys | Purpose |
|---|---|---|---|---|
| `profiles` | `UUID` (= auth.users.id) | `username`, `email`, `first_name`, `last_name`, `age`, `sex`, `birthday`, `avatar_url`, `bio` | `auth.users(id)` CASCADE | User identity & profile |
| `posts` | `UUID` | `user_id`, `content`, `mood`, `category`, `photo_url`, `is_anonymous`, `archived` | `profiles(id)` CASCADE | Community feed posts |
| `post_likes` | `UUID` | `post_id`, `user_id` | `posts(id)`, `profiles(id)` CASCADE | Like/unlike tracking |
| `post_comments` | `UUID` | `post_id`, `user_id`, `content`, `reactions (JSONB)` | `posts(id)`, `profiles(id)` CASCADE | Comment threads |
| `saved_posts` | `UUID` | `post_id`, `user_id` | `posts(id)`, `profiles(id)` CASCADE | Bookmarked posts |
| `messages` | `UUID` | `sender_id`, `receiver_id`, `message`, `is_from_support`, `reactions (JSONB)`, `hidden_for (JSONB)` | `profiles(id)` CASCADE | Direct messages & support chat |
| `friendships` | `UUID` | `requester_id`, `receiver_id`, `status` (pending/accepted/declined) | `profiles(id)` CASCADE | Social connections |
| `blocks` | `UUID` | `blocker_id`, `blocked_id` | `profiles(id)` CASCADE | Safety blocking |
| `chat_nicknames` | `UUID` | `user_id`, `other_user_id`, `nickname` | `profiles(id)` CASCADE | Custom DM nicknames |
| `notifications` | `UUID` | `user_id`, `actor_id`, `type`, `post_id`, `comment_id`, `is_read` | `profiles(id)`, `posts(id)`, `post_comments(id)` CASCADE | In-app notification bell |

**Key Database Mechanisms:**
- **Auto-Profile Trigger**: `handle_new_user()` — automatically creates a `profiles` row when Supabase Auth registers a new user.
- **Row Level Security (RLS)**: Enabled on all tables. Users can only read/write their own data per policy rules.
- **Realtime**: `posts`, `messages`, `notifications`, `post_comments`, `post_likes` are published to `supabase_realtime`.
- **Storage Buckets**: `avatars` (public) and `post-photos` (public), with RLS upload policies for authenticated users.

---

## Component-to-Database Alignment

This section maps every screen and JS module to the exact database tables it reads from and writes to.

| Component | File | Reads From | Writes To | JS API Methods |
|---|---|---|---|---|
| **Community Feed** | `index.html` | `posts`, `post_likes`, `post_comments`, `profiles` | `posts`, `post_likes`, `post_comments`, `saved_posts` | `SafeSpaceDB.posts.getFeed()`, `toggleLike()`, `addComment()`, `toggleSave()`, `createPost()` |
| **Login** | `login.html` | `auth.users` (via Supabase Auth) | `auth.users` session | `SafeSpaceDB.auth.signIn()` |
| **Register** | `register.html` | — | `auth.users` → `profiles` (via trigger), `avatars` bucket | `SafeSpaceDB.auth.signUp()`, `SafeSpaceDB.storage.uploadImage()` |
| **Community** | `community.html` | `profiles`, `friendships`, `blocks` | `friendships` | `SafeSpaceDB.community.getMembers()`, `getFriendships()`, `sendFriendRequest()` |
| **Chat Inbox** | `chat.html` | `messages`, `profiles`, `blocks` | `messages` | `SafeSpaceDB.messages.getConversations()`, `sendMessage()` |
| **Profile** | `profile.html` | `profiles`, `posts`, `saved_posts`, `post_likes` | `profiles` (bio, avatar_url), `posts` (delete) | `SafeSpaceDB.auth.getCurrentUser()`, `posts.getFeed()`, `posts.getSavedPosts()`, `posts.deletePost()`, `storage.uploadImage()` |
| **Resources** | `resources.html` | — (static content) | — | None (no DB calls) |
| **Auth Guard** | `js/app.js` | `auth.users` (session) | — | `requireAuth()` → redirects to `login.html` |
| **Service Worker** | `sw.js` | Browser cache | Browser cache | Cache-first for static, network-first for HTML |

### Demo Mode Alignment (Offline / Pre-Supabase)
When `SUPABASE_URL` / `SUPABASE_ANON_KEY` are not set in [`js/config.js`](file:///c:/Users/tacio/OneDrive/Desktop/SAFE%20SPACE%20THESIS/js/config.js), all operations mirror exactly the same function signatures but use `localStorage` keys:

| localStorage Key | Mirrors Table | Initial State |
|---|---|---|
| `safe_space_user` | `profiles` | Demo user: alex_rivera |
| `safe_space_posts` | `posts` + `post_likes` + `post_comments` | 3 seeded posts |
| `safe_space_members` | `profiles` | 3 seeded members + 1 counselor |
| `safe_space_messages` | `messages` | 2 seeded messages with counselor |
| `safe_space_friendships` | `friendships` | 2 seeded friendships |
| `safe_space_saved` | `saved_posts` | 1 saved post |

---

## Feature Status Tracker

| # | Feature | Status | Screen | DB Tables | Notes |
|---|---|---|---|---|---|
| F-01 | User Authentication (Sign In) | ✅ Complete | `login.html` | `auth.users` | Supabase Auth + demo fallback |
| F-02 | User Registration | ✅ Complete | `register.html` | `auth.users`, `profiles` | With avatar upload + auto-trigger |
| F-03 | Community Feed | ✅ Complete | `index.html` | `posts`, `profiles`, `post_likes`, `post_comments` | Filter by mood tag |
| F-04 | Create Post (Anonymous Toggle) | ✅ Complete | `index.html` | `posts`, `post-photos` bucket | Mood tags, photo upload |
| F-05 | Like / Unlike Post | ✅ Complete | `index.html` | `post_likes` | Toggle logic, count update |
| F-06 | Comment on Post | ✅ Complete | `index.html` | `post_comments` | Comments drawer/modal |
| F-07 | Bookmark/Save Post | ✅ Complete | `index.html`, `profile.html` | `saved_posts` | Toggle, persists per user |
| F-08 | Member Directory | ✅ Complete | `community.html` | `profiles`, `friendships` | Live search |
| F-09 | Friend Requests | ✅ Complete | `community.html` | `friendships` | Send, status display |
| F-10 | Direct Messaging (DM) | ✅ Complete | `chat.html` | `messages`, `profiles` | Thread view, send message |
| F-11 | Counselor Support Chat | ✅ Complete | `chat.html` | `messages` | Seeded counselor ID in demo mode |
| F-12 | Profile View | ✅ Complete | `profile.html` | `profiles` | Avatar, bio, username |
| F-13 | Edit Bio | ✅ Complete | `profile.html` | `profiles` | Inline edit → `localStorage`/Supabase |
| F-14 | Upload Profile Avatar | ✅ Complete | `profile.html`, `register.html` | `profiles.avatar_url`, `avatars` bucket | Base64 in demo, Supabase URL in live |
| F-15 | My Posts Tab | ✅ Complete | `profile.html` | `posts` | Filtered by `user_id` |
| F-16 | Saved Posts Tab | ✅ Complete | `profile.html` | `saved_posts`, `posts` | Join query |
| F-17 | Delete Own Post | ✅ Complete | `profile.html` | `posts` | Owner-only |
| F-18 | Mental Health Resources | ✅ Complete | `resources.html` | — (static) | Crisis hotlines, self-care |
| F-19 | PWA Manifest & Installability | ✅ Complete | `manifest.webmanifest` | — | Icons 192/512, standalone mode |
| F-20 | Service Worker & Offline Cache | ✅ Complete | `sw.js` | — | Cache-first + offline.html fallback |
| F-21 | PWA Install Banner | ✅ Complete | All pages | — | `beforeinstallprompt` handled |
| F-22 | Notifications (Bell) | ⚠️ Partial | `index.html` | `notifications` | DB table ready, UI shows toast only |
| F-23 | User Blocking | ⚠️ Partial | `community.html` | `blocks` | DB table ready; UI button not yet added |
| F-24 | Edit Post | ❌ Pending | — | `posts` | Schema supports it; no edit screen yet |
| F-25 | Realtime Chat (WebSockets) | ❌ Pending | `chat.html` | `messages` (Realtime enabled) | Supabase Realtime subscription not wired |
| F-26 | Realtime Feed Updates | ❌ Pending | `index.html` | `posts` (Realtime enabled) | Supabase Realtime subscription not wired |
| F-27 | Notification Bell (Live Count) | ❌ Pending | `index.html` | `notifications` | Full badge + dropdown needed |
| F-28 | Password Change / Account Settings | ❌ Pending | — | `auth.users` | Supabase `updateUser()` |
| F-29 | Post Archiving | ❌ Pending | — | `posts.archived` | Column exists; filter logic needed |
| F-30 | Chat Nicknames | ❌ Pending | `chat.html` | `chat_nicknames` | Table ready; UI not implemented |
| F-31 | Block User from Chat | ❌ Pending | `chat.html` | `blocks` | Table ready |
| F-32 | Accept/Decline Friend Requests | ❌ Pending | `community.html` | `friendships` | Send works; accept/decline UI missing |

---

## Change History

Each entry follows this format:
> ### vX.X — [Date] — [Short Description]

---

### v1.0 — 2026-09-16 — Initial PHP/SQLite System
**Status**: `ARCHIVED` (files deleted)

**What Existed:**
- Full PHP web application with SQLite backend (`database.sqlite`)
- Python/Kivy mobile prototype (`main.py`, `buildozer.spec`)
- 25+ `.php` pages served via Apache/XAMPP
- `includes/db.php`, `includes/auth.php`, `includes/mailer.php`

**Known Issues at Archive Point:**
- Missing `uploads/` directory auto-creation (file uploads would fail on fresh install)
- Root `db.php` had a broken path pointing outside the project root
- `process_post.php` was a dead file with no references
- `resources.php` had a broken bottom-nav link (Community → `index.php` instead of `community.php`)
- `README.md` described only the Python/Kivy app, not the PHP app

**Files Removed:**
`main.py`, `buildozer.spec`, `requirements.txt`, `database/db.py`, `database.sqlite`, `screens/`, `utils/`, `mysql_test.php`, `process_post.php`, `db.php`, all `*.php` files, `includes/`

---

### v2.0 — 2026-09-16 — Full PWA Overhaul to HTML/CSS/JS + Supabase
**Status**: `ACTIVE`

**Implementation Plan Applied:**
1. Delete all PHP, Python/Kivy, and SQLite files.
2. Create Supabase PostgreSQL schema with RLS, triggers, indexes, and storage.
3. Build 7 HTML screens (index, login, register, community, chat, profile, resources).
4. Create unified Supabase client layer (`js/supabase-client.js`) with demo fallback.
5. Add PWA infrastructure: `manifest.webmanifest`, `sw.js`, `offline.html`, `js/pwa.js`.
6. Generate PWA app icons (192px, 512px, SVG, favicon).
7. Update `README.md`, `.env.example`, and walkthrough documentation.

**Files Created:**
| File | Purpose |
|---|---|
| `index.html` | Community feed |
| `login.html` | Authentication |
| `register.html` | User registration |
| `community.html` | Member directory |
| `chat.html` | Messaging |
| `profile.html` | User profile |
| `resources.html` | Mental health resources |
| `offline.html` | PWA offline fallback |
| `manifest.webmanifest` | PWA manifest |
| `manifest.json` | PWA manifest (alias) |
| `sw.js` | Service Worker |
| `css/style.css` | Global styles |
| `js/config.js` | Supabase credentials |
| `js/supabase-client.js` | DB/Auth API + Demo fallback |
| `js/app.js` | Shared UI utilities |
| `js/pwa.js` | Service Worker + install prompt |
| `database/supabase_schema.sql` | PostgreSQL DDL + RLS |
| `assets/icons/icon-192.png` | PWA icon |
| `assets/icons/icon-512.png` | PWA icon |
| `assets/icons/icon.svg` | PWA icon (vector) |
| `assets/icons/favicon.png` | Browser tab icon |

**DB Alignment Status at v2.0:**
- ✅ `profiles`, `posts`, `post_likes`, `post_comments`, `saved_posts`, `messages`, `friendships` — Wired to UI
- ⚠️ `notifications`, `blocks`, `chat_nicknames` — Tables created in schema, UI not yet connected

---

### v2.0.1 — 2026-09-16 — Remove start.bat, Enable Direct file:// Access
**Status**: `ACTIVE`

**Change**: User requested to open `index.html` directly by double-clicking rather than using a batch server launcher.

**Files Changed:**
| File | Change |
|---|---|
| `start.bat` | **Deleted** |
| `js/pwa.js` | Updated Service Worker registration guard: only registers when `window.location.protocol.startsWith('http')` to avoid errors when opening via `file://` protocol |
| `README.md` | Updated Quick Start: Option 1 now instructs direct double-click of `index.html`; removed `start.bat` reference from project tree |

**Rollback**: Restore `start.bat` from git history or copy batch script from walkthrough.

---

### v2.1.0 — 2026-09-16 — Exact UI Overhaul based on UI SAFE SPACE Designs
**Status**: `ACTIVE`

**Change**: Overhauled frontend styling and structure across all screens to strictly match mockups in `UI SAFE SPACE/`.

**UI Alignment Highlights:**
- **Full Auth Theme (`#7B52D3`)**: Rebuilt `login.html` and `register.html` with deep purple screens, hand-holding-heart icon, wave decorations, and custom input pill fields with icon prefixes.
- **Home Feed**: Header with purple "Home", "Select" button, bell icon; scrollable category pills ("All", "General", "Support", "Stories"); post cards with mood tags ("👍 feeling good"); FAB button; slide-up modal with anonymous toggle.
- **Community**: People, Requests, Friends tab pills; search bar; member card rows with "Add" button.
- **Chats**: Header with subtitle + add-contact button; empty inbox state; slide-in chat conversation thread.
- **Profile**: Avatar placeholder with camera badge; editable bio card with edit pencil; structured menu rows (Account Info, My Posts, Saved Posts, Privacy & Security, Notifications, Blocked Users, About, Logout).
- **Resources**: 3 core resource cards (Mental Health, Find Support, Self Care) with slide-in detail panels.

**Files Overwritten:**
| File | Change |
|---|---|
| `css/style.css` | Complete redesign: color tokens, auth pages, app frame, buttons, animations |
| `login.html` | Matched `UI FOR LOGIN.png` |
| `register.html` | Matched `UI FOR REGISTER.png` |
| `index.html` | Matched `UI FOR HOME PAGE.png` & `UI FOR CREATE POST PAGE.png` |
| `community.html` | Matched `UI FOR COMMUNITY PAGE.png` |
| `chat.html` | Matched `UI FOR CHAT PAGE.png` |
| `profile.html` | Matched `UI FOR PROFILE 1 PAGE.png` & `UI FOR PROFILE 2 PAGE.png` |
| `resources.html` | Matched `UI FOR RESOURCES PAGE.png` |

---

## Backlog & Pending Improvements

> Items here should each get their own Implementation Plan entry before work begins.

### BP-01 — Realtime Chat via Supabase WebSockets
**Priority**: High  
**Why**: Currently the DM chat requires page refresh to see new messages.  
**Plan Overview**:
1. In `chat.html`, after opening a thread, subscribe to Supabase Realtime channel on `messages` table filtered by `sender_id/receiver_id`.
2. On INSERT event, append the new bubble to `#messagesScroll` without re-fetching all messages.
3. Unsubscribe when closing the thread or navigating away.  
**DB Tables**: `messages`  
**Files to Modify**: `chat.html`, `js/supabase-client.js`

---

### BP-02 — Notification Bell with Live Count
**Priority**: High  
**Why**: Notifications table exists in DB but no UI reads it.  
**Plan Overview**:
1. On page load (all pages with `app.js`), query `notifications` where `user_id = current_user.id AND is_read = false`.
2. Show count on the `#notificationsBtn` badge dot in `index.html`.
3. Subscribe to Realtime channel for new notification INSERTs.
4. On bell click, show a dropdown listing recent notifications; mark them `is_read = true`.  
**DB Tables**: `notifications`, `profiles`  
**Files to Modify**: `js/app.js`, `index.html`

---

### BP-03 — Accept / Decline Friend Requests
**Priority**: Medium  
**Why**: `sendFriendRequest()` works but receivers have no way to respond.  
**Plan Overview**:
1. Add a "Pending Requests" section to `community.html` (or a dedicated notifications area).
2. Query `friendships` where `receiver_id = current_user.id AND status = 'pending'`.
3. Add Accept (UPDATE `status = 'accepted'`) and Decline (UPDATE `status = 'declined'`) buttons.  
**DB Tables**: `friendships`, `notifications`  
**Files to Modify**: `community.html`, `js/supabase-client.js`

---

### BP-04 — User Blocking (Safety Feature)
**Priority**: Medium  
**Why**: `blocks` table is in the schema but no UI block action exists.  
**Plan Overview**:
1. Add a "Block User" option in the member card three-dot menu on `community.html` and in the chat thread header on `chat.html`.
2. INSERT into `blocks` table.
3. Filter blocked users out of `getFeed()`, `getMembers()`, and `getConversations()` queries.  
**DB Tables**: `blocks`, `profiles`, `messages`  
**Files to Modify**: `community.html`, `chat.html`, `js/supabase-client.js`

---

### BP-05 — Edit Post
**Priority**: Medium  
**Why**: Users cannot modify posts after creation.  
**Plan Overview**:
1. Add an edit icon/button on posts where `user_id === currentUser.id`.
2. Open an edit modal (similar to create post modal) pre-filled with existing `content`, `mood`, `photo_url`, `is_anonymous`.
3. On submit: `UPDATE posts SET content = ?, mood = ?, updated_at = now() WHERE id = ? AND user_id = ?`.  
**DB Tables**: `posts`, `post-photos` bucket  
**Files to Modify**: `index.html`, `profile.html`, `js/supabase-client.js`

---

### BP-06 — Password Change / Account Settings Page
**Priority**: Low  
**Why**: No way for users to change their password in the current UI.  
**Plan Overview**:
1. Add a new `settings.html` page accessible from `profile.html` settings modal.
2. Use Supabase `supabase.auth.updateUser({ password: newPassword })` after verifying the current session.
3. Include CSRF-equivalent protection using Supabase session token.  
**DB Tables**: `auth.users` (via Supabase Auth API)  
**Files to Modify**: `profile.html`, **new** `settings.html`, `js/supabase-client.js`

---

### BP-07 — Realtime Feed Updates (New Posts Auto-Appear)
**Priority**: Low  
**Why**: Feed requires manual refresh to show new posts from other users.  
**Plan Overview**:
1. Subscribe to Supabase Realtime `posts` INSERT event on `index.html` load.
2. On new post INSERT, prepend the post card to `#feedContainer` with a slide-in animation.  
**DB Tables**: `posts`, `profiles`, `post_likes`, `post_comments`  
**Files to Modify**: `index.html`, `js/supabase-client.js`

---

## Rollback Guide

### How to Rollback a Feature
1. **Check this document** for the version that introduced the change.
2. **Identify the affected files** from the "Files Changed" table in the relevant Change History entry.
3. **Revert the file** using git: `git checkout <commit-hash> -- <file>`.
4. **Update this document** with a new entry noting the rollback reason and date.

### Rollback to v1.0 (PHP System)
> ⚠️ Warning: The PHP files were permanently deleted and the SQLite database removed.

If you need to restore v1.0:
- Retrieve files from your Git commit history before the v2.0 commit.
- Restore Apache/XAMPP and place the project in your `htdocs` folder.
- The SQLite file can be regenerated by loading any PHP page (schema auto-creates on first load via `CREATE TABLE IF NOT EXISTS`).

### Rollback to v2.0 from v2.0.1 (Restore start.bat)
Create a new `start.bat` file in the project root:
```bat
@echo off
start http://localhost:8000
python -m http.server 8000
```
Then update `js/pwa.js` line 8: remove the `&& window.location.protocol.startsWith('http')` condition.

---

## Implementation Plan Template

> **Copy this block when planning any new change or feature:**

```markdown
### Plan: [Feature/Change Name]
**Date Planned**: YYYY-MM-DD
**Status**: [ ] Pending / [/] In Progress / [x] Complete

**Problem/Goal**:
[Describe what this change solves or adds]

**Affected Files**:
| File | Change Type | Description |
|---|---|---|
| `filename.html` | MODIFY | [What changes] |
| `js/supabase-client.js` | MODIFY | [API method added/changed] |
| `database/supabase_schema.sql` | MODIFY | [Schema change if any] |

**Database Impact**:
- Tables read: 
- Tables written to: 
- New columns/tables: 
- RLS policy changes: 

**Rollback**:
[How to undo this change]

**Verification**:
- [ ] Feature works in Demo Mode (localStorage)
- [ ] Feature works in Live Mode (Supabase)
- [ ] No DB table is left disconnected from UI
- [ ] This document is updated with a new Change History entry
```

