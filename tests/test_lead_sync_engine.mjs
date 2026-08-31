import { syncUploadedLeadsToMasterDB, sanitizeRawContact } from '../src/lib/leadDatabase.js';

console.log('================================================================');
console.log('🧪 RUNNING MASTER LEAD DATABASE & DEDUPLICATION ENGINE TESTS');
console.log('================================================================');

let allPassed = true;
const test = (title, fn) => {
  try {
    fn();
    console.log(`✅ [PASS] ${title}`);
  } catch (err) {
    allPassed = false;
    console.error(`❌ [FAIL] ${title}`);
    console.error(`   Reason: ${err.message}`);
  }
};

const assert = (condition, msg) => {
  if (!condition) throw new Error(msg);
};

// 1. Test Lead Sanitization
test('Contact Sanitization & RFC Fixes', () => {
  const raw = {
    firstName: 'Dr. Sarah Connor (CEO)',
    lastName: 'Connor',
    company: 'SkyNet Systems LLC Inc.',
    title: 'Chief Security Officer',
    email: 'sarah@gmai.com' // Typo test
  };
  const clean = sanitizeRawContact(raw, 0);
  assert(clean.cleanFirstName === 'Sarah', `Expected Sarah, got ${clean.cleanFirstName}`);
  assert(clean.cleanCompany === 'SkyNet Systems', `Expected SkyNet Systems, got ${clean.cleanCompany}`);
  assert(clean.email === 'sarah@gmail.com', `Expected typo fix to sarah@gmail.com, got ${clean.email}`);
  assert(clean.isValidEmail === true, 'Expected valid email');
});

// 2. Test Campaign 1 Ingestion (Initial 5 Leads)
let masterDb = [];
test('Campaign 1 Sync: 5 New Leads -> Master DB (5 Leads)', () => {
  const camp1Leads = [
    { firstName: 'Sarah', email: 'sarah@skynet.com', company: 'SkyNet' },
    { firstName: 'John', email: 'john@resistance.io', company: 'Resistance' },
    { firstName: 'Kyle', email: 'kyle@future.org', company: 'FutureTech' },
    { firstName: 'Miles', email: 'miles@cyberdyne.ai', company: 'Cyberdyne' },
    { firstName: 'Marcus', email: 'marcus@salvation.co', company: 'Salvation' }
  ];

  const res = syncUploadedLeadsToMasterDB(camp1Leads, 'free', masterDb);
  masterDb = res.updatedMasterLeads;

  assert(masterDb.length === 5, `Expected 5 leads in Master DB, got ${masterDb.length}`);
  assert(res.addedCount === 5, `Expected 5 added, got ${res.addedCount}`);
  assert(res.updatedCount === 0, `Expected 0 updated, got ${res.updatedCount}`);
});

// 3. Test Campaign 2 Ingestion (3 Duplicates + 2 New Leads)
test('Campaign 2 Sync: Deduplication (3 Dups + 2 New -> 7 Unique Leads)', () => {
  const camp2Leads = [
    { firstName: 'Sarah', email: 'sarah@skynet.com', company: 'SkyNet Defense Systems' }, // Duplicate with updated comp
    { firstName: 'John', email: 'john@resistance.io', company: 'Resistance HQ' }, // Duplicate
    { firstName: 'Kyle', email: 'kyle@future.org', company: 'FutureTech Inc' }, // Duplicate
    { firstName: 'Grace', email: 'grace@legion.com', company: 'Legion Defense' }, // NEW 1
    { firstName: 'Dani', email: 'dani@newmexico.co', company: 'New Mexico Energy' } // NEW 2
  ];

  const res = syncUploadedLeadsToMasterDB(camp2Leads, 'free', masterDb);
  masterDb = res.updatedMasterLeads;

  assert(masterDb.length === 7, `Expected 7 unique leads in Master DB, got ${masterDb.length}`);
  assert(res.addedCount === 2, `Expected 2 added, got ${res.addedCount}`);
  assert(res.updatedCount === 3, `Expected 3 updated, got ${res.updatedCount}`);

  // Verify Sarah was updated with new company name
  const sarah = masterDb.find(l => l.email === 'sarah@skynet.com');
  assert(sarah.cleanCompany === 'SkyNet Defense Systems', `Expected updated company name, got ${sarah.cleanCompany}`);
});

// 4. Test Free Tier 250 Capacity & Smart FIFO Replacement
test('Free Plan FIFO Smart Replacement (300 Leads -> Caps at 250 with Newest Retained)', () => {
  // Generate 260 new leads
  const largeBatch = [];
  for (let i = 1; i <= 260; i++) {
    largeBatch.push({
      firstName: `User${i}`,
      email: `user${i}@largecorp${i}.com`,
      company: `LargeCorp ${i}`,
      title: 'Manager'
    });
  }

  const res = syncUploadedLeadsToMasterDB(largeBatch, 'free', masterDb);
  masterDb = res.updatedMasterLeads;

  assert(masterDb.length === 250, `Expected exactly 250 leads on Free plan, got ${masterDb.length}`);
  assert(res.replacedCount === 17, `Expected 17 older leads replaced (7 existing + 260 incoming = 267 total - 250 = 17 replaced), got ${res.replacedCount}`);
  
  // Verify the newest leads exist in the pool
  const user260 = masterDb.find(l => l.email === 'user260@largecorp260.com');
  assert(user260 !== undefined, 'Expected user260 to be in the database');
});

// 5. Test Pro Plan Unlimited Capacity (No FIFO Truncation)
test('Pro Plan Unlimited Capacity (500 Leads -> Retains all 500)', () => {
  const proBatch = [];
  for (let i = 1; i <= 500; i++) {
    proBatch.push({
      firstName: `ProUser${i}`,
      email: `pro${i}@enterprise.com`,
      company: `Enterprise ${i}`
    });
  }

  const res = syncUploadedLeadsToMasterDB(proBatch, 'pro', []);
  assert(res.updatedMasterLeads.length === 500, `Expected 500 leads on Pro plan, got ${res.updatedMasterLeads.length}`);
  assert(res.replacedCount === 0, 'Expected 0 replaced on Pro plan');
});

console.log('================================================================');
if (allPassed) {
  console.log('🎉 ALL 5 MASTER LEAD DB & DEDUPLICATION TESTS PASSED (100%)');
} else {
  console.error('❌ SOME TESTS FAILED');
  process.exit(1);
}
console.log('================================================================');
