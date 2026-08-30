import { normalizeTargetAudience, normalizeOfferGrammar, generateDynamicSequence } from '../src/lib/engine/nlpNormalizer.ts';

console.log('Testing "dentistal clinics" ->', normalizeTargetAudience('dentistal clinics'));
console.log('Testing "teeth fixers" ->', normalizeTargetAudience('teeth fixers'));
console.log('Testing "more bookings" ->', normalizeOfferGrammar('more bookings'));
console.log('Testing "15 patients" ->', normalizeOfferGrammar('15 patients'));

console.log('\n--- GENERATION 1 (Angle: Value Teardown) ---');
const seq1 = generateDynamicSequence('dentistal clinics', 'more bookings', 'empty chairs and relying on FB ads', 'a 60-second video teardown ({{Pitch_Page_URL}})', 'Worth a quick look?', 'value_teardown');
console.log('Subject:', seq1[0].subject);
console.log('Body:\n' + seq1[0].body);

console.log('\n--- GENERATION 2 (Angle: 3-Sentence Hook) ---');
const seq2 = generateDynamicSequence('dentistal clinics', 'more bookings', 'empty chairs', 'a 60-second video teardown ({{Pitch_Page_URL}})', 'Worth a quick look?', '3_sentence_hook');
console.log('Subject:', seq2[0].subject);
console.log('Body:\n' + seq2[0].body);

console.log('\n--- GENERATION 3 (Angle: Case Study Proof) ---');
const seq3 = generateDynamicSequence('dentistal clinics', 'more bookings', 'empty chairs', 'a 60-second video teardown ({{Pitch_Page_URL}})', 'Worth a quick look?', 'case_study_proof');
console.log('Subject:', seq3[0].subject);
console.log('Body:\n' + seq3[0].body);
