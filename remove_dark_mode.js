const fs = require('fs');
const path = require('path');

const cssPath = path.join('c:', 'Users', 'ramej', 'OneDrive', 'Escritorio', 'TEST', 'css', 'styles.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Regex to find blocks like: [data-theme="dark"] ... { ... }
// or [data-theme="dark"] selector { ... }
const regex = /\[data-theme="dark"\]\s*[^\{]*\{[^\}]*\}/g;

const initialLength = cssContent.length;
cssContent = cssContent.replace(regex, '');

// There might be some nested rules, but usually CSS is flat.
// Let's also remove any standalone data-theme dark entries
cssContent = cssContent.replace(/\[data-theme="dark"\][^\{]*\{(?:\s*[^{}]*\{[^{}]*\})*\s*[^{}]*\}/g, ''); // Handles one level of nesting if exists

fs.writeFileSync(cssPath, cssContent, 'utf8');

console.log(`Replaced. Length went from ${initialLength} to ${cssContent.length}`);
