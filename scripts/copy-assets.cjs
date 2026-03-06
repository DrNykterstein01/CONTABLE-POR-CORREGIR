const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcLogo = path.join(root, 'logo.jpg');
const destDir = path.join(root, 'dist');
const destLogo = path.join(destDir, 'logo.jpg');

if (!fs.existsSync(srcLogo)) {
  console.error('copy-assets: source logo.jpg not found at', srcLogo);
  process.exit(1);
}

if (!fs.existsSync(destDir)) {
  console.error('copy-assets: dist directory not found, run `vite build` first');
  process.exit(1);
}

try {
  fs.copyFileSync(srcLogo, destLogo);
  console.log('copy-assets: copied', srcLogo, '->', destLogo);
} catch (err) {
  console.error('copy-assets: failed to copy logo:', err);
  process.exit(1);
}
