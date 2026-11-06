require('dotenv').config();

async function test() {
  const key = process.env.GEMINI_API_KEY;
  console.log('Testing key ending in:', key ? key.slice(-6) : 'none');

  // Test models to find which one responds
  const models = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
  ];

  for (const m of models) {
    try {
      console.log(`Checking model: ${m}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with the single word: OK' }] }]
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ SUCCESS with ${m}! Response:`, data.candidates[0].content.parts[0].text.trim());
        return m;
      } else {
        console.log(`❌ ${m} returned ${res.status}:`, data.error?.message?.substring(0, 100));
      }
    } catch (e) {
      console.log(`Error testing ${m}:`, e.message);
    }
  }
}

test();
