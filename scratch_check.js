import fs from 'fs';

const content = fs.readFileSync(
  'C:\\Users\\Kunal\\.gemini\\antigravity\\brain\\12a05dd5-f2a5-4331-80d9-e7731ea63966\\.system_generated\\steps\\231\\content.md',
  'utf8'
);

const matches = content.match(/https?:[^\s"'>]+/gi) || [];
console.log('--- Sketchfab URLs ---');
matches.forEach((url) => {
  if (url.includes('models') || url.includes('sketchfab') || url.includes('gltf') || url.includes('glb')) {
    console.log(url);
  }
});
