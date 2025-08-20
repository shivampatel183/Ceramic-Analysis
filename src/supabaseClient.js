import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://azjhjthikmqecrnvjjqg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6amhqdGhpa21xZWNybnZqanFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzgyOTIsImV4cCI6MjA2NTY1NDI5Mn0.jTFPp4GYxlsls2j_jA-Yh0KbClb548mZMHJUXE5bj_A"
);
