/**
 * Safe Space - Supabase Configuration
 * 
 * Replace the values below with your Supabase Project settings:
 * Supabase Dashboard -> Project Settings -> API
 * 1. SUPABASE_URL: Project URL (e.g. https://xyzcompany.supabase.co)
 * 2. SUPABASE_ANON_KEY: Project API anon/public key (eyJh...)
 * 
 * NOTE: If left blank or using placeholders, Safe Space automatically runs
 * in zero-dependency Local Demo Mode so you can test on your laptop immediately!
 */
const SAFE_SPACE_CONFIG = {
  // Enter your Supabase Project URL:
  SUPABASE_URL: "",

  // Enter your Supabase Public Anon Key:
  SUPABASE_ANON_KEY: "",

  // App Metadata
  APP_NAME: "Safe Space",
  VERSION: "2.0.0",

  // Demo Mode is automatically active if Supabase keys are not set
  isConfigured() {
    return (
      Boolean(this.SUPABASE_URL) &&
      Boolean(this.SUPABASE_ANON_KEY) &&
      !this.SUPABASE_URL.includes("your-project-id") &&
      !this.SUPABASE_ANON_KEY.includes("your-anon-key")
    );
  }
};

