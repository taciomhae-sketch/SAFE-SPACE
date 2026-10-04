# Safe Space - Progressive Web Application (PWA)

A secure, inclusive, and confidential community and mental health support platform for LGBTQ+ individuals and allies, built as a modern **Progressive Web App (PWA)** powered by **Supabase**.

---

## Key Features

* **Progressive Web App (PWA)**: Installable directly onto Windows, macOS, Android, and iOS home screens with full offline caching via Service Worker.
* **Anonymous Community Feed**: Share feelings, stories, and struggles either with your profile or completely anonymously with mood tags (Love, Feeling Good, Funny, Support, Sad, Frustrated).
* **Live Social Interactions**: Instant likes with animations, bookmarking, and supportive comment threads.
* **Member Directory & Connections**: Discover community peers, send/receive connection requests, and block unwanted interactions for psychological safety.
* **Chat & Counselor Support**: Real-time private direct messaging and 24/7 peer counselor support chat.
* **Crisis & Mental Health Resources**: Quick-dial emergency crisis hotlines (988 Lifeline, Trevor Project, Trans Lifeline) and grounding self-care guides.
* **Supabase Powered (No Firebase / No PHP)**: Pure HTML5, CSS3, and JavaScript communicating directly with Supabase PostgreSQL, Realtime WebSockets, and Supabase Storage.

---

## Quick Start (Run Locally on Your Laptop)

You do **not** need Apache, XAMPP, or PHP to run Safe Space!

### Option 1: Direct Browser Launch
Simply double-click [`index.html`](file:///c:/Users/tacio/OneDrive/Desktop/SAFE%20SPACE%20THESIS/index.html) to open Safe Space directly in your default browser (Google Chrome, Microsoft Edge, Firefox, etc.).

### Option 2: VS Code Live Server
Right-click [`index.html`](file:///c:/Users/tacio/OneDrive/Desktop/SAFE%20SPACE%20THESIS/index.html) in VS Code and select **"Open with Live Server"**.

### Option 3: Local HTTP Server (Optional)
```bash
python -m http.server 8000
```
Then visit: [http://localhost:8000](http://localhost:8000)

> **Note on Demo Mode**: The application works immediately out-of-the-box in **Zero-Dependency Local Mode** with pre-populated community members and posts even before configuring Supabase!

---

## Supabase Database Setup

When you are ready to connect to your live Supabase cloud database:

### 1. Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a new project.

### 2. Run the Database Schema
1. Open your Supabase Project Dashboard.
2. In the left sidebar, click on **SQL Editor**.
3. Click **New Query**.
4. Copy the entire contents of [`database/supabase_schema.sql`](file:///c:/Users/tacio/OneDrive/Desktop/SAFE%20SPACE%20THESIS/database/supabase_schema.sql) and paste it into the editor.
5. Click **Run** (or press `Ctrl + Enter`). This automatically creates all tables, Row Level Security (RLS) policies, triggers, and storage buckets!

### 3. Configure Your API Keys
1. In your Supabase Dashboard, go to **Project Settings** -> **API**.
2. Copy your **Project URL** and **Project API Anon/Public Key**.
3. Open [`js/config.js`](file:///c:/Users/tacio/OneDrive/Desktop/SAFE%20SPACE%20THESIS/js/config.js) and paste them:
```javascript
const SAFE_SPACE_CONFIG = {
  SUPABASE_URL: "https://your-project-id.supabase.co",
  SUPABASE_ANON_KEY: "eyJh..."
};
```
4. Save the file and refresh your browser. Safe Space is now live on Supabase!

---

## Project Structure

```
SAFE SPACE THESIS/
├── index.html              # Main Community Feed & Post Composer
├── login.html              # Authentication & Demo Fast-Login Screen
├── register.html           # User Registration & Avatar Picker
├── community.html          # Community Member Directory & Connections
├── chat.html               # Real-Time Chat & Counselor Support
├── profile.html            # Profile, Bio Editor, My Posts & Saved Posts
├── resources.html          # Mental Health Resources & Hotlines
├── offline.html            # Offline Fallback Screen
├── manifest.webmanifest    # PWA Configuration & Metadata
├── sw.js                   # Service Worker (Caching & Offline Logic)
├── css/
│   └── style.css           # Responsive PWA Mobile-First Stylesheet
├── js/
│   ├── config.js           # Supabase Project Credentials & Settings
│   ├── supabase-client.js  # Supabase Client Layer & Demo Fallback
│   ├── app.js              # Global Navigation, Modals & Toast Alerts
│   └── pwa.js              # Service Worker & PWA Install Prompter
├── database/
│   └── supabase_schema.sql # Complete Supabase PostgreSQL Schema & RLS
└── assets/
    └── icons/              # PWA App Icons (192px, 512px, SVG)
```
