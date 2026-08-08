/**
 * Supabase client bootstrap (CDN: @supabase/supabase-js).
 */
const supabaseClient = (() => {
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase SDK failed to load");
    return null;
  }
  if (
    !SUPABASE_URL ||
    SUPABASE_URL === "YOUR_SUPABASE_URL" ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY"
  ) {
    console.error("Set SUPABASE_URL and SUPABASE_ANON_KEY in js/config.js");
  }
  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();

function getSupabase() {
  if (!supabaseClient) {
    throw new Error("Supabase client is not available");
  }
  return supabaseClient;
}
