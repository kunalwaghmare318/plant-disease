import fs from 'fs';
import https from 'https';

const tex2Url =
  'https://media.sketchfab.com/models/55823c933335420eb12f819504db94c0/ce275474876f45508ee604d25176eef7/textures/d9a7a732b1c548caa489417ad2fb618d/f6ec2aef88e24f9c9a8ac14b33bfcca8.png';

https.get(tex2Url, (res) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync('public/assets/oak_leaf_alpha.png', buffer);
    console.log('✅ Oak Leaf alpha texture saved! Size:', buffer.length);
  });
});
