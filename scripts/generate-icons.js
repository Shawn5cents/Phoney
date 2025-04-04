const sharp = require('sharp');
const path = require('path');

async function generateIcons() {
  const sizes = [192, 512];
  const inputSvg = path.join(__dirname, '..', 'public', 'icon.svg');
  
  for (const size of sizes) {
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, '..', 'public', `icon-${size}.png`));
    console.log(`Generated ${size}x${size} icon`);
  }
}

generateIcons().catch(console.error);
