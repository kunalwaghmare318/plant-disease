import fs from 'fs';

async function findOakModel() {
  const res = await fetch('https://sketchfab.com/models/55823c933335420eb12f819504db94c0/embed');
  const html = await res.text();
  fs.writeFileSync('scratch_embed.html', html);

  const urls = html.match(/https?:[^\s"'>\\]+\.(?:binz|gltf|glb|bin|png|jpg|jpeg)/gi) || [];
  console.log('Matches:', [...new Set(urls)]);
}

findOakModel().catch(console.error);
