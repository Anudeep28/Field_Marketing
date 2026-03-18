/**
 * PWA Icon Generator
 * 
 * This script creates properly sized PNG icons for the PWA manifest.
 * It uses a simple canvas approach to generate solid-color placeholder icons
 * with the app initial "F" (for FieldPulse).
 * 
 * To use your own logo instead, replace the generated files in public/icons/
 * with your actual logo resized to each dimension.
 * 
 * Required sizes: 72, 96, 128, 144, 152, 192, 384, 512
 * 
 * OPTION 1 (Recommended): Use an online tool
 *   - Go to https://www.pwabuilder.com/imageGenerator
 *   - Upload your assets/icon.png
 *   - Download all sizes and place in public/icons/
 * 
 * OPTION 2: Use this script (generates placeholder icons)
 *   - Run: node scripts/generate-pwa-icons.js
 *   - Requires: npm install canvas (one-time)
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const BG_COLOR = '#1E40AF'; // Match your theme color
const TEXT_COLOR = '#FFFFFF';

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

try {
  // Try using canvas package if available
  const { createCanvas } = require('canvas');
  
  SIZES.forEach((size) => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Text "F" for FieldPulse
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = `bold ${Math.round(size * 0.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', size / 2, size / 2 + size * 0.02);
    
    // Save
    const buffer = canvas.toBuffer('image/png');
    const filePath = path.join(ICONS_DIR, `icon-${size}.png`);
    fs.writeFileSync(filePath, buffer);
    console.log(`✓ Created ${filePath} (${size}x${size})`);
  });
  
  console.log('\n✅ All PWA icons generated successfully!');
} catch (err) {
  // Fallback: create minimal valid 1x1 PNGs as placeholders
  console.log('⚠️  "canvas" package not found. Creating minimal placeholder PNGs...');
  console.log('   For proper icons, either:');
  console.log('   1. Run: npm install canvas && node scripts/generate-pwa-icons.js');
  console.log('   2. Use https://www.pwabuilder.com/imageGenerator with assets/icon.png\n');
  
  // Minimal valid PNG (1x1 blue pixel) — works as a placeholder
  // Real icons should be generated with proper tools
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xD7, 0x63, 0xD8, 0xCD, 0xC0, 0x00,
    0x00, 0x00, 0x04, 0x00, 0x01, 0x9A, 0xA1, 0x27,
    0x39, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
    0x44, 0xAE, 0x42, 0x60, 0x82,
  ]);
  
  SIZES.forEach((size) => {
    const filePath = path.join(ICONS_DIR, `icon-${size}.png`);
    fs.writeFileSync(filePath, minimalPNG);
    console.log(`✓ Created placeholder ${filePath}`);
  });
  
  console.log('\n⚠️  Placeholder icons created. Replace them with real icons before deploying.');
}
