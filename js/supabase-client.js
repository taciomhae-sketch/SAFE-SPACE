/**
 * Safe Space - Supabase Database & Auth Client Layer
 * Handles Supabase initialization, queries, auth, storage, and local demo fallback.
 */

// Initial Seed Data (Empty — all accounts are now live Supabase users)
var INITIAL_DEMO_DATA = {
  currentUser: null,
  members: [],
  posts: [],
  messages: [],
  friendships: [],
  savedPosts: [],
  blocks: []
};

// Initialize Local Storage & actively purge all legacy dummy/demo records
function initLocalStorage() {
  function isDummyId(id) {
    if (!id || typeof id !== 'string') return true;
    return !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  // Purge legacy dummy user if currently stored
  try {
    var storedUser = JSON.parse(localStorage.getItem('safe_space_user') || 'null');
    if (storedUser && isDummyId(storedUser.id)) {
      localStorage.removeItem('safe_space_user');
    }
  } catch (e) {}

  // Filter out any legacy dummy members
  try {
    var curMembers = JSON.parse(localStorage.getItem('safe_space_members') || '[]');
    var realMembers = curMembers.filter(function(m) {
      return m && m.id && !isDummyId(m.id);
    });
    localStorage.setItem('safe_space_members', JSON.stringify(realMembers));
  } catch (e) {
    localStorage.setItem('safe_space_members', JSON.stringify([]));
  }

  // Filter out any legacy dummy messages
  try {
    var curMsgs = JSON.parse(localStorage.getItem('safe_space_messages') || '[]');
    var realMsgs = curMsgs.filter(function(m) {
      return m && m.id && !isDummyId(m.id) && !isDummyId(m.sender_id) && !isDummyId(m.receiver_id);
    });
    localStorage.setItem('safe_space_messages', JSON.stringify(realMsgs));
  } catch (e) {
    localStorage.setItem('safe_space_messages', JSON.stringify([]));
  }

  // Filter out any legacy dummy posts
  try {
    var curPosts = JSON.parse(localStorage.getItem('safe_space_posts') || '[]');
    var realPosts = curPosts.filter(function(p) {
      return p && p.id && !isDummyId(p.id) && !isDummyId(p.user_id);
    });
    localStorage.setItem('safe_space_posts', JSON.stringify(realPosts));
  } catch (e) {
    localStorage.setItem('safe_space_posts', JSON.stringify([]));
  }

  // Filter out any legacy dummy friendships
  try {
    var curFriends = JSON.parse(localStorage.getItem('safe_space_friendships') || '[]');
    var realFriends = curFriends.filter(function(f) {
      return f && f.id && !isDummyId(f.id) && !isDummyId(f.requester_id) && !isDummyId(f.receiver_id);
    });
    localStorage.setItem('safe_space_friendships', JSON.stringify(realFriends));
  } catch (e) {
    localStorage.setItem('safe_space_friendships', JSON.stringify([]));
  }

  // Filter out any legacy dummy blocks
  try {
    var curBlocks = JSON.parse(localStorage.getItem('safe_space_blocks') || '[]');
    var realBlocks = curBlocks.filter(function(b) {
      return b && b.id && !isDummyId(b.id) && !isDummyId(b.blocker_id) && !isDummyId(b.blocked_id);
    });
    localStorage.setItem('safe_space_blocks', JSON.stringify(realBlocks));
  } catch (e) {
    localStorage.setItem('safe_space_blocks', JSON.stringify([]));
  }

  // Purge any legacy fake/demo notifications
  try {
    var keysToRemove = [];
    for (var k = 0; k < localStorage.length; k++) {
      var keyName = localStorage.key(k);
      if (keyName && keyName.indexOf('safe_space_notifications_') === 0) {
        keysToRemove.push(keyName);
      }
    }
    keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
  } catch (e) {}

  if (!localStorage.getItem('safe_space_saved')) {
    localStorage.setItem('safe_space_saved', JSON.stringify([]));
  }
}

initLocalStorage();

// ─────────────────────────────────────────────────────────────────
// Initialize Supabase Client
// Uses "_db" internally to avoid clashing with any global
// ─────────────────────────────────────────────────────────────────
var _db = null;
var _dbAdmin = null;
(function initSupabase() {
  try {
    var configured = typeof SAFE_SPACE_CONFIG !== 'undefined' && SAFE_SPACE_CONFIG.isConfigured();
    var sbLib = (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')
      ? window.supabase
      : null;
    if (configured && sbLib) {
      _db = sbLib.createClient(
        SAFE_SPACE_CONFIG.SUPABASE_URL,
        SAFE_SPACE_CONFIG.SUPABASE_ANON_KEY
      );
      if (SAFE_SPACE_CONFIG.SUPABASE_SERVICE_KEY) {
        _dbAdmin = sbLib.createClient(
          SAFE_SPACE_CONFIG.SUPABASE_URL,
          SAFE_SPACE_CONFIG.SUPABASE_SERVICE_KEY
        );
      }
      console.log('[SafeSpace] ✅ Connected to Supabase:', SAFE_SPACE_CONFIG.SUPABASE_URL);
    } else if (!sbLib) {
      console.warn('[SafeSpace] ⚠️ Supabase library not available — running in Demo/Local mode');
    } else {
      console.warn('[SafeSpace] ⚠️ Supabase not configured — running in Demo/Local mode');
    }
  } catch (err) {
    console.warn('[SafeSpace] Supabase init error, falling back to local mode:', err);
  }
})();

/**
 * High Level Unified SafeSpace API
 */
var SafeSpaceDB = {
  isSupabaseActive: function() {
    return Boolean(_db);
  },

  /**
   * Broadcast real-time moderation changes across tabs and windows
   */
  _broadcastModerationSync: function(postId, action) {
    if (!postId) return;
    var payload = {
      type: 'post_moderated',
      postId: postId,
      action: action || 'deleted',
      timestamp: Date.now()
    };
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        var ch = new BroadcastChannel('safespace_moderation_channel');
        ch.postMessage(payload);
      }
    } catch (e) {}
    try {
      localStorage.setItem('safe_space_post_moderation_sync', JSON.stringify(payload));
    } catch (e2) {}
  },

  /**
   * Returns the user's handle/username.
   * Ensures email is NEVER displayed — if username contains '@', domain is stripped.
   */
  _displayName: function(profile) {
    if (!profile) return 'Member';
    if (profile.username && typeof profile.username === 'string') {
      var u = profile.username.trim();
      if (u.indexOf('@') !== -1) u = u.split('@')[0];
      if (u.length > 0) return u;
    }
    if (profile.first_name && typeof profile.first_name === 'string') {
      var name = profile.first_name.trim();
      if (profile.last_name) name += ' ' + profile.last_name.trim().charAt(0) + '.';
      if (name.length > 0) return name;
    }
    if (profile.email && typeof profile.email === 'string') {
      return profile.email.split('@')[0];
    }
    return 'Member';
  },

  _isUUID: function(str) {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  },

  // ==========================================
  // USERS & ONLINE STATUS
  // ==========================================
  users: {
    updateLastActive: async function() {
      try {
        var currentUser = await SafeSpaceDB.auth.getCurrentUser();
        if (!currentUser) return;
        var nowIso = new Date().toISOString();

        if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts && SafeSpaceDB.posts._isUUID(currentUser.id)) {
          var client = _dbAdmin || _db;
          await client.from('profiles').update({
            last_active: nowIso,
            is_online: true
          }).eq('id', currentUser.id);
        }

        // Local storage update
        var stored = JSON.parse(localStorage.getItem('safe_space_user'));
        if (stored) {
          stored.last_active = nowIso;
          stored.is_online = true;
          localStorage.setItem('safe_space_user', JSON.stringify(stored));
        }

        var members = JSON.parse(localStorage.getItem('safe_space_members')) || [];
        for (var i = 0; i < members.length; i++) {
          if (members[i].id === currentUser.id) {
            members[i].last_active = nowIso;
            members[i].is_online = true;
            break;
          }
        }
        localStorage.setItem('safe_space_members', JSON.stringify(members));
      } catch (err) {
        console.warn('[SafeSpace] Error updating last_active:', err);
      }
    },

    isOnline: function(user) {
      if (!user) return false;
      if (user.isAi || user.id === 'safe-space-ai-bot') return true;
      if (user.is_online === true) return true;
      if (user.last_active) {
        var last = new Date(user.last_active).getTime();
        var now = Date.now();
        // Considered online if active within last 5 minutes (300,000 ms)
        if (!isNaN(last) && (now - last) <= (5 * 60 * 1000)) {
          return true;
        }
      }
      return false;
    },

    getAvatarUrl: function(user) {
      if (typeof window !== 'undefined' && window.SafeSpaceAvatars) {
        return window.SafeSpaceAvatars.getUrl(user);
      }
      return (user && user.avatar_url) ? user.avatar_url : 'assets/avatars/default-avatar.png';
    },

    renderAvatar: function(user, options) {
      if (typeof window !== 'undefined' && window.SafeSpaceAvatars) {
        return window.SafeSpaceAvatars.renderHtml(user, options);
      }
      var url = (user && user.avatar_url) ? user.avatar_url : 'assets/avatars/default-avatar.png';
      return '<img src="' + url + '" alt="Avatar" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />';
    }
  },

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  auth: {
    getCurrentUser: async function() {
      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var res = await _db.auth.getUser();
          var user = res.data ? res.data.user : null;
          if (user) {
            var client = _dbAdmin || _db;
            var pRes = await client.from('profiles').select('*').eq('id', user.id).single();
            var profile = pRes.data || {};
            var fullUser = Object.assign({}, user, profile);

            // Ensure primary researcher / admin account is recognized with full admin role
            var isPrimaryAdmin = Boolean(
              (user.email && (user.email.toLowerCase() === 'taciomhae@gmail.com' || user.email.toLowerCase().includes('admin'))) ||
              (fullUser.username && (fullUser.username.toLowerCase() === 'taciomhae' || fullUser.username.toLowerCase().includes('admin'))) ||
              fullUser.role === 'admin' ||
              fullUser.is_admin === true
            );

            if (isPrimaryAdmin) {
              fullUser.role = 'admin';
              fullUser.is_admin = true;
              // If profile in Supabase was still marked student, self-heal and sync to admin
              if (profile.role !== 'admin') {
                try {
                  await client.from('profiles').update({ role: 'admin' }).eq('id', user.id);
                } catch (syncErr) {}
              }
            }

            try {
              localStorage.setItem('safe_space_user', JSON.stringify(fullUser));
            } catch (e) {}
            return fullUser;
          }
        } catch (e) {
          console.warn('[SafeSpace] Supabase auth check error:', e);
        }
      }
      var storedUser = JSON.parse(localStorage.getItem('safe_space_user'));
      if (storedUser) {
        var isStoredAdmin = Boolean(
          (storedUser.email && (storedUser.email.toLowerCase() === 'taciomhae@gmail.com' || storedUser.email.toLowerCase().includes('admin'))) ||
          (storedUser.username && (storedUser.username.toLowerCase() === 'taciomhae' || storedUser.username.toLowerCase().includes('admin'))) ||
          storedUser.role === 'admin' ||
          storedUser.is_admin === true
        );
        if (isStoredAdmin) {
          storedUser.role = 'admin';
          storedUser.is_admin = true;
        }
      }
      return storedUser;
    },

    signIn: async function(email, password) {
      if (SafeSpaceDB.isSupabaseActive()) {
        var res = await _db.auth.signInWithPassword({ email: email, password: password });
        if (res.error) throw res.error;
        if (res.data && res.data.user) {
          try {
            var pRes = await _db.from('profiles').select('*').eq('id', res.data.user.id).single();
            var profile = pRes.data || {};
            var fullUser = Object.assign({}, res.data.user, profile);
            localStorage.setItem('safe_space_user', JSON.stringify(fullUser));
          } catch (e) {
            localStorage.setItem('safe_space_user', JSON.stringify(res.data.user));
          }
        }
        return res.data;
      }
      // Demo authentication
      if (!email || !password) throw new Error('Please enter email and password.');
      var stored = JSON.parse(localStorage.getItem('safe_space_user'));
      var baseUser = stored || Object.assign({}, INITIAL_DEMO_DATA.currentUser);
      baseUser.email = email;
      localStorage.setItem('safe_space_user', JSON.stringify(baseUser));
      return { user: baseUser };
    },

    /**
     * Send a one-time sign-in link (Magic link) or one-time password (OTP)
     */
    signInWithOtp: async function(email) {
      email = (email || '').trim().toLowerCase();
      if (!email) throw new Error('Please enter your email address.');

      if (SafeSpaceDB.isSupabaseActive()) {
        var redirectTarget = (typeof window !== 'undefined' && window.location)
          ? (window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/login.html'))
          : undefined;

        var res = await _db.auth.signInWithOtp({
          email: email,
          options: {
            emailRedirectTo: redirectTarget,
            shouldCreateUser: false
          }
        });
        if (res.error) throw res.error;
        return res.data;
      }
      return { success: true };
    },

    signUp: async function(payload) {
      payload = payload || {};
      var email = payload.email;
      var password = payload.password;
      var metadata = Object.assign({}, payload);
      delete metadata.email;
      delete metadata.password;

      if (SafeSpaceDB.isSupabaseActive()) {
        // If REQUIRE_EMAIL_CONFIRMATION is enabled, use standard Supabase signup to trigger real SMTP confirmation email
        if (typeof SAFE_SPACE_CONFIG !== 'undefined' && SAFE_SPACE_CONFIG.REQUIRE_EMAIL_CONFIRMATION) {
          // Provide dynamic emailRedirectTo pointing to the actual local web app login page
          var redirectTarget = (typeof window !== 'undefined' && window.location)
            ? (window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/login.html'))
            : undefined;

          var res = await _db.auth.signUp({
            email: email,
            password: password,
            options: {
              data: metadata,
              emailRedirectTo: redirectTarget
            }
          });
          if (res.error) {
            // Provide a clear explanation if SMTP is not configured in Supabase yet
            if (res.error.message && res.error.message.toLowerCase().includes('confirmation email')) {
              throw new Error('Supabase SMTP Error: Please configure custom SMTP (Resend or Gmail) in your Supabase Dashboard -> Authentication -> SMTP Settings, or disable email confirmation.');
            }
            throw res.error;
          }

          // Supabase security feature: if user already exists, identities array is empty
          if (res.data && res.data.user && Array.isArray(res.data.user.identities) && res.data.user.identities.length === 0) {
            throw new Error('User already registered. An account with this email already exists. Please log in instead.');
          }

          // If waiting for email confirmation
          if (res.data && res.data.user && !res.data.session) {
            return {
              user: res.data.user,
              session: null,
              needsEmailConfirmation: true,
              needsOtp: true,
              email: email
            };
          }
          return res.data;
        }

        // Auto-confirm fallback via Admin API (when REQUIRE_EMAIL_CONFIRMATION is false)
        if (typeof SAFE_SPACE_CONFIG !== 'undefined' && SAFE_SPACE_CONFIG.SUPABASE_SERVICE_KEY) {
          try {
            var adminUrl = SAFE_SPACE_CONFIG.SUPABASE_URL + '/auth/v1/admin/users';
            var response = await fetch(adminUrl, {
              method: 'POST',
              headers: {
                'apikey': SAFE_SPACE_CONFIG.SUPABASE_SERVICE_KEY,
                'Authorization': 'Bearer ' + SAFE_SPACE_CONFIG.SUPABASE_SERVICE_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: metadata
              })
            });

            var adminData = await response.json();
            if (!response.ok) {
              var errMessage = adminData.msg || adminData.message || adminData.error_description || 'Registration error';
              throw new Error(errMessage);
            }

            var loginRes = await _db.auth.signInWithPassword({ email: email, password: password });
            if (loginRes.error) throw loginRes.error;
            return loginRes.data;
          } catch (adminErr) {
            console.warn('[SafeSpace] Admin auto-confirm signup error:', adminErr);
            throw adminErr;
          }
        }
      }
      // Demo Signup
      var newUser = {
        id: 'user-' + Date.now(),
        email: email,
        username: metadata.username || (email ? email.split('@')[0] : 'user'),
        first_name: metadata.first_name || 'Member',
        middle_name: metadata.middle_name || null,
        last_name: metadata.last_name || '',
        age: metadata.age || null,
        sex: metadata.sex || null,
        birthday: metadata.birthday || null,
        bio: metadata.bio || 'Hello, Safe Space!',
        avatar_url: metadata.avatar_url || null,
        created_at: new Date().toISOString()
      };
      localStorage.setItem('safe_space_user', JSON.stringify(newUser));
      return { user: newUser };
    },

    /**
     * Verifies Supabase OTP verification code for signup or email
     */
    verifyOtp: async function(email, token, type) {
      email = (email || '').trim().toLowerCase();
      token = (token || '').trim();
      type = type || 'signup';

      if (!token) throw new Error('Please enter the 6-digit verification code.');

      if (SafeSpaceDB.isSupabaseActive()) {
        // Attempt verify with requested type (usually 'signup')
        var res = await _db.auth.verifyOtp({
          email: email,
          token: token,
          type: type
        });

        // If signup failed, also try type: 'email' (handles tokens configured as email OTP in Supabase)
        if (res.error && type === 'signup') {
          var fallbackRes = await _db.auth.verifyOtp({
            email: email,
            token: token,
            type: 'email'
          });
          if (!fallbackRes.error) {
            res = fallbackRes;
          }
        }

        if (res.error) throw res.error;

        var user = res.data ? res.data.user : null;
        if (user) {
          try {
            var pRes = await _db.from('profiles').select('*').eq('id', user.id).single();
            var profile = pRes.data || {};
            var fullUser = Object.assign({}, user, profile);
            localStorage.setItem('safe_space_user', JSON.stringify(fullUser));
          } catch (e) {
            localStorage.setItem('safe_space_user', JSON.stringify(user));
          }
        }
        return res.data;
      }

      // Demo fallback: accept any 6-digit code or '123456'
      if (token.length < 4) {
        throw new Error('Please enter a valid verification code.');
      }
      var stored = JSON.parse(localStorage.getItem('safe_space_user')) || Object.assign({}, INITIAL_DEMO_DATA.currentUser);
      stored.email = email || stored.email;
      stored.email_confirmed = true;
      localStorage.setItem('safe_space_user', JSON.stringify(stored));
      return { user: stored, session: { access_token: 'demo-session-token' } };
    },

    /**
     * Resends Supabase OTP verification code
     */
    resendOtp: async function(email, type) {
      email = (email || '').trim().toLowerCase();
      type = type || 'signup';
      if (!email) throw new Error('Please enter your email address.');

      if (SafeSpaceDB.isSupabaseActive()) {
        var redirectTarget = (typeof window !== 'undefined' && window.location)
          ? (window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/login.html'))
          : undefined;

        var res = await _db.auth.resend({
          type: type,
          email: email,
          options: redirectTarget ? { emailRedirectTo: redirectTarget } : undefined
        });
        if (res.error) throw res.error;
        return res.data;
      }
      return { success: true };
    },

    /**
     * Formats error objects into user-friendly error messages
     */
    formatAuthError: function(err) {
      if (!err) return 'An unexpected error occurred. Please try again.';
      var raw = (typeof err === 'string') ? err : (err.message || err.error_description || String(err));
      var lower = raw.toLowerCase();

      if (lower.includes('invalid login credentials') || lower.includes('invalid_grant') || lower.includes('invalid_credentials')) {
        return 'Wrong password or email. Please check your credentials and try again.';
      }
      if (lower.includes('email not confirmed') || lower.includes('email_not_confirmed')) {
        return 'This account is not verified yet. Please enter the OTP code sent to your email or check your inbox.';
      }
      if (lower.includes('user already registered') || lower.includes('already exists') || lower.includes('user_already_exists')) {
        return 'This email is already registered. Please sign in instead.';
      }
      if (lower.includes('token has expired') || lower.includes('otp expired') || lower.includes('invalid token') || lower.includes('token is invalid') || lower.includes('otp invalid')) {
        return 'Invalid or expired OTP code. Please check the code or request a new one.';
      }
      if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
        return 'Too many requests. Supabase email rate limit reached. Please wait a few minutes before trying again.';
      }
      if (lower.includes('too many requests') || lower.includes('over_request_rate_limit')) {
        return 'Too many attempts. For your security, please wait a minute before trying again.';
      }
      if (lower.includes('user not found')) {
        return 'No account found with this email. Please check your email or sign up.';
      }
      if (lower.includes('password') && (lower.includes('at least') || lower.includes('short') || lower.includes('weak'))) {
        return 'Password must be at least 8 characters long.';
      }
      if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('networkerror')) {
        return 'Network connection error. Please check your internet connection.';
      }
      return raw;
    },

    checkUsernameAvailability: async function(username) {
      if (!username || username.trim().length < 3) return { available: false, error: 'Username must be at least 3 characters.' };
      username = username.trim().toLowerCase();
      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var res = await _db.from('profiles').select('id').ilike('username', username).limit(1);
          if (res.data && res.data.length > 0) {
            return { available: false, message: 'This username is already taken. Please choose another username.' };
          }
          return { available: true, message: 'Username is available.' };
        } catch (e) {
          return { available: true, message: 'Username is available.' };
        }
      }
      var storedUser = JSON.parse(localStorage.getItem('safe_space_user'));
      if (storedUser && (storedUser.username || '').toLowerCase() === username) {
        return { available: false, message: 'This username is already taken. Please choose another username.' };
      }
      var taken = (INITIAL_DEMO_DATA.members || []).some(function(m) {
        return (m.username || '').toLowerCase() === username;
      });
      if (taken) {
        return { available: false, message: 'This username is already taken. Please choose another username.' };
      }
      return { available: true, message: 'Username is available.' };
    },

    checkEmailAvailability: async function(email) {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return { available: false, error: 'Please enter a valid email address.' };
      }
      email = email.trim().toLowerCase();
      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var res = await _db.from('profiles').select('id').ilike('email', email).limit(1);
          if (res.data && res.data.length > 0) {
            return { available: false, message: 'This email address is already registered.' };
          }
          return { available: true, message: 'Email address is available.' };
        } catch (e) {
          return { available: true, message: 'Email address is available.' };
        }
      }
      var storedUser = JSON.parse(localStorage.getItem('safe_space_user'));
      if (storedUser && (storedUser.email || '').toLowerCase() === email) {
        return { available: false, message: 'This email address is already registered.' };
      }
      return { available: true, message: 'Email address is available.' };
    },

    updateProfile: async function(updates) {
      updates = updates || {};
      var validProfileCols = [
        'username', 'first_name', 'middle_name', 'last_name',
        'age', 'sex', 'birthday', 'avatar_url', 'avatar_type', 'avatar_value',
        'theme_mode', 'theme_color', 'bio', 'is_deactivated',
        'privacy_anonymous_posting', 'privacy_allow_discovery', 'privacy_show_profile',
        'updated_at'
      ];
      var dbPayload = {};
      validProfileCols.forEach(function(col) {
        if (updates.hasOwnProperty(col)) {
          dbPayload[col] = updates[col];
        }
      });
      dbPayload.updated_at = new Date().toISOString();

      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var res = await _db.auth.getUser();
          var user = res.data ? res.data.user : null;
          if (user) {
            var client = _dbAdmin || _db;
            var pRes = await client
              .from('profiles')
              .update(dbPayload)
              .eq('id', user.id)
              .select()
              .single();

            // Also update user metadata in auth if possible
            try {
              await _db.auth.updateUser({ data: updates });
            } catch (authErr) {}

            var cur = JSON.parse(localStorage.getItem('safe_space_user')) || {};
            var merged = Object.assign({}, cur, (pRes && pRes.data) || {}, updates);
            localStorage.setItem('safe_space_user', JSON.stringify(merged));

            // Synchronize members list in local storage so immediate UI lookups reflect the new avatar
            try {
              var mems = JSON.parse(localStorage.getItem('safe_space_members')) || [];
              var memIdx = mems.findIndex(function(m) { return m && m.id === merged.id; });
              if (memIdx > -1) {
                mems[memIdx] = Object.assign({}, mems[memIdx], merged);
                localStorage.setItem('safe_space_members', JSON.stringify(mems));
              }
            } catch (me) {}

            // Dispatch global event for immediate real-time sync across all components
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('safespace:avatar-changed', {
                detail: { user: merged, avatar_url: merged.avatar_url }
              }));
            }

            return merged;
          }
        } catch (e) {
          console.warn('[SafeSpace] Supabase updateProfile error, syncing local:', e);
        }
      }
      var cur = JSON.parse(localStorage.getItem('safe_space_user')) || {};
      var updatedUser = Object.assign({}, cur, updates);
      localStorage.setItem('safe_space_user', JSON.stringify(updatedUser));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('safespace:avatar-changed', {
          detail: { user: updatedUser, avatar_url: updatedUser.avatar_url }
        }));
      }

      return updatedUser;
    },

    updatePassword: async function(currentPassword, newPassword) {
      if (!newPassword || newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long.');
      }
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('You must be logged in to change your password.');

      if (SafeSpaceDB.isSupabaseActive()) {
        var res = await _db.auth.updateUser({ password: newPassword });
        if (res.error) throw res.error;
        return { success: true };
      }

      var cur = JSON.parse(localStorage.getItem('safe_space_user')) || {};
      cur.password = newPassword;
      localStorage.setItem('safe_space_user', JSON.stringify(cur));
      return { success: true };
    },

    signOut: async function() {
      if (SafeSpaceDB.isSupabaseActive()) {
        try { await _db.auth.signOut(); } catch (e) {}
      }
      localStorage.removeItem('safe_space_user');
      localStorage.removeItem('safe_space_session_active');
    },

    deactivateAccount: async function() {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      await SafeSpaceDB.auth.updateProfile({ is_deactivated: true });
      await SafeSpaceDB.auth.signOut();
      return { success: true };
    },

    deleteAccount: async function(password) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      var curStored = JSON.parse(localStorage.getItem('safe_space_user') || 'null');
      if (curStored && curStored.password && password && curStored.password !== password) {
        throw new Error('Incorrect current password.');
      }

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(currentUser.id)) {
        try {
          var client = _dbAdmin || _db;
          // Anonymize user posts
          await client.from('posts')
            .update({ is_anonymous: true, user_id: currentUser.id })
            .eq('user_id', currentUser.id);

          await client.from('saved_posts').delete().eq('user_id', currentUser.id);
          await client.from('blocks').delete().or('blocker_id.eq.' + currentUser.id + ',blocked_id.eq.' + currentUser.id);
          await client.from('notifications').delete().eq('user_id', currentUser.id);
          await client.from('profiles').delete().eq('id', currentUser.id);

          if (_dbAdmin && _dbAdmin.auth && _dbAdmin.auth.admin) {
            await _dbAdmin.auth.admin.deleteUser(currentUser.id);
          }
        } catch (err) {
          console.warn('[SafeSpace] Supabase delete account error:', err);
        }
      }

      var posts = JSON.parse(localStorage.getItem('safe_space_posts') || '[]');
      posts = posts.map(function(p) {
        if (p.user_id === currentUser.id) {
          return Object.assign({}, p, { is_anonymous: true, author_name: 'Anonymous', author_avatar: null });
        }
        return p;
      });
      localStorage.setItem('safe_space_posts', JSON.stringify(posts));

      var members = JSON.parse(localStorage.getItem('safe_space_members') || '[]');
      members = members.filter(function(m) { return m.id !== currentUser.id; });
      localStorage.setItem('safe_space_members', JSON.stringify(members));

      await SafeSpaceDB.auth.signOut();
      return { success: true };
    }
  },

  // ==========================================
  // POSTS & COMMUNITY FEED (MODULE 2)
  // ==========================================
  posts: {
    getFeed: async function(filter) {
      filter = filter || {};
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      var limit = typeof filter.limit === 'number' ? filter.limit : 15;
      var page = typeof filter.page === 'number' ? Math.max(0, filter.page) : 0;
      var from = page * limit;
      var to = from + limit - 1;

      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var postColumns = [
            'id', 'user_id', 'content', 'mood', 'category', 'photo_url', 'is_anonymous', 'archived', 'created_at', 'updated_at',
            'profiles:user_id(id, username, first_name, last_name, avatar_url)',
            'post_likes(user_id)',
            'post_comments(id, user_id, content, reactions, created_at, profiles:user_id(username, first_name, last_name, avatar_url))',
            'saved_posts(user_id)'
          ].join(', ');

          var query = _db.from('posts')
            .select(postColumns)
            .eq('archived', false)
            .order('created_at', { ascending: false });

          if (filter.mood) query = query.eq('mood', filter.mood);
          if (filter.userId) query = query.eq('user_id', filter.userId);
          if (filter.category && filter.category !== 'all') {
            var cat = String(filter.category).toLowerCase().trim();
            if (cat === 'story' || cat === 'stories') {
              query = query.in('category', ['story', 'stories']);
            } else {
              query = query.eq('category', cat);
            }
          }

          if (limit > 0) {
            query = query.range(from, to);
          }

          var res = await query;
          if (res.error) {
            console.warn('[SafeSpace] Supabase feed query warning, trying fallback:', res.error.message);
            var fallbackQuery = _db.from('posts').select(`
              *,
              profiles:user_id (id, username, first_name, last_name, avatar_url),
              post_likes (user_id),
              post_comments (id, user_id, content, reactions, created_at, profiles:user_id(username, first_name, last_name, avatar_url)),
              saved_posts (user_id)
            `).eq('archived', false).order('created_at', { ascending: false });

            if (filter.mood) fallbackQuery = fallbackQuery.eq('mood', filter.mood);
            if (filter.userId) fallbackQuery = fallbackQuery.eq('user_id', filter.userId);
            if (filter.category && filter.category !== 'all') {
              var c = String(filter.category).toLowerCase().trim();
              if (c === 'story' || c === 'stories') fallbackQuery = fallbackQuery.in('category', ['story', 'stories']);
              else fallbackQuery = fallbackQuery.eq('category', c);
            }
            if (limit > 0) fallbackQuery = fallbackQuery.range(from, to);
            res = await fallbackQuery;
          }

          var overrides = {};
          try {
            overrides = JSON.parse(localStorage.getItem('safe_space_post_moderation_overrides') || '{}');
          } catch (oe) {}

          var sbFeed = (res.data || [])
            .filter(function(p) {
              if (p.archived === true || p.deleted_at) return false;
              if (overrides[p.id] && overrides[p.id].archived === true) return false;
              return true;
            })
            .map(function(p) {
            return Object.assign({}, p, {
              author_name: p.is_anonymous ? 'Anonymous' : SafeSpaceDB._displayName(p.profiles),
              author_avatar: p.is_anonymous ? null : (p.profiles ? p.profiles.avatar_url : null),
              likes: p.post_likes ? p.post_likes.map(function(l) { return l.user_id; }) : [],
              comments: (p.post_comments || []).map(function(c) {
                var r = c.reactions;
                var likesList = [];
                var parentId = null;
                var replyTo = null;
                if (Array.isArray(r)) {
                  likesList = r.map(function(x) { return typeof x === 'string' ? x : (x && x.user_id ? x.user_id : null); }).filter(Boolean);
                } else if (r && typeof r === 'object') {
                  likesList = Array.isArray(r.likes) ? r.likes : [];
                  parentId = r.parent_id || null;
                  replyTo = r.reply_to || null;
                }
                return {
                  id: c.id,
                  post_id: c.post_id || p.id,
                  user_id: c.user_id,
                  username: SafeSpaceDB._displayName(c.profiles),
                  avatar_url: c.profiles ? c.profiles.avatar_url : null,
                  content: c.content,
                  reactions: r,
                  likes: likesList,
                  parent_id: parentId,
                  reply_to: replyTo,
                  created_at: c.created_at
                };
              }),
              saved_by: p.saved_posts ? p.saved_posts.map(function(s) { return s.user_id; }) : []
            });
          });

          // Merge local posts (e.g. freshly posted or demo cache) only if on first page
          if (page === 0) {
            var localPosts = JSON.parse(localStorage.getItem('safe_space_posts') || '[]');
            var existingFeedIds = new Set(sbFeed.map(function(p) { return p.id; }));
            localPosts.forEach(function(lp) {
              if (lp.archived === true || lp.is_deleted === true || lp.moderation_status === 'BLOCKED' || lp.moderation_status === 'DELETED' || lp.moderation_status === 'HIDDEN') return;
              if (overrides[lp.id] && overrides[lp.id].archived === true) return;
              if (!existingFeedIds.has(lp.id)) {
                if (filter.category && filter.category !== 'all') {
                  var targetCat = String(filter.category).toLowerCase().trim();
                  var lpCat = (lp.category || 'general').toLowerCase();
                  if (targetCat === 'story' || targetCat === 'stories') {
                    if (lpCat !== 'story' && lpCat !== 'stories') return;
                  } else if (lpCat !== targetCat) {
                    return;
                  }
                }
                sbFeed.unshift(lp);
              }
            });
          }
          return sbFeed;
        } catch (supabaseErr) {
          console.warn('[SafeSpace] Using local feed fallback:', supabaseErr.message);
        }
      }

      // Local Demo Mode
      var posts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      var saved = JSON.parse(localStorage.getItem('safe_space_saved')) || [];

      if (filter.mood) posts = posts.filter(function(p) { return p.mood === filter.mood; });
      if (filter.userId) posts = posts.filter(function(p) { return p.user_id === filter.userId; });
      if (filter.category && filter.category !== 'all') {
        var catFilter = String(filter.category).toLowerCase().trim();
        posts = posts.filter(function(p) {
          var postCat = (p.category || 'general').toLowerCase();
          if (catFilter === 'story' || catFilter === 'stories') {
            return postCat === 'story' || postCat === 'stories';
          }
          return postCat === catFilter;
        });
      }

      if (limit > 0) {
        posts = posts.slice(from, from + limit);
      }

      return posts.map(function(p) {
        var postSavedBy = Array.isArray(p.saved_by) ? p.saved_by : [];
        if (saved.includes(p.id) && currentUser && !postSavedBy.includes(currentUser.id)) {
          postSavedBy = postSavedBy.concat([currentUser.id]);
        }
        return Object.assign({}, p, {
          category: p.category || 'general',
          saved_by: postSavedBy,
          likes: Array.isArray(p.likes) ? p.likes : [],
          comments: Array.isArray(p.comments) ? p.comments : []
        });
      });
    },

    createPost: async function(options) {
      options = options || {};
      var content = options.content;
      var mood = options.mood || null;
      var photo_url = options.photo_url || null;
      var is_anonymous = Boolean(options.is_anonymous);
      var category = (options.category || 'general').toLowerCase();

      // AI Moderation & Sentiment metadata
      var sentiment = options.sentiment || null;
      var sentiment_score = typeof options.sentiment_score === 'number' ? options.sentiment_score : null;
      var moderation_status = options.moderation_status || 'APPROVED';
      var moderation_category = options.moderation_category || 'SAFE';
      var moderation_confidence = typeof options.moderation_confidence === 'number' ? options.moderation_confidence : null;
      var moderation_reason = options.moderation_reason || null;

      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('You must be logged in to post.');

      // Check suspension & ban enforcement
      if (SafeSpaceDB.admin && SafeSpaceDB.admin.checkUserStatus) {
        var userStatus = await SafeSpaceDB.admin.checkUserStatus(currentUser.id);
        if (userStatus.status === 'banned') {
          throw new Error('Your account is permanently banned for community guidelines violations.');
        }
        if (userStatus.status === 'suspended' && userStatus.suspended_until && new Date(userStatus.suspended_until) > new Date()) {
          throw new Error('Your account is temporarily suspended until ' + new Date(userStatus.suspended_until).toLocaleString() + '.');
        }
      }

      // Authoritative Content Moderation Shield (prevents direct bypass)
      if (typeof window !== 'undefined' && window.AIService && content) {
        var modCheck = await window.AIService.moderate(content);
        if (!modCheck.allowed || modCheck.status === 'BLOCKED' || (modCheck.status === 'REVIEW' && modCheck.category !== 'SAFE')) {
          if (SafeSpaceDB.admin && SafeSpaceDB.admin.logModerationEvent) {
            SafeSpaceDB.admin.logModerationEvent({
              user_id: currentUser.id,
              content_type: 'post',
              language: modCheck.language || 'unknown',
              category: modCheck.category,
              severity: modCheck.severity,
              confidence: modCheck.confidence,
              action: 'blocked',
              reason: modCheck.reason,
              detection_source: modCheck.detection_source || (modCheck.online ? 'ai' : 'fallback'),
              online: modCheck.online
            }).catch(function() {});
          }
          throw new Error('Your post may violate the Safe Space community guidelines. Please review and revise your message before posting.');
        }
        sentiment = sentiment || modCheck.sentiment;
        sentiment_score = (typeof sentiment_score === 'number') ? sentiment_score : modCheck.sentiment_score;
        moderation_status = modCheck.status;
        moderation_category = modCheck.category;
        moderation_confidence = modCheck.confidence;
        moderation_reason = modCheck.reason;
      }

      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var insertPayload = {
            user_id: currentUser.id,
            content: content,
            mood: mood,
            photo_url: photo_url,
            is_anonymous: is_anonymous,
            category: category
          };

          // Try inserting with AI fields first
          var aiPayload = Object.assign({}, insertPayload, {
            sentiment: sentiment,
            sentiment_score: sentiment_score,
            moderation_status: moderation_status,
            moderation_category: moderation_category
          });

          var res = await _db.from('posts').insert(aiPayload).select('*, profiles:user_id(id, username, avatar_url)').single();

          // Fallback if Supabase database table does not yet have AI columns
          if (res.error && (res.error.message && res.error.message.includes('column'))) {
            res = await _db.from('posts').insert(insertPayload).select('*, profiles:user_id(id, username, avatar_url)').single();
          }

          if (res.error) throw res.error;
          var p = res.data;
          return Object.assign({}, p, {
            author_name: p.is_anonymous ? 'Anonymous' : SafeSpaceDB._displayName(p.profiles || currentUser),
            author_avatar: p.is_anonymous ? null : (p.profiles ? p.profiles.avatar_url : currentUser.avatar_url),
            sentiment: p.sentiment || sentiment,
            sentiment_score: p.sentiment_score !== undefined ? p.sentiment_score : sentiment_score,
            moderation_status: p.moderation_status || moderation_status,
            moderation_category: p.moderation_category || moderation_category,
            likes: [],
            comments: [],
            saved_by: []
          });
        } catch (supabaseErr) {
          console.warn('[SafeSpace] Supabase createPost failed, falling back to local:', supabaseErr.message);
        }
      }

      // Demo Mode
      var posts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      var newPost = {
        id: 'post-' + Date.now(),
        user_id: currentUser.id,
        author_name: is_anonymous ? 'Anonymous' : SafeSpaceDB._displayName(currentUser),
        author_avatar: is_anonymous ? null : currentUser.avatar_url,
        content: content,
        mood: mood,
        photo_url: photo_url,
        is_anonymous: is_anonymous,
        category: category,
        sentiment: sentiment,
        sentiment_score: sentiment_score,
        moderation_status: moderation_status,
        moderation_category: moderation_category,
        moderation_confidence: moderation_confidence,
        moderation_reason: moderation_reason,
        likes: [],
        comments: [],
        saved_by: [],
        created_at: new Date().toISOString()
      };
      posts.unshift(newPost);
      localStorage.setItem('safe_space_posts', JSON.stringify(posts));
      return newPost;
    },

    _isUUID: function(str) {
      return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    },

    toggleLike: async function(postId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return { liked: false, count: 0 };

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(postId)) {
        try {
          var existingRes = await _db.from('post_likes')
            .select('id').eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle();
          if (existingRes.error) throw existingRes.error;

          var liked = false;
          if (existingRes.data) {
            var delRes = await _db.from('post_likes').delete().eq('id', existingRes.data.id);
            if (delRes.error) throw delRes.error;
            liked = false;
          } else {
            var insRes = await _db.from('post_likes').insert({ post_id: postId, user_id: currentUser.id });
            if (insRes.error) throw insRes.error;
            liked = true;

            // Generate real notification in DB for post owner
            try {
              var postOwnerRes = await _db.from('posts').select('user_id').eq('id', postId).maybeSingle();
              if (postOwnerRes.data && postOwnerRes.data.user_id && postOwnerRes.data.user_id !== currentUser.id) {
                await _db.from('notifications').insert({
                  user_id: postOwnerRes.data.user_id,
                  actor_id: currentUser.id,
                  type: 'like',
                  post_id: postId,
                  is_read: false
                });
              }
            } catch (ne) {}
          }
          var countRes = await _db.from('post_likes').select('id', { count: 'exact', head: true }).eq('post_id', postId);
          var totalCount = (countRes && countRes.count !== null && countRes.count !== undefined) ? countRes.count : (liked ? 1 : 0);
          return { liked: liked, count: totalCount };
        } catch (err) {
          console.warn('[SafeSpace] Supabase toggleLike failed, using local:', err.message);
        }
      }

      // Demo Mode
      var posts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      var post = posts.find(function(p) { return p.id === postId; });
      if (!post) {
        return { liked: true, count: 1 };
      }
      if (!Array.isArray(post.likes)) post.likes = [];
      var idx = post.likes.indexOf(currentUser.id);
      var isLiked = false;
      if (idx > -1) {
        post.likes.splice(idx, 1);
        isLiked = false;
      } else {
        post.likes.push(currentUser.id);
        isLiked = true;
      }
      localStorage.setItem('safe_space_posts', JSON.stringify(posts));
      return { liked: isLiked, count: post.likes.length };
    },

    addComment: async function(postId, content, options) {
      options = options || {};
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Log in to comment.');

      var parentId = options.parent_id || null;
      var replyTo = options.reply_to || null;
      var reactionsPayload = {
        likes: [],
        parent_id: parentId,
        reply_to: replyTo
      };

      // Authoritative Content Moderation Shield for Comments
      if (typeof window !== 'undefined' && window.AIService && content) {
        var modCheck = await window.AIService.moderate(content);
        if (!modCheck.allowed || modCheck.status === 'BLOCKED' || (modCheck.status === 'REVIEW' && modCheck.category !== 'SAFE')) {
          if (SafeSpaceDB.admin && SafeSpaceDB.admin.logModerationEvent) {
            SafeSpaceDB.admin.logModerationEvent({
              user_id: currentUser.id,
              content_type: 'comment',
              content_id: postId,
              language: modCheck.language || 'unknown',
              category: modCheck.category,
              severity: modCheck.severity,
              confidence: modCheck.confidence,
              action: 'blocked',
              reason: modCheck.reason,
              detection_source: modCheck.detection_source || (modCheck.online ? 'ai' : 'fallback'),
              online: modCheck.online
            }).catch(function() {});
          }
          throw new Error('Your comment may violate the Safe Space community guidelines. Please review and revise your message before posting.');
        }
      }

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(postId)) {
        try {
          var res = await _db.from('post_comments').insert({
            post_id: postId,
            user_id: currentUser.id,
            content: content,
            reactions: reactionsPayload
          }).select(`*, profiles:user_id(username, first_name, last_name, avatar_url)`).single();

          if (res.error) throw res.error;
          var c = res.data;

          // Generate real notification in DB for post owner
          try {
            var postOwnerRes = await _db.from('posts').select('user_id').eq('id', postId).maybeSingle();
            if (postOwnerRes.data && postOwnerRes.data.user_id && postOwnerRes.data.user_id !== currentUser.id) {
              await _db.from('notifications').insert({
                user_id: postOwnerRes.data.user_id,
                actor_id: currentUser.id,
                type: 'comment',
                post_id: postId,
                comment_id: c.id,
                is_read: false
              });
            }
          } catch (ne) {}

          return {
            id: c.id,
            post_id: c.post_id || postId,
            user_id: c.user_id,
            username: SafeSpaceDB._displayName(c.profiles || currentUser),
            avatar_url: c.profiles ? c.profiles.avatar_url : currentUser.avatar_url,
            content: c.content,
            reactions: reactionsPayload,
            likes: [],
            parent_id: parentId,
            reply_to: replyTo,
            created_at: c.created_at || new Date().toISOString()
          };
        } catch (err) {
          console.warn('[SafeSpace] Supabase addComment failed, using local:', err.message);
        }
      }

      // Demo Mode
      var posts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      var post = posts.find(function(p) { return p.id === postId; });
      var comment = {
        id: 'c-' + Date.now(),
        post_id: postId,
        user_id: currentUser.id,
        username: SafeSpaceDB._displayName(currentUser),
        avatar_url: currentUser.avatar_url || null,
        content: content,
        reactions: reactionsPayload,
        likes: [],
        parent_id: parentId,
        reply_to: replyTo,
        created_at: new Date().toISOString()
      };
      if (post) {
        if (!Array.isArray(post.comments)) post.comments = [];
        post.comments.push(comment);
        localStorage.setItem('safe_space_posts', JSON.stringify(posts));
      }
      return comment;
    },

    toggleCommentReaction: async function(commentId, postId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return { reacted: false, count: 0 };

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(commentId)) {
        try {
          var dbClient = _dbAdmin || _db;
          var cRes = await dbClient.from('post_comments').select('id, reactions').eq('id', commentId).single();
          if (cRes.error) throw cRes.error;
          if (cRes.data) {
            var r = cRes.data.reactions;
            var likesList = [];
            var parentId = null;
            var replyTo = null;
            if (Array.isArray(r)) {
              likesList = r.map(function(x) { return typeof x === 'string' ? x : (x && x.user_id ? x.user_id : null); }).filter(Boolean);
            } else if (r && typeof r === 'object') {
              likesList = Array.isArray(r.likes) ? r.likes : [];
              parentId = r.parent_id || null;
              replyTo = r.reply_to || null;
            }
            var idx = likesList.indexOf(currentUser.id);
            var reacted = false;
            if (idx > -1) {
              likesList.splice(idx, 1);
              reacted = false;
            } else {
              likesList.push(currentUser.id);
              reacted = true;
            }
            var updatedReactions = {
              likes: likesList,
              parent_id: parentId,
              reply_to: replyTo
            };
            var upRes = await dbClient.from('post_comments').update({ reactions: updatedReactions }).eq('id', commentId);
            if (upRes.error) throw upRes.error;
            return { reacted: reacted, count: likesList.length };
          }
        } catch (err) {
          console.warn('[SafeSpace] Supabase toggleCommentReaction failed, using local:', err.message);
        }
      }

      // Demo Mode
      var posts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      for (var i = 0; i < posts.length; i++) {
        var p = posts[i];
        if (Array.isArray(p.comments)) {
          var c = p.comments.find(function(item) { return item.id === commentId; });
          if (c) {
            if (!c.reactions || typeof c.reactions !== 'object') {
              c.reactions = { likes: [], parent_id: null, reply_to: null };
            }
            if (!Array.isArray(c.reactions.likes)) c.reactions.likes = [];
            var lIdx = c.reactions.likes.indexOf(currentUser.id);
            var isReacted = false;
            if (lIdx > -1) {
              c.reactions.likes.splice(lIdx, 1);
              isReacted = false;
            } else {
              c.reactions.likes.push(currentUser.id);
              isReacted = true;
            }
            c.likes = c.reactions.likes;
            localStorage.setItem('safe_space_posts', JSON.stringify(posts));
            return { reacted: isReacted, count: c.reactions.likes.length };
          }
        }
      }
      return { reacted: false, count: 0 };
    },

    toggleSave: async function(postId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return { saved: false };

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(postId)) {
        try {
          var existingRes = await _db.from('saved_posts')
            .select('id').eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle();
          if (existingRes.error) throw existingRes.error;

          if (existingRes.data) {
            var delRes = await _db.from('saved_posts').delete().eq('id', existingRes.data.id);
            if (delRes.error) throw delRes.error;
            return { saved: false };
          } else {
            var insRes = await _db.from('saved_posts').insert({ post_id: postId, user_id: currentUser.id });
            if (insRes.error) throw insRes.error;
            return { saved: true };
          }
        } catch (err) {
          console.warn('[SafeSpace] Supabase toggleSave failed, using local:', err.message);
        }
      }

      // Demo Mode
      var saved = JSON.parse(localStorage.getItem('safe_space_saved')) || [];
      var idx = saved.indexOf(postId);
      var isSaved = false;
      if (idx > -1) {
        saved.splice(idx, 1);
        isSaved = false;
      } else {
        saved.push(postId);
        isSaved = true;
      }
      localStorage.setItem('safe_space_saved', JSON.stringify(saved));
      return { saved: isSaved };
    },

    getSavedPosts: async function() {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      var results = [];

      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var res = await _db.from('saved_posts')
            .select('post_id, posts(*, profiles:user_id(username, avatar_url))')
            .eq('user_id', currentUser.id);
          if (res.error) throw res.error;
          results = (res.data || []).filter(function(d) { return Boolean(d.posts); }).map(function(d) {
            var p = d.posts;
            return Object.assign({}, p, {
              author_name: p.is_anonymous ? 'Anonymous' : SafeSpaceDB._displayName(p.profiles),
              author_avatar: p.is_anonymous ? null : (p.profiles ? p.profiles.avatar_url : null)
            });
          });
        } catch (err) {
          console.warn('[SafeSpace] Supabase getSavedPosts failed, using local:', err.message);
        }
      }

      var saved = JSON.parse(localStorage.getItem('safe_space_saved')) || [];
      var allPosts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      var localSaved = allPosts.filter(function(p) { return saved.includes(p.id); });

      var existingIds = new Set(results.map(function(r) { return r.id; }));
      localSaved.forEach(function(lp) {
        if (!existingIds.has(lp.id)) {
          results.push(lp);
        }
      });

      return results;
    },

    deletePost: async function(postId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return false;

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(postId)) {
        try {
          var res = await _db.from('posts').delete().eq('id', postId).eq('user_id', currentUser.id);
          if (res.error) throw res.error;
          return true;
        } catch (err) {
          console.warn('[SafeSpace] Supabase deletePost failed, using local:', err.message);
        }
      }

      var posts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      posts = posts.filter(function(p) { return p.id !== postId; });
      localStorage.setItem('safe_space_posts', JSON.stringify(posts));
      return true;
    },

    adminDeletePost: async function(postId) {
      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(postId)) {
        try {
          var client = _dbAdmin || _db;
          // Soft-delete first to immediately remove from queries
          await client.from('posts').update({ archived: true }).eq('id', postId);
          await client.from('post_likes').delete().eq('post_id', postId);
          await client.from('post_comments').delete().eq('post_id', postId);
          await client.from('saved_posts').delete().eq('post_id', postId);
          await client.from('reports').delete().eq('post_id', postId);
          var res = await client.from('posts').delete().eq('id', postId);
          if (res.error) console.warn('[SafeSpace] Permanent delete warning:', res.error.message);
        } catch (e) {
          console.warn('[SafeSpace] Supabase adminDeletePost error:', e);
        }
      }
      var posts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      posts = posts.filter(function(p) { return p.id !== postId; });
      localStorage.setItem('safe_space_posts', JSON.stringify(posts));

      if (typeof SafeSpaceDB._broadcastModerationSync === 'function') {
        SafeSpaceDB._broadcastModerationSync(postId, 'deleted');
      }

      return { success: true };
    }
  },

  // ==========================================
  // MESSAGING & CHAT SUPPORT (MODULE 3)
  // ==========================================
  messages: {
    getConversations: async function(limit) {
      limit = limit || 20;
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      var convosMap = {};
      var readMarkers = JSON.parse(localStorage.getItem('safe_space_chat_read_markers') || '{}');

      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _db;
          // Retrieve only valid fields and limit recent messages for fast loading
          var res = await client.from('messages')
            .select('id, sender_id, receiver_id, message, is_deleted, created_at, sender:sender_id(id, username, first_name, last_name, avatar_url), receiver:receiver_id(id, username, first_name, last_name, avatar_url)')
            .or('sender_id.eq.' + currentUser.id + ',receiver_id.eq.' + currentUser.id)
            .order('created_at', { ascending: false })
            .limit(100);

          if (res.error) throw res.error;
          var list = res.data || [];
          for (var i = 0; i < list.length; i++) {
            var m = list[i];
            var otherUser = m.sender_id === currentUser.id ? m.receiver : m.sender;
            if (!otherUser || !otherUser.id) continue;
            
            var lastRead = readMarkers[otherUser.id] ? new Date(readMarkers[otherUser.id]).getTime() : 0;
            var msgTime = new Date(m.created_at).getTime();
            var isUnreadIncoming = (m.receiver_id === currentUser.id && msgTime > lastRead);

            if (!convosMap[otherUser.id]) {
              var dispName = SafeSpaceDB._displayName(otherUser);
              var isOnline = SafeSpaceDB.users.isOnline(otherUser);
              convosMap[otherUser.id] = {
                user_id: otherUser.id,
                username: dispName,
                avatar_url: otherUser.avatar_url,
                last_message: m.message,
                last_message_at: m.created_at,
                unread_count: isUnreadIncoming ? 1 : 0,
                last_active: m.created_at,
                is_online: isOnline,
                contact: {
                  id: otherUser.id,
                  username: dispName,
                  avatar_url: otherUser.avatar_url,
                  last_active: m.created_at,
                  is_online: isOnline
                }
              };
            } else {
              // Accumulate subsequent unread messages from this sender
              if (isUnreadIncoming) {
                convosMap[otherUser.id].unread_count = (convosMap[otherUser.id].unread_count || 0) + 1;
              }
            }
          }
          var convList = [];
          for (var k in convosMap) {
            if (convosMap.hasOwnProperty(k)) convList.push(convosMap[k]);
          }
          convList.sort(function(a, b) {
            return new Date(b.last_message_at) - new Date(a.last_message_at);
          });
          return convList.slice(0, limit);
        } catch (err) {
          console.warn('[SafeSpace] Supabase getConversations error:', err.message);
        }
      }

      var all = JSON.parse(localStorage.getItem('safe_space_messages')) || [];
      var members = JSON.parse(localStorage.getItem('safe_space_members')) || [];
      all.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      for (var j = 0; j < all.length; j++) {
        var msg = all[j];
        var otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        if (!otherId) continue;
        var lr = readMarkers[otherId] ? new Date(readMarkers[otherId]).getTime() : 0;
        var mt = new Date(msg.created_at).getTime();
        var isUnreadLoc = (msg.receiver_id === currentUser.id && mt > lr);

        if (!convosMap[otherId]) {
          var mem = null;
          for (var mi = 0; mi < members.length; mi++) {
            if (members[mi].id === otherId) { mem = members[mi]; break; }
          }
          if (!mem) mem = { id: otherId, username: 'Member' };
          var dName = SafeSpaceDB._displayName(mem);
          var memOnline = SafeSpaceDB.users.isOnline(mem);
          convosMap[otherId] = {
            user_id: otherId,
            username: dName,
            avatar_url: mem.avatar_url,
            last_message: msg.message,
            last_message_at: msg.created_at,
            unread_count: isUnreadLoc ? 1 : 0,
            last_active: mem.last_active,
            is_online: memOnline,
            contact: {
              id: otherId,
              username: dName,
              avatar_url: mem.avatar_url,
              last_active: mem.last_active,
              is_online: memOnline
            }
          };
        } else {
          if (isUnreadLoc) {
            convosMap[otherId].unread_count = (convosMap[otherId].unread_count || 0) + 1;
          }
        }
      }
      var localConvs = [];
      for (var lk in convosMap) {
        if (convosMap.hasOwnProperty(lk)) localConvs.push(convosMap[lk]);
      }
      localConvs.sort(function(a, b) {
        return new Date(b.last_message_at) - new Date(a.last_message_at);
      });
      return localConvs.slice(0, limit);
    },

    getMessages: function(otherUserId, options) {
      return this.getMessagesWith(otherUserId, options);
    },

    getMessagesWith: async function(otherUserId, options) {
      options = options || {};
      var limit = options.limit || 30;
      var before = options.before || null;

      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(otherUserId) && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        try {
          var client = _db;
          var query = client.from('messages')
            .select('id, sender_id, receiver_id, message, is_deleted, reactions, created_at')
            .or('and(sender_id.eq.' + currentUser.id + ',receiver_id.eq.' + otherUserId + '),and(sender_id.eq.' + otherUserId + ',receiver_id.eq.' + currentUser.id + ')')
            .order('created_at', { ascending: false })
            .limit(limit);

          if (before) {
            query = query.lt('created_at', before);
          }

          var res = await query;
          if (res.error) throw res.error;
          var data = res.data || [];
          data.reverse(); // Ensure chronological order: older at top, newest at bottom
          return data;
        } catch (err) {
          console.warn('[SafeSpace] Supabase getMessagesWith error:', err.message);
        }
      }

      var all = JSON.parse(localStorage.getItem('safe_space_messages')) || [];
      var filtered = all.filter(function(m) {
        return (m.sender_id === currentUser.id && m.receiver_id === otherUserId) ||
               (m.sender_id === otherUserId && m.receiver_id === currentUser.id);
      });
      if (before) {
        var beforeTime = new Date(before).getTime();
        filtered = filtered.filter(function(m) { return new Date(m.created_at).getTime() < beforeTime; });
      }
      filtered.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      var paged = filtered.slice(0, limit);
      paged.reverse();
      return paged;
    },

    markAsRead: async function(otherUserId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser || !otherUserId) return 0;

      // Persist client read marker immediately
      try {
        var markers = JSON.parse(localStorage.getItem('safe_space_chat_read_markers') || '{}');
        markers[otherUserId] = new Date().toISOString();
        localStorage.setItem('safe_space_chat_read_markers', JSON.stringify(markers));
      } catch (e) {}

      var updatedCount = 0;

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(otherUserId) && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        try {
          var client = _db;
          var nowIso = new Date().toISOString();
          var res = await client.from('messages')
            .update({ is_read: true, read_at: nowIso })
            .eq('receiver_id', currentUser.id)
            .eq('sender_id', otherUserId)
            .select('id');

          if (res.data) {
            updatedCount += res.data.length;
          }
        } catch (err) {
          try {
            var client2 = _db;
            var res2 = await client2.from('messages')
              .update({ is_read: true })
              .eq('receiver_id', currentUser.id)
              .eq('sender_id', otherUserId)
              .select('id');
            if (res2.data) updatedCount += res2.data.length;
          } catch (e2) {}
        }
      }

      // Also ensure local storage messages are synchronized
      var messages = JSON.parse(localStorage.getItem('safe_space_messages')) || [];
      var localMarked = 0;
      messages.forEach(function(m) {
        if (m.receiver_id === currentUser.id && m.sender_id === otherUserId && (m.is_read === false || m.is_read === 0 || !m.is_read)) {
          m.is_read = true;
          localMarked++;
        }
      });
      if (localMarked > 0) {
        localStorage.setItem('safe_space_messages', JSON.stringify(messages));
      }

      return Math.max(updatedCount, localMarked);
    },

    sendMessage: async function(receiverId, text) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (SafeSpaceDB.admin && SafeSpaceDB.admin.checkUserStatus) {
        var userStatus = await SafeSpaceDB.admin.checkUserStatus(currentUser.id);
        if (userStatus.status === 'banned') {
          throw new Error('Your account is permanently banned.');
        }
        if (userStatus.status === 'suspended' && userStatus.suspended_until && new Date(userStatus.suspended_until) > new Date()) {
          throw new Error('Your account is temporarily suspended from sending messages.');
        }
      }

      SafeSpaceDB.users.updateLastActive().catch(function() {});

      // Authoritative Content Moderation Shield for Chat Messages
      if (typeof window !== 'undefined' && window.AIService && text) {
        var modCheck = await window.AIService.moderate(text);
        if (!modCheck.allowed || modCheck.status === 'BLOCKED' || (modCheck.status === 'REVIEW' && modCheck.category !== 'SAFE')) {
          if (SafeSpaceDB.admin && SafeSpaceDB.admin.logModerationEvent) {
            SafeSpaceDB.admin.logModerationEvent({
              user_id: currentUser.id,
              content_type: 'chat',
              language: modCheck.language || 'unknown',
              category: modCheck.category,
              severity: modCheck.severity,
              confidence: modCheck.confidence,
              action: 'blocked',
              reason: modCheck.reason,
              detection_source: modCheck.detection_source || (modCheck.online ? 'ai' : 'fallback'),
              online: modCheck.online
            }).catch(function() {});
          }
          throw new Error('Your message may violate the Safe Space community guidelines. Please review and revise your message before sending.');
        }
      }

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(receiverId) && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        var client = _db;
        var insertPayload = {
          sender_id: currentUser.id,
          receiver_id: receiverId,
          message: text
        };
        var res = await client.from('messages').insert(insertPayload).select().single();
        if (res.error) throw res.error;

        // Generate notification for message receiver
        try {
          var senderName = SafeSpaceDB._displayName(currentUser);
          var truncatedText = text.length > 60 ? (text.substring(0, 57) + '...') : text;
          await client.from('notifications').insert({
            user_id: receiverId,
            actor_id: currentUser.id,
            type: 'message',
            message: senderName + ': ' + truncatedText,
            is_read: false
          });
        } catch (ne) {}

        return res.data;
      }

      var messages = JSON.parse(localStorage.getItem('safe_space_messages')) || [];
      var msg = {
        id: 'msg-' + Date.now(),
        sender_id: currentUser.id,
        receiver_id: receiverId,
        message: text,
        is_read: false,
        created_at: new Date().toISOString()
      };
      messages.push(msg);
      localStorage.setItem('safe_space_messages', JSON.stringify(messages));

      // Local notification for receiver
      try {
        var localNotifsKey = 'safe_space_notifications_' + receiverId;
        var localNotifs = JSON.parse(localStorage.getItem(localNotifsKey) || '[]');
        localNotifs.unshift({
          id: 'notif-' + Date.now(),
          user_id: receiverId,
          actor_id: currentUser.id,
          type: 'message',
          message: (currentUser.username || 'A member') + ': ' + (text.length > 60 ? (text.substring(0, 57) + '...') : text),
          is_read: false,
          created_at: new Date().toISOString()
        });
        localStorage.setItem(localNotifsKey, JSON.stringify(localNotifs));
      } catch (lne) {}
      return msg;
    },

    subscribeToMessages: function(otherUserId, callback) {
      if (SafeSpaceDB.isSupabaseActive() && _db && typeof _db.channel === 'function') {
        try {
          var channelName = 'chat_' + [otherUserId, Date.now()].join('_');
          var channel = _db.channel(channelName)
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'messages' },
              function(payload) {
                var newMsg = payload.new;
                if (newMsg && (newMsg.sender_id === otherUserId || newMsg.receiver_id === otherUserId)) {
                  callback(newMsg);
                }
              }
            )
            .subscribe();

          return function() {
            try {
              _db.removeChannel(channel);
            } catch (e) {}
          };
        } catch (err) {
          console.warn('[SafeSpace] Realtime subscription failed:', err.message);
        }
      }
      return function() {};
    },

    subscribeToInbox: function(callback) {
      if (SafeSpaceDB.isSupabaseActive() && _db && typeof _db.channel === 'function') {
        try {
          var currentUser = JSON.parse(localStorage.getItem('safe_space_user'));
          if (!currentUser || !currentUser.id) return function() {};
          var channelName = 'inbox_' + currentUser.id + '_' + Date.now();
          var channel = _db.channel(channelName)
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'messages' },
              function(payload) {
                var newMsg = payload.new;
                if (newMsg && (newMsg.receiver_id === currentUser.id || newMsg.sender_id === currentUser.id)) {
                  callback(newMsg);
                }
              }
            )
            .subscribe();

          return function() {
            try {
              _db.removeChannel(channel);
            } catch (e) {}
          };
        } catch (err) {
          console.warn('[SafeSpace] Inbox subscription failed:', err.message);
        }
      }
      return function() {};
    },

    deleteMessage: async function(messageId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(messageId)) {
        try {
          var client = _dbAdmin || _db;
          // Verify ownership & soft delete
          var res = await client.from('messages')
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString(),
              message: 'This message was deleted.'
            })
            .eq('id', messageId)
            .eq('sender_id', currentUser.id)
            .select()
            .single();

          if (res.error) throw res.error;
          return res.data;
        } catch (err) {
          console.warn('[SafeSpace] Supabase deleteMessage error:', err.message);
        }
      }

      // Demo Mode
      var messages = JSON.parse(localStorage.getItem('safe_space_messages')) || [];
      var msgIndex = messages.findIndex(function(m) { return m.id === messageId; });
      if (msgIndex === -1) throw new Error('Message not found');

      if (messages[msgIndex].sender_id !== currentUser.id) {
        throw new Error('Unauthorized: You can only delete your own messages.');
      }

      messages[msgIndex].is_deleted = true;
      messages[msgIndex].deleted_at = new Date().toISOString();
      messages[msgIndex].message = 'This message was deleted.';
      localStorage.setItem('safe_space_messages', JSON.stringify(messages));
      return messages[msgIndex];
    },

    clearConversation: async function(otherUserId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (otherUserId === 'safe-space-ai-bot') {
        if (typeof window !== 'undefined' && window.AIChatbot) {
          AIChatbot.clearChatHistory(currentUser.id);
        }
        return { success: true };
      }

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(otherUserId) && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        try {
          var client = _dbAdmin || _db;
          await client.from('messages')
            .update({
              is_deleted: true,
              deleted_at: new Date().toISOString(),
              message: 'This message was deleted.'
            })
            .or('and(sender_id.eq.' + currentUser.id + ',receiver_id.eq.' + otherUserId + '),and(sender_id.eq.' + otherUserId + ',receiver_id.eq.' + currentUser.id + ')');
        } catch (err) {
          console.warn('[SafeSpace] Supabase clearConversation error:', err.message);
        }
      }

      // Also clean local storage
      var messages = JSON.parse(localStorage.getItem('safe_space_messages')) || [];
      var remaining = messages.filter(function(m) {
        return !((m.sender_id === currentUser.id && m.receiver_id === otherUserId) ||
                 (m.sender_id === otherUserId && m.receiver_id === currentUser.id));
      });
      localStorage.setItem('safe_space_messages', JSON.stringify(remaining));
      return { success: true };
    },

    toggleReaction: async function(messageId, reactionEmoji) {
      var validReactions = ['❤️', '👍', '😂', '😢', '😮'];
      if (!validReactions.includes(reactionEmoji)) {
        throw new Error('Invalid reaction emoji.');
      }

      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(messageId) && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        try {
          var client = _dbAdmin || _db;
          // Check existing reaction in message_reactions
          var chk = await client.from('message_reactions')
            .select('*')
            .eq('message_id', messageId)
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (chk.data) {
            if (chk.data.reaction === reactionEmoji) {
              // Toggle off
              await client.from('message_reactions').delete().eq('id', chk.data.id);
            } else {
              // Update reaction
              await client.from('message_reactions').update({ reaction: reactionEmoji }).eq('id', chk.data.id);
            }
          } else {
            // Insert reaction
            await client.from('message_reactions').insert({
              message_id: messageId,
              user_id: currentUser.id,
              reaction: reactionEmoji
            });
          }

          var allR = await client.from('message_reactions').select('reaction, user_id').eq('message_id', messageId);
          return allR.data || [];
        } catch (err) {
          console.warn('[SafeSpace] Supabase toggleReaction error:', err.message);
        }
      }

      // Demo Mode
      var messages = JSON.parse(localStorage.getItem('safe_space_messages')) || [];
      var msg = messages.find(function(m) { return m.id === messageId; });
      if (!msg) throw new Error('Message not found');

      if (!Array.isArray(msg.reactions)) {
        msg.reactions = [];
      }

      var existingIdx = msg.reactions.findIndex(function(r) { return r.user_id === currentUser.id; });
      if (existingIdx !== -1) {
        if (msg.reactions[existingIdx].reaction === reactionEmoji) {
          msg.reactions.splice(existingIdx, 1); // remove
        } else {
          msg.reactions[existingIdx].reaction = reactionEmoji; // change
        }
      } else {
        msg.reactions.push({
          user_id: currentUser.id,
          reaction: reactionEmoji,
          created_at: new Date().toISOString()
        });
      }

      localStorage.setItem('safe_space_messages', JSON.stringify(messages));
      return msg.reactions;
    }
  },

  // ==========================================
  // NOTIFICATIONS (MODULE 3 & BELL)
  // ==========================================
  notifications: {
    getNotifications: async function() {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        try {
          var client = _db;
          var res = await client.from('notifications')
            .select('id, user_id, actor_id, type, post_id, comment_id, message, is_read, created_at, actor:actor_id(id, username, first_name, last_name, avatar_url)')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

          if (res.error) {
            res = await client.from('notifications')
              .select('id, user_id, actor_id, type, post_id, comment_id, is_read, created_at, actor:actor_id(id, username, first_name, last_name, avatar_url)')
              .eq('user_id', currentUser.id)
              .order('created_at', { ascending: false });
          }

          if (!res.error && Array.isArray(res.data)) {
            return res.data.map(function(n) {
              var actorName = n.actor ? SafeSpaceDB._displayName(n.actor) : 'A member';
              var msg = '';
              if (n.type === 'like' || n.type === 'reaction') msg = n.message || (actorName + ' reacted ❤️ to your community post.');
              else if (n.type === 'comment') msg = n.message || (actorName + ' commented on your post.');
              else if (n.type === 'friend_request') msg = n.message || (actorName + ' sent you a friend request.');
              else if (n.type === 'friend_accept') msg = n.message || (actorName + ' accepted your friend request.');
              else if (n.type === 'support_message' || n.type === 'message') msg = n.message || ('You received a message from ' + actorName + '.');
              else if (n.type === 'moderation_warning') msg = n.message || '⚠️ Warning: A post of yours violated Safe Space community standards.';
              else if (n.type === 'moderation_notice') msg = n.message || '⚠️ Moderation Notice: A post was reviewed by community moderators.';
              else if (n.type === 'account_suspended') msg = n.message || '🚫 Account Alert: Your account was suspended by administrators.';
              else msg = n.message || ('Notification from ' + actorName);
              return Object.assign({}, n, {
                message: msg,
                actor_name: actorName,
                actor_avatar: n.actor ? n.actor.avatar_url : null
              });
            });
          }
        } catch (e) {
          console.warn('[SafeSpace] Supabase notifications error:', e.message);
        }
      }

      var notifs = JSON.parse(localStorage.getItem('safe_space_notifications_' + currentUser.id)) || [];
      return notifs;
    },

    markAsRead: async function(notifId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return;

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(notifId)) {
        try {
          var client = _db;
          await client.from('notifications').update({ is_read: true }).eq('id', notifId).eq('user_id', currentUser.id);
        } catch (e) {}
      }

      var notifs = JSON.parse(localStorage.getItem('safe_space_notifications_' + currentUser.id)) || [];
      notifs.forEach(function(n) {
        if (n.id === notifId) n.is_read = true;
      });
      localStorage.setItem('safe_space_notifications_' + currentUser.id, JSON.stringify(notifs));
    },

    markAllAsRead: async function() {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return;

      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _db;
          await client.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id);
        } catch (e) {}
      }

      var notifs = JSON.parse(localStorage.getItem('safe_space_notifications_' + currentUser.id)) || [];
      notifs.forEach(function(n) { n.is_read = true; });
      localStorage.setItem('safe_space_notifications_' + currentUser.id, JSON.stringify(notifs));
    },

    getUnreadCount: async function() {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return 0;
      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        try {
          var countRes = await _db.from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .eq('is_read', false);
          if (countRes && countRes.count !== null && countRes.count !== undefined) {
            return countRes.count;
          }
        } catch (e) {}
      }
      var notifs = await this.getNotifications();
      return notifs.filter(function(n) { return !n.is_read; }).length;
    }
  },

  // ==========================================
  // BIBLE VERSES DATABASE (PUBLIC DOMAIN)
  // ==========================================
  verses: {
    INITIAL_VERSES: [
      {
        id: 'verse-1',
        book: 'Philippians',
        chapter: 4,
        verse: 6,
        category: 'Anxiety',
        verse_text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.'
      },
      {
        id: 'verse-2',
        book: '1 Peter',
        chapter: 5,
        verse: 7,
        category: 'Anxiety',
        verse_text: 'Cast all your anxiety on him because he cares for you.'
      },
      {
        id: 'verse-psalm23',
        book: 'Psalm',
        chapter: 23,
        verse: 1,
        category: 'Comfort',
        verse_text: 'The Lord is my shepherd; I shall not want.'
      },
      {
        id: 'verse-3',
        book: 'Matthew',
        chapter: 11,
        verse: 28,
        category: 'Stress',
        verse_text: 'Come to me, all you who are weary and burdened, and I will give you rest.'
      },
      {
        id: 'verse-4',
        book: 'Psalm',
        chapter: 55,
        verse: 22,
        category: 'Stress',
        verse_text: 'Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.'
      },
      {
        id: 'verse-5',
        book: 'Jeremiah',
        chapter: 29,
        verse: 11,
        category: 'Hope',
        verse_text: 'For I know the plans I have for you, plans to prosper you and not to harm you, plans to give you hope and a future.'
      },
      {
        id: 'verse-6',
        book: 'Romans',
        chapter: 15,
        verse: 13,
        category: 'Hope',
        verse_text: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope.'
      },
      {
        id: 'verse-7',
        book: 'Isaiah',
        chapter: 40,
        verse: 31,
        category: 'Strength',
        verse_text: 'Those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary.'
      },
      {
        id: 'verse-8',
        book: 'Philippians',
        chapter: 4,
        verse: 13,
        category: 'Strength',
        verse_text: 'I can do all this through him who gives me strength.'
      },
      {
        id: 'verse-9',
        book: 'Joshua',
        chapter: 1,
        verse: 9,
        category: 'Fear',
        verse_text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.'
      },
      {
        id: 'verse-10',
        book: '2 Timothy',
        chapter: 1,
        verse: 7,
        category: 'Fear',
        verse_text: 'For God has not given us a spirit of fear, but of power, and of love, and of a sound mind.'
      },
      {
        id: 'verse-11',
        book: 'Psalm',
        chapter: 34,
        verse: 18,
        category: 'Sadness',
        verse_text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.'
      },
      {
        id: 'verse-12',
        book: 'Revelation',
        chapter: 21,
        verse: 4,
        category: 'Sadness',
        verse_text: 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain.'
      },
      {
        id: 'verse-13',
        book: 'Romans',
        chapter: 8,
        verse: 31,
        category: 'Encouragement',
        verse_text: 'What, then, shall we say in response to these things? If God is for us, who can be against us?'
      },
      {
        id: 'verse-14',
        book: '1 Thessalonians',
        chapter: 5,
        verse: 11,
        category: 'Encouragement',
        verse_text: 'Therefore encourage one another and build each other up, just as in fact you are doing.'
      },
      {
        id: 'verse-15',
        book: 'John',
        chapter: 14,
        verse: 27,
        category: 'Peace',
        verse_text: 'Peace I leave with you; my peace I give you. Do not let your hearts be troubled and do not be afraid.'
      },
      {
        id: 'verse-16',
        book: 'Numbers',
        chapter: 6,
        verse: 24,
        category: 'Peace',
        verse_text: 'The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you and give you peace.'
      },
      {
        id: 'verse-17',
        book: '1 Corinthians',
        chapter: 13,
        verse: 4,
        category: 'Love',
        verse_text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud, and it keeps no record of wrongs.'
      },
      {
        id: 'verse-18',
        book: 'Romans',
        chapter: 8,
        verse: 38,
        category: 'Love',
        verse_text: 'For I am convinced that neither death nor life... will be able to separate us from the love of God.'
      },
      {
        id: 'verse-19',
        book: 'Colossians',
        chapter: 3,
        verse: 13,
        category: 'Forgiveness',
        verse_text: 'Bear with each other and forgive one another if any of you has a grievance against someone. Forgive as the Lord forgave you.'
      },
      {
        id: 'verse-20',
        book: 'Proverbs',
        chapter: 3,
        verse: 5,
        category: 'Guidance',
        verse_text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.'
      },
      {
        id: 'verse-21',
        book: '1 Thessalonians',
        chapter: 5,
        verse: 18,
        category: 'Gratitude',
        verse_text: 'Give thanks in all circumstances; for this is God’s will for you in Christ Jesus.'
      },
      {
        id: 'verse-22',
        book: 'Psalm',
        chapter: 23,
        verse: 4,
        category: 'Comfort',
        verse_text: 'Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.'
      },
      {
        id: 'verse-23',
        book: '2 Corinthians',
        chapter: 4,
        verse: 8,
        category: 'Strength',
        verse_text: 'We are hard pressed on every side, but not crushed; perplexed, but not in despair; struck down, but not destroyed.'
      },
      {
        id: 'verse-24',
        book: '2 Corinthians',
        chapter: 1,
        verse: 4,
        category: 'Comfort',
        verse_text: 'Who comforts us in all our troubles, so that we can comfort those in any trouble with the comfort we ourselves receive from God.'
      },
      {
        id: 'verse-25',
        book: 'Matthew',
        chapter: 5,
        verse: 4,
        category: 'Comfort',
        verse_text: 'Blessed are those who mourn, for they will be comforted.'
      },
      {
        id: 'verse-26',
        book: 'Philippians',
        chapter: 4,
        verse: 7,
        category: 'Peace',
        verse_text: 'And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.'
      },
      {
        id: 'verse-27',
        book: 'Psalm',
        chapter: 119,
        verse: 105,
        category: 'Guidance',
        verse_text: 'Your word is a lamp for my feet, a light on my path.'
      },
      {
        id: 'verse-28',
        book: 'Proverbs',
        chapter: 16,
        verse: 9,
        category: 'Guidance',
        verse_text: 'In their hearts humans plan their course, but the Lord establishes their steps.'
      },
      {
        id: 'verse-29',
        book: 'Psalm',
        chapter: 46,
        verse: 1,
        category: 'Strength',
        verse_text: 'God is our refuge and strength, an ever-present help in trouble.'
      },
      {
        id: 'verse-30',
        book: '1 John',
        chapter: 4,
        verse: 18,
        category: 'Love',
        verse_text: 'There is no fear in love. But perfect love drives out fear, because fear has to do with punishment.'
      },
      {
        id: 'verse-31',
        book: 'Lamentations',
        chapter: 3,
        verse: '22-23',
        category: 'Hope',
        verse_text: 'Because of the Lord’s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.'
      }
    ],

    getVerses: async function(filter) {
      filter = filter || {};
      if (typeof SafeSpaceBible !== 'undefined' && SafeSpaceBible.queryVerses) {
        var res = await SafeSpaceBible.queryVerses(filter);
        return res.items || [];
      }

      var category = (filter.category || 'all').toLowerCase();
      var query = (filter.query || filter.search || '').trim().toLowerCase();
      var onlySaved = Boolean(filter.onlySaved);

      var list = JSON.parse(localStorage.getItem('safe_space_bible_verses'));
      if (!list || list.length < this.INITIAL_VERSES.length) {
        list = this.INITIAL_VERSES;
        localStorage.setItem('safe_space_bible_verses', JSON.stringify(list));
      }

      var savedIds = [];
      if (onlySaved) {
        savedIds = await this.getSavedVerses();
      }

      return list.filter(function(v) {
        if (onlySaved && !savedIds.includes(v.id) && !savedIds.includes(v.reference)) return false;

        var vCat = (Array.isArray(v.category) ? v.category.join(' ') : (v.category || '')).toLowerCase();
        var matchCat = (category === 'all');
        if (!matchCat) {
          matchCat = vCat.includes(category);
        }

        var matchQ = !query ||
          (v.book || '').toLowerCase().includes(query) ||
          vCat.includes(query) ||
          (v.text || v.verse_text || '').toLowerCase().includes(query) ||
          String(v.chapter).includes(query) ||
          String(v.verse).includes(query);

        return matchCat && matchQ;
      });
    },

    getSavedVerses: async function() {
      var currentUser = null;
      try {
        currentUser = JSON.parse(localStorage.getItem('safe_space_user') || 'null');
      } catch (e) {}
      if (!currentUser) {
        currentUser = await SafeSpaceDB.auth.getCurrentUser();
      }
      if (!currentUser) return [];

      var key = 'safe_space_saved_verses_' + currentUser.id;
      var saved = JSON.parse(localStorage.getItem(key)) || [];

      // Non-blocking background sync with Supabase
      if (SafeSpaceDB.isSupabaseActive() && _db && SafeSpaceDB.posts && SafeSpaceDB.posts._isUUID && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        _db.from('saved_bible_verses').select('*').eq('user_id', currentUser.id).then(function(res) {
          if (res && res.data) {
            var updated = saved.slice();
            res.data.forEach(function(row) {
              if (row.verse_id && !updated.includes(row.verse_id)) updated.push(row.verse_id);
              if (row.verse_ref && !updated.includes(row.verse_ref)) updated.push(row.verse_ref);
            });
            localStorage.setItem(key, JSON.stringify(updated));
          }
        }).catch(function(e) {
          console.warn('[SafeSpace] getSavedVerses Supabase fetch warning:', e);
        });
      }

      return saved;
    },

    getSavedVersesSync: function(userId) {
      try {
        var uid = userId;
        if (!uid) {
          var u = JSON.parse(localStorage.getItem('safe_space_user') || 'null');
          uid = u ? u.id : null;
        }
        if (!uid) return [];
        return JSON.parse(localStorage.getItem('safe_space_saved_verses_' + uid)) || [];
      } catch (e) {
        return [];
      }
    },

    toggleSaveVerse: async function(verseId, verseData) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) {
        try {
          currentUser = JSON.parse(localStorage.getItem('safe_space_user') || 'null');
        } catch (e) {}
      }
      if (!currentUser) throw new Error('You must be logged in to save verses.');

      var key = 'safe_space_saved_verses_' + currentUser.id;
      var saved = JSON.parse(localStorage.getItem(key)) || [];
      var isSaved = saved.includes(verseId) || (verseData && saved.includes(verseData.reference));

      if (SafeSpaceDB.isSupabaseActive() && _db && SafeSpaceDB.posts && SafeSpaceDB.posts._isUUID && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        try {
          if (isSaved) {
            await _db.from('saved_bible_verses').delete().eq('user_id', currentUser.id).or('verse_ref.eq.' + (verseData ? verseData.reference : verseId));
          } else {
            await _db.from('saved_bible_verses').insert({
              user_id: currentUser.id,
              verse_ref: (verseData && verseData.reference) ? verseData.reference : String(verseId),
              verse_text: (verseData && (verseData.text || verseData.verse_text)) ? (verseData.text || verseData.verse_text) : ''
            });
          }
        } catch (e) {
          console.warn('[SafeSpace] Supabase toggleSaveVerse warning:', e);
        }
      }

      if (isSaved) {
        saved = saved.filter(function(id) {
          return id !== verseId && (!verseData || id !== verseData.reference);
        });
      } else {
        saved.push(verseId);
        if (verseData && verseData.reference && !saved.includes(verseData.reference)) {
          saved.push(verseData.reference);
        }
      }

      localStorage.setItem(key, JSON.stringify(saved));
      return { saved: !isSaved, count: saved.length };
    },

    getDailyVerse: async function(customDate) {
      try {
        if (typeof SafeSpaceBible !== 'undefined' && SafeSpaceBible.getDailyScripture) {
          var ds = SafeSpaceBible.getDailyScripture(customDate);
          if (ds) {
            return {
              id: ds.id,
              book: ds.book,
              chapter: ds.chapter,
              verse: ds.verse,
              category: ds.category,
              verse_text: ds.text || ds.verse_text,
              reference: ds.reference,
              translation: 'KJV'
            };
          }
        }

        var verses = this.INITIAL_VERSES;
        var targetDate = customDate instanceof Date ? customDate : new Date();
        var year = targetDate.getFullYear();
        var month = targetDate.getMonth();
        var date = targetDate.getDate();

        var baseline = new Date(2024, 0, 1).getTime();
        var currentDayTimestamp = new Date(year, month, date).getTime();
        var dayIndex = Math.floor((currentDayTimestamp - baseline) / (24 * 60 * 60 * 1000));
        if (isNaN(dayIndex)) dayIndex = 0;

        var index = Math.abs(dayIndex) % verses.length;
        var selected = verses[index] || verses[0];

        return {
          id: selected.id,
          book: selected.book,
          chapter: selected.chapter,
          verse: selected.verse,
          category: selected.category,
          verse_text: (selected.verse_text || selected.text || '').replace(/^["“”']+|["“”']+$/g, ''),
          reference: selected.reference || (selected.book + ' ' + selected.chapter + ':' + selected.verse),
          translation: 'KJV'
        };
      } catch (err) {
        console.warn('[SafeSpace] getDailyVerse error, using safe fallback:', err);
        return {
          id: 'fallback-1',
          verse_text: 'Cast all your anxiety on Him because He cares for you.',
          book: '1 Peter',
          chapter: 5,
          verse: 7,
          reference: '1 Peter 5:7',
          translation: 'KJV'
        };
      }
    }
  },

  // ==========================================
  // SUPPORT SERVICES & EMERGENCY (MODULE 4)
  // ==========================================
  supportServices: {
    STORAGE_KEY: 'safe_space_support_services',

    INITIAL_SERVICES: [
      {
        id: 'svc-1',
        category: 'school_support',
        title: 'Guidance and Counseling Office',
        description: 'Provides student emotional guidance, academic counseling, personal advice, and confidential one-on-one sessions.',
        location: 'Student Affairs & Services Building, 2nd Floor, Room 204',
        office_hours: 'Monday – Friday: 8:00 AM – 5:00 PM',
        contact_number: '(02) 8000-0000 loc. 101',
        email: 'guidance.office@university.edu.ph',
        how_to_access: 'Walk-ins are welcomed during office hours, or book a private appointment via student email or the Safe Space support desk.'
      },
      {
        id: 'svc-2',
        category: 'school_support',
        title: 'Office of Student Affairs (OSA)',
        description: 'Oversees student welfare, student leadership, student organization advising, and campus safety inquiries.',
        location: 'Administration Hall, Ground Floor',
        office_hours: 'Monday – Friday: 8:00 AM – 5:00 PM',
        contact_number: '(02) 8000-0000 loc. 102',
        email: 'student.affairs@university.edu.ph',
        how_to_access: 'In-person visits or email consultation during office hours.'
      },
      {
        id: 'svc-3',
        category: 'counseling',
        title: 'Confidential Individual Counseling',
        description: 'Private 45-minute counseling sessions with licensed school counselors and guidance specialists in a safe, non-judgmental space.',
        location: 'Guidance Center — Consultation Rooms 1 & 2',
        office_hours: 'Monday – Friday: 9:00 AM – 4:00 PM (By appointment)',
        contact_number: '(02) 8000-0000 loc. 105',
        email: 'counseling.desk@university.edu.ph',
        how_to_access: 'Request a confidential consultation slip at the Guidance Office or email counseling.desk@university.edu.ph.'
      },
      {
        id: 'svc-4',
        category: 'emergency',
        title: 'Campus Emergency & Security Desk',
        description: 'On-campus security, medical first responders, campus patrol, and immediate emergency escort assistance.',
        location: 'Main Campus Gate 1 & Security Operations Command',
        office_hours: '24/7 Active',
        contact_number: 'Loc. 111 / 112 (Campus Security)',
        email: 'campus.security@university.edu.ph',
        how_to_access: 'Direct call to security hotlines or approach any uniformed campus security guard.'
      },
      {
        id: 'svc-5',
        category: 'emergency',
        title: 'Philippine National Emergency Hotline',
        description: 'Verified official national emergency dispatch for medical emergencies, police assistance, and fire rescue.',
        location: 'Nationwide Public Dispatch',
        office_hours: '24/7 Available',
        contact_number: '911',
        email: 'help@emergency911.gov.ph',
        how_to_access: 'Dial 911 directly from any landline or mobile phone.'
      },
      {
        id: 'svc-6',
        category: 'emergency',
        title: 'Philippine Red Cross Emergency Hotline',
        description: 'Verified ambulance service, disaster emergency aid, blood services, and psychological first aid.',
        location: 'Philippine Red Cross National Headquarters',
        office_hours: '24/7 Available',
        contact_number: '143 / (02) 8790-2300',
        email: 'prc@redcross.org.ph',
        how_to_access: 'Dial 143 or call (02) 8790-2300 directly.'
      },
      {
        id: 'svc-7',
        category: 'organizations',
        title: 'National Center for Mental Health (NCMH) Crisis Helpline',
        description: '24/7 free and confidential mental health crisis intervention, psychological triage, and suicide prevention hotline.',
        location: 'NCMH Mandaluyong / Nationwide Toll-Free Support',
        office_hours: '24/7 Continuous Helpline',
        contact_number: '1553 (Toll-Free Nationwide) / 0917-899-8727 / (02) 7989-8727',
        website: 'https://doh.gov.ph',
        how_to_access: 'Call 1553 toll-free nationwide from landline or mobile phone, or text/call 0917-899-8727.'
      },
      {
        id: 'svc-8',
        category: 'organizations',
        title: 'Hopeline Philippines (Project HOPE)',
        description: 'Dedicated 24/7 crisis support hotline especially focused on young people, students, and emotional distress.',
        location: 'Nationwide Helpline',
        office_hours: '24/7 Available',
        contact_number: '177 (Globe toll-free) / 0917-558-4673 / (02) 8804-4673',
        website: 'https://hopeline.ph',
        how_to_access: 'Call 177 from Globe/TM or dial mobile hotline numbers.'
      },
      {
        id: 'svc-9',
        category: 'organizations',
        title: 'In Touch Community Services Crisis Line',
        description: 'Professional, compassionate mental health counseling and crisis support in English and Tagalog.',
        location: 'In Touch Center, Makati City',
        office_hours: '24/7 Helpline',
        contact_number: '(02) 8893-7603 / 0917-800-1123',
        website: 'https://in-touch.org',
        how_to_access: 'Call crisis numbers or book online consultation via their website.'
      },
      {
        id: 'svc-10',
        category: 'organizations',
        title: 'Tawag Paglaum Centro Bisaya',
        description: 'Emotional crisis support and suicide prevention helpline primarily serving Visayas and Mindanao regions.',
        location: 'Cebu City / Nationwide Access',
        office_hours: '24/7 Helpline',
        contact_number: '0939-937-5433 / 0927-654-1629',
        website: 'https://facebook.com/tawagpaglaum',
        how_to_access: 'Call or text either mobile hotline.'
      }
    ],

    getServices: async function(category) {
      var services = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
      if (!services || !services.length) {
        services = this.INITIAL_SERVICES;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(services));
      }
      if (!category || category === 'all') return services;
      return services.filter(function(s) {
        return s.category === category;
      });
    },

    saveService: async function(service) {
      var services = await this.getServices('all');
      var index = services.findIndex(function(s) { return s.id === service.id; });
      if (index >= 0) {
        services[index] = Object.assign({}, services[index], service);
      } else {
        if (!service.id) service.id = 'svc-' + Date.now();
        services.push(service);
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(services));
      return service;
    }
  },

  // ==========================================
  // COMMUNITY MEMBERS & CONNECTIONS (MODULE 3)
  // ==========================================
  community: {
    getMembers: async function(query) {
      query = query || '';
      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _dbAdmin || _db;
          var q = client.from('profiles').select('id, username, email, first_name, last_name, avatar_url, bio, created_at');
          if (query) {
            q = q.or('username.ilike.%' + query + '%,first_name.ilike.%' + query + '%');
          }
          var res = await q;
          var list = res.data || [];
          return list.map(function(m) {
            return Object.assign({}, m, {
              username: SafeSpaceDB._displayName(m),
              display_name: SafeSpaceDB._displayName(m),
              is_online: SafeSpaceDB.users.isOnline(m)
            });
          });
        } catch (err) {
          console.warn('[SafeSpace] Supabase getMembers error:', err.message);
        }
      }

      var members = JSON.parse(localStorage.getItem('safe_space_members')) || [];
      if (query) {
        var qLower = query.toLowerCase();
        members = members.filter(function(m) {
          return (m.username && m.username.toLowerCase().indexOf(qLower) > -1) ||
                 (m.first_name && m.first_name.toLowerCase().indexOf(qLower) > -1) ||
                 (m.bio && m.bio.toLowerCase().indexOf(qLower) > -1);
        });
      }
      return members.map(function(m) {
        return Object.assign({}, m, {
          username: SafeSpaceDB._displayName(m),
          display_name: SafeSpaceDB._displayName(m),
          is_online: SafeSpaceDB.users.isOnline(m)
        });
      });
    },

    /**
     * Retrieves eligible users for the "Find People" section.
     * Excludes:
     * 1. Current logged-in user
     * 2. AI Assistant bot ('safe-space-ai-bot')
     * 3. Existing friends (accepted friendship)
     * 4. Existing chat contacts / exchanged message partners (both directions)
     * 5. Blocked users (both blocker & blocked directions)
     */
    getFindPeopleUsers: async function(query) {
      query = (query || '').toLowerCase().trim();
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      var isRealUser = currentUser && SafeSpaceDB._isUUID(currentUser.id);
      var excludedIds = {};
      excludedIds[currentUser.id] = true;
      excludedIds['safe-space-ai-bot'] = true;

      // 1. Exclude existing conversations / chat partners
      try {
        var convs = await SafeSpaceDB.messages.getConversations();
        (convs || []).forEach(function(c) {
          var cid = c.user_id || (c.contact && c.contact.id);
          if (cid) excludedIds[cid] = true;
        });
      } catch (e) {
        console.warn('[SafeSpace] Error fetching conversations for Find People filter:', e);
      }

      // 2. Exclude direct message partners in either direction (sender or receiver)
      if (SafeSpaceDB.isSupabaseActive() && isRealUser) {
        try {
          var client = _dbAdmin || _db;
          var msgRes = await client.from('messages')
            .select('sender_id, receiver_id')
            .or('sender_id.eq.' + currentUser.id + ',receiver_id.eq.' + currentUser.id);
          if (msgRes.data) {
            msgRes.data.forEach(function(m) {
              if (m.sender_id && m.sender_id !== currentUser.id) excludedIds[m.sender_id] = true;
              if (m.receiver_id && m.receiver_id !== currentUser.id) excludedIds[m.receiver_id] = true;
            });
          }
        } catch (e) {}
      } else {
        var allMsgs = JSON.parse(localStorage.getItem('safe_space_messages')) || [];
        allMsgs.forEach(function(m) {
          if (m.sender_id === currentUser.id && m.receiver_id) excludedIds[m.receiver_id] = true;
          if (m.receiver_id === currentUser.id && m.sender_id) excludedIds[m.sender_id] = true;
        });
      }

      // 3. Exclude existing friends (status = 'accepted')
      try {
        var friendships = await SafeSpaceDB.community.getFriendships();
        (friendships || []).forEach(function(f) {
          if (f.status === 'accepted') {
            var rId = f.requester_id || (f.requester && f.requester.id);
            var recId = f.receiver_id || (f.receiver && f.receiver.id);
            if (rId && rId !== currentUser.id) excludedIds[rId] = true;
            if (recId && recId !== currentUser.id) excludedIds[recId] = true;
          }
        });
      } catch (e) {
        console.warn('[SafeSpace] Error fetching friendships for Find People filter:', e);
      }

      // 4. Exclude blocked users (both blocker & blocked)
      try {
        var blockedIds = await SafeSpaceDB.blocks.getBlockedUserIds();
        (blockedIds || []).forEach(function(bId) {
          if (bId) excludedIds[bId] = true;
        });
      } catch (e) {
        console.warn('[SafeSpace] Error fetching blocked users for Find People filter:', e);
      }

      // 5. Fetch all community members
      var all = await SafeSpaceDB.community.getMembers();

      // 6. Filter candidate members
      var filtered = (all || []).filter(function(m) {
        if (!m || !m.id) return false;
        if (excludedIds[m.id]) return false;

        if (query) {
          var name = (m.username || '').toLowerCase();
          var first = (m.first_name || '').toLowerCase();
          var bio = (m.bio || '').toLowerCase();
          return name.indexOf(query) !== -1 || first.indexOf(query) !== -1 || bio.indexOf(query) !== -1;
        }
        return true;
      }).map(function(m) {
        return Object.assign({}, m, {
          is_online: SafeSpaceDB.users.isOnline(m)
        });
      });

      return filtered;
    },

    getFriendships: async function() {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      var isRealUser = currentUser && SafeSpaceDB._isUUID(currentUser.id);
      if (SafeSpaceDB.isSupabaseActive() && isRealUser) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('friendships')
            .select('*, requester:requester_id(id, username, first_name, last_name, avatar_url), receiver:receiver_id(id, username, first_name, last_name, avatar_url)')
            .or('requester_id.eq.' + currentUser.id + ',receiver_id.eq.' + currentUser.id);
          if (res.error) throw res.error;
          return (res.data || []).map(function(f) {
            return Object.assign({}, f, {
              requester: f.requester ? Object.assign({}, f.requester, { username: SafeSpaceDB._displayName(f.requester) }) : null,
              receiver: f.receiver ? Object.assign({}, f.receiver, { username: SafeSpaceDB._displayName(f.receiver) }) : null
            });
          });
        } catch (err) {
          console.warn('[SafeSpace] Supabase getFriendships error:', err.message);
        }
      }

      return JSON.parse(localStorage.getItem('safe_space_friendships')) || [];
    },

    sendFriendRequest: async function(targetId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(targetId) && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        var client = _dbAdmin || _db;
        var existing = await client.from('friendships')
          .select('*')
          .or('and(requester_id.eq.' + currentUser.id + ',receiver_id.eq.' + targetId + '),and(requester_id.eq.' + targetId + ',receiver_id.eq.' + currentUser.id + ')')
          .maybeSingle();

        if (existing.data) {
          if (existing.data.status === 'declined') {
            var upRes = await client.from('friendships')
              .update({ requester_id: currentUser.id, receiver_id: targetId, status: 'pending', updated_at: new Date().toISOString() })
              .eq('id', existing.data.id)
              .select()
              .single();
            return upRes.data || existing.data;
          }
          return existing.data;
        }

        var insertRes = await client.from('friendships').insert({
          requester_id: currentUser.id,
          receiver_id: targetId,
          status: 'pending'
        }).select().single();
        if (insertRes.error) throw insertRes.error;
        try {
          await client.from('notifications').insert({
            user_id: targetId,
            actor_id: currentUser.id,
            type: 'friend_request',
            is_read: false
          });
        } catch (ne) {}
        return insertRes.data;
      }

      var friendships = JSON.parse(localStorage.getItem('safe_space_friendships')) || [];
      var found = null;
      for (var i = 0; i < friendships.length; i++) {
        var f = friendships[i];
        if ((f.requester_id === currentUser.id && f.receiver_id === targetId) ||
            (f.requester_id === targetId && f.receiver_id === currentUser.id)) {
          found = f;
          break;
        }
      }
      if (found) {
        found.status = 'pending';
        found.requester_id = currentUser.id;
        found.receiver_id = targetId;
      } else {
        found = {
          id: 'f-' + Date.now(),
          requester_id: currentUser.id,
          receiver_id: targetId,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        friendships.push(found);
      }
      localStorage.setItem('safe_space_friendships', JSON.stringify(friendships));
      return found;
    },

    respondFriendRequest: async function(requestId, status) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(requestId)) {
        var client = _dbAdmin || _db;
        var upRes = await client.from('friendships')
          .update({ status: status, updated_at: new Date().toISOString() })
          .eq('id', requestId)
          .select()
          .single();
        if (upRes.error) throw upRes.error;
        if (status === 'accepted' && upRes.data) {
          try {
            var otherUid = upRes.data.requester_id === currentUser.id ? upRes.data.receiver_id : upRes.data.requester_id;
            await client.from('notifications').insert({
              user_id: otherUid,
              actor_id: currentUser.id,
              type: 'friend_accept',
              is_read: false
            });
          } catch (ne) {}
        }
        return upRes.data;
      }

      var friendships = JSON.parse(localStorage.getItem('safe_space_friendships')) || [];
      for (var i = 0; i < friendships.length; i++) {
        if (friendships[i].id === requestId) {
          friendships[i].status = status;
          friendships[i].updated_at = new Date().toISOString();
          localStorage.setItem('safe_space_friendships', JSON.stringify(friendships));
          return friendships[i];
        }
      }
      return null;
    },

    removeFriend: async function(targetUserId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(targetUserId) && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        var client = _dbAdmin || _db;
        var res = await client.from('friendships')
          .delete()
          .or('and(requester_id.eq.' + currentUser.id + ',receiver_id.eq.' + targetUserId + '),and(requester_id.eq.' + targetUserId + ',receiver_id.eq.' + currentUser.id + ')');
        if (res.error) throw res.error;
        return true;
      }

      var friendships = JSON.parse(localStorage.getItem('safe_space_friendships')) || [];
      friendships = friendships.filter(function(f) {
        return !((f.requester_id === currentUser.id && f.receiver_id === targetUserId) ||
                 (f.requester_id === targetUserId && f.receiver_id === currentUser.id));
      });
      localStorage.setItem('safe_space_friendships', JSON.stringify(friendships));
      return true;
    }
  },

  // ==========================================
  // BLOCKS & SAFETY CONTROL
  // ==========================================
  blocks: {
    getBlockedUserIds: async function() {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      var blockedSet = {};
      var isRealUser = currentUser && SafeSpaceDB._isUUID(currentUser.id);
      if (SafeSpaceDB.isSupabaseActive() && isRealUser) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('blocks')
            .select('blocker_id, blocked_id')
            .or('blocker_id.eq.' + currentUser.id + ',blocked_id.eq.' + currentUser.id);
          if (res.data) {
            res.data.forEach(function(b) {
              var other = b.blocker_id === currentUser.id ? b.blocked_id : b.blocker_id;
              if (other) blockedSet[other] = true;
            });
          }
          return Object.keys(blockedSet);
        } catch (e) {
          console.warn('[SafeSpace] Supabase blocks query error:', e);
        }
      }

      var blocks = JSON.parse(localStorage.getItem('safe_space_blocks')) || [];
      blocks.forEach(function(b) {
        if (b.blocker_id === currentUser.id && b.blocked_id) blockedSet[b.blocked_id] = true;
        if (b.blocked_id === currentUser.id && b.blocker_id) blockedSet[b.blocker_id] = true;
      });
      return Object.keys(blockedSet);
    },

    blockUser: async function(targetId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(targetId) && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        var client = _dbAdmin || _db;
        var res = await client.from('blocks').insert({
          blocker_id: currentUser.id,
          blocked_id: targetId
        }).select().single();
        if (res.error) throw res.error;
        return res.data;
      }

      var blocks = JSON.parse(localStorage.getItem('safe_space_blocks')) || [];
      blocks.push({
        id: 'block-' + Date.now(),
        blocker_id: currentUser.id,
        blocked_id: targetId,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('safe_space_blocks', JSON.stringify(blocks));
      return true;
    },

    unblockUser: async function(targetId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(targetId) && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        try {
          var client = _dbAdmin || _db;
          await client.from('blocks')
            .delete()
            .eq('blocker_id', currentUser.id)
            .eq('blocked_id', targetId);
        } catch (e) {
          console.warn('[SafeSpace] Supabase unblock error:', e);
        }
      }

      var blocks = JSON.parse(localStorage.getItem('safe_space_blocks')) || [];
      blocks = blocks.filter(function(b) {
        return !(b.blocker_id === currentUser.id && b.blocked_id === targetId);
      });
      localStorage.setItem('safe_space_blocks', JSON.stringify(blocks));
      return true;
    },

    getBlockedUsers: async function() {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('blocks')
            .select('blocked_id, profiles:blocked_id(id, username, first_name, last_name, avatar_url, avatar_type, avatar_value)')
            .eq('blocker_id', currentUser.id);
          if (res.data && res.data.length > 0) {
            return res.data.map(function(item) {
              var p = item.profiles || {};
              return {
                id: item.blocked_id,
                username: p.username || 'User',
                first_name: p.first_name || '',
                last_name: p.last_name || '',
                avatar_url: p.avatar_url || null,
                avatar_type: p.avatar_type || 'default',
                avatar_value: p.avatar_value || 'default'
              };
            });
          }
        } catch (e) {
          console.warn('[SafeSpace] Supabase getBlockedUsers error:', e);
        }
      }

      var blocks = JSON.parse(localStorage.getItem('safe_space_blocks')) || [];
      var myBlocks = blocks.filter(function(b) { return b.blocker_id === currentUser.id; });
      var members = JSON.parse(localStorage.getItem('safe_space_members')) || [];

      return myBlocks.map(function(b) {
        var found = members.find(function(m) { return m.id === b.blocked_id; }) || {};
        return {
          id: b.blocked_id,
          username: found.username || 'User',
          first_name: found.first_name || '',
          last_name: found.last_name || '',
          avatar_url: found.avatar_url || null,
          avatar_type: found.avatar_type || 'default',
          avatar_value: found.avatar_value || 'default'
        };
      });
    }
  },

  // ==========================================
  // CONTEXTUAL REPORTS & SAFETY SYSTEM (REAL SUPABASE)
  // ==========================================
  reports: {
    STORAGE_KEY: 'safe_space_reports',

    createReport: async function(data) {
      data = data || {};
      var currentUser = null;
      try {
        currentUser = await SafeSpaceDB.auth.getCurrentUser();
      } catch (e) {}

      if (!currentUser) {
        throw new Error('You must be logged in to submit a safety report.');
      }

      var postId = (data.post_id && SafeSpaceDB._isUUID(data.post_id)) ? data.post_id : null;
      var reportedUserId = (data.reported_user_id && SafeSpaceDB._isUUID(data.reported_user_id)) ? data.reported_user_id : null;
      var commentId = (data.comment_id && SafeSpaceDB._isUUID(data.comment_id)) ? data.comment_id : null;
      var messageId = (data.message_id && SafeSpaceDB._isUUID(data.message_id)) ? data.message_id : null;
      var reportReason = data.reason || data.report_type || data.category || 'Harassment or bullying';
      var details = (data.details || data.description || '').trim();

      // 1. Prevent duplicate active reports on the same post by the same user
      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(currentUser.id) && postId) {
        try {
          var client = _dbAdmin || _db;
          var dupCheck = await client.from('reports')
            .select('id, status')
            .eq('reporter_id', currentUser.id)
            .eq('post_id', postId)
            .in('status', ['Pending', 'Reviewed', 'pending', 'under_review']);
          
          if (dupCheck.data && dupCheck.data.length > 0) {
            return {
              duplicate: true,
              message: 'You have already reported this post.\nOur moderation team will review it.'
            };
          }
        } catch (chkErr) {
          console.warn('[SafeSpace] Duplicate report check error:', chkErr);
        }
      }

      // Check local storage duplicate fallback
      var localReports = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
      if (postId) {
        var localDup = localReports.find(function(r) {
          return r.reporter_id === currentUser.id && r.post_id === postId && 
            ['pending', 'under_review', 'Pending', 'Reviewed'].includes(r.status);
        });
        if (localDup) {
          return {
            duplicate: true,
            message: 'You have already reported this post.\nOur moderation team will review it.'
          };
        }
      }

      // 2. Automatically retrieve post author if reported_user_id is not yet set
      if (!reportedUserId && postId && SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _dbAdmin || _db;
          var pRes = await client.from('posts').select('user_id').eq('id', postId).maybeSingle();
          if (pRes.data && pRes.data.user_id) {
            reportedUserId = pRes.data.user_id;
          }
        } catch (pe) {}
      }

      var repId = 'rep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      var reportedContent = data.content || data.post_content || data.reported_content || data.text || '';
      var reportLanguage = data.language || (data.mod_metadata && data.mod_metadata.language) || 'taglish';
      var reportSeverity = data.severity || (data.mod_metadata && data.mod_metadata.severity) || 'medium';
      var reportDetectionSource = data.detection_source || 'user_report';

      var reportData = {
        id: repId,
        report_id: repId,
        reporter_id: currentUser.id,
        reporter_username: currentUser.username || currentUser.email || 'Student',
        reported_user_id: reportedUserId,
        post_id: postId,
        comment_id: commentId,
        message_id: messageId,
        conversation_id: data.conversation_id || null,
        content: reportedContent,
        reason: reportReason,
        report_type: reportReason,
        category: reportReason,
        ai_category: data.ai_category || reportReason,
        language: reportLanguage,
        severity: reportSeverity,
        detection_source: reportDetectionSource,
        description: details,
        details: details,
        status: 'Pending',
        created_at: new Date().toISOString()
      };

      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _dbAdmin || _db;
          var insertPayload = {
            reporter_id: currentUser.id,
            reported_user_id: reportedUserId,
            post_id: postId,
            comment_id: commentId,
            message_id: messageId,
            content: reportedContent,
            reason: reportReason,
            report_type: reportReason,
            ai_category: data.ai_category || reportReason,
            language: reportLanguage,
            severity: reportSeverity,
            detection_source: reportDetectionSource,
            description: details,
            details: details,
            status: 'Pending',
            created_at: reportData.created_at
          };

          var res = await client.from('reports').insert(insertPayload).select().single();
          if (!res.error && res.data) {
            reportData = res.data;
          }
        } catch (err) {
          console.warn('[SafeSpace] Supabase createReport error:', err.message);
        }
      }

      localReports.unshift(reportData);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(localReports));
      return { success: true, report: reportData };
    },

    getReports: async function(filter) {
      filter = filter || {};
      var status = (filter.status || 'all').toLowerCase();
      var rawReports = [];

      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _dbAdmin || _db;
          var query = client.from('reports').select('*').order('created_at', { ascending: false });
          var res = await query;
          if (!res.error && Array.isArray(res.data)) {
            rawReports = res.data;
          }
        } catch (e) {
          console.warn('[SafeSpace] Supabase getReports error:', e);
        }
      }

      if (rawReports.length === 0) {
        rawReports = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
      }

      // Collect related IDs for fast batch lookup
      var postIds = Array.from(new Set(rawReports.map(function(r) { return r.post_id; }).filter(Boolean)));
      var userIds = Array.from(new Set(
        rawReports.map(function(r) { return r.reporter_id; })
          .concat(rawReports.map(function(r) { return r.reported_user_id; }))
          .filter(Boolean)
      ));

      var postsMap = {};
      var usersMap = {};
      var modActionsMap = {}; // user_id -> actions array

      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _dbAdmin || _db;
          if (postIds.length > 0) {
            var postsRes = await client.from('posts').select('id, user_id, content, mood, category, photo_url, is_anonymous, archived, deleted_at, deleted_by, deletion_reason, moderation_status, created_at').in('id', postIds);
            if (postsRes.data) {
              postsRes.data.forEach(function(p) { postsMap[p.id] = p; });
            }
          }
          if (userIds.length > 0) {
            var usersRes = await client.from('profiles').select('*').in('id', userIds);
            if (usersRes.data) {
              usersRes.data.forEach(function(u) { usersMap[u.id] = u; });
            }

            var modRes = await client.from('moderation_actions').select('*').in('user_id', userIds).order('created_at', { ascending: false });
            if (modRes.data) {
              modRes.data.forEach(function(act) {
                if (!modActionsMap[act.user_id]) modActionsMap[act.user_id] = [];
                modActionsMap[act.user_id].push(act);
              });
            }
          }
        } catch (enrichErr) {
          console.warn('[SafeSpace] Error batch-enriching reports:', enrichErr);
        }
      }

      // Calculate post report aggregation
      var postReportCounts = {};
      var postReportReasons = {};
      rawReports.forEach(function(r) {
        if (r.post_id) {
          postReportCounts[r.post_id] = (postReportCounts[r.post_id] || 0) + 1;
          if (!postReportReasons[r.post_id]) postReportReasons[r.post_id] = {};
          var rsn = r.reason || r.report_type || 'Safety Concern';
          postReportReasons[r.post_id][rsn] = (postReportReasons[r.post_id][rsn] || 0) + 1;
        }
      });

      // Enrich and build final report objects
      var enriched = rawReports.map(function(r) {
        var postObj = r.post_id ? (postsMap[r.post_id] || null) : null;
        var reporterObj = r.reporter_id ? (usersMap[r.reporter_id] || null) : null;
        var reportedUserObj = r.reported_user_id ? (usersMap[r.reported_user_id] || null) : null;

        // If reported_user_id wasn't in report, check post owner
        if (!reportedUserObj && postObj && postObj.user_id && usersMap[postObj.user_id]) {
          reportedUserObj = usersMap[postObj.user_id];
        }

        var userViolations = reportedUserObj ? (modActionsMap[reportedUserObj.id] || []) : [];

        var reasonCounts = (r.post_id && postReportReasons[r.post_id]) ? postReportReasons[r.post_id] : {};
        var reasonsSummary = Object.keys(reasonCounts).map(function(k) {
          return k + ' (' + reasonCounts[k] + ')';
        });

        return Object.assign({}, r, {
          post: postObj,
          reporter: reporterObj ? {
            id: reporterObj.id,
            username: reporterObj.username,
            name: SafeSpaceDB._displayName(reporterObj),
            avatar_url: reporterObj.avatar_url,
            email: reporterObj.email
          } : { id: r.reporter_id, username: 'Student', name: 'Student', avatar_url: null },
          reported_user: reportedUserObj ? {
            id: reportedUserObj.id,
            username: reportedUserObj.username,
            name: SafeSpaceDB._displayName(reportedUserObj),
            avatar_url: reportedUserObj.avatar_url,
            email: reportedUserObj.email,
            account_status: reportedUserObj.account_status || 'active',
            suspended_until: reportedUserObj.suspended_until || null,
            violation_count: reportedUserObj.violation_count || userViolations.filter(function(v) { return v.action !== 'report_dismissed'; }).length,
            created_at: reportedUserObj.created_at,
            violations_history: userViolations
          } : null,
          post_report_count: r.post_id ? (postReportCounts[r.post_id] || 1) : 1,
          post_report_reasons: reasonsSummary
        });
      });

      // Filter by status if requested
      if (status !== 'all') {
        enriched = enriched.filter(function(r) {
          var s = (r.status || 'Pending').toLowerCase();
          if (status === 'pending') return s === 'pending';
          if (status === 'reviewed' || status === 'under_review') return s === 'reviewed' || s === 'under_review';
          if (status === 'resolved') return s === 'resolved';
          if (status === 'dismissed') return s === 'dismissed';
          return s === status;
        });
      }

      return enriched;
    },

    getReportsStats: async function() {
      var stats = { total: 0, pending: 0, underReview: 0, resolved: 0, dismissed: 0 };
      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('reports').select('id, status');
          if (res.data && res.data.length > 0) {
            stats.total = res.data.length;
            res.data.forEach(function(r) {
              var s = (r.status || 'Pending').toLowerCase();
              if (s === 'pending') stats.pending++;
              else if (s === 'reviewed' || s === 'under_review') stats.underReview++;
              else if (s === 'resolved') stats.resolved++;
              else if (s === 'dismissed') stats.dismissed++;
            });
            return stats;
          }
        } catch (e) {
          console.warn('[SafeSpace] Supabase getReportsStats error:', e);
        }
      }

      var local = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
      stats.total = local.length;
      local.forEach(function(r) {
        var s = (r.status || 'Pending').toLowerCase();
        if (s === 'pending') stats.pending++;
        else if (s === 'reviewed' || s === 'under_review') stats.underReview++;
        else if (s === 'resolved') stats.resolved++;
        else if (s === 'dismissed') stats.dismissed++;
      });
      return stats;
    },

    updateReportStatus: async function(reportId, newStatus, adminNotes, actionTaken) {
      var now = new Date().toISOString();
      var currentAdmin = await SafeSpaceDB.auth.getCurrentUser();
      var adminId = currentAdmin ? currentAdmin.id : null;

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(reportId)) {
        try {
          var client = _dbAdmin || _db;
          var updates = {
            status: newStatus,
            reviewed_at: now,
            admin_id: adminId
          };
          if (adminNotes !== undefined) updates.admin_notes = adminNotes;
          if (actionTaken !== undefined) updates.action_taken = actionTaken;

          var res = await client.from('reports').update(updates).eq('id', reportId).select().single();
          if (res.error) {
            // Resilient fallback: If extended columns (admin_id, admin_notes, action_taken) do not exist yet, update core status & reviewed_at
            var fb = await client.from('reports').update({ status: newStatus, reviewed_at: now }).eq('id', reportId).select().single();
            if (!fb.error && fb.data) return fb.data;
          } else if (res.data) {
            return res.data;
          }
        } catch (e) {
          try {
            var fb2 = await client.from('reports').update({ status: newStatus, reviewed_at: now }).eq('id', reportId).select().single();
            if (!fb2.error && fb2.data) return fb2.data;
          } catch (e2) {}
          console.warn('[SafeSpace] Supabase updateReportStatus error:', e);
        }
      }

      var reports = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
      var found = null;
      for (var i = 0; i < reports.length; i++) {
        if (reports[i].id === reportId || reports[i].report_id === reportId) {
          reports[i].status = newStatus;
          reports[i].reviewed_at = now;
          if (adminNotes !== undefined) reports[i].admin_notes = adminNotes;
          if (actionTaken !== undefined) reports[i].action_taken = actionTaken;
          found = reports[i];
          break;
        }
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
      return found || { id: reportId, status: newStatus, reviewed_at: now };
    },

    deleteReportedContent: async function(contentType, contentId) {
      if (contentType === 'post' && contentId) {
        return await SafeSpaceDB.admin.softDeletePost(contentId, 'Reported violating content');
      } else if (contentType === 'message' && contentId) {
        return await SafeSpaceDB.messages.deleteMessage(contentId);
      } else if (contentType === 'comment' && contentId) {
        if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(contentId)) {
          var client = _dbAdmin || _db;
          await client.from('post_comments').delete().eq('id', contentId);
        }
      }
      return { success: true };
    }
  },

  // ==========================================
  // ADMIN DASHBOARD & SYSTEM MONITORING API
  // ==========================================
  admin: {
    getStats: async function() {
      var stats = {
        totalUsers: 0,
        totalPosts: 0,
        totalComments: 0,
        totalReports: 0,
        pendingReports: 0,
        underReviewReports: 0,
        resolvedReports: 0,
        dismissedReports: 0,
        flaggedPosts: 0,
        activeUsersToday: 0
      };

      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _dbAdmin || _db;
          var [usersRes, postsRes, reportsRes, commentsRes] = await Promise.all([
            client.from('profiles').select('id, last_active, is_online, is_deactivated', { count: 'exact' }),
            client.from('posts').select('id, moderation_status, deleted_at', { count: 'exact' }),
            client.from('reports').select('id, status', { count: 'exact' }),
            client.from('post_comments').select('id', { count: 'exact' })
          ]);

          stats.totalUsers = usersRes.count || (usersRes.data ? usersRes.data.length : 0);
          stats.totalPosts = postsRes.count || (postsRes.data ? postsRes.data.length : 0);
          stats.totalReports = reportsRes.count || (reportsRes.data ? reportsRes.data.length : 0);
          stats.totalComments = commentsRes.count || 0;

          if (reportsRes.data) {
            reportsRes.data.forEach(function(r) {
              var s = (r.status || 'Pending').toLowerCase();
              if (s === 'pending') stats.pendingReports++;
              else if (s === 'reviewed' || s === 'under_review') stats.underReviewReports++;
              else if (s === 'resolved') stats.resolvedReports++;
              else if (s === 'dismissed') stats.dismissedReports++;
            });
          }
          if (postsRes.data) {
            stats.flaggedPosts = postsRes.data.filter(function(p) {
              return p.moderation_status === 'FLAGGED' || p.moderation_status === 'REVIEW' || p.moderation_status === 'BLOCKED' || Boolean(p.deleted_at);
            }).length;
          }
          if (usersRes.data) {
            stats.activeUsersToday = usersRes.data.filter(function(u) {
              return u.is_online || (u.last_active && (Date.now() - new Date(u.last_active).getTime() < 86400000));
            }).length;
          }
          return stats;
        } catch (e) {
          console.warn('[SafeSpace] Supabase admin.getStats error:', e);
        }
      }

      var localMembers = JSON.parse(localStorage.getItem('safe_space_members')) || [];
      var localPosts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      var localReports = JSON.parse(localStorage.getItem('safe_space_reports')) || [];

      stats.totalUsers = Math.max(localMembers.length, 1);
      stats.totalPosts = localPosts.length;
      stats.totalReports = localReports.length;
      localReports.forEach(function(r) {
        var s = (r.status || 'Pending').toLowerCase();
        if (s === 'pending') stats.pendingReports++;
        else if (s === 'reviewed' || s === 'under_review') stats.underReviewReports++;
        else if (s === 'resolved') stats.resolvedReports++;
        else if (s === 'dismissed') stats.dismissedReports++;
      });
      stats.flaggedPosts = localPosts.filter(function(p) { return p.moderation_status === 'FLAGGED' || p.moderation_status === 'REVIEW'; }).length;
      stats.activeUsersToday = 1;
      return stats;
    },

    getUsers: async function() {
      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('profiles').select('*').order('created_at', { ascending: false });
          if (!res.error && res.data && res.data.length > 0) {
            return res.data;
          }
        } catch (e) {
          console.warn('[SafeSpace] Supabase admin.getUsers error:', e);
        }
      }
      return SafeSpaceDB.community ? await SafeSpaceDB.community.getMembers() : [];
    },

    // ──────────────────────────────────────────
    // DECISION 1: DISMISS REPORT
    // ──────────────────────────────────────────
    dismissReport: async function(reportId, adminNotes) {
      var currentAdmin = await SafeSpaceDB.auth.getCurrentUser();
      var adminId = currentAdmin ? currentAdmin.id : null;
      var now = new Date().toISOString();

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(reportId)) {
        try {
          var client = _dbAdmin || _db;
          await client.from('reports').update({
            status: 'Dismissed',
            action_taken: 'report_dismissed',
            admin_notes: adminNotes || 'No violation found',
            admin_id: adminId,
            reviewed_at: now
          }).eq('id', reportId);

          var repRes = await client.from('reports').select('reported_user_id, post_id').eq('id', reportId).maybeSingle();
          if (repRes.data && repRes.data.reported_user_id) {
            await client.from('moderation_actions').insert({
              user_id: repRes.data.reported_user_id,
              admin_id: adminId,
              report_id: reportId,
              post_id: repRes.data.post_id,
              action: 'report_dismissed',
              reason: 'Report reviewed and dismissed — no violation found',
              notes: adminNotes || null,
              created_at: now
            });
          }
        } catch (e) {
          console.warn('[SafeSpace] dismissReport error:', e);
        }
      }

      await SafeSpaceDB.reports.updateReportStatus(reportId, 'Dismissed', adminNotes, 'report_dismissed');
      return { success: true };
    },

    // ──────────────────────────────────────────
    // DECISION 2: KEEP POST (RESOLVE WITH NO VIOLATION)
    // ──────────────────────────────────────────
    keepPost: async function(reportId, adminNotes) {
      var currentAdmin = await SafeSpaceDB.auth.getCurrentUser();
      var adminId = currentAdmin ? currentAdmin.id : null;
      var now = new Date().toISOString();

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(reportId)) {
        try {
          var client = _dbAdmin || _db;
          await client.from('reports').update({
            status: 'Resolved',
            action_taken: 'no_violation',
            admin_notes: adminNotes || 'Post reviewed and cleared',
            admin_id: adminId,
            reviewed_at: now
          }).eq('id', reportId);
        } catch (e) {
          console.warn('[SafeSpace] keepPost error:', e);
        }
      }

      await SafeSpaceDB.reports.updateReportStatus(reportId, 'Resolved', adminNotes, 'no_violation');
      return { success: true };
    },

    // ──────────────────────────────────────────
    // DECISION 3: SOFT DELETE / REMOVE POST
    // ──────────────────────────────────────────
    softDeletePost: async function(postId, reason, reportId, adminNotes) {
      var currentAdmin = await SafeSpaceDB.auth.getCurrentUser();
      var adminId = currentAdmin ? currentAdmin.id : null;
      var now = new Date().toISOString();
      reason = reason || 'Violation of community guidelines';

      var authorId = null;

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(postId)) {
        try {
          var client = _dbAdmin || _db;

          // 1. Get post author
          var pRes = await client.from('posts').select('user_id').eq('id', postId).maybeSingle();
          if (pRes.data && pRes.data.user_id) {
            authorId = pRes.data.user_id;
          }

          // 2. Soft-delete the post using the native archived boolean column in Supabase
          await client.from('posts').update({
            archived: true,
            updated_at: now
          }).eq('id', postId);

          // 3. Increment author's confirmed violation count if possible
          if (authorId) {
            try {
              var profRes = await client.from('profiles').select('violation_count').eq('id', authorId).maybeSingle();
              if (profRes.data && typeof profRes.data.violation_count === 'number') {
                await client.from('profiles').update({
                  violation_count: (profRes.data.violation_count || 0) + 1
                }).eq('id', authorId);
              }
            } catch (ve) {}

            // 4. Send real in-app notification to reported author
            try {
              await client.from('notifications').insert({
                user_id: authorId,
                actor_id: adminId || authorId,
                type: 'moderation_notice',
                message: 'Your post was removed by moderation: ' + reason,
                post_id: postId,
                is_read: false
              });
            } catch (ne) {}
          }

          // 5. Resolve all pending reports for this post
          try {
            await client.from('reports').update({
              status: 'Resolved',
              action_taken: 'post_removed',
              admin_notes: adminNotes || reason,
              admin_id: adminId,
              reviewed_at: now
            }).eq('post_id', postId).in('status', ['Pending', 'Reviewed', 'pending', 'under_review']);
          } catch (re) {}

        } catch (e) {
          console.warn('[SafeSpace] softDeletePost error:', e);
        }
      }

      // Update local storage feed
      var posts = JSON.parse(localStorage.getItem('safe_space_posts') || '[]');
      posts = posts.map(function(p) {
        if (p.id === postId) {
          p.archived = true;
          p.moderation_status = 'BLOCKED';
        }
        return p;
      });
      localStorage.setItem('safe_space_posts', JSON.stringify(posts));

      // Persist authoritative moderation decision in overrides store
      try {
        var ov = JSON.parse(localStorage.getItem('safe_space_post_moderation_overrides') || '{}');
        ov[postId] = { archived: true, status: 'BLOCKED', reason: reason, updated_at: now };
        localStorage.setItem('safe_space_post_moderation_overrides', JSON.stringify(ov));
      } catch (e) {}

      if (reportId) {
        await SafeSpaceDB.reports.updateReportStatus(reportId, 'Resolved', adminNotes || reason, 'post_removed');
      }

      // Broadcast instant synchronization to Home feed
      if (typeof SafeSpaceDB._broadcastModerationSync === 'function') {
        SafeSpaceDB._broadcastModerationSync(postId, 'hidden');
      }

      return { success: true };
    },

    restorePost: async function(postId, adminNotes) {
      var currentAdmin = await SafeSpaceDB.auth.getCurrentUser();
      var adminId = currentAdmin ? currentAdmin.id : null;
      var now = new Date().toISOString();

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(postId)) {
        try {
          var client = _dbAdmin || _db;
          await client.from('posts').update({
            archived: false,
            updated_at: now
          }).eq('id', postId);
        } catch (e) {
          console.warn('[SafeSpace] restorePost error:', e);
        }
      }

      var posts = JSON.parse(localStorage.getItem('safe_space_posts') || '[]');
      posts = posts.map(function(p) {
        if (p.id === postId) {
          p.archived = false;
          p.moderation_status = 'APPROVED';
        }
        return p;
      });
      localStorage.setItem('safe_space_posts', JSON.stringify(posts));

      // Persist authoritative restore decision in overrides store
      try {
        var ov = JSON.parse(localStorage.getItem('safe_space_post_moderation_overrides') || '{}');
        ov[postId] = { archived: false, status: 'APPROVED', updated_at: now };
        localStorage.setItem('safe_space_post_moderation_overrides', JSON.stringify(ov));
      } catch (e) {}

      if (typeof SafeSpaceDB._broadcastModerationSync === 'function') {
        SafeSpaceDB._broadcastModerationSync(postId, 'restored');
      }

      return { success: true };
    },

    // ──────────────────────────────────────────
    // DECISION 4: WARN USER
    // ──────────────────────────────────────────
    warnUser: async function(userId, reason, reportId, postId, adminNotes) {
      var currentAdmin = await SafeSpaceDB.auth.getCurrentUser();
      var adminId = currentAdmin ? currentAdmin.id : null;
      var now = new Date().toISOString();
      reason = reason || 'Violation of Safe Space community guidelines';

      var warnMessage = '⚠️ Official Warning from Safe Space Admin: ' + reason;

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(userId)) {
        try {
          var client = _dbAdmin || _db;

          // 1. Send warning notification to student FIRST so it is always delivered
          var notifPayload = {
            user_id: userId,
            actor_id: (adminId && SafeSpaceDB._isUUID(adminId)) ? adminId : userId,
            type: 'moderation_warning',
            post_id: (postId && SafeSpaceDB._isUUID(postId)) ? postId : null,
            message: warnMessage,
            is_read: false
          };
          var nRes = await client.from('notifications').insert(notifPayload);
          if (nRes && nRes.error && String(nRes.error.code) === 'PGRST204') {
            // Older database without the message column
            delete notifPayload.message;
            nRes = await client.from('notifications').insert(notifPayload);
          }
          if (nRes && nRes.error) {
            console.warn('[SafeSpace] warning notification insert error:', nRes.error);
            // Retry without post reference (e.g. post deleted / FK issue)
            notifPayload.post_id = null;
            nRes = await client.from('notifications').insert(notifPayload);
            if (nRes && nRes.error) throw nRes.error;
          }

          // 2. Increment confirmed violation count (best effort)
          try {
            var profRes = await client.from('profiles').select('violation_count').eq('id', userId).maybeSingle();
            var curCount = (profRes.data && profRes.data.violation_count) ? profRes.data.violation_count : 0;
            await client.from('profiles').update({ violation_count: curCount + 1 }).eq('id', userId);
          } catch (ve) {}

          // 3. Record audit record in moderation_actions (best effort)
          try {
            await client.from('moderation_actions').insert({
              user_id: userId,
              admin_id: adminId,
              report_id: reportId || null,
              post_id: postId || null,
              action: 'warning',
              reason: reason,
              notes: adminNotes || null,
              created_at: now
            });
          } catch (ae) {}

          // 4. Resolve report if linked
          if (reportId) {
            await client.from('reports').update({
              status: 'Resolved',
              action_taken: 'warning',
              admin_notes: adminNotes || reason,
              admin_id: adminId,
              reviewed_at: now
            }).eq('id', reportId);
          }
        } catch (e) {
          console.warn('[SafeSpace] warnUser error:', e);
          throw new Error('Could not deliver warning notification: ' + (e.message || e));
        }
      } else {
        // Local/demo mode: store notification in the user's local inbox
        var key = 'safe_space_notifications_' + userId;
        var local = JSON.parse(localStorage.getItem(key) || '[]');
        local.unshift({
          id: 'notif-' + Date.now(),
          user_id: userId,
          actor_id: adminId,
          type: 'moderation_warning',
          post_id: postId || null,
          message: warnMessage,
          is_read: false,
          created_at: now
        });
        localStorage.setItem(key, JSON.stringify(local));
      }

      if (reportId) {
        await SafeSpaceDB.reports.updateReportStatus(reportId, 'Resolved', adminNotes || reason, 'warning');
      }

      return { success: true };
    },

    // ──────────────────────────────────────────
    // DECISION 5: SUSPEND USER (TEMPORARY)
    // ──────────────────────────────────────────
    suspendUser: async function(userId, durationHours, reason, reportId, adminNotes) {
      var currentAdmin = await SafeSpaceDB.auth.getCurrentUser();
      var adminId = currentAdmin ? currentAdmin.id : null;
      var now = new Date();
      var expiresAt = new Date(now.getTime() + (durationHours * 3600 * 1000)).toISOString();
      reason = reason || 'Repeated community violations';

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(userId)) {
        try {
          var client = _dbAdmin || _db;

          // 1. Fetch current violations
          var profRes = await client.from('profiles').select('violation_count').eq('id', userId).maybeSingle();
          var curCount = (profRes.data && profRes.data.violation_count) ? profRes.data.violation_count : 0;

          // 2. Set account status to suspended
          await client.from('profiles').update({
            account_status: 'suspended',
            suspended_until: expiresAt,
            violation_count: curCount + 1
          }).eq('id', userId);

          // 3. Record in moderation_actions audit log
          await client.from('moderation_actions').insert({
            user_id: userId,
            admin_id: adminId,
            report_id: reportId || null,
            action: 'temporary_suspension',
            reason: reason,
            notes: adminNotes || null,
            created_at: now.toISOString(),
            expires_at: expiresAt
          });

          // 4. Send suspension notification
          await client.from('notifications').insert({
            user_id: userId,
            actor_id: adminId || userId,
            type: 'account_suspended',
            is_read: false
          });

          // 5. Resolve report
          if (reportId) {
            await client.from('reports').update({
              status: 'Resolved',
              action_taken: 'temporary_suspension',
              admin_notes: adminNotes || reason,
              admin_id: adminId,
              reviewed_at: now.toISOString()
            }).eq('id', reportId);
          }
        } catch (e) {
          console.warn('[SafeSpace] suspendUser error:', e);
        }
      }

      if (reportId) {
        await SafeSpaceDB.reports.updateReportStatus(reportId, 'Resolved', adminNotes || reason, 'temporary_suspension');
      }

      return { success: true, suspended_until: expiresAt };
    },

    // ──────────────────────────────────────────
    // DECISION 6: PERMANENT BAN
    // ──────────────────────────────────────────
    banUser: async function(userId, reason, reportId, adminNotes) {
      var currentAdmin = await SafeSpaceDB.auth.getCurrentUser();
      var adminId = currentAdmin ? currentAdmin.id : null;
      var now = new Date().toISOString();
      reason = reason || 'Severe or repeated community guidelines violations';

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(userId)) {
        try {
          var client = _dbAdmin || _db;

          var profRes = await client.from('profiles').select('violation_count').eq('id', userId).maybeSingle();
          var curCount = (profRes.data && profRes.data.violation_count) ? profRes.data.violation_count : 0;

          // 1. Set account status to banned
          await client.from('profiles').update({
            account_status: 'banned',
            banned_at: now,
            ban_reason: reason,
            is_deactivated: true,
            violation_count: curCount + 1
          }).eq('id', userId);

          // 2. Record permanent ban in audit table
          await client.from('moderation_actions').insert({
            user_id: userId,
            admin_id: adminId,
            report_id: reportId || null,
            action: 'permanent_ban',
            reason: reason,
            notes: adminNotes || null,
            created_at: now
          });

          // 3. Resolve report
          if (reportId) {
            await client.from('reports').update({
              status: 'Resolved',
              action_taken: 'permanent_ban',
              admin_notes: adminNotes || reason,
              admin_id: adminId,
              reviewed_at: now
            }).eq('id', reportId);
          }
        } catch (e) {
          console.warn('[SafeSpace] banUser error:', e);
        }
      }

      if (reportId) {
        await SafeSpaceDB.reports.updateReportStatus(reportId, 'Resolved', adminNotes || reason, 'permanent_ban');
      }

      return { success: true };
    },

    // ──────────────────────────────────────────
    // MODERATION HISTORY & AUDIT LOGS
    // ──────────────────────────────────────────
    getUserModerationHistory: async function(userId) {
      if (!userId) return [];
      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(userId)) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('moderation_actions')
            .select('*, admin:admin_id(username, first_name, last_name)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          if (!res.error && res.data) return res.data;
        } catch (e) {
          console.warn('[SafeSpace] getUserModerationHistory error:', e);
        }
      }
      return [];
    },

    getModerationAuditLog: async function(limit) {
      limit = limit || 50;
      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('moderation_actions')
            .select(`
              *,
              user:user_id(id, username, first_name, last_name, email, avatar_url),
              admin:admin_id(id, username, first_name, last_name)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);
          if (!res.error && res.data) return res.data;
        } catch (e) {
          console.warn('[SafeSpace] getModerationAuditLog error:', e);
        }
      }
      return [];
    },

    logModerationEvent: async function(eventData) {
      if (!eventData) return;
      var userId = eventData.user_id;
      var contentType = eventData.content_type || 'post';
      var contentId = eventData.content_id || null;
      var category = eventData.category || 'OFFENSIVE';
      var severity = eventData.severity || 'medium';
      var action = eventData.action || 'flagged';
      var reason = eventData.reason || 'Content moderation event';
      var language = eventData.language || 'unknown';
      var confidence = (typeof eventData.confidence === 'number') ? eventData.confidence : 0.92;
      var detectionSource = eventData.detection_source || (eventData.online ? 'ai' : 'fallback');
      var now = new Date().toISOString();
      var eventId = 'modevt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

      var eventRecord = {
        id: eventId,
        user_id: userId,
        content_id: contentId,
        content_type: contentType,
        language: language,
        category: category,
        severity: severity,
        confidence: confidence,
        action: action === 'blocked' ? 'blocked' : 'flagged',
        detection_source: detectionSource,
        created_at: now
      };

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(userId)) {
        try {
          var client = _dbAdmin || _db;
          // Store in moderation_events table
          await client.from('moderation_events').insert({
            user_id: userId,
            content_id: contentId,
            content_type: contentType,
            language: language,
            category: category,
            severity: severity,
            confidence: confidence,
            action: eventRecord.action,
            detection_source: detectionSource,
            created_at: now
          });
        } catch (e) {
          // If moderation_events table not created yet in Postgres, ignore error
        }

        try {
          var client2 = _dbAdmin || _db;
          // Backward-compatible sync with moderation_actions for admin logs
          await client2.from('moderation_actions').insert({
            user_id: userId,
            action: action === 'blocked' ? 'ai_blocked' : 'ai_flagged',
            reason: `[${contentType.toUpperCase()}] ${category} (${severity}) [${language.toUpperCase()}]: ${reason}`,
            notes: `Detection: ${detectionSource}. Confidence: ${Math.round(confidence * 100)}%. Severity: ${severity}.`,
            created_at: now
          });
        } catch (e2) {
          console.warn('[SafeSpace] logModerationEvent moderation_actions error:', e2);
        }
      }

      try {
        var localEvents = JSON.parse(localStorage.getItem('safe_space_moderation_events')) || [];
        localEvents.unshift(eventRecord);
        localStorage.setItem('safe_space_moderation_events', JSON.stringify(localEvents.slice(0, 200)));

        var localAudits = JSON.parse(localStorage.getItem('safe_space_audit_logs')) || [];
        localAudits.unshift({
          id: 'audit-' + Date.now(),
          user_id: userId,
          action: action === 'blocked' ? 'ai_blocked' : 'ai_flagged',
          reason: `[${contentType.toUpperCase()}] ${category} (${severity}) [${language.toUpperCase()}]: ${reason}`,
          notes: `Detected via: ${detectionSource}. Language: ${language}. Severity: ${severity}.`,
          created_at: now
        });
        localStorage.setItem('safe_space_audit_logs', JSON.stringify(localAudits.slice(0, 100)));
      } catch (le) {}
    },

    checkUserStatus: async function(userId) {
      if (!userId) return { status: 'active' };
      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(userId)) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (res.data) {
            var st = res.data.account_status || (res.data.is_deactivated ? 'deactivated' : 'active');
            var suspUntil = res.data.suspended_until || null;

            // Auto-reactivate expired temporary suspensions
            if (st === 'suspended' && suspUntil && new Date(suspUntil) <= new Date()) {
              try {
                await client.from('profiles').update({
                  account_status: 'active',
                  suspended_until: null
                }).eq('id', userId);
              } catch (updateErr) {}
              return { status: 'active' };
            }
            return {
              status: st,
              suspended_until: suspUntil,
              ban_reason: res.data.ban_reason || null
            };
          }
        } catch (e) {
          console.warn('[SafeSpace] checkUserStatus error:', e);
        }
      }
      return { status: 'active' };
    },

    updateUserRole: async function(userId, newRole) {
      var isAdmin = (newRole === 'admin');
      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(userId)) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('profiles').update({ role: newRole, is_admin: isAdmin }).eq('id', userId).select().single();
          if (!res.error && res.data) return res.data;
        } catch (e) {
          console.warn('[SafeSpace] Supabase admin.updateUserRole error:', e);
        }
      }
      var mems = JSON.parse(localStorage.getItem('safe_space_members')) || [];
      var found = null;
      mems = mems.map(function(m) {
        if (m.id === userId) {
          m.role = newRole;
          m.is_admin = isAdmin;
          found = m;
        }
        return m;
      });
      localStorage.setItem('safe_space_members', JSON.stringify(mems));
      return found || { id: userId, role: newRole, is_admin: isAdmin };
    },

    toggleUserStatus: async function(userId, isDeactivated) {
      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(userId)) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('profiles').update({ is_deactivated: isDeactivated }).eq('id', userId).select().single();
          if (!res.error && res.data) return res.data;
        } catch (e) {
          console.warn('[SafeSpace] Supabase admin.toggleUserStatus error:', e);
        }
      }
      var mems = JSON.parse(localStorage.getItem('safe_space_members')) || [];
      var found = null;
      mems = mems.map(function(m) {
        if (m.id === userId) {
          m.is_deactivated = isDeactivated;
          found = m;
        }
        return m;
      });
      localStorage.setItem('safe_space_members', JSON.stringify(mems));
      return found || { id: userId, is_deactivated: isDeactivated };
    },

    createUser: async function(userData) {
      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _dbAdmin || _db;
          var authRes = await client.auth.signUp({
            email: userData.email,
            password: userData.password || 'TemporaryPass123!',
            options: {
              data: {
                username: userData.username,
                first_name: userData.first_name,
                last_name: userData.last_name,
                role: userData.role || 'student'
              }
            }
          });
          if (authRes.error) throw authRes.error;
          var newId = authRes.data && authRes.data.user ? authRes.data.user.id : null;
          if (newId) {
            await client.from('profiles').update({
              role: userData.role || 'student',
              is_admin: userData.role === 'admin'
            }).eq('id', newId);
          }
          return authRes.data.user;
        } catch (e) {
          console.warn('[SafeSpace] Supabase admin.createUser error:', e);
          throw e;
        }
      }
      var newLocal = {
        id: 'user-' + Date.now(),
        ...userData,
        is_deactivated: false,
        created_at: new Date().toISOString()
      };
      var mems = JSON.parse(localStorage.getItem('safe_space_members')) || [];
      mems.unshift(newLocal);
      localStorage.setItem('safe_space_members', JSON.stringify(mems));
      return newLocal;
    },

    getAllPosts: async function() {
      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('posts')
            .select('*, profiles:user_id(id, username, first_name, last_name, avatar_url, role, is_deactivated), post_comments(id), post_likes(id), reports(id, reason, status, details, created_at)')
            .order('created_at', { ascending: false });
          if (!res.error && res.data) {
            var overrides = {};
            try {
              overrides = JSON.parse(localStorage.getItem('safe_space_post_moderation_overrides') || '{}');
            } catch (oe) {}
            return res.data.map(function(p) {
              var isArchived = Boolean(p.archived);
              if (overrides[p.id] !== undefined) {
                isArchived = Boolean(overrides[p.id].archived);
              }
              var activeReports = (p.reports || []).filter(function(r) {
                var st = (r.status || 'pending').toLowerCase();
                return st === 'pending' || st === 'under_review';
              });
              var modStatus = isArchived ? 'BLOCKED' : (activeReports.length > 0 ? 'REVIEW' : (p.moderation_status || 'APPROVED'));
              return {
                id: p.id,
                user_id: p.user_id,
                author_name: p.profiles ? SafeSpaceDB._displayName(p.profiles) : 'Student',
                author_avatar: p.profiles ? p.profiles.avatar_url : null,
                author_role: p.profiles ? (p.profiles.role || 'student') : 'student',
                author_deactivated: p.profiles ? Boolean(p.profiles.is_deactivated) : false,
                content: p.content,
                category: p.category || 'general',
                mood: p.mood,
                is_anonymous: Boolean(p.is_anonymous),
                archived: isArchived,
                deleted_at: isArchived ? (p.updated_at || p.created_at) : null,
                deletion_reason: p.deletion_reason || (isArchived ? 'Moderator removed' : null),
                moderation_status: modStatus,
                moderation_category: p.moderation_category || (activeReports.length > 0 ? activeReports[0].reason : 'SAFE'),
                ai_status: p.moderation_status || 'APPROVED',
                ai_category: p.moderation_category || 'SAFE',
                ai_severity: isArchived ? 'high' : (activeReports.length > 0 ? 'medium' : 'none'),
                ai_confidence: typeof p.sentiment_score === 'number' ? p.sentiment_score : 0.94,
                sentiment: p.sentiment || 'NEUTRAL',
                sentiment_score: p.sentiment_score || 0.5,
                comments_count: p.post_comments ? p.post_comments.length : 0,
                likes_count: p.post_likes ? p.post_likes.length : 0,
                reports_count: (p.reports || []).length,
                active_reports_count: activeReports.length,
                reports: p.reports || [],
                created_at: p.created_at,
                updated_at: p.updated_at
              };
            });
          }

          // If complex query failed or returned no data, attempt simple select
          var simpleRes = await client.from('posts')
            .select('*, profiles:user_id(id, username, first_name, last_name, avatar_url, role, is_deactivated)')
            .order('created_at', { ascending: false });
          if (!simpleRes.error && Array.isArray(simpleRes.data)) {
            var overrides = {};
            try {
              overrides = JSON.parse(localStorage.getItem('safe_space_post_moderation_overrides') || '{}');
            } catch (oe) {}
            return simpleRes.data.map(function(p) {
              var isArchived = Boolean(p.archived);
              if (overrides[p.id] !== undefined) {
                isArchived = Boolean(overrides[p.id].archived);
              }
              var modStatus = isArchived ? 'BLOCKED' : (p.moderation_status || 'APPROVED');
              return {
                id: String(p.id || ''),
                user_id: String(p.user_id || ''),
                author_name: p.profiles ? SafeSpaceDB._displayName(p.profiles) : 'Student',
                author_avatar: p.profiles ? p.profiles.avatar_url : null,
                author_role: p.profiles ? (p.profiles.role || 'student') : 'student',
                author_deactivated: p.profiles ? Boolean(p.profiles.is_deactivated) : false,
                content: p.content || '',
                category: p.category || 'general',
                mood: p.mood,
                is_anonymous: Boolean(p.is_anonymous),
                archived: isArchived,
                deleted_at: isArchived ? (p.updated_at || p.created_at) : null,
                deletion_reason: p.deletion_reason || (isArchived ? 'Moderator removed' : null),
                moderation_status: modStatus,
                moderation_category: p.moderation_category || 'SAFE',
                ai_status: p.moderation_status || 'APPROVED',
                ai_category: p.moderation_category || 'SAFE',
                ai_severity: isArchived ? 'high' : 'none',
                ai_confidence: typeof p.sentiment_score === 'number' ? p.sentiment_score : 0.94,
                sentiment: p.sentiment || 'NEUTRAL',
                sentiment_score: p.sentiment_score || 0.5,
                comments_count: 0,
                likes_count: 0,
                reports_count: 0,
                active_reports_count: 0,
                reports: [],
                created_at: p.created_at || new Date().toISOString(),
                updated_at: p.updated_at || p.created_at
              };
            });
          }
        } catch (e) {
          console.warn('[SafeSpace] Supabase admin.getAllPosts error:', e);
        }
      }

      var fallbackFeed = SafeSpaceDB.posts ? await SafeSpaceDB.posts.getFeed({ category: 'all', limit: 100 }) : [];
      if (!Array.isArray(fallbackFeed) || fallbackFeed.length === 0) {
        fallbackFeed = JSON.parse(localStorage.getItem('safe_space_posts') || '[]');
      }
      return (fallbackFeed || []).map(function(p) {
        var isArchived = Boolean(p.archived);
        var likesCount = p.likes_count !== undefined ? p.likes_count : (Array.isArray(p.likes) ? p.likes.length : 0);
        var commentsCount = p.comments_count !== undefined ? p.comments_count : (Array.isArray(p.comments) ? p.comments.length : 0);
        var repCount = p.reports_count !== undefined ? p.reports_count : (Array.isArray(p.reports) ? p.reports.length : 0);
        return {
          id: String(p.id || ''),
          user_id: String(p.user_id || ''),
          author_name: p.author_name || (p.profiles ? SafeSpaceDB._displayName(p.profiles) : 'Student'),
          author_avatar: p.author_avatar || (p.profiles ? p.profiles.avatar_url : null),
          author_role: p.author_role || (p.profiles ? p.profiles.role : 'student'),
          content: p.content || '',
          category: p.category || 'general',
          mood: p.mood,
          is_anonymous: Boolean(p.is_anonymous),
          archived: isArchived,
          moderation_status: p.moderation_status || (isArchived ? 'BLOCKED' : 'APPROVED'),
          moderation_category: p.moderation_category || 'SAFE',
          ai_status: p.ai_status || p.moderation_status || 'APPROVED',
          ai_category: p.ai_category || p.moderation_category || 'SAFE',
          ai_severity: isArchived ? 'high' : (repCount > 0 ? 'medium' : 'none'),
          sentiment: p.sentiment || 'NEUTRAL',
          comments_count: commentsCount,
          likes_count: likesCount,
          reports_count: repCount,
          active_reports_count: repCount,
          reports: p.reports || [],
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || p.created_at
        };
      });
    },

    updatePostModeration: async function(postId, status, category) {
      var isArchived = (status === 'BLOCKED' || status === 'HIDDEN');
      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(postId)) {
        try {
          var client = _dbAdmin || _db;
          var payload = { archived: isArchived };
          var res = await client.from('posts').update(payload).eq('id', postId).select().single();
          if (!res.error && res.data) {
            // broadcast
          }
        } catch (e) {
          console.warn('[SafeSpace] Supabase updatePostModeration error:', e);
        }
      }
      var posts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      posts = posts.map(function(p) {
        if (p.id === postId) {
          p.archived = isArchived;
          p.moderation_status = status;
          if (category) p.moderation_category = category;
        }
        return p;
      });
      localStorage.setItem('safe_space_posts', JSON.stringify(posts));

      if (typeof SafeSpaceDB._broadcastModerationSync === 'function') {
        SafeSpaceDB._broadcastModerationSync(postId, isArchived ? 'hidden' : 'restored');
      }

      return { id: postId, moderation_status: status };
    },

    getPostComments: async function(postId) {
      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(postId)) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('post_comments')
            .select('*, profiles:user_id(id, username, first_name, last_name, avatar_url)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });
          if (!res.error && res.data) return res.data;
        } catch (e) {
          console.warn('[SafeSpace] Supabase getPostComments error:', e);
        }
      }
      return [];
    },

    deleteComment: async function(commentId) {
      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB._isUUID(commentId)) {
        try {
          var client = _dbAdmin || _db;
          await client.from('post_comments').delete().eq('id', commentId);
          return { success: true };
        } catch (e) {
          console.warn('[SafeSpace] Supabase deleteComment error:', e);
        }
      }
      return { success: true };
    }
  },

  // ==========================================
  // BLOCKED USERS & BLOCKING BEHAVIOR
  // ==========================================
  blocks: {
    getBlockedUsers: async function() {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        try {
          var client = _dbAdmin || _db;
          var res = await client
            .from('blocked_users')
            .select('blocked_id, profiles:blocked_id(id, username, first_name, last_name, avatar_url)')
            .eq('blocker_id', currentUser.id);

          if (!res.error && res.data && res.data.length > 0) {
            return res.data.map(function(item) {
              var prof = item.profiles || {};
              return {
                id: item.blocked_id,
                username: prof.username || 'user',
                first_name: prof.first_name || '',
                last_name: prof.last_name || '',
                avatar_url: prof.avatar_url || null
              };
            });
          }
        } catch (e) {
          console.warn('[SafeSpace] Supabase getBlockedUsers error:', e);
        }
      }

      var key = 'safe_space_blocks_' + currentUser.id;
      return JSON.parse(localStorage.getItem(key) || '[]');
    },

    blockUser: async function(user) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');
      if (!user || !user.id) throw new Error('Invalid user to block');

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(currentUser.id) && SafeSpaceDB.posts._isUUID(user.id)) {
        try {
          var client = _dbAdmin || _db;
          await client.from('blocked_users').insert({
            blocker_id: currentUser.id,
            blocked_id: user.id
          });
        } catch (e) {
          console.warn('[SafeSpace] Supabase blockUser error:', e);
        }
      }

      var key = 'safe_space_blocks_' + currentUser.id;
      var blocks = JSON.parse(localStorage.getItem(key) || '[]');
      if (!blocks.some(function(b) { return b.id === user.id; })) {
        blocks.push({
          id: user.id,
          username: user.username || 'user',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          avatar_url: user.avatar_url || null
        });
        localStorage.setItem(key, JSON.stringify(blocks));
      }
      return { success: true };
    },

    unblockUser: async function(targetUserId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(currentUser.id) && SafeSpaceDB.posts._isUUID(targetUserId)) {
        try {
          var client = _dbAdmin || _db;
          await client.from('blocked_users').delete().eq('blocker_id', currentUser.id).eq('blocked_id', targetUserId);
        } catch (e) {
          console.warn('[SafeSpace] Supabase unblockUser error:', e);
        }
      }

      var key = 'safe_space_blocks_' + currentUser.id;
      var blocks = JSON.parse(localStorage.getItem(key) || '[]');
      blocks = blocks.filter(function(b) { return b.id !== targetUserId; });
      localStorage.setItem(key, JSON.stringify(blocks));
      return { success: true };
    },

    isBlocked: async function(targetUserId) {
      var list = await this.getBlockedUsers();
      return list.some(function(b) { return b.id === targetUserId; });
    }
  },

  // ==========================================
  // STORAGE & IMAGE UPLOADS
  // ==========================================
  storage: {
    uploadImage: async function(file, bucket) {
      bucket = bucket || 'post-photos';
      if (SafeSpaceDB.isSupabaseActive()) {
        var fileExt = file.name ? file.name.split('.').pop() : 'jpg';
        var fileName = Date.now() + '_' + Math.random().toString(36).substring(2) + '.' + fileExt;
        var upRes = await _db.storage.from(bucket).upload(fileName, file);
        if (upRes.error) throw upRes.error;
        var pubRes = _db.storage.from(bucket).getPublicUrl(fileName);
        return pubRes.data ? pubRes.data.publicUrl : null;
      }

      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }
};

if (typeof window !== 'undefined') {
  window.SafeSpaceDB = SafeSpaceDB;
}
