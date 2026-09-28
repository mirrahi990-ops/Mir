import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const publicDir = path.resolve('public');

if (!fs.existsSync(distDir)) {
  console.error('dist directory does not exist! Run npm run build first.');
  process.exit(1);
}

const htmlFile = path.join(distDir, 'index.html');
let htmlContent = fs.readFileSync(htmlFile, 'utf-8');

// Find CSS file in dist/assets
const assetsDir = path.join(distDir, 'assets');
const assetFiles = fs.readdirSync(assetsDir);

const cssFile = assetFiles.find((f) => f.endsWith('.css'));
const jsFile = assetFiles.find((f) => f.endsWith('.js'));

if (cssFile) {
  const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf-8');
  // Replace <link rel="stylesheet" ...> with <style>...</style>
  htmlContent = htmlContent.replace(
    new RegExp(`<link[^>]*href=["'](?:/assets/|assets/)?${cssFile}["'][^>]*>`, 'i'),
    `<style>\n${cssContent}\n</style>`
  );
}

if (jsFile) {
  const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf-8');
  // Replace <script type="module" ... src="..."></script> with inline script
  htmlContent = htmlContent.replace(
    new RegExp(`<script[^>]*src=["'](?:/assets/|assets/)?${jsFile}["'][^>]*>\\s*</script>`, 'i'),
    `<script type="module">\n${jsContent}\n</script>`
  );
}

// Remove any remaining manifest or service worker link that might fail on local file://
htmlContent = htmlContent.replace(/<link rel="manifest"[^>]*>/i, '');

// Save to public/HydroPulse-Standalone.html
const outputFile = path.join(publicDir, 'HydroPulse-Standalone.html');
fs.writeFileSync(outputFile, htmlContent, 'utf-8');
console.log('Standalone single-file HTML generated at:', outputFile);
