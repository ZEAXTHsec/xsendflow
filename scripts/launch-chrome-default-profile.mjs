import { execSync, spawn } from 'child_process';
import fs from 'fs';

try {
  console.log('🛑 Stopping background Chrome...');
  execSync('taskkill /F /IM chrome.exe /T', { stdio: 'ignore' });
} catch {}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userProfile = 'C:\\Users\\Afyie\\AppData\\Local\\Google\\Chrome\\User Data';
const args = [
  '--remote-debugging-port=9222',
  `--user-data-dir=${userProfile}`,
  'http://localhost:3000/studio'
];

console.log('🚀 Launching Chrome targeting default profile directory...');
const proc = spawn(chromePath, args, { detached: true, stdio: 'ignore' });
proc.unref();

setTimeout(() => {
  const portFile = 'C:\\Users\\Afyie\\AppData\\Local\\Google\\Chrome\\User Data\\DevToolsActivePort';
  if (fs.existsSync(portFile)) {
    console.log('✅ FOUND DevToolsActivePort:');
    console.log(fs.readFileSync(portFile, 'utf8'));
  } else {
    console.log('❌ DevToolsActivePort not created yet');
  }
}, 3000);
