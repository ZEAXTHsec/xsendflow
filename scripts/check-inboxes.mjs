import tls from 'tls';

function check(email, pass) {
  return new Promise((resolve) => {
    console.log('\n=============================================');
    console.log(`📬 Checking Inbox for: ${email}`);
    const client = tls.connect(993, 'imap.hostinger.com', { rejectUnauthorized: false }, () => {});
    let step = 0, output = '';
    client.on('data', (d) => {
      const str = d.toString();
      output += str;
      if (step === 0 && str.includes('* OK')) {
        step = 1;
        client.write(`A1 LOGIN "${email}" "${pass}"\r\n`);
      } else if (step === 1 && str.includes('A1 OK')) {
        step = 2;
        client.write(`A2 SELECT INBOX\r\n`);
      } else if (step === 2 && str.includes('A2 OK')) {
        step = 3;
        client.write(`A3 FETCH 1:* (BODY[HEADER.FIELDS (SUBJECT FROM DATE)])\r\n`);
      } else if (step === 3 && (str.includes('A3 OK') || str.includes('A3 NO') || str.includes('A3 BAD'))) {
        step = 4;
        client.write(`A4 LOGOUT\r\n`);
        client.end();
      }
    });
    client.on('end', () => {
      const subjects = output.match(/Subject: [^\r\n]+/gi) || [];
      const froms = output.match(/From: [^\r\n]+/gi) || [];
      const dates = output.match(/Date: [^\r\n]+/gi) || [];
      console.log(`   Found ${subjects.length} total messages:`);
      for (let i = Math.max(0, subjects.length - 6); i < subjects.length; i++) {
        console.log(`   [${i + 1}] ${froms[i] || ''} | ${subjects[i] || ''} | ${dates[i] || ''}`);
      }
      resolve();
    });
    client.on('error', (err) => {
      console.log('   IMAP Error:', err.message);
      resolve();
    });
    setTimeout(() => { try { client.end(); } catch {} resolve(); }, 8000);
  });
}

async function main() {
  await check('aftab@poe2lab.com', 'Aftab123)');
  await check('aftab@aftabconsults.com', 'Aftab123)');
  await check('aftab@mohammadaftab.com', 'Aftab123)');
}
main();
