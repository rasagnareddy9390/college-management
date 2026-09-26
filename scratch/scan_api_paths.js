import fs from 'fs';
import path from 'path';

const dir = './frontend/js';
fs.readdirSync(dir).forEach(file => {
  if (!file.endsWith('.js')) return;
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes("'/api/") || line.includes('"/api/')) {
      console.log(`${file}:${idx + 1}: ${line.trim()}`);
    }
  });
});

