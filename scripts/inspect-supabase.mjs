import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://putztvsdxuprkbxufrge.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHp0dnNkeHVwcmtieHVmcmdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzIzNDgyMiwiZXhwIjoyMDk4ODEwODIyfQ.vDCdwY8j2z_m-AGHe6AMwHD8eiMLqqr0Mq6D0EBZeAs";

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  console.log("[*] Connecting to Supabase at", SUPABASE_URL);

  const tablesToCheck = [
    "users", "profiles", "senders", "campaigns", "leads", 
    "pitch_pages", "sequences", "emails", "settings", "accounts",
    "templates", "mailboxes", "contacts", "analytics"
  ];

  let foundCount = 0;

  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: 'exact' })
        .limit(5);

      if (!error && data !== null) {
        foundCount++;
        console.log(`\n✅ Table '${table}' exists! Total Rows: ${count ?? data.length}`);
        if (data.length > 0) {
          console.log(`   Sample Data (first ${data.length}):`);
          console.log(JSON.stringify(data, null, 2));
        }
      }
    } catch (err) {
      // Table doesn't exist
    }
  }

  // Check auth users
  try {
    const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
    if (!authErr && users) {
      console.log(`\n👥 Registered Auth Users: ${users.length}`);
      users.forEach(u => console.log(`   - ${u.email} (ID: ${u.id}, Created: ${u.created_at})`));
    }
  } catch (err) {
    console.log("Auth admin check note:", err.message);
  }

  if (foundCount === 0) {
    console.log("\n[*] No existing application tables found in public schema.");
  }
}

main();
