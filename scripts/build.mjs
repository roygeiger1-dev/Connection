// Builds two outputs from src/:
//   dist/kith.html  – the page published as a claude.ai artifact (the viewer wraps it in its own document)
//   index.html      – a standalone, installable copy (PWA) that keeps data in the browser
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const css = read('src/styles.css');
const markup = read('src/markup.html');
const js = read('src/app.js');

const fonts =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Figtree:wght@400..800&family=IBM+Plex+Mono:wght@400;500&display=swap">';

const artifact = `<title>Kith</title>\n${fonts}\n<style>\n${css}</style>\n${markup}<script>\n${js}</script>\n`;
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/kith.html'), artifact);

const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Your private map of the people you know and how they’re connected.">
<meta name="theme-color" content="#edf0f3" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0d1116" media="(prefers-color-scheme: dark)">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Kith">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<title>Kith</title>
${fonts}
<style>:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px);color-scheme:light}img{max-width:100%}[hidden]{display:none!important}</style>
<style>
${css}</style>
</head>
<body>
${markup}<script>
${js}</script>
<script>
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
</script>
</body>
</html>
`;
writeFileSync(join(root, 'index.html'), standalone);
console.log(`dist/kith.html ${(artifact.length / 1024).toFixed(1)} KB · index.html ${(standalone.length / 1024).toFixed(1)} KB`);
