/**
 * Safe Space - Supabase Database & Auth Client Layer
 * Handles Supabase initialization, queries, auth, storage, and local demo fallback.
 */

// Initial Seed Data for Demo / Offline Laptop mode
const INITIAL_DEMO_DATA = {
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

// Initialize Local Storage if empty
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
  if (!localStorage.getItem('safe_space_user')) {
    localStorage.setItem('safe_space_user', JSON.stringify(INITIAL_DEMO_DATA.currentUser));
  }
  if (!localStorage.getItem('safe_space_saved')) {
    localStorage.setItem('safe_space_saved', JSON.stringify(INITIAL_DEMO_DATA.savedPosts));
  }
  if (!localStorage.getItem('safe_space_friendships')) {
    localStorage.setItem('safe_space_friendships', JSON.stringify(INITIAL_DEMO_DATA.friendships));
  }
}

initLocalStorage();

// Initialize Supabase Client if configured
let supabase = null;
if (typeof SAFE_SPACE_CONFIG !== 'undefined' && SAFE_SPACE_CONFIG.isConfigured() && window.supabase) {
  try {
    supabase = window.supabase.createClient(
      SAFE_SPACE_CONFIG.SUPABASE_URL,
      SAFE_SPACE_CONFIG.SUPABASE_ANON_KEY
    );
    console.log('[Supabase] Connected to project:', SAFE_SPACE_CONFIG.SUPABASE_URL);
  } catch (err) {
    console.warn('[Supabase] Initialization error, using local mode:', err);
  }
}

/**
 * High Level Unified SafeSpace API
 */
