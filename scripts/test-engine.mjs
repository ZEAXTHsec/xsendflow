// Standalone ES module tester for Spintax and Jitter
function protectMergeTags(text) {
  const placeholders = {};
  let counter = 0;
  const protectedText = text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, tag) => {
    const key = `___MERGETAG_${counter++}___`;
    placeholders[key] = `{{${tag}}}`;
    return key;
  });
  const restore = (str) => {
    let result = str;
    for (const [key, original] of Object.entries(placeholders)) {
      result = result.replaceAll(key, original);
    }
    return result;
  };
  return { protectedText, restore };
}

function parseDeepSpintax(text) {
  if (!text) return '';
  const { protectedText, restore } = protectMergeTags(text);
  const innermost = /\{([^{}]+?)\}/;
  let current = protectedText;
  let iterations = 0;
  while (innermost.test(current) && iterations < 200) {
    current = current.replace(innermost, (_, optionsStr) => {
      const parts = optionsStr.split('|');
      return parts[Math.floor(Math.random() * parts.length)];
    });
    iterations++;
  }
  return restore(current);
}

const template = "{{Hey|Hi} {{First_Name}|there}|Good morning {{First_Name}}},\n\n{{Noticed|Saw} {{Company}} is scaling {B2B pipeline|outbound acquisitions}|Came across your recent work in the space}.\n\nPut together a custom breakdown for {{Company}}: {{Pitch_Page_URL}}.\n\n{{Open to checking it out?|Worth a quick peek?}}";

console.log("--- 3 Randomized Permutations ---");
for (let i = 1; i <= 3; i++) {
  console.log(`\n[Variation #${i}]:\n${parseDeepSpintax(template)}`);
}
