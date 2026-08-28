import os
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

from supabase import create_client, Client

SUPABASE_URL = "https://putztvsdxuprkbxufrge.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHp0dnNkeHVwcmtieHVmcmdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzIzNDgyMiwiZXhwIjoyMDk4ODEwODIyfQ.vDCdwY8j2z_m-AGHe6AMwHD8eiMLqqr0Mq6D0EBZeAs"

def main():
    try:
        supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
        print("[+] Connected to Supabase!")
        
        # Test common tables
        tables_to_check = ["users", "profiles", "senders", "campaigns", "leads", "pitch_pages", "sequences", "emails", "settings", "accounts"]
        found_tables = {}
        
        for table in tables_to_check:
            try:
                res = supabase.table(table).select("*").limit(10).execute()
                found_tables[table] = res.data
                print(f"[+] Found table '{table}' with {len(res.data)} sample row(s)!")
                if res.data:
                    for idx, row in enumerate(res.data):
                        print(f"    Row {idx+1}: {row}")
            except Exception as e:
                # Table probably doesn't exist
                pass
                
        if not found_tables:
            print("[*] No standard tables found in public schema. Database is fresh!")
        else:
            print(f"\n[+] Summary: Found {len(found_tables)} active table(s): {list(found_tables.keys())}")
            
    except Exception as e:
        print(f"[!] Error inspecting Supabase: {e}")

if __name__ == "__main__":
    main()
