/**
 * Safe Space - Supabase Database & Auth Client Layer
 * Handles Supabase initialization, queries, auth, storage, and local demo fallback.
 */

// Initial Seed Data for Demo / Offline Laptop mode
var INITIAL_DEMO_DATA = {
  currentUser: {
    id: "user-demo-1",
    email: "demo@safespace.org",
    username: "alex_rivera",
    first_name: "Alex",
    last_name: "Rivera",
    age: 21,
    sex: "Non-binary",
    birthday: "2003-05-14",
    bio: "Living authentically 🌈 Psychology student, artist, and LGBTQ+ advocate.",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
  },
  members: [
    {
      id: "user-demo-2",
      username: "jordan_lee",
      first_name: "Jordan",
      last_name: "Lee",
      bio: "Here to listen, learn, and share safe warmth. Proud trans ally.",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "user-demo-3",
      username: "taylor_sky",
      first_name: "Taylor",
      last_name: "Sky",
      bio: "Trans and thriving ✨ You are not alone.",
      avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "support-counselor-1",
      username: "counselor_sam",
      first_name: "Sam (Counselor)",
      last_name: "Support",
      bio: "Certified Peer Counselor available 24/7 for safe chat & mental health support.",
      avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
      isSupport: true
    }
  ],
  posts: [
    {
      id: "post-1",
      user_id: "user-demo-2",
      author_name: "jordan_lee",
      author_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      content: "Reminder to everyone in this community: your journey is valid, your identity is precious, and you deserve unconditional respect. Never let anyone dim your rainbow! 🌈✨",
      mood: "love",
      photo_url: null,
      is_anonymous: false,
      likes: ["user-demo-1"],
      comments: [
        { id: "c-1", user_id: "user-demo-1", username: "alex_rivera", content: "Thank you so much for this reminder today!", created_at: "10 mins ago" }
      ],
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "post-2",
      user_id: "user-demo-3",
      author_name: "Anonymous",
      author_avatar: null,
      content: "Came out to my closest friends this weekend after months of anxiety. They prepared a small rainbow cake and hugged me. Still crying happy tears! 😭❤️",
      mood: "haha",
      photo_url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
      is_anonymous: true,
      likes: ["user-demo-1", "user-demo-2"],
      comments: [
        { id: "c-2", user_id: "user-demo-2", username: "jordan_lee", content: "So incredibly proud of you! Welcome to living in full color!", created_at: "25 mins ago" }
      ],
      created_at: new Date(Date.now() - 14400000).toISOString()
    },
    {
      id: "post-3",
      user_id: "user-demo-1",
      author_name: "alex_rivera",
      author_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      content: "Feeling a bit overwhelmed with final exams and family pressure lately. Taking deep breaths and listening to calming music. How do you all ground yourselves during stress?",
      mood: "sad",
      photo_url: null,
      is_anonymous: false,
      likes: ["user-demo-3"],
      comments: [
        { id: "c-3", user_id: "support-counselor-1", username: "counselor_sam", content: "The 5-4-3-2-1 sensory grounding exercise is wonderfully effective! We are here if you'd like to chat 1-on-1.", created_at: "1 hour ago" }
      ],
      created_at: new Date(Date.now() - 28800000).toISOString()
    }
  ],
  messages: [
    {
      id: "m-1",
      sender_id: "support-counselor-1",
      receiver_id: "user-demo-1",
      message: "Hello Alex! Welcome to Safe Space Support Chat. How are you feeling today?",
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: "m-2",
      sender_id: "user-demo-1",
      receiver_id: "support-counselor-1",
      message: "Hi Sam! Thanks for reaching out. Feeling better after reading the community posts!",
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  friendships: [
    { id: "f-1", requester_id: "user-demo-2", receiver_id: "user-demo-1", status: "accepted" },
    { id: "f-2", requester_id: "user-demo-3", receiver_id: "user-demo-1", status: "pending" }
  ],
  savedPosts: ["post-1"],
  blocks: []
};

// Initialize Local Storage if empty (posts/members/messages only — NOT user, must login)
function initLocalStorage() {
  if (!localStorage.getItem('safe_space_posts')) {
    localStorage.setItem('safe_space_posts', JSON.stringify(INITIAL_DEMO_DATA.posts));
  }
  if (!localStorage.getItem('safe_space_members')) {
    localStorage.setItem('safe_space_members', JSON.stringify(INITIAL_DEMO_DATA.members));
  }
  if (!localStorage.getItem('safe_space_messages')) {
    localStorage.setItem('safe_space_messages', JSON.stringify(INITIAL_DEMO_DATA.messages));
  }
  if (!localStorage.getItem('safe_space_saved')) {
    localStorage.setItem('safe_space_saved', JSON.stringify(INITIAL_DEMO_DATA.savedPosts || []));
  }
  if (!localStorage.getItem('safe_space_friendships')) {
    localStorage.setItem('safe_space_friendships', JSON.stringify(INITIAL_DEMO_DATA.friendships || []));
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
            var pRes = await _db.from('profiles').select('*').eq('id', user.id).single();
            var profile = pRes.data || {};
            return Object.assign({}, user, profile);
          }
        } catch (e) {
          console.warn('[SafeSpace] Supabase auth check error:', e);
        }
      }
      return JSON.parse(localStorage.getItem('safe_space_user'));
    },

    signIn: async function(email, password) {
      if (SafeSpaceDB.isSupabaseActive()) {
        var res = await _db.auth.signInWithPassword({ email: email, password: password });
        if (res.error) throw res.error;
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
          var res = await _db.auth.signUp({
            email: email,
            password: password,
            options: { data: metadata }
          });
          if (res.error) {
            // Provide a clear explanation if SMTP is not configured in Supabase yet
            if (res.error.message && res.error.message.toLowerCase().includes('confirmation email')) {
              throw new Error('Supabase SMTP Error: Please configure custom SMTP (Resend or Gmail) in your Supabase Dashboard -> Authentication -> SMTP Settings, or disable email confirmation.');
            }
            throw res.error;
          }
          // If waiting for email confirmation
          if (res.data && res.data.user && !res.data.session) {
            return {
              user: res.data.user,
              session: null,
              needsEmailConfirmation: true,
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

    updateProfile: async function(updates) {
      updates = updates || {};
      if (SafeSpaceDB.isSupabaseActive()) {
        var res = await _db.auth.getUser();
        var user = res.data ? res.data.user : null;
        if (!user) throw new Error('Not logged in');
        var pRes = await _db
          .from('profiles')
          .update(Object.assign({}, updates, { updated_at: new Date().toISOString() }))
          .eq('id', user.id)
          .select()
          .single();
        if (pRes.error) throw pRes.error;
        return pRes.data;
      }
      var cur = JSON.parse(localStorage.getItem('safe_space_user')) || {};
      var updatedUser = Object.assign({}, cur, updates);
      localStorage.setItem('safe_space_user', JSON.stringify(updatedUser));
      return updatedUser;
    },

    signOut: async function() {
      if (SafeSpaceDB.isSupabaseActive()) {
        try { await _db.auth.signOut(); } catch (e) {}
      }
      localStorage.removeItem('safe_space_user');
      localStorage.removeItem('safe_space_session_active');
    }
  },

  // ==========================================
  // POSTS & COMMUNITY FEED (MODULE 2)
  // ==========================================
  posts: {
    getFeed: async function(filter) {
      filter = filter || {};
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();

      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var query = _db.from('posts').select(`
            *,
            profiles:user_id (id, username, first_name, last_name, avatar_url),
            post_likes (user_id),
            post_comments (id, user_id, content, reactions, created_at, profiles:user_id(username, first_name, last_name, avatar_url)),
            saved_posts (user_id)
          `).order('created_at', { ascending: false });

          if (filter.mood) query = query.eq('mood', filter.mood);
          if (filter.userId) query = query.eq('user_id', filter.userId);
          if (filter.category && filter.category !== 'all') {
            query = query.eq('category', filter.category.toLowerCase());
          }

          var res = await query;
          if (res.error) {
            console.warn('[SafeSpace] Supabase feed query warning, checking fallback:', res.error.message);
            throw res.error;
          }

          return (res.data || []).map(function(p) {
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
        posts = posts.filter(function(p) {
          return (p.category || 'general').toLowerCase() === filter.category.toLowerCase();
        });
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

      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('You must be logged in to post.');

      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var res = await _db.from('posts').insert({
            user_id: currentUser.id,
            content: content,
            mood: mood,
            photo_url: photo_url,
            is_anonymous: is_anonymous,
            category: category
          }).select('*, profiles:user_id(id, username, avatar_url)').single();

          if (res.error) throw res.error;
          var p = res.data;
          return Object.assign({}, p, {
            author_name: p.is_anonymous ? 'Anonymous' : SafeSpaceDB._displayName(p.profiles || currentUser),
            author_avatar: p.is_anonymous ? null : (p.profiles ? p.profiles.avatar_url : currentUser.avatar_url),
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
    }
  },

  // ==========================================
  // MESSAGING & CHAT SUPPORT (MODULE 3)
  // ==========================================
  messages: {
    getConversations: async function() {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      var convosMap = {};

      if (SafeSpaceDB.isSupabaseActive()) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('messages')
            .select('*, sender:sender_id(id, username, first_name, last_name, avatar_url), receiver:receiver_id(id, username, first_name, last_name, avatar_url)')
            .or('sender_id.eq.' + currentUser.id + ',receiver_id.eq.' + currentUser.id)
            .order('created_at', { ascending: false });

          if (res.error) throw res.error;
          var list = res.data || [];
          for (var i = 0; i < list.length; i++) {
            var m = list[i];
            var otherUser = m.sender_id === currentUser.id ? m.receiver : m.sender;
            if (!otherUser || !otherUser.id) continue;
            if (!convosMap[otherUser.id]) {
              var dispName = SafeSpaceDB._displayName(otherUser);
              convosMap[otherUser.id] = {
                user_id: otherUser.id,
                username: dispName,
                avatar_url: otherUser.avatar_url,
                last_message: m.message,
                last_message_at: m.created_at,
                unread_count: (m.receiver_id === currentUser.id && !m.is_read) ? 1 : 0,
                contact: {
                  id: otherUser.id,
                  username: dispName,
                  avatar_url: otherUser.avatar_url
                }
              };
            }
          }
          var convList = [];
          for (var k in convosMap) {
            if (convosMap.hasOwnProperty(k)) convList.push(convosMap[k]);
          }
          return convList;
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
        if (!convosMap[otherId]) {
          var mem = null;
          for (var mi = 0; mi < members.length; mi++) {
            if (members[mi].id === otherId) { mem = members[mi]; break; }
          }
          if (!mem) mem = { id: otherId, username: 'Member' };
          var dName = SafeSpaceDB._displayName(mem);
          convosMap[otherId] = {
            user_id: otherId,
            username: dName,
            avatar_url: mem.avatar_url,
            last_message: msg.message,
            last_message_at: msg.created_at,
            unread_count: 0,
            contact: {
              id: otherId,
              username: dName,
              avatar_url: mem.avatar_url
            }
          };
        }
      }
      var localConvs = [];
      for (var lk in convosMap) {
        if (convosMap.hasOwnProperty(lk)) localConvs.push(convosMap[lk]);
      }
      return localConvs;
    },

    getMessages: function(otherUserId) {
      return this.getMessagesWith(otherUserId);
    },

    getMessagesWith: async function(otherUserId) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(otherUserId) && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        try {
          var client = _dbAdmin || _db;
          var res = await client.from('messages')
            .select('*')
            .or('and(sender_id.eq.' + currentUser.id + ',receiver_id.eq.' + otherUserId + '),and(sender_id.eq.' + otherUserId + ',receiver_id.eq.' + currentUser.id + ')')
            .order('created_at', { ascending: true });
          if (res.error) throw res.error;
          return res.data || [];
        } catch (err) {
          console.warn('[SafeSpace] Supabase getMessagesWith error:', err.message);
        }
      }

      var all = JSON.parse(localStorage.getItem('safe_space_messages')) || [];
      var filtered = all.filter(function(m) {
        return (m.sender_id === currentUser.id && m.receiver_id === otherUserId) ||
               (m.sender_id === otherUserId && m.receiver_id === currentUser.id);
      });
      filtered.sort(function(a, b) { return new Date(a.created_at) - new Date(b.created_at); });
      return filtered;
    },

    sendMessage: async function(receiverId, text) {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (SafeSpaceDB.isSupabaseActive() && SafeSpaceDB.posts._isUUID(receiverId) && SafeSpaceDB.posts._isUUID(currentUser.id)) {
        var client = _dbAdmin || _db;
        var res = await client.from('messages').insert({
          sender_id: currentUser.id,
          receiver_id: receiverId,
          message: text
        }).select().single();
        if (res.error) throw res.error;
        return res.data;
      }

      var messages = JSON.parse(localStorage.getItem('safe_space_messages')) || [];
      var msg = {
        id: 'msg-' + Date.now(),
        sender_id: currentUser.id,
        receiver_id: receiverId,
        message: text,
        created_at: new Date().toISOString()
      };
      messages.push(msg);
      localStorage.setItem('safe_space_messages', JSON.stringify(messages));
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
              display_name: SafeSpaceDB._displayName(m)
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
          display_name: SafeSpaceDB._displayName(m)
        });
      });
    },

    getFriendships: async function() {
      var currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      if (SafeSpaceDB.isSupabaseActive()) {
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