const SafeSpaceDB = {
  isSupabaseActive() {
    return Boolean(supabase);
  },

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  auth: {
    async getCurrentUser() {
      if (SafeSpaceDB.isSupabaseActive()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        return { ...user, ...profile };
      }
      return JSON.parse(localStorage.getItem('safe_space_user'));
    },

    async signIn(email, password) {
      if (SafeSpaceDB.isSupabaseActive()) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
      }
      // Demo authentication: Accept demo user or any valid email
      const user = JSON.parse(localStorage.getItem('safe_space_user'));
      if (email && password) {
        user.email = email;
        localStorage.setItem('safe_space_user', JSON.stringify(user));
        return { user };
      }
      throw new Error('Please enter email and password.');
    },

    async signUp(email, password, metadata = {}) {
      if (SafeSpaceDB.isSupabaseActive()) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata }
        });
        if (error) throw error;
        return data;
      }
      // Demo Signup
      const newUser = {
        id: 'user-' + Date.now(),
        email,
        username: metadata.username || email.split('@')[0],
        first_name: metadata.first_name || 'Member',
        last_name: metadata.last_name || '',
        bio: metadata.bio || 'Hello, Safe Space!',
        avatar_url: metadata.avatar_url || null,
        created_at: new Date().toISOString()
      };
      localStorage.setItem('safe_space_user', JSON.stringify(newUser));
      return { user: newUser };
    },

    async signOut() {
      if (SafeSpaceDB.isSupabaseActive()) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('safe_space_session_active');
    }
  },

  // ==========================================
  // POSTS & COMMUNITY FEED
  // ==========================================
  posts: {
    async getFeed(filter = {}) {
      if (SafeSpaceDB.isSupabaseActive()) {
        let query = supabase.from('posts').select(`
          *,
          profiles:user_id (id, username, avatar_url),
          post_likes (user_id),
          post_comments (id, user_id, content, created_at, profiles:user_id(username, avatar_url))
        `).order('created_at', { ascending: false });

        if (filter.mood) query = query.eq('mood', filter.mood);
        if (filter.userId) query = query.eq('user_id', filter.userId);

        const { data, error } = await query;
        if (error) throw error;
        return data.map(p => ({
          ...p,
          author_name: p.is_anonymous ? 'Anonymous' : (p.profiles?.username || 'Member'),
          author_avatar: p.is_anonymous ? null : p.profiles?.avatar_url,
          likes: p.post_likes ? p.post_likes.map(l => l.user_id) : [],
          comments: p.post_comments || []
        }));
      }

      // Local Demo Mode
      let posts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      if (filter.mood) {
        posts = posts.filter(p => p.mood === filter.mood);
      }
      if (filter.userId) {
        posts = posts.filter(p => p.user_id === filter.userId);
      }
      return posts;
    },

    async createPost({ content, mood = null, photo_url = null, is_anonymous = false }) {
      const currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('You must be logged in to post.');

      if (SafeSpaceDB.isSupabaseActive()) {
        const { data, error } = await supabase.from('posts').insert({
          user_id: currentUser.id,
          content,
          mood,
          photo_url,
          is_anonymous
        }).select().single();
        if (error) throw error;
        return data;
      }

      // Demo Mode
      const posts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      const newPost = {
        id: 'post-' + Date.now(),
        user_id: currentUser.id,
        author_name: is_anonymous ? 'Anonymous' : currentUser.username,
        author_avatar: is_anonymous ? null : currentUser.avatar_url,
        content,
        mood,
        photo_url,
        is_anonymous,
        likes: [],
        comments: [],
        created_at: new Date().toISOString()
      };
      posts.unshift(newPost);
      localStorage.setItem('safe_space_posts', JSON.stringify(posts));
      return newPost;
    },

    async toggleLike(postId) {
      const currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return false;

      if (SafeSpaceDB.isSupabaseActive()) {
        const { data: existing } = await supabase.from('post_likes')
          .select('id').eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle();

        if (existing) {
          await supabase.from('post_likes').delete().eq('id', existing.id);
          return false;
        } else {
          await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUser.id });
          return true;
        }
      }

      // Demo Mode
      const posts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      const post = posts.find(p => p.id === postId);
      if (!post) return false;
      const idx = post.likes.indexOf(currentUser.id);
      let liked = false;
      if (idx > -1) {
        post.likes.splice(idx, 1);
      } else {
        post.likes.push(currentUser.id);
        liked = true;
      }
      localStorage.setItem('safe_space_posts', JSON.stringify(posts));
      return liked;
    },

    async addComment(postId, content) {
      const currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Log in to comment.');

      if (SafeSpaceDB.isSupabaseActive()) {
        const { data, error } = await supabase.from('post_comments').insert({
          post_id: postId,
          user_id: currentUser.id,
          content
        }).select(`*, profiles:user_id(username, avatar_url)`).single();
        if (error) throw error;
        return data;
      }

      // Demo Mode
      const posts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      const post = posts.find(p => p.id === postId);
      if (!post) throw new Error('Post not found');
      const comment = {
        id: 'c-' + Date.now(),
        user_id: currentUser.id,
        username: currentUser.username,
        content,
        created_at: 'Just now'
      };
      post.comments.push(comment);
      localStorage.setItem('safe_space_posts', JSON.stringify(posts));
      return comment;
    },

    async toggleSave(postId) {
      const currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return false;

      if (SafeSpaceDB.isSupabaseActive()) {
        const { data: existing } = await supabase.from('saved_posts')
          .select('id').eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle();

        if (existing) {
          await supabase.from('saved_posts').delete().eq('id', existing.id);
          return false;
        } else {
          await supabase.from('saved_posts').insert({ post_id: postId, user_id: currentUser.id });
          return true;
        }
      }

      // Demo Mode
      let saved = JSON.parse(localStorage.getItem('safe_space_saved')) || [];
      const idx = saved.indexOf(postId);
      let isSaved = false;
      if (idx > -1) {
        saved.splice(idx, 1);
      } else {
        saved.push(postId);
        isSaved = true;
      }
      localStorage.setItem('safe_space_saved', JSON.stringify(saved));
      return isSaved;
    },

    async getSavedPosts() {
      const currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      if (SafeSpaceDB.isSupabaseActive()) {
        const { data } = await supabase.from('saved_posts')
          .select('post_id, posts(*, profiles:user_id(username, avatar_url))')
          .eq('user_id', currentUser.id);
        return data ? data.map(d => d.posts) : [];
      }

      const saved = JSON.parse(localStorage.getItem('safe_space_saved')) || [];
      const allPosts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      return allPosts.filter(p => saved.includes(p.id));
    },

    async deletePost(postId) {
      const currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return;

      if (SafeSpaceDB.isSupabaseActive()) {
        await supabase.from('posts').delete().eq('id', postId).eq('user_id', currentUser.id);
        return;
      }

      let posts = JSON.parse(localStorage.getItem('safe_space_posts')) || [];
      posts = posts.filter(p => p.id !== postId);
      localStorage.setItem('safe_space_posts', JSON.stringify(posts));
    }
  },

  // ==========================================
  // MESSAGING & CHAT SUPPORT
  // ==========================================
  messages: {
    async getConversations() {
      const currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      if (SafeSpaceDB.isSupabaseActive()) {
        const { data } = await supabase.from('messages')
          .select(`*, sender:sender_id(id, username, avatar_url), receiver:receiver_id(id, username, avatar_url)`)
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: false });
        return data || [];
      }

      // Demo Mode
      const all = JSON.parse(localStorage.getItem('safe_space_messages')) || [];
      return all;
    },

    async getMessagesWith(otherUserId) {
      const currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      if (SafeSpaceDB.isSupabaseActive()) {
        const { data } = await supabase.from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`)
          .order('created_at', { ascending: true });
        return data || [];
      }

      const all = JSON.parse(localStorage.getItem('safe_space_messages')) || [];
      return all.filter(m => 
        (m.sender_id === currentUser.id && m.receiver_id === otherUserId) ||
        (m.sender_id === otherUserId && m.receiver_id === currentUser.id)
      );
    },

    async sendMessage(receiverId, text) {
      const currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) throw new Error('Not authenticated');

      if (SafeSpaceDB.isSupabaseActive()) {
        const { data, error } = await supabase.from('messages').insert({
          sender_id: currentUser.id,
          receiver_id: receiverId,
          message: text
        }).select().single();
        if (error) throw error;
        return data;
      }

      // Demo Mode
      const messages = JSON.parse(localStorage.getItem('safe_space_messages')) || [];
      const msg = {
        id: 'msg-' + Date.now(),
        sender_id: currentUser.id,
        receiver_id: receiverId,
        message: text,
        created_at: new Date().toISOString()
      };
      messages.push(msg);
      localStorage.setItem('safe_space_messages', JSON.stringify(messages));
      return msg;
    }
  },

  // ==========================================
  // COMMUNITY MEMBERS & CONNECTIONS
  // ==========================================
  community: {
    async getMembers(query = '') {
      if (SafeSpaceDB.isSupabaseActive()) {
        let q = supabase.from('profiles').select('*');
        if (query) q = q.ilike('username', `%${query}%`);
        const { data } = await q;
        return data || [];
      }

      let members = JSON.parse(localStorage.getItem('safe_space_members')) || [];
      if (query) {
        members = members.filter(m => m.username.toLowerCase().includes(query.toLowerCase()));
      }
      return members;
    },

    async getFriendships() {
      const currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return [];

      if (SafeSpaceDB.isSupabaseActive()) {
        const { data } = await supabase.from('friendships')
          .select('*')
          .or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
        return data || [];
      }

      return JSON.parse(localStorage.getItem('safe_space_friendships')) || [];
    },

    async sendFriendRequest(targetId) {
      const currentUser = await SafeSpaceDB.auth.getCurrentUser();
      if (!currentUser) return;

      if (SafeSpaceDB.isSupabaseActive()) {
        await supabase.from('friendships').insert({
          requester_id: currentUser.id,
          receiver_id: targetId,
          status: 'pending'
        });
        return;
      }

      const friendships = JSON.parse(localStorage.getItem('safe_space_friendships')) || [];
      friendships.push({
        id: 'f-' + Date.now(),
        requester_id: currentUser.id,
        receiver_id: targetId,
        status: 'pending'
      });
      localStorage.setItem('safe_space_friendships', JSON.stringify(friendships));
    }
  },

  // ==========================================
  // STORAGE & IMAGE UPLOADS
  // ==========================================
  storage: {
    async uploadImage(file, bucket = 'post-photos') {
      if (SafeSpaceDB.isSupabaseActive()) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error } = await supabase.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return publicUrl;
      }

      // Demo Mode: convert to base64 Data URL for immediate local preview
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }
};

window.SafeSpaceDB = SafeSpaceDB;

