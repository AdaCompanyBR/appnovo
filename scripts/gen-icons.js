const fs = require('fs');
const names = ['flame','inbox','hourglass','check-check','search','plus','lock','log-out','key-round','download','folder-open','x','trash-2','calendar','user','hash','circle','circle-check','play','pause','keyboard','copy','eye','eye-off','undo-2','triangle-alert','clock','settings','corner-down-left','life-buoy','refresh-cw','sun','list-todo','clock-3','circle-check-big','flag','check','folder','at-sign','circle-dashed','calendar-days','arrow-right','sparkles','moon','chevron-down','notebook-pen','file-text'];
const out = {};
for (const n of names) {
  const svg = fs.readFileSync(`node_modules/lucide-static/icons/${n}.svg`, 'utf8');
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s+/g, ' ').trim();
  out[n] = inner;
}
const body = `/* Ícones Lucide (ISC), gerados a partir de lucide-static. */\n(function (root) {\n  'use strict';\n  const PATHS = ${JSON.stringify(out, null, 2)};\n  function icon(name, size = 16) {\n    return '<svg class="icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (PATHS[name] || '') + '</svg>';\n  }\n  root.icon = icon;\n})(self);\n`;
fs.writeFileSync('src/renderer/icons.js', body);
console.log(Object.keys(out).filter(k=>!out[k]).length, 'missing');
