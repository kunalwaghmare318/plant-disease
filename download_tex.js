import fs from 'fs';
import https from 'https';

const texUrl =
  'https://media.sketchfab.com/models/55823c933335420eb12f819504db94c0/ce275474876f45508ee604d25176eef7/textures/d9a7a732b1c548caa489417ad2fb618d/23720a14d11e45efbf132cd351fdec03.png';

console.log('Downloading Oak Leaf Texture...');
https.get(texUrl, (res) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync('public/assets/oak_leaf_texture.png', buffer);
    console.log('✅ Oak Leaf texture saved! Size:', buffer.length);
  });
});
