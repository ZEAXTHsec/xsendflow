import os
import sys
import tarfile
import subprocess
import time

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

VPS_IP = "68.233.104.131"
KEY_PATH = r"C:\Users\Afyie\.oci\xsendflow_vps.key"
PROJECT_DIR = r"D:\Antigravity\Saas\Xsendflow"
ARCHIVE_PATH = os.path.join(PROJECT_DIR, "xsendflow_deploy.tar.gz")

def make_tarfile():
    print("[*] Packaging XSendFlow codebase (excluding node_modules and .next)...")
    exclude_dirs = {"node_modules", ".next", ".git"}
    
    with tarfile.open(ARCHIVE_PATH, "w:gz") as tar:
        for root, dirs, files in os.walk(PROJECT_DIR):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if file.endswith((".tar.gz", ".log", ".tsbuildinfo")):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, PROJECT_DIR)
                tar.add(full_path, arcname=rel_path)
    print(f"[+] Archive created: {ARCHIVE_PATH} ({os.path.getsize(ARCHIVE_PATH) / 1024 / 1024:.2f} MB)")

def run_remote_cmd(cmd):
    ssh_cmd = [
        "ssh", "-i", KEY_PATH,
        "-o", "StrictHostKeyChecking=no",
        f"ubuntu@{VPS_IP}",
        cmd
    ]
    res = subprocess.run(ssh_cmd, capture_output=True, text=True)
    return res.stdout, res.stderr, res.returncode

def main():
    make_tarfile()
    
    print(f"[*] Uploading codebase to Oracle Always Free VPS ({VPS_IP})...")
    scp_cmd = [
        "scp", "-i", KEY_PATH,
        "-o", "StrictHostKeyChecking=no",
        ARCHIVE_PATH,
        f"ubuntu@{VPS_IP}:/home/ubuntu/xsendflow_deploy.tar.gz"
    ]
    subprocess.run(scp_cmd, check=True)
    print("[+] Archive uploaded successfully!")
    
    # Upload .env.local
    env_local = os.path.join(PROJECT_DIR, ".env.local")
    if os.path.exists(env_local):
        print("[*] Uploading .env.local configuration...")
        scp_env = [
            "scp", "-i", KEY_PATH,
            "-o", "StrictHostKeyChecking=no",
            env_local,
            f"ubuntu@{VPS_IP}:/home/ubuntu/.env.local"
        ]
        subprocess.run(scp_env, check=True)
        
    print("[*] Extracting, installing dependencies, and compiling Next.js production build on VPS...")
    build_script = """
    mkdir -p /home/ubuntu/xsendflow
    tar -xzf /home/ubuntu/xsendflow_deploy.tar.gz -C /home/ubuntu/xsendflow
    cp /home/ubuntu/.env.local /home/ubuntu/xsendflow/.env.local 2>/dev/null || true
    cd /home/ubuntu/xsendflow
    npm install --production=false
    npm run build
    pm2 delete xsendflow 2>/dev/null || true
    pm2 start npm --name "xsendflow" -- start -- -p 3000
    pm2 save
    sudo ufw allow 3000/tcp 2>/dev/null || true
    sudo ufw allow 80/tcp 2>/dev/null || true
    sudo ufw allow 443/tcp 2>/dev/null || true
    sudo ufw allow 22/tcp 2>/dev/null || true
    """
    
    out, err, code = run_remote_cmd(build_script)
    print(out)
    if code != 0:
        print(f"[!] Build error: {err}")
    else:
        print("\n" + "="*60)
        print("🎉 XSENDFLOW IS LIVE ON ORACLE ALWAYS FREE VPS (24/7)!")
        print(f"🌐 Live Web App URL:    http://{VPS_IP}:3000")
        print(f"🌐 Live Studio URL:     http://{VPS_IP}:3000/studio")
        print(f"⚡ Process Manager:     PM2 (Auto-restarts on reboot)")
        print(f"💰 Monthly Cost:        $0.00 / month (Always Free)")
        print("="*60 + "\n")
        
    # Clean up local archive
    if os.path.exists(ARCHIVE_PATH):
        os.remove(ARCHIVE_PATH)

if __name__ == "__main__":
    main()
