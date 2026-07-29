import fs from 'fs';
import https from 'https';
import zlib from 'zlib';

const binzUrl =
  'https://media.sketchfab.com/models/55823c933335420eb12f819504db94c0/ce275474876f45508ee604d25176eef7/files/25bf3316febb44b69344d40b908ccfe1/file.binz';

console.log('Downloading file.binz...');
https.get(binzUrl, (res) => {
  if (res.statusCode !== 200) {
    console.error('Download failed with status:', res.statusCode);
    return;
  }
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log('Downloaded size:', buffer.length);
    fs.writeFileSync('scratch_oak.binz', buffer);

    // Try gunzip / inflate
    zlib.unzip(buffer, (err, decompressed) => {
      if (err) {
        console.log('Not simple gzip, testing raw buffer header:', buffer.slice(0, 50).toString('utf8'));
      } else {
        console.log('Decompressed size:', decompressed.length);
        fs.writeFileSync('scratch_oak.gltf', decompressed);
      }
    });
  });
});
