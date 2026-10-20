/**
 * Safe Space - Supabase Configuration
 * Project: ssqswqqfsbfgjsrllprq
 */
var SAFE_SPACE_CONFIG = {
  // Supabase Project URL:
  SUPABASE_URL: "https://ssqswqqfsbfgjsrllprq.supabase.co",

  // Supabase Public Anon / Publishable Key:
  SUPABASE_ANON_KEY: "sb_publishable_yOcs11bwjXyhA1DuUAQCBQ_dwo-zhLM",

  // Supabase Service Role Key (Keep empty in frontend; use only in secure backend scripts):
  SUPABASE_SERVICE_KEY: "",

  // EMAIL AUTHENTICATION SETTING:
  // Set to true to require real SMTP confirmation emails sent to students' actual email inboxes.
  // Requires setting up SMTP in your Supabase Dashboard (e.g. via Resend or Gmail).
  REQUIRE_EMAIL_CONFIRMATION: true,

  // AI Moderation & Sentiment Analysis Service (FastAPI):
  AI_API_URL: "http://127.0.0.1:8000",

  // Optional Google Gemini API Key for dynamic generative Safe Space AI Assistant:
  // Can also be set in Support Preferences via the Chat UI
  GEMINI_API_KEY: "",

  // App Metadata
  APP_NAME: "Safe Space",
  VERSION: "2.0.0",

  // Check if live Supabase is properly configured
  isConfigured: function() {
    return (
      Boolean(this.SUPABASE_URL) &&
      Boolean(this.SUPABASE_ANON_KEY) &&
      !this.SUPABASE_URL.includes("your-project-id") &&
      !this.SUPABASE_ANON_KEY.includes("your-anon-key")
    );
  }
};

if (typeof window !== 'undefined') {
  window.SAFE_SPACE_CONFIG = SAFE_SPACE_CONFIG;
}
