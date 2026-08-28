import { execSync, spawn } from 'child_process';
import http from 'http';

function stopExistingChrome() {
  try {
    console.log('🛑 Stopping any existing background Chrome processes...');
    execSync('taskkill /F /IM chrome.exe /T', { stdio: 'ignore' });
  } catch {
    // Ignore if not running
  }
}

function launchChrome() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const args = [
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\chrome-dev-profile',
    'http://localhost:3000/studio'
  ];

  console.log('🚀 Launching Google Chrome with remote debugging on port 9222...');
  const proc = spawn(chromePath, args, {
    detached: true,
    stdio: 'ignore'
  });
  proc.unref();
}

function checkCDP(retries = 6) {
  if (retries === 0) {
    console.log('❌ Could not connect to CDP port 9222 after retries.');
    process.exit(1);
  }

  const req = http.get('http://localhost:9222/json/version', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('✅ Chrome CDP is ACTIVE and listening on port 9222!');
        console.log('   Browser:', json.Browser);
        console.log('   WebSocket URL:', json.webSocketDebuggerUrl);
        process.exit(0);
      } catch (err) {
        console.log('⚠️ Parsing CDP response:', err.message);
        setTimeout(() => checkCDP(retries - 1), 1000);
      }
    });
  });

  req.on('error', () => {
    setTimeout(() => checkCDP(retries - 1), 1000);
  });
}

stopExistingChrome();
setTimeout(() => {
  launchChrome();
  setTimeout(() => {
    checkCDP();
  }, 2000);
}, 1000);
