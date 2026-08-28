import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://putztvsdxuprkbxufrge.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHp0dnNkeHVwcmtieHVmcmdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzIzNDgyMiwiZXhwIjoyMDk4ODEwODIyfQ.vDCdwY8j2z_m-AGHe6AMwHD8eiMLqqr0Mq6D0EBZeAs";

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  const email = "aftab@xsendflow.com";
  const password = "Aftab123";

  console.log(`[*] Creating confirmed user in Supabase: ${email}...`);

  // Check if user already exists
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existing = users.find(u => u.email === email);

  if (existing) {
    console.log(`[*] User already exists (ID: ${existing.id}). Updating password...`);
    const { error: updateErr } = await supabase.auth.admin.updateUserById(existing.id, {
      password: password,
      email_confirm: true
    });
    if (updateErr) {
      console.error("[!] Error updating user:", updateErr.message);
    } else {
      console.log(`✅ User ${email} password updated and confirmed successfully!`);
    }
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: "Aftab M." }
    });

    if (error) {
      console.error("[!] Error creating user:", error.message);
    } else {
      console.log(`✅ Account Created Successfully! User ID: ${data.user.id}`);
      console.log(`   Email:    ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Status:   Confirmed (Instant Login Active)`);
    }
  }
}

main();
