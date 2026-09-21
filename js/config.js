/**
 * Safe Space - Supabase Configuration
 * Project: ssqswqqfsbfgjsrllprq
 */
var SAFE_SPACE_CONFIG = {
  // Supabase Project URL:
  SUPABASE_URL: "https://ssqswqqfsbfgjsrllprq.supabase.co",

  // Supabase Public Anon Key:
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcXN3cXFmc2JmZ2pzcmxscHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NTI4NDcsImV4cCI6MjEwNTEyODg0N30.edh6s4TqNS8b8dzZyE-kLPzhw8YWtgWpKFf-zU3rVLg",

  // Supabase Service Role Key:
  SUPABASE_SERVICE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzcXN3cXFmc2JmZ2pzcmxscHJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU1Mjg0NywiZXhwIjoyMTA1MTI4ODQ3fQ.LLtIHwdrA3wYCqVc1Ep7gO9z-vABKF47OYO7nxxfqzk",

  // EMAIL AUTHENTICATION SETTING:
  // Set to true to require real SMTP confirmation emails sent to students' actual email inboxes.
  // Requires setting up SMTP in your Supabase Dashboard (e.g. via Resend or Gmail).
  REQUIRE_EMAIL_CONFIRMATION: true,

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
