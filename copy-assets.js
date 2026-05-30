import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

function processCopy() {
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)){
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('Created public/ directory successfully.');
  }

  const srcIcon = path.join(__dirname, 'src', 'assets', 'images', 'favicon_1780123257209.png');
  const destIcon = path.join(publicDir, 'icon.png');
  const destFavicon = path.join(publicDir, 'favicon.ico');

  if (fs.existsSync(srcIcon)) {
    fs.copyFileSync(srcIcon, destIcon);
    fs.copyFileSync(srcIcon, destFavicon);
    console.log('Copied icon assets to public/ folder successfully.');
  } else {
    console.warn(`Source icon not found at: ${srcIcon}`);
  }
}

processCopy();
