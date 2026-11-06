'use strict';
/* Gera web/dist/demandas.html: a versão de navegador em um único arquivo,
   no formato de página do claude.ai (sem <html>/<head>/<body>). */
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const R = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const dataUri = (p) => `data:image/svg+xml;base64,${Buffer.from(R(p)).toString('base64')}`;

let css = R('src/renderer/styles.css');
css = css.replace(/@font-face\s*{[^}]*}\s*/g, '');
css = css.replace('url("assets/mark.svg")', `url("${dataUri('src/renderer/assets/mark.svg')}")`);
css = css.replace('url("assets/plus.svg")', `url("${dataUri('src/renderer/assets/plus.svg')}")`);
css = css.replace('url("assets/calendar.svg")', `url("${dataUri('src/renderer/assets/calendar.svg')}")`);
css = css.replace('--titlebar-controls: 150px;', '--titlebar-controls: 20px;');
css += `
/* ---------- versão web: telas estreitas ---------- */
@media (max-width: 560px) {
  .topbar { gap: 8px; padding-left: 12px; }
  .board { padding: 8px 12px 64px; }
  .rows { --cols: 28px minmax(0, 1fr) 76px; }
  .row { padding-right: 10px; }
  .row .r-seq, .row .r-due, .rows-head .h-seq, .rows-head .h-due { display: none; }
  .r-title { min-width: 0; }
  .rail-ticket { flex-basis: 210px; }
  .detail { left: 12px; width: auto; }
  .capture-preview { padding-left: 16px; }
  .auth-ticket { padding: 28px 20px 22px; }
}
`;

const html = R('src/renderer/index.html');
let body = html.slice(html.indexOf('<body>') + 6, html.indexOf('<script'));
body = body.replace('Tudo fica neste computador, cifrado com a sua senha.', 'Suas demandas são cifradas no navegador com a sua senha antes de serem salvas.');

const scripts = ['src/renderer/icons.js', 'src/renderer/parse.js', 'web/api-web.js', 'src/renderer/app.js']
  .map((p) => `<script>\n${R(p).replace(/<\/script/gi, '<\\/script')}\n</script>`).join('\n');

const out = `<title>Lumo</title>
<meta name="description" content="Anote as demandas do dia em segundos, com login e dados cifrados.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400..750&display=swap">
<style>
${css}
</style>
${body.trim()}
${scripts}
`;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'demandas.html'), out);
console.log(`web/dist/demandas.html: ${(out.length / 1024).toFixed(0)} KB`);
