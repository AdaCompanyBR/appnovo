/* Lumo — interface. Sem frameworks: estado simples + renderização por região. */
(function () {
  'use strict';

  const api = window.api;
  const { parseCapture, iso, addDays } = window.DemandParse;
  const icon = window.icon;
  const IS_WEB = api.platform === 'web';

  /* ---------- utilidades ---------- */

  const $ = (sel, root = document) => root.querySelector(sel);
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  const seqLabel = (n) => `#${n}`;
  const WEEK = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const PRIORITY_LABEL = { urgente: 'Urgente', alta: 'Alta', normal: 'Normal', baixa: 'Baixa' };
  const PRIORITY_RANK = { urgente: 0, alta: 1, normal: 2, baixa: 3 };
  const STATUS_LABEL = { todo: 'A fazer', doing: 'Fazendo', waiting: 'Aguardando', done: 'Feito' };

  function todayISO() { return iso(new Date()); }
  function parseISODate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
  function dayDiff(dueISO) {
    const a = parseISODate(todayISO());
    const b = parseISODate(dueISO);
    return Math.round((b - a) / 86400000);
  }

  function dueInfo(d) {
    if (!d.due) return null;
    const diff = dayDiff(d.due);
    const date = parseISODate(d.due);
    let label;
    if (diff === 0) label = 'Hoje';
    else if (diff === 1) label = 'Amanhã';
    else if (diff === -1) label = 'Ontem';
    else if (diff < -1) label = `${-diff} dias atrás`;
    else if (diff < 7) label = WEEK[date.getDay()];
    else label = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
    const open = d.status !== 'done';
    const tone = !open ? '' : diff < 0 ? 'fire' : diff === 0 ? 'heat' : '';
    return { diff, label, tone };
  }

  function age(fromISO) {
    const mins = Math.max(0, Math.round((Date.now() - new Date(fromISO).getTime()) / 60000));
    if (mins < 1) return { text: 'agora', mins };
    if (mins < 60) return { text: `${mins}min`, mins };
    const h = Math.floor(mins / 60);
    if (h < 24) return { text: `${h}h`, mins };
    const days = Math.floor(h / 24);
    if (days < 14) return { text: `${days}d`, mins };
    return { text: `${Math.floor(days / 7)}sem`, mins };
  }

  function fullDate(isoString) {
    const d = new Date(isoString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function stamp() {
    const d = new Date();
    return `${WEEK[d.getDay()].toUpperCase()} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function longToday() {
    const d = new Date();
    const names = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    return `${names[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  }

  async function call(promise) {
    const res = await promise;
    if (!res.ok) {
      const err = new Error(res.error.message);
      Object.assign(err, res.error);
      throw err;
    }
    return res.value;
  }

  /* ---------- estado ---------- */

  const state = {
    username: '',
    demands: [],
    view: 'hoje',
    project: null,
    requester: null,
    search: '',
    selectedId: null,
    order: [],
    undo: [],
    justCreated: null,
  };

  const byId = (id) => state.demands.find((d) => d.id === id);
  const isOpen = (d) => d.status !== 'done';

  function bucketToday(d) {
    if (!isOpen(d) || d.status === 'waiting') return null;
    if (d.status === 'doing') return 'rail';
    const due = d.due ? dayDiff(d.due) : null;
    if (due !== null && due < 0) return 'late';
    if (due === 0) return 'today';
    if (d.priority === 'urgente') return 'urgent';
    return null;
  }

  function sortOpen(a, b) {
    const ad = a.due ? dayDiff(a.due) : 9999;
    const bd = b.due ? dayDiff(b.due) : 9999;
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || ad - bd || a.seq - b.seq;
  }

  const inWs = (d) => (d.ws || state.legacyWs) === state.ws;
  function scoped(list) {
    return list.filter((d) => inWs(d) &&
      (!state.project || d.project.toLowerCase() === state.project.toLowerCase()) &&
      (!state.requester || d.requester.toLowerCase() === state.requester.toLowerCase()));
  }

  function counts() {
    const all = scoped(state.demands);
    let hoje = 0; let hot = false; let fila = 0; let wait = 0; let done = 0;
    for (const d of all) {
      const b = bucketToday(d);
      if (b) { hoje++; if (b === 'late') hot = true; }
      if (d.status === 'todo' || d.status === 'doing') fila++;
      if (d.status === 'waiting') wait++;
      if (d.status === 'done') done++;
    }
    return { hoje, hot, fila, wait, done };
  }

  /* ---------- telas de acesso ---------- */

  const authEl = $('#auth');
  const authBody = $('#auth-body');
  const workspaceEl = $('#workspace');

  function passwordField(id, label, opts = {}) {
    return `
      <div class="field">
        <label class="field-label" for="${id}">${label}</label>
        <div class="input-wrap">
          <input class="input" id="${id}" name="${id}" type="password" autocomplete="${opts.autocomplete || 'current-password'}" required ${opts.minlength ? `minlength="${opts.minlength}"` : ''}>
          <button type="button" class="reveal" data-reveal="${id}" aria-label="Mostrar senha" aria-pressed="false">${icon('eye')}</button>
        </div>
        ${opts.strength ? '<div class="strength" id="strength" data-level="0" aria-hidden="true"><span></span><span></span><span></span><span></span></div>' : ''}
        ${opts.hint ? `<span class="field-hint" id="${id}-hint">${opts.hint}</span>` : ''}
      </div>`;
  }

  function strengthLevel(p) {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p) || /\d/.test(p) && /[^\w]/.test(p)) s++;
    if (p.length >= 16 || (/\d/.test(p) && /[^\w\s]/.test(p) && p.length >= 10)) s++;
    return Math.max(1, Math.min(4, s));
  }

  function errorBox(msg) {
    return `<div class="form-error" role="alert">${icon('triangle-alert')}<span>${esc(msg)}</span></div>`;
  }

  function showAuth(html, focusSel) {
    workspaceEl.hidden = true;
    authEl.hidden = false;
    $('.auth-ticket').className = 'auth-ticket paper';
    $('.auth-head').innerHTML = `<span class="brand-mark" aria-hidden="true"></span><span class="brand-name">lumo</span><span class="stamp">${stamp()}</span>`;
    authBody.innerHTML = html;
    const f = focusSel && $(focusSel, authBody);
    if (f) f.focus();
  }

  function bindReveal(root) {
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-reveal]');
      if (!b) return;
      const input = document.getElementById(b.dataset.reveal);
      const isUser = input.classList.contains('masked') || input.classList.contains('unmasked');
      let show;
      if (isUser) {
        show = input.classList.contains('masked');
        input.classList.toggle('masked', !show);
        input.classList.toggle('unmasked', show);
      } else {
        show = input.type === 'password';
        input.type = show ? 'text' : 'password';
      }
      const what = isUser ? 'usuário' : 'senha';
      b.setAttribute('aria-pressed', String(show));
      b.setAttribute('aria-label', show ? `Ocultar ${what}` : `Mostrar ${what}`);
      input.focus();
      b.innerHTML = icon(show ? 'eye-off' : 'eye');
    });
  }
  bindReveal(authBody);

  function busy(button, on, label) {
    button.disabled = on;
    if (on) { button.dataset.label = button.innerHTML; button.innerHTML = `<span class="spinner" aria-hidden="true"></span>${label}`; }
    else if (button.dataset.label) button.innerHTML = button.dataset.label;
  }

  function wireStrength(inputId) {
    const input = document.getElementById(inputId);
    const meter = $('#strength');
    if (!input || !meter) return;
    input.addEventListener('input', () => { meter.dataset.level = String(strengthLevel(input.value)); });
  }

  function renderRegister(error) {
    showAuth(`
      <h1 id="auth-title">Crie seu acesso</h1>
      <p class="lede">Uma conta local para este computador. Suas demandas ficam cifradas com esta senha.</p>
      ${error ? errorBox(error) : ''}
      <form id="register-form" novalidate>
        <div class="field">
          <label class="field-label" for="r-user">Usuário</label>
          <div class="input-wrap"><input class="input masked" id="r-user" type="text" autocomplete="username" spellcheck="false" autocapitalize="off" autocorrect="off" required maxlength="32" placeholder="ex.: guilherme"><button type="button" class="reveal" data-reveal="r-user" aria-label="Mostrar usuário" aria-pressed="false">${icon('eye')}</button></div>
        </div>
        ${passwordField('r-pass', 'Senha', { autocomplete: 'new-password', strength: true, hint: 'Pelo menos 8 caracteres. Uma frase curta é mais forte e fácil de lembrar.' })}
        ${passwordField('r-pass2', 'Confirme a senha', { autocomplete: 'new-password' })}
        <div class="actions"><button class="btn btn-primary btn-block" type="submit">Criar conta</button></div>
      </form>`, '#r-user');
    wireStrength('r-pass');
    $('#register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = $('#r-user').value.trim();
      const pass = $('#r-pass').value;
      if (pass !== $('#r-pass2').value) return renderRegisterKeep('As senhas não conferem. Digite a mesma senha nos dois campos.', user);
      const btn = e.submitter || $('#register-form button[type=submit]');
      busy(btn, true, 'Criando…');
      try {
        const out = await call(api.auth.register(user, pass));
        state.username = out.username;
        renderRecoveryCode(out.recoveryCode, 'Conta criada', enterWorkspace);
      } catch (err) {
        renderRegisterKeep(err.message, user);
      }
    });
  }
  function renderRegisterKeep(msg, user) {
    renderRegister(msg);
    $('#r-user').value = user;
    $(user ? '#r-pass' : '#r-user').focus();
  }

  function renderRecoveryCode(code, title, next) {
    showAuth(`
      <h1 id="auth-title">${esc(title)}. Guarde seu código de recuperação</h1>
      <p class="lede">Se você esquecer a senha, só este código abre suas demandas. Ele não aparece de novo. Guarde num gerenciador de senhas ou anote.</p>
      <div class="recovery-code" id="code" aria-label="Código de recuperação">${esc(code)}</div>
      <button type="button" class="btn btn-ghost btn-block" id="copy-code">${icon('copy')}Copiar código</button>
      <label class="check"><input type="checkbox" id="saved-code"><span>Guardei o código em um lugar seguro.</span></label>
      <div class="actions"><button class="btn btn-primary btn-block" id="continue" disabled>Continuar</button></div>`, '#copy-code');
    $('#copy-code').addEventListener('click', async () => {
      if ((await api.app.copy(code)) === false) { selectText($('#code')); return; }
      $('#copy-code').innerHTML = `${icon('circle-check')}Copiado`;
    });
    $('#saved-code').addEventListener('change', (e) => { $('#continue').disabled = !e.target.checked; });
    $('#continue').addEventListener('click', next);
  }

  function renderLogin(username, error, notice) {
    showAuth(`
      <h1 id="auth-title">Bom te ver de novo</h1>
      <p class="lede">${notice ? esc(notice) : 'Entre para ver suas demandas.'}</p>
      ${error ? errorBox(error) : ''}
      <form id="login-form" novalidate>
        <div class="field">
          <label class="field-label" for="l-user">Usuário</label>
          <div class="input-wrap"><input class="input masked" id="l-user" type="text" autocomplete="username" spellcheck="false" autocapitalize="off" autocorrect="off" required value="${esc(username || '')}"><button type="button" class="reveal" data-reveal="l-user" aria-label="Mostrar usuário" aria-pressed="false">${icon('eye')}</button></div>
        </div>
        ${passwordField('l-pass', 'Senha')}
        <div class="actions">
          <button class="btn btn-primary btn-block" type="submit">Entrar</button>
          <button class="link" type="button" id="forgot">Esqueci minha senha</button>
        </div>
      </form>`, username ? '#l-pass' : '#l-user');
    $('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = $('#l-user').value.trim();
      const pass = $('#l-pass').value;
      if (!user || !pass) return renderLogin(user, 'Preencha usuário e senha.');
      const btn = $('#login-form button[type=submit]');
      busy(btn, true, 'Entrando…');
      try {
        const out = await call(api.auth.login(user, pass));
        state.username = out.username;
        enterWorkspace();
      } catch (err) {
        renderLogin(user, err.message);
        if (err.code === 'locked' && err.retryInSeconds) lockCountdown(err.retryInSeconds);
      }
    });
    $('#forgot').addEventListener('click', () => renderRecover($('#l-user').value.trim()));
  }

  function lockCountdown(seconds) {
    const btn = $('#login-form button[type=submit]');
    let left = seconds;
    btn.disabled = true;
    const tick = () => {
      if (!document.body.contains(btn)) return;
      if (left <= 0) { btn.disabled = false; btn.textContent = 'Entrar'; return; }
      btn.textContent = `Aguarde ${left} s`;
      left--;
      setTimeout(tick, 1000);
    };
    tick();
  }

  function renderRecover(username, error) {
    showAuth(`
      <h1 id="auth-title">Recuperar acesso</h1>
      <p class="lede">Use o código de recuperação que você guardou ao criar a conta e escolha uma nova senha.</p>
      ${error ? errorBox(error) : ''}
      <form id="recover-form" novalidate>
        <div class="field">
          <label class="field-label" for="c-user">Usuário</label>
          <div class="input-wrap"><input class="input masked" id="c-user" type="text" autocomplete="username" spellcheck="false" autocapitalize="off" autocorrect="off" required value="${esc(username || '')}"><button type="button" class="reveal" data-reveal="c-user" aria-label="Mostrar usuário" aria-pressed="false">${icon('eye')}</button></div>
        </div>
        <div class="field">
          <label class="field-label" for="c-code">Código de recuperação</label>
          <input class="input num" id="c-code" type="text" autocomplete="off" spellcheck="false" required placeholder="XXXX-XXXX-XXXX-XXXX-XXXX">
        </div>
        ${passwordField('c-pass', 'Nova senha', { autocomplete: 'new-password', strength: true })}
        ${passwordField('c-pass2', 'Confirme a nova senha', { autocomplete: 'new-password' })}
        <div class="actions">
          <button class="btn btn-primary btn-block" type="submit">Redefinir senha</button>
          <button class="link" type="button" id="back">Voltar para o login</button>
        </div>
      </form>`, username ? '#c-code' : '#c-user');
    wireStrength('c-pass');
    $('#back').addEventListener('click', () => renderLogin($('#c-user').value.trim()));
    $('#recover-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = $('#c-user').value.trim();
      const code = $('#c-code').value;
      const pass = $('#c-pass').value;
      if (pass !== $('#c-pass2').value) { renderRecover(user, 'As senhas não conferem.'); $('#c-code').value = code; return; }
      const btn = $('#recover-form button[type=submit]');
      busy(btn, true, 'Verificando…');
      try {
        const out = await call(api.auth.recover(user, code, pass));
        state.username = out.username;
        renderRecoveryCode(out.recoveryCode, 'Senha redefinida', enterWorkspace);
      } catch (err) {
        renderRecover(user, err.message);
        $('#c-code').value = code;
      }
    });
  }

  /* ---------- área de trabalho ---------- */

  const viewsEl = $('#views');
  const projectsEl = $('#projects');
  const boardEl = $('#board');
  const detailEl = $('#detail');
  const captureForm = $('#capture');
  const captureInput = $('#capture-input');
  const previewEl = $('#capture-preview');
  const searchInput = $('#search-input');
  const accountBtn = $('#account-btn');
  const accountMenu = $('#account-menu');
  $('#search-icon').innerHTML = icon('search');

  async function enterWorkspace() {
    authEl.hidden = true;
    workspaceEl.hidden = false;
    boardEl.innerHTML = '<div class="skeleton" aria-label="Carregando"><div></div><div></div><div></div><div></div></div>';
    state.view = 'hoje';
    state.selectedId = null;
    state.project = state.requester = null;
    state.search = '';
    searchInput.value = '';
    accountBtn.innerHTML = `<span class="avatar" aria-hidden="true">${esc(state.username.slice(0, 1))}</span><span class="name">${esc(state.username)}</span>${icon('settings')}`;
    accountBtn.setAttribute('aria-label', `Conta ${state.username}`);
    try {
      state.demands = await call(api.demands.list());
    } catch (err) {
      toast(err.message, { error: true });
      state.demands = [];
    }
    try { state.notes = await call(api.notes.list()); } catch { state.notes = []; }
    // Remove imagens que nenhum bloco usa mais (em segundo plano).
    const usedImages = state.notes.flatMap((n) => (n.doc || []).filter((op) => op.insert && op.insert.lumoimg).map((op) => op.insert.lumoimg.id));
    api.images.collect(usedImages).catch(() => {});
    state.noteId = null;
    await loadWorkspaces();
    renderAll();
    captureInput.focus();
  }

  /* ---------- empresas ---------- */

  const wsBtn = $('#ws-btn');
  const wsMenu = $('#ws-menu');
  let settings = {};

  async function loadWorkspaces() {
    try { settings = await call(api.settings.get()) || {}; } catch { settings = {}; }
    if (!Array.isArray(settings.workspaces) || !settings.workspaces.length) {
      // Primeira vez: as demandas que já existem pertencem à Comexport.
      settings = { ...settings, workspaces: [{ id: 'comexport', name: 'Comexport' }], current: 'comexport', legacyWs: 'comexport' };
      try { await call(api.settings.set(settings)); } catch { /* tenta de novo na próxima mudança */ }
    }
    state.legacyWs = settings.legacyWs || settings.workspaces[0].id;
    state.ws = settings.workspaces.some((w) => w.id === settings.current) ? settings.current : settings.workspaces[0].id;
    renderWsButton();
  }

  const currentWs = () => (settings.workspaces || []).find((w) => w.id === state.ws) || { name: '' };

  function renderWsButton() {
    const name = currentWs().name;
    wsBtn.innerHTML = `<span class="ws-name">${esc(name)}</span>${icon('chevron-down', 14)}`;
    wsBtn.setAttribute('aria-label', `Empresa: ${name}. Trocar ou criar empresa`);
    wsBtn.title = name;
  }

  function wsOpenCount(id) {
    return state.demands.filter((d) => (d.ws || state.legacyWs) === id && isOpen(d)).length;
  }

  function openWsMenu(creating = false, error = '') {
    const list = settings.workspaces || [];
    wsMenu.innerHTML = `
      <div class="menu-meta">Empresas</div>
      ${list.map((w) => `<button type="button" role="menuitemradio" aria-checked="${w.id === state.ws}" data-ws="${esc(w.id)}">
<span class="ws-item-name">${esc(w.name)}</span>
        <span class="ws-count num">${wsOpenCount(w.id) || ''}</span>${w.id === state.ws ? icon('check', 14) : '<span class="ws-check-space"></span>'}</button>`).join('')}
      <hr>
      ${creating
        ? `<form class="ws-new" id="ws-new" novalidate><input class="input" id="ws-new-name" maxlength="40" placeholder="Nome da empresa" autocomplete="off" aria-label="Nome da nova empresa">
            <button type="submit" class="btn btn-primary">Criar</button></form>${error ? `<div class="ws-error">${esc(error)}</div>` : ''}`
        : `<button type="button" role="menuitem" data-ws-new>${icon('plus')}Nova empresa</button>`}`;
    wsMenu.hidden = false;
    wsBtn.setAttribute('aria-expanded', 'true');
    const f = creating ? $('#ws-new-name') : wsMenu.querySelector('button');
    if (f) f.focus();
  }
  function closeWsMenu() { wsMenu.hidden = true; wsBtn.setAttribute('aria-expanded', 'false'); }

  wsBtn.addEventListener('click', (e) => { e.stopPropagation(); if (wsMenu.hidden) openWsMenu(); else closeWsMenu(); });
  document.addEventListener('click', (e) => { if (!wsMenu.hidden && !e.target.closest('#ws-menu') && !e.target.closest('#ws-btn')) closeWsMenu(); });
  wsMenu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeWsMenu(); wsBtn.focus(); e.stopPropagation(); return; }
    if (e.target.id === 'ws-new-name') return;
    const items = [...wsMenu.querySelectorAll('button')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });
  wsMenu.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (e.target.closest('[data-ws-new]')) { openWsMenu(true); return; }
    const b = e.target.closest('[data-ws]');
    if (!b) return;
    closeWsMenu();
    await switchWs(b.dataset.ws);
  });
  wsMenu.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#ws-new-name').value.trim().replace(/\s+/g, ' ');
    if (!name) { openWsMenu(true, 'Escreva o nome da empresa.'); return; }
    if ((settings.workspaces || []).some((w) => w.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))) {
      openWsMenu(true, 'Já existe uma empresa com esse nome.');
      $('#ws-new-name').value = name;
      return;
    }
    const id = `ws-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const next = { ...settings, workspaces: [...settings.workspaces, { id, name }], current: id };
    try {
      settings = await call(api.settings.set(next));
    } catch (err) { openWsMenu(true, err.message); return; }
    closeWsMenu();
    await switchWs(id, true);
    toast(`Empresa ${name} criada. As novas demandas vão para ela.`);
  });

  async function switchWs(id, saved = false) {
    if (id === state.ws && !saved) return;
    state.ws = id;
    state.selectedId = null;
    state.noteId = null;
    state.project = state.requester = null;
    state.search = '';
    searchInput.value = '';
    if (!saved) {
      settings = { ...settings, current: id };
      try { settings = await call(api.settings.set(settings)); } catch { /* troca vale nesta sessão */ }
    }
    renderWsButton();
    renderAll();
    captureInput.focus();
  }

  function renderAll() {
    renderSidebar();
    renderBoard();
    renderDetail();
  }

  const VIEWS = [
    { id: 'hoje', label: 'Hoje', icon: 'sun', key: '1' },
    { id: 'fila', label: 'Fila', icon: 'list-todo', key: '2' },
    { id: 'aguardando', label: 'Aguardando', icon: 'clock-3', key: '3' },
    { id: 'feitas', label: 'Feitas', icon: 'circle-check-big', key: '4' },
  ];

  function renderSidebar() {
    const c = counts();
    const n = { hoje: c.hoje, fila: c.fila, aguardando: c.wait, feitas: c.done };
    viewsEl.innerHTML = VIEWS.map((v) => `
      <button type="button" class="view" data-view="${v.id}" ${state.view === v.id && !state.search && !state.noteId ? 'aria-current="page"' : ''} title="${v.label} (Ctrl+${v.key})">
        ${icon(v.icon, 17)}<span>${v.label}</span>
        <span class="count num ${v.id === 'hoje' && c.hot ? 'hot' : ''}">${n[v.id] || ''}</span>
        <span class="share ${v.id === 'hoje' && c.hot ? 'hot' : ''}" aria-hidden="true"></span>
      </button>`).join('');
    // Barra fina proporcional: a fatia de cada visão no total de demandas.
    const total = Math.max(1, scoped(state.demands).length);
    for (const el of viewsEl.querySelectorAll('[data-view]')) {
      el.querySelector('.share').style.setProperty('--share', String((n[el.dataset.view] || 0) / total));
    }

    viewsEl.insertAdjacentHTML('beforeend', `
      <button type="button" class="view view-projects" id="notes-btn" aria-haspopup="menu" aria-expanded="false" title="Blocos de notas">
        ${icon('notebook-pen', 17)}<span>Blocos de notas</span><span class="count num">${wsNotes().length || ''}</span>
      </button>`);
    renderNotesList();
  }

  /* ---------- blocos de notas ---------- */

  const wsNotes = () => (state.notes || [])
    .filter((n) => (n.ws || state.legacyWs) === state.ws)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const noteTitle = (n) => n.title || 'Sem título';

  function renderNotesList() {
    const list = wsNotes();
    projectsEl.innerHTML = `
      <div class="side-title"><span>Blocos de notas</span><button type="button" class="side-add" data-note-new title="Novo bloco de notas" aria-label="Novo bloco de notas">${icon('plus', 15)}</button></div>
      ${list.length ? list.map((n) => `
        <button type="button" class="tag-filter note-link" data-note="${esc(n.id)}" ${state.noteId === n.id ? 'aria-current="page"' : ''}>
          ${icon('file-text', 15)}<span>${esc(noteTitle(n))}</span><span></span>
        </button>`).join('') : `<button type="button" class="side-empty-btn" data-note-new>${icon('plus', 14)}Criar um bloco de notas</button>`}`;
  }

  projectsEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-note-new]')) { createNote(); return; }
    const b = e.target.closest('[data-note]');
    if (b) openNote(b.dataset.note);
  });

  async function createNote() {
    try {
      const n = await call(api.notes.create({ title: '', body: '', ws: state.ws }));
      state.notes = [...(state.notes || []), n];
      openNote(n.id, true);
    } catch (err) { toast(err.message, { error: true }); }
  }

  function openNote(id, focusTitle = false) {
    state.noteId = id;
    state.selectedId = null;
    state.search = '';
    searchInput.value = '';
    closeNotesPop();
    renderAll();
    boardEl.scrollTop = 0;
    if (focusTitle) { const t = $('#note-title'); if (t) t.focus(); }
    else if (noteQuill) noteQuill.focus();
  }

  function renderNote() {
    const n = (state.notes || []).find((x) => x.id === state.noteId);
    if (!n) { state.noteId = null; return false; }
    boardEl.innerHTML = `
      <div class="note-view">
        <div class="note-head">
          <label class="visually-hidden" for="note-title">Título do bloco</label>
          <input class="note-title" id="note-title" maxlength="200" placeholder="Sem título" value="${esc(n.title)}" autocomplete="off">
          <span class="saved" id="note-saved" aria-live="polite"></span>
          <button type="button" class="icon-btn danger" data-note-act="delete" title="Excluir bloco" aria-label="Excluir bloco de notas">${icon('trash-2')}</button>
        </div>
        <p class="note-meta">Criado em ${fullDate(n.createdAt)} · editado ${age(n.updatedAt).text === 'agora' ? 'agora' : `há ${age(n.updatedAt).text}`}</p>
        <div class="note-editor"><div id="note-body" aria-label="Conteúdo do bloco"></div></div>
      </div>`;
    mountEditor(n);
    state.order = [];
    return true;
  }

  /* --- editor de texto (Quill) --- */

  let noteQuill = null;
  const NOTE_FONTS = ['sans', 'serif', 'mono', 'arial', 'georgia', 'times', 'courier', 'verdana', 'trebuchet'];
  const NOTE_SIZES = ['12px', '14px', '16px', '18px', '22px', '28px', '36px'];
  let quillReady = false;

  function setupQuill() {
    if (quillReady || !window.Quill) return Boolean(window.Quill);
    const Font = window.Quill.import('attributors/class/font');
    Font.whitelist = NOTE_FONTS;
    window.Quill.register(Font, true);
    const Size = window.Quill.import('attributors/style/size');
    Size.whitelist = NOTE_SIZES;
    window.Quill.register(Size, true);
    // Imagem do Lumo: o conteúdo guarda só o id; os bytes ficam cifrados à parte.
    const BaseImage = window.Quill.import('formats/image');
    class LumoImage extends BaseImage {
      static create(value) {
        const node = super.create(BLANK_IMG);
        node.setAttribute('alt', 'Imagem');
        node.dataset.id = value && value.id ? value.id : '';
        node.classList.add('lumo-img', 'loading');
        if (node.dataset.id) loadImageInto(node, node.dataset.id);
        return node;
      }
      static value(node) { return { id: node.dataset.id }; }
      static formats() { return {}; }
    }
    LumoImage.blotName = 'lumoimg';
    LumoImage.className = 'lumo-img';
    window.Quill.register(LumoImage, true);
    quillReady = true;
    return true;
  }

  const BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const imageUrls = new Map();
  async function loadImageInto(node, id) {
    try {
      if (!imageUrls.has(id)) imageUrls.set(id, await call(api.images.get(id)));
      node.src = imageUrls.get(id);
      node.classList.remove('loading');
    } catch {
      node.classList.remove('loading');
      node.classList.add('missing');
      node.setAttribute('alt', 'Imagem indisponível');
    }
  }

  // Reduz para no máximo 1600 px e converte para WebP, para não pesar no armazenamento.
  async function shrinkImage(file) {
    if (file.type === 'image/gif') return readAsDataUrl(file); // mantém a animação
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close && bitmap.close();
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.86));
    return readAsDataUrl(blob && blob.size < file.size ? blob : file);
  }

  function readAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }

  async function insertImages(q, files, index) {
    const images = [...files].filter((f) => /^image\/(png|jpeg|webp|gif)$/.test(f.type));
    if (!images.length) return false;
    let at = typeof index === 'number' ? index : (q.getSelection(true) || { index: q.getLength() }).index;
    for (const file of images) {
      try {
        const dataUrl = await shrinkImage(file);
        const { id } = await call(api.images.put(dataUrl));
        imageUrls.set(id, dataUrl);
        q.insertEmbed(at, 'lumoimg', { id }, 'user');
        q.insertText(at + 1, '\n', 'user');
        at += 2;
        q.setSelection(at, 0, 'silent');
      } catch (err) {
        toast(err.message || 'Não foi possível colar a imagem.', { error: true });
      }
    }
    return true;
  }

  const TOOL_TITLES = {
    'ql-bold': 'Negrito (Ctrl+B)', 'ql-italic': 'Itálico (Ctrl+I)', 'ql-underline': 'Sublinhado (Ctrl+U)', 'ql-strike': 'Riscado',
    'ql-color': 'Cor do texto', 'ql-background': 'Marca-texto', 'ql-font': 'Fonte', 'ql-size': 'Tamanho', 'ql-header': 'Estilo do parágrafo',
    'ql-blockquote': 'Citação', 'ql-code-block': 'Bloco de código', 'ql-link': 'Link (Ctrl+K)', 'ql-clean': 'Limpar formatação', 'ql-align': 'Alinhamento',
  };

  function mountEditor(n) {
    noteQuill = null;
    const host = $('#note-body');
    if (!host) return;
    if (!setupQuill()) {
      host.innerHTML = '<p class="note-fallback">O editor não carregou. Verifique a conexão e recarregue a página.</p>';
      return;
    }
    const q = new window.Quill(host, {
      theme: 'snow',
      placeholder: 'Escreva aqui. Tudo é salvo sozinho enquanto você digita.',
      formats: ['font', 'size', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'header', 'list', 'indent', 'align', 'blockquote', 'code-block', 'link', 'script', 'lumoimg'],
      modules: {
        toolbar: [
          [{ font: [false, ...NOTE_FONTS.slice(1)] }, { size: [false, ...NOTE_SIZES.filter((x) => x !== '16px')] }],
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'bullet' }, { list: 'ordered' }, { list: 'check' }],
          [{ indent: '-1' }, { indent: '+1' }, { align: [] }],
          ['blockquote', 'code-block', 'link'],
          [{ script: 'sub' }, { script: 'super' }],
          ['clean'],
        ],
        clipboard: { matchVisual: false },
        // Arrastar arquivos de imagem para o bloco.
        uploader: { mimetypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], handler(range, files) { insertImages(this.quill, files, range && range.index); } },
        history: { delay: 800, maxStack: 200, userOnly: true },
      },
    });
    if (Array.isArray(n.doc) && n.doc.length) q.setContents({ ops: n.doc }, 'silent');
    else if (n.body) q.setText(n.body, 'silent');
    q.history.clear();
    // Dicas em português nos botões da barra.
    const toolbar = q.getModule('toolbar').container;
    toolbar.setAttribute('aria-label', 'Formatação do texto');
    for (const el of toolbar.querySelectorAll('button, .ql-picker')) {
      const cls = [...el.classList].find((c) => TOOL_TITLES[c]);
      let title = cls ? TOOL_TITLES[cls] : '';
      if (el.classList.contains('ql-list')) title = { bullet: 'Lista com marcadores', ordered: 'Lista numerada', check: 'Lista de tarefas' }[el.value] || 'Lista';
      if (el.classList.contains('ql-indent')) title = el.value === '+1' ? 'Aumentar recuo' : 'Diminuir recuo';
      if (el.classList.contains('ql-script')) title = el.value === 'super' ? 'Sobrescrito' : 'Subscrito';
      if (title) { el.title = title; if (el.tagName === 'BUTTON') el.setAttribute('aria-label', title); }
    }
    const linkInput = host.parentElement.querySelector('.ql-tooltip input[type=text]');
    if (linkInput) linkInput.dataset.link = 'https://…';
    q.on('text-change', (_d, _o, source) => {
      if (source !== 'user') return;
      clearTimeout(noteTimer);
      noteTimer = setTimeout(saveNote, 700);
    });
    q.root.addEventListener('blur', () => saveNote());
    // Ctrl+V com imagem copiada (print, imagem de outro app ou do navegador).
    q.root.addEventListener('paste', (e) => {
      const files = [...((e.clipboardData && e.clipboardData.files) || [])].filter((f) => f.type.startsWith('image/'));
      if (!files.length) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      insertImages(q, files);
    }, true);
    noteQuill = q;
  }

  let noteTimer = null;
  async function saveNote() {
    clearTimeout(noteTimer);
    const n = (state.notes || []).find((x) => x.id === state.noteId);
    const t = $('#note-title');
    if (!n || !t) return;
    const patch = { title: t.value.trim() };
    if (noteQuill) {
      patch.doc = noteQuill.getContents().ops;
      patch.body = noteQuill.getText().replace(/\n$/, '');
    }
    const docChanged = Boolean(noteQuill) && JSON.stringify(patch.doc) !== JSON.stringify(n.doc || null)
      && !(!n.doc && patch.body === n.body && noteQuill.getContents().ops.every((op) => !op.attributes));
    if (patch.title === n.title && !docChanged) return;
    try {
      const saved = await call(api.notes.update(n.id, patch));
      state.notes = state.notes.map((x) => (x.id === saved.id ? saved : x));
      // Atualiza só o nome na lista, sem redesenhar a barra (um clique em andamento não se perde).
      const label = projectsEl.querySelector(`.note-link[data-note="${CSS.escape(saved.id)}"] span:nth-child(2)`);
      if (label) label.textContent = noteTitle(saved);
      const s = $('#note-saved');
      if (s) { s.textContent = 'salvo'; clearTimeout(saveNote.t); saveNote.t = setTimeout(() => { if ($('#note-saved')) $('#note-saved').textContent = ''; }, 1400); }
    } catch (err) { toast(err.message, { error: true }); }
  }

  boardEl.addEventListener('input', (e) => {
    if (e.target.id !== 'note-title') return;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(saveNote, 600);
  });
  boardEl.addEventListener('focusout', (e) => {
    if (e.target.id === 'note-title') saveNote();
  });
  boardEl.addEventListener('keydown', (e) => {
    if (e.target.id === 'note-title' && e.key === 'Enter') { e.preventDefault(); if (noteQuill) noteQuill.focus(); }
  });
  boardEl.addEventListener('click', (e) => {
    if (!e.target.closest('[data-note-act="delete"]')) return;
    const n = (state.notes || []).find((x) => x.id === state.noteId);
    if (!n) return;
    openSheet(`
      <h2>Excluir bloco de notas?</h2>
      <p class="lede">“${esc(noteTitle(n))}” será apagado. Essa ação não pode ser desfeita.</p>
      <div class="actions"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="button" class="btn btn-danger" id="note-del-ok">${icon('trash-2', 15)}Excluir</button></div>`, '#note-del-ok');
    $('#note-del-ok').addEventListener('click', async () => {
      try {
        await call(api.notes.remove(n.id));
        for (const op of n.doc || []) if (op.insert && op.insert.lumoimg) api.images.remove(op.insert.lumoimg.id);
        state.notes = state.notes.filter((x) => x.id !== n.id);
        sheet.close();
        state.noteId = null;
        renderAll();
        toast('Bloco de notas excluído.');
      } catch (err) { toast(err.message, { error: true }); }
    });
  });

  // Janela estreita: os blocos ficam num menu no ícone de caderno.
  const notesPop = document.createElement('div');
  notesPop.className = 'menu projects-pop';
  notesPop.setAttribute('role', 'menu');
  notesPop.hidden = true;
  $('.sidebar').appendChild(notesPop);
  function closeNotesPop() { notesPop.hidden = true; const b = $('#notes-btn'); if (b) b.setAttribute('aria-expanded', 'false'); }
  viewsEl.addEventListener('click', (e) => {
    const b = e.target.closest('#notes-btn');
    if (!b) return;
    e.stopPropagation();
    if (!notesPop.hidden) { closeNotesPop(); return; }
    const list = wsNotes();
    notesPop.innerHTML = `<div class="menu-meta">Blocos de notas</div>
      ${list.map((n) => `<button type="button" role="menuitem" data-note="${esc(n.id)}">${icon('file-text')}<span class="ws-item-name">${esc(noteTitle(n))}</span></button>`).join('')}
      ${list.length ? '<hr>' : ''}<button type="button" role="menuitem" data-note-new>${icon('plus')}Novo bloco de notas</button>`;
    notesPop.style.top = `${b.getBoundingClientRect().top}px`;
    notesPop.hidden = false;
    b.setAttribute('aria-expanded', 'true');
  });
  notesPop.addEventListener('click', (e) => {
    if (e.target.closest('[data-note-new]')) { closeNotesPop(); createNote(); return; }
    const b = e.target.closest('[data-note]');
    if (b) openNote(b.dataset.note);
  });
  document.addEventListener('click', (e) => { if (!notesPop.hidden && !e.target.closest('.projects-pop')) closeNotesPop(); });
  notesPop.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeNotesPop(); e.stopPropagation(); } });

  viewsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-view]');
    if (b) setView(b.dataset.view);
  });

  function setView(view) {
    state.view = view;
    state.noteId = null;
    state.search = '';
    searchInput.value = '';
    renderSidebar();
    renderBoard();
    boardEl.scrollTop = 0;
  }

  /* --- montagem dos grupos de cada visão --- */

  function buildGroups() {
    const list = scoped(state.demands);
    if (state.search) {
      const q = state.search.toLowerCase();
      const hits = list.filter((d) => [d.title, d.notes, d.project, d.requester, seqLabel(d.seq)].some((f) => f && f.toLowerCase().includes(q)));
      hits.sort((a, b) => (isOpen(b) - isOpen(a)) || sortOpen(a, b));
      return { title: 'Busca', rail: null, groups: [{ id: 'search', title: `Resultados para “${state.search}”`, items: hits }] };
    }
    if (state.view === 'hoje') {
      const rail = []; const late = []; const today = []; const urgent = [];
      for (const d of list) {
        const b = bucketToday(d);
        if (b === 'rail') rail.push(d);
        else if (b === 'late') late.push(d);
        else if (b === 'today') today.push(d);
        else if (b === 'urgent') urgent.push(d);
      }
      rail.sort(sortOpen); late.sort(sortOpen); today.sort(sortOpen); urgent.sort(sortOpen);
      // Próximas da fila: o que não é urgente também aparece, até 5 por vez.
      const todo = list.filter((d) => d.status === 'todo' && !bucketToday(d)).sort(sortOpen);
      const next = todo.slice(0, 5);
      const hasHot = late.length + today.length + urgent.length > 0;
      // Concluídas hoje: o que você já terminou no dia.
      const t0 = parseISODate(todayISO()).getTime();
      const doneToday = list
        .filter((d) => d.status === 'done' && new Date(d.doneAt || d.updatedAt).getTime() >= t0)
        .sort((a, b) => new Date(b.doneAt || b.updatedAt) - new Date(a.doneAt || a.updatedAt));
      return {
        title: 'Hoje',
        rail,
        rest: todo.length - next.length,
        groups: [
          { id: 'late', title: 'Atrasadas', tone: 'fire', items: late },
          { id: 'today', title: 'Vencem hoje', tone: 'heat', items: today },
          { id: 'urgent', title: 'Urgentes', tone: 'fire', items: urgent },
          { id: 'next', title: hasHot ? 'Próximas' : 'A fazer', items: next, more: todo.length - next.length },
          { id: 'done', title: 'Concluídas hoje', tone: 'done', items: doneToday },
        ].filter((g) => g.items.length),
      };
    }
    if (state.view === 'fila') {
      const open = list.filter((d) => d.status === 'todo' || d.status === 'doing').sort(sortOpen);
      const g = { late: [], week: [], later: [], none: [] };
      for (const d of open) {
        if (!d.due) g.none.push(d);
        else { const x = dayDiff(d.due); if (x < 0) g.late.push(d); else if (x < 7) g.week.push(d); else g.later.push(d); }
      }
      return {
        title: 'Fila',
        groups: [
          { id: 'late', title: 'Atrasadas', tone: 'fire', items: g.late },
          { id: 'week', title: 'Próximos 7 dias', items: g.week },
          { id: 'later', title: 'Mais adiante', items: g.later },
          { id: 'none', title: 'Sem prazo', items: g.none },
        ].filter((x) => x.items.length),
      };
    }
    if (state.view === 'aguardando') {
      const items = list.filter((d) => d.status === 'waiting').sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
      return { title: 'Aguardando', groups: items.length ? [{ id: 'wait', title: 'Esperando resposta de alguém', items, hint: 'mais antigas primeiro' }] : [] };
    }
    const done = list.filter((d) => d.status === 'done').sort((a, b) => new Date(b.doneAt || b.updatedAt) - new Date(a.doneAt || a.updatedAt));
    const t0 = parseISODate(todayISO()).getTime();
    const buckets = { today: [], yesterday: [], week: [], older: [] };
    for (const d of done) {
      const t = new Date(d.doneAt || d.updatedAt).getTime();
      if (t >= t0) buckets.today.push(d);
      else if (t >= t0 - 86400000) buckets.yesterday.push(d);
      else if (t >= t0 - 6 * 86400000) buckets.week.push(d);
      else buckets.older.push(d);
    }
    return {
      title: 'Feitas',
      groups: [
        { id: 'today', title: 'Hoje', items: buckets.today },
        { id: 'yesterday', title: 'Ontem', items: buckets.yesterday },
        { id: 'week', title: 'Nesta semana', items: buckets.week },
        { id: 'older', title: 'Antes', items: buckets.older },
      ].filter((x) => x.items.length),
    };
  }

  function tagsHtml(d, { status = true } = {}) {
    const out = [];
    if (status && d.status === 'waiting') out.push(`<span class="tag wait">${icon('hourglass', 12)}Aguardando</span>`);
    if (status && d.status === 'doing') out.push(`<span class="tag">${icon('play', 12)}Fazendo</span>`);
    if (d.requester) out.push(`<span class="tag" data-k="requester" title="Quem pediu">${icon('user', 12)}${esc(d.requester)}</span>`);
    if (d.project) out.push(`<span class="tag" data-k="project" title="Projeto">${icon('hash', 12)}${esc(d.project)}</span>`);
    return out.join('');
  }

  function statusTag(d) {
    return d.status === 'waiting'
      ? `<span class="tag wait">${icon('hourglass', 12)}Aguardando</span>`
      : `<span class="tag">${icon('play', 12)}Fazendo</span>`;
  }

  function rowsHeadHtml(group) {
    const doneList = group.id === 'done' || state.view === 'feitas';
    const ageLabel = state.search ? 'Há' : doneList ? 'Concluída há' : 'Criada há';
    return `<div class="rows-head" aria-hidden="true"><span></span><span class="h-seq">Nº</span><span>Demanda</span><span class="h-tags">Quem pediu · Projeto</span><span class="h-due">Prazo</span><span class="h-age">${ageLabel}</span></div>`;
  }

  function dueHtml(d) {
    const info = dueInfo(d);
    if (!info) return '';
    return `<span class="tag ${info.tone}" title="Prazo: ${esc(d.due.split('-').reverse().join('/'))}">${icon('calendar', 12)}${esc(info.label)}</span>`;
  }

  function ageHtml(d) {
    if (!isOpen(d)) return `<span class="r-age num" title="Concluída em ${fullDate(d.doneAt || d.updatedAt)}">${age(d.doneAt || d.updatedAt).text}</span>`;
    const a = age(d.createdAt);
    const cls = a.mins >= 7 * 1440 ? 'stale' : '';
    return `<span class="r-age num ${cls}" title="Chegou em ${fullDate(d.createdAt)}">${a.text}</span>`;
  }

  function rowHtml(d) {
    const done = d.status === 'done';
    return `
      <div class="row paper ${done ? 'is-done' : ''} ${state.justCreated === d.id ? 'printing' : ''}" role="option" data-id="${d.id}" data-p="${d.priority}" aria-selected="${state.selectedId === d.id}">
        <button type="button" class="tick" role="checkbox" aria-checked="${done}" data-act="toggle" aria-label="${done ? 'Reabrir' : 'Concluir'} demanda ${seqLabel(d.seq)}">${icon('check', 12)}</button>
        <span class="r-seq"><span class="pri" data-p="${d.priority}" title="Prioridade ${PRIORITY_LABEL[d.priority]}"></span>${seqLabel(d.seq)}</span>
        <span class="r-main"><span class="r-title">${esc(d.title)}</span>${state.view !== 'aguardando' && (d.status === 'doing' || d.status === 'waiting') ? statusTag(d) : ''}</span>
        <span class="r-tags">${tagsHtml(d, { status: false })}</span>
        <span class="r-due">${dueHtml(d)}</span>
        ${ageHtml(d)}
      </div>`;
  }

  function railTicketHtml(d) {
    const a = age(d.createdAt);
    return `
      <div class="rail-ticket paper ${state.justCreated === d.id ? 'printing' : ''}" role="option" data-id="${d.id}" data-p="${d.priority}" aria-selected="${state.selectedId === d.id}">
        <div class="t-head"><span class="seq">${seqLabel(d.seq)}</span><span title="Chegou em ${fullDate(d.createdAt)}">${a.text}</span></div>
        <div class="t-title">${esc(d.title)}</div>
        <div class="t-meta">${d.priority !== 'normal' ? `<span class="tag ${d.priority === 'urgente' ? 'fire' : d.priority === 'alta' ? 'heat' : ''}">${PRIORITY_LABEL[d.priority]}</span>` : ''}${dueHtml(d)}${tagsHtml(d, { status: false })}</div>
        <div class="t-actions">
          <button type="button" class="btn btn-primary" data-act="toggle">${icon('check-check', 14)}Concluir</button>
          <button type="button" class="btn btn-ghost" data-act="pause" title="Voltar para a fila (F)">${icon('pause', 14)}</button>
        </div>
      </div>`;
  }

  function filtersHtml() {
    const chips = [];
    if (state.project) chips.push(`<span class="chip-filter">#${esc(state.project)}<button type="button" data-clear="project" aria-label="Remover filtro de projeto">${icon('x', 12)}</button></span>`);
    if (state.requester) chips.push(`<span class="chip-filter">@${esc(state.requester)}<button type="button" data-clear="requester" aria-label="Remover filtro de pessoa">${icon('x', 12)}</button></span>`);
    return chips.length ? `<div class="filters">${chips.join('')}</div>` : '';
  }

  function emptyHtml(view) {
    const ticket = `<div class="empty-ticket" aria-hidden="true">${icon(state.search ? 'search' : (VIEWS.find((v) => v.id === view) || VIEWS[0]).icon, 26)}</div>`;
    if (state.search) return `<div class="empty">${ticket}<h2>Nada encontrado</h2><p>Nenhuma demanda tem “${esc(state.search)}” no título, notas, projeto ou pessoa.</p></div>`;
    if (!state.demands.length) {
      return `<div class="empty">${ticket}<h2>Sua primeira demanda leva cinco segundos</h2>
        <p>Escreva no campo acima e aperte Enter. Detalhes são opcionais e vão na mesma linha:</p>
        <div class="example paper">Subir hotfix do login <b>!urgente</b><br><b>@carla</b> <b>#portal</b> <b>hoje</b></div>
        ${IS_WEB ? '<p class="empty-shortcut">Com a página aberta, aperte <kbd>N</kbd> para anotar.</p>' : '<p class="empty-shortcut">De qualquer lugar do Windows: <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>Espaço</kbd></p>'}</div>`;
    }
    const msgs = {
      hoje: ['Tudo em dia por hoje', 'Sem atrasadas, sem prazos para hoje e sem urgências. Puxe algo da fila quando quiser.'],
      fila: ['Fila vazia', 'Tudo o que você anotou já foi concluído ou está aguardando alguém.'],
      aguardando: ['Ninguém te devendo resposta', 'Marque uma demanda como Aguardando (tecla W) quando depender de outra pessoa.'],
      feitas: ['Nenhuma concluída ainda', 'Conclua uma demanda com Espaço ou clicando no círculo.'],
    };
    const [h, p] = msgs[view];
    return `<div class="empty">${ticket}<h2>${h}</h2><p>${p}</p></div>`;
  }

  function renderBoard() {
    if (state.noteId && renderNote()) return;
    const model = buildGroups();
    const order = [];
    let html = `<div class="board-head"><h1>${esc(state.search ? 'Busca' : model.title)}</h1>${state.view === 'hoje' && !state.search ? `<span class="date">${longToday()}</span>` : ''}${filtersHtml()}</div>`;

    if (model.rail) {
      html += `<div class="rail-wrap"><h2 class="group-title">Em andamento <span class="count">${model.rail.length || ''}</span><span class="hint">o que você está fazendo agora</span></h2>`;
      if (model.rail.length) {
        html += `<div class="rail"><div class="rail-track" role="listbox" aria-label="Em andamento">${model.rail.map(railTicketHtml).join('')}</div></div>`;
        model.rail.forEach((d) => order.push(d.id));
      } else {
        html += `<div class="rail"><div class="rail-empty"><span>Nada em andamento. Selecione uma demanda e aperte <kbd>F</kbd> para começar.</span></div></div>`;
      }
      html += '</div>';
    }

    for (const g of model.groups) {
      html += `<section class="group" aria-label="${esc(g.title)}"><h2 class="group-title ${g.tone || ''}">${esc(g.title)} <span class="count">${g.items.length}</span>${g.hint ? `<span class="hint">${esc(g.hint)}</span>` : ''}</h2><div class="rows" role="listbox" aria-label="${esc(g.title)}">${rowsHeadHtml(g)}${g.items.map(rowHtml).join('')}</div></section>`;
      if (g.more) html = html.replace(/<\/section>$/, `<p class="more"><button type="button" class="link" data-goto="fila">Ver mais ${g.more} na Fila</button></p></section>`);
      g.items.forEach((d) => order.push(d.id));
    }

    const nothing = !order.length;
    if (nothing && !(model.rail && state.view === 'hoje' && state.demands.length)) html += emptyHtml(state.view);
    else if (nothing) html += emptyHtml('hoje');


    state.order = order;
    if (state.selectedId && !byId(state.selectedId)) state.selectedId = null;
    boardEl.innerHTML = html;
    state.justCreated = null;
  }

  /* --- interação com a lista --- */

  boardEl.addEventListener('click', (e) => {
    const clear = e.target.closest('[data-clear]');
    if (clear) { state[clear.dataset.clear] = null; renderSidebar(); renderBoard(); return; }
    const go = e.target.closest('[data-goto]');
    if (go) { setView(go.dataset.goto); return; }
    const item = e.target.closest('[data-id]');
    if (!item) return;
    const id = item.dataset.id;
    const act = e.target.closest('[data-act]');
    if (act && act.dataset.act === 'toggle') { e.stopPropagation(); toggleDone(id); return; }
    if (act && act.dataset.act === 'pause') { e.stopPropagation(); setField(id, { status: 'todo' }, 'Voltou para a fila'); return; }
    select(id, { open: true });
  });

  function select(id, { open = false, scroll = false } = {}) {
    state.selectedId = id;
    for (const el of boardEl.querySelectorAll('[data-id]')) el.setAttribute('aria-selected', String(el.dataset.id === id));
    if (scroll) {
      const el = boardEl.querySelector(`[data-id="${id}"]`);
      if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    if (open || !detailEl.hidden) renderDetail();
  }

  function moveSelection(delta) {
    if (!state.order.length) return;
    const i = state.order.indexOf(state.selectedId);
    const next = i < 0 ? (delta > 0 ? 0 : state.order.length - 1) : Math.max(0, Math.min(state.order.length - 1, i + delta));
    select(state.order[next], { scroll: true });
  }

  /* ---------- painel de detalhes ---------- */

  let detailTimer = null;

  function segHtml(name, options, value) {
    return `<div class="seg" role="radiogroup" aria-label="${name}">${options.map(([v, label, extra = '']) =>
      `<button type="button" role="radio" data-field="${name === 'Prioridade' ? 'priority' : 'status'}" data-v="${v}" aria-checked="${v === value}">${extra}${label}</button>`).join('')}</div>`;
  }

  function renderDetail() {
    const d = state.selectedId && byId(state.selectedId);
    if (ai.state && (!d || ai.state.id !== d.id)) { if (ai.state.ctl) ai.state.ctl.abort(); ai.state = null; }
    if (!d) { detailEl.hidden = true; detailEl.innerHTML = ''; return; }
    detailEl.hidden = false;
    detailEl.className = 'detail paper';
    detailEl.innerHTML = `
      <div class="d-head">
        <span class="seq">${seqLabel(d.seq)}</span><span>· criada há ${age(d.createdAt).text}</span>
        <span class="spacer"></span><span class="saved" id="saved" aria-live="polite"></span>
        <button type="button" class="icon-btn danger" data-dact="delete" title="Excluir (Delete)" aria-label="Excluir demanda">${icon('trash-2')}</button>
        <button type="button" class="icon-btn" data-dact="close" title="Fechar (Esc)" aria-label="Fechar painel">${icon('x')}</button>
      </div>
      <div class="d-body">
        <label class="visually-hidden" for="d-title">Título</label>
        <textarea class="d-title" id="d-title" rows="1" maxlength="500">${esc(d.title)}</textarea>
        <div class="field"><span class="field-label">Status</span>
          ${segHtml('Status', [['todo', 'A fazer'], ['doing', 'Fazendo'], ['waiting', 'Aguardando'], ['done', 'Feito']], d.status)}</div>
        <div class="field"><span class="field-label">Prioridade</span>
          ${segHtml('Prioridade', ['urgente', 'alta', 'normal', 'baixa'].map((p) => [p, PRIORITY_LABEL[p], `<span class="pri" data-p="${p}" aria-hidden="true"></span>`]), d.priority)}</div>
        <div class="d-grid">
          <div class="field"><label class="field-label" for="d-due">Prazo</label><input class="input num" id="d-due" type="date" value="${d.due || ''}"></div>
          <div class="field has-suggest"><label class="field-label" for="d-req">Quem pediu</label><input class="input" id="d-req" type="text" maxlength="80" value="${esc(d.requester)}" placeholder="Nome" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="suggest-d-req"><div class="suggest" id="suggest-d-req" role="listbox" hidden></div></div>
        </div>
        <div class="field has-suggest"><label class="field-label" for="d-proj">Projeto ou cliente</label><input class="input" id="d-proj" type="text" maxlength="80" value="${esc(d.project)}" placeholder="ex.: portal, infra, cliente X" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="suggest-d-proj"><div class="suggest" id="suggest-d-proj" role="listbox" hidden></div></div>
        <div class="field">
          <div class="notes-head"><label class="field-label" for="d-notes">Anotações</label>${ai.available ? `<button type="button" class="ai-btn" data-dact="ai" title="Revisar ortografia, gramática e clareza com IA">${icon('sparkles', 14)}Melhorar escrita</button>` : ''}</div>
          <textarea class="d-notes" id="d-notes" placeholder="Contexto, links, passos, o que foi combinado…">${esc(d.notes)}</textarea>
          <div id="ai-slot">${aiBoxHtml(d)}</div>
          ${ai.available ? `<label class="ai-auto"><input type="checkbox" id="ai-auto" ${aiAuto() ? 'checked' : ''}><span>Revisar com IA ao sair do campo</span></label>` : ''}
        </div>
        <div class="d-actions">
          ${d.status === 'done'
            ? `<button type="button" class="btn btn-ghost" data-dact="toggle">${icon('undo-2', 15)}Reabrir</button>`
            : `<button type="button" class="btn btn-primary" data-dact="toggle">${icon('check-check', 15)}Concluir</button>`}
        </div>
        <div class="d-meta">
          <div><span>Criada</span><span class="num">${fullDate(d.createdAt)}</span></div>
          <div><span>Atualizada</span><span class="num">${fullDate(d.updatedAt)}</span></div>
          ${d.doneAt ? `<div><span>Concluída</span><span class="num">${fullDate(d.doneAt)}</span></div>` : ''}
        </div>
      </div>`;
    autosize($('#d-title'));
  }

  function autosize(t) { if (!t) return; t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px`; }

  function flashSaved() {
    const s = $('#saved');
    if (s) { s.textContent = 'salvo'; clearTimeout(flashSaved.t); flashSaved.t = setTimeout(() => { if ($('#saved')) $('#saved').textContent = ''; }, 1400); }
  }

  detailEl.addEventListener('click', (e) => {
    const id = state.selectedId;
    const seg = e.target.closest('[data-field]');
    if (seg) {
      const field = seg.dataset.field;
      if (field === 'status' && seg.dataset.v === 'done') { toggleDone(id, true); return; }
      setField(id, { [field]: seg.dataset.v }).then(renderDetail);
      return;
    }
    const act = e.target.closest('[data-dact]');
    if (!act) return;
    if (act.dataset.dact === 'close') closeDetail();
    if (act.dataset.dact === 'delete') removeDemand(id);
    if (act.dataset.dact === 'toggle') toggleDone(id);
    if (act.dataset.dact === 'ai') improveNotes('button');
    if (act.dataset.dact === 'ai-stop' && ai.state && ai.state.ctl) ai.state.ctl.abort();
    if (act.dataset.dact === 'ai-dismiss') { ai.state = null; paintAi(); }
    if (act.dataset.dact === 'ai-apply') applySuggestion();
  });

  detailEl.addEventListener('input', (e) => {
    if (e.target.id === 'd-title') autosize(e.target);
    if (SUGGEST_FIELDS[e.target.id]) showSuggestions(e.target);
    if (!['d-title', 'd-notes', 'd-req', 'd-proj'].includes(e.target.id)) return;
    clearTimeout(detailTimer);
    detailTimer = setTimeout(saveDetailText, 450);
  });
  detailEl.addEventListener('focusin', (e) => {
    if (e.target.id === 'd-notes') ai.focusValue = e.target.value;
  });
  detailEl.addEventListener('change', (e) => {
    if (e.target.id === 'ai-auto') { try { localStorage.setItem(AI_AUTO_KEY, e.target.checked ? '1' : '0'); } catch { /* só nesta visita */ } ai.autoSession = e.target.checked; return; }
    if (e.target.id === 'd-due') setField(state.selectedId, { due: e.target.value || null }).then(flashSaved);
  });
  detailEl.addEventListener('focusout', (e) => {
    if (SUGGEST_FIELDS[e.target.id]) hideSuggestions(e.target);
    if (['d-title', 'd-notes', 'd-req', 'd-proj'].includes(e.target.id)) { clearTimeout(detailTimer); saveDetailText(); }
    // Revisão automática: só quando o texto mudou enquanto você estava no campo.
    if (e.target.id === 'd-notes' && ai.available && aiAuto() && e.target.value !== ai.focusValue
        && e.target.value.trim() !== (ai.lastRevised[state.selectedId] || '')
        && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('[data-dact^="ai"]'))) {
      improveNotes('auto');
    }
  });
  detailEl.addEventListener('keydown', (e) => {
    if (SUGGEST_FIELDS[e.target.id] && suggestKeydown(e)) return;
    if (e.target.id === 'd-title' && e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
  });

  async function saveDetailText() {
    const d = byId(state.selectedId);
    if (!d || !$('#d-title')) return;
    const patch = {
      title: $('#d-title').value.trim(),
      notes: $('#d-notes').value,
      requester: $('#d-req').value.trim(),
      project: $('#d-proj').value.trim(),
    };
    if (!patch.title) { toast('O título não pode ficar vazio.', { error: true }); return; }
    if (patch.title === d.title && patch.notes === d.notes && patch.requester === d.requester && patch.project === d.project) return;
    await setField(d.id, patch);
    flashSaved();
  }

  /* ---------- sugestões em "Quem pediu" e "Projeto" ---------- */

  const SUGGEST_FIELDS = { 'd-req': 'requester', 'd-proj': 'project' };
  const fold = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  function knownValues(key) {
    // Nomes já usados, sem repetir (ignora maiúsculas e acentos); os mais usados e recentes primeiro.
    const map = new Map();
    for (const d of state.demands.filter(inWs)) {
      const v = (d[key] || '').trim();
      if (!v) continue;
      const k = fold(v);
      const cur = map.get(k) || { value: v, n: 0, last: '' };
      cur.n++;
      const capital = (t) => t[0] !== t[0].toLowerCase();
      // Prefere a grafia com inicial maiúscula; entre iguais, a mais recente.
      if ((capital(v) && !capital(cur.value)) || (capital(v) === capital(cur.value) && d.updatedAt > cur.last) || !cur.n) cur.value = v;
      if (d.updatedAt > cur.last) cur.last = d.updatedAt;
      map.set(k, cur);
    }
    return [...map.values()].sort((a, b) => b.n - a.n || b.last.localeCompare(a.last));
  }

  function showSuggestions(input) {
    const box = document.getElementById(`suggest-${input.id}`);
    if (!box) return;
    const q = fold(input.value);
    if (!q) { hideSuggestions(input); return; }
    const matches = knownValues(SUGGEST_FIELDS[input.id])
      .filter((v) => { const f = fold(v.value); return f !== q && (f.startsWith(q) || f.split(/[\s._-]+/).some((w) => w.startsWith(q))); })
      .slice(0, 6);
    if (!matches.length) { hideSuggestions(input); return; }
    box.innerHTML = matches.map((m, i) => {
      const f = fold(m.value);
      let start = f.startsWith(q) ? 0 : -1;
      for (let k = 1; start < 0 && k < f.length; k++) if (/[\s._-]/.test(f[k - 1]) && f.startsWith(q, k)) start = k;
      const label = start >= 0
        ? `${esc(m.value.slice(0, start))}<b>${esc(m.value.slice(start, start + q.length))}</b>${esc(m.value.slice(start + q.length))}`
        : esc(m.value);
      return `<div class="suggest-item" role="option" id="${input.id}-opt-${i}" data-value="${esc(m.value)}" aria-selected="${i === 0}">${icon(SUGGEST_FIELDS[input.id] === 'requester' ? 'user' : 'hash', 14)}<span>${label}</span><span class="suggest-n">${m.n}</span></div>`;
    }).join('');
    box.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-activedescendant', `${input.id}-opt-0`);
  }

  function hideSuggestions(input) {
    const box = document.getElementById(`suggest-${input.id}`);
    if (box) { box.hidden = true; box.innerHTML = ''; }
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function pickSuggestion(input, value) {
    input.value = value;
    hideSuggestions(input);
    clearTimeout(detailTimer);
    saveDetailText();
  }

  function suggestKeydown(e) {
    const input = e.target;
    const box = document.getElementById(`suggest-${input.id}`);
    if (!box || box.hidden) return false;
    const items = [...box.querySelectorAll('.suggest-item')];
    let i = items.findIndex((el) => el.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      i = (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((el, j) => el.setAttribute('aria-selected', String(j === i)));
      input.setAttribute('aria-activedescendant', items[i].id);
      return true;
    }
    if ((e.key === 'Enter' || e.key === 'Tab') && i >= 0) {
      e.preventDefault();
      pickSuggestion(input, items[i].dataset.value);
      return true;
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hideSuggestions(input); return true; }
    return false;
  }

  // mousedown (e não click) para escolher antes de o campo perder o foco.
  detailEl.addEventListener('mousedown', (e) => {
    const item = e.target.closest('.suggest-item');
    if (!item) return;
    e.preventDefault();
    const input = item.closest('.field').querySelector('input');
    pickSuggestion(input, item.dataset.value);
  });

  /* ---------- revisão das anotações com IA (versão web) ---------- */

  const AI_AUTO_KEY = 'lumo-ai-auto';
  const ai = { sample: null, available: false, state: null, lastRevised: {}, focusValue: '', autoSession: null };
  function aiAuto() {
    if (ai.autoSession !== null) return ai.autoSession;
    try { return localStorage.getItem(AI_AUTO_KEY) !== '0'; } catch { return true; }
  }
  if (IS_WEB && window.claude && typeof window.claude.use === 'function') {
    window.claude.use('sample').then((fn) => {
      ai.sample = fn;
      ai.available = Boolean(fn);
      if (ai.available && !detailEl.hidden && !detailEl.contains(document.activeElement)) renderDetail();
    }, () => {});
  }

  function aiBoxHtml(d) {
    const st = ai.state;
    if (!st || st.id !== d.id) return '';
    if (st.status === 'thinking' || st.status === 'streaming') {
      return `<div class="ai-box" aria-live="polite"><div class="ai-head"><span class="ai-spin" aria-hidden="true"></span><span>Revisando…</span><button type="button" class="link" data-dact="ai-stop">Parar</button></div>${st.text ? `<div class="ai-text">${esc(st.text)}</div>` : ''}</div>`;
    }
    if (st.status === 'done') {
      return `<div class="ai-box" aria-live="polite"><div class="ai-head">${icon('sparkles', 14)}<span>Sugestão de escrita</span></div><div class="ai-text">${esc(st.text)}</div>
        <div class="ai-actions"><button type="button" class="btn btn-primary" data-dact="ai-apply">${icon('check', 14)}Aplicar</button><button type="button" class="btn btn-ghost" data-dact="ai-dismiss">Ignorar</button></div></div>`;
    }
    if (st.status === 'same') {
      return `<div class="ai-box quiet" aria-live="polite"><div class="ai-head">${icon('circle-check', 14)}<span>O texto já está bom. Nada a mudar.</span><button type="button" class="link" data-dact="ai-dismiss">Fechar</button></div></div>`;
    }
    return `<div class="ai-box quiet" aria-live="polite"><div class="ai-head">${icon('triangle-alert', 14)}<span>${esc(st.msg)}</span><button type="button" class="link" data-dact="ai-dismiss">Fechar</button></div></div>`;
  }

  function paintAi() {
    const d = byId(state.selectedId);
    const slot = $('#ai-slot');
    if (!d || !slot) return;
    slot.innerHTML = aiBoxHtml(d);
    const btn = detailEl.querySelector('[data-dact="ai"]');
    if (btn) btn.disabled = Boolean(ai.state && (ai.state.status === 'thinking' || ai.state.status === 'streaming'));
  }

  const normalize = (t) => t.replace(/\s+/g, ' ').trim();

  async function improveNotes(trigger) {
    if (!ai.sample) return;
    const d = byId(state.selectedId);
    if (!d) return;
    const field = $('#d-notes');
    const text = (field ? field.value : d.notes).trim();
    if (text.length < 12) {
      if (trigger === 'button') toast('Escreva um pouco mais nas anotações para revisar.');
      return;
    }
    if (ai.state && ai.state.ctl) ai.state.ctl.abort();
    const ctl = new AbortController();
    ai.state = { id: d.id, original: text, text: '', status: 'thinking', ctl };
    ai.lastRevised[d.id] = text;
    paintAi();
    const prompt = `Você revisa anotações de trabalho de um profissional de tecnologia.
Reescreva o texto entre <anotacao> e </anotacao> com ortografia, gramática e pontuação corretas, em frases claras e diretas. Se ajudar a leitura, organize em tópicos curtos começando com "- ".
Regras: não invente informação nem acrescente ideias; mantenha nomes, números, datas, links, comandos, siglas e termos técnicos exatamente como estão; escreva em português do Brasil e mantenha o tom; não adicione títulos, aspas nem comentários sobre a revisão.
Responda somente com o texto revisado.

Título da demanda (só para contexto): ${d.title}

<anotacao>
${text.slice(0, 12000)}
</anotacao>`;
    try {
      const res = await ai.sample(prompt, {
        modelTier: 'quick',
        signal: ctl.signal,
        onText: ({ text: partial }) => {
          if (!ai.state || ai.state.ctl !== ctl) return;
          ai.state.text = partial.replace(/<\/?anotacao>/g, '');
          ai.state.status = 'streaming';
          paintAi();
        },
      });
      if (!ai.state || ai.state.ctl !== ctl) return;
      const out = res.text.replace(/<\/?anotacao>/g, '').trim();
      ai.state = { id: d.id, original: text, text: out, status: normalize(out) === normalize(text) ? 'same' : 'done' };
    } catch (e) {
      if (!ai.state || ai.state.ctl !== ctl) return;
      const code = e && e.code;
      if (code === 'cancelled') ai.state = null;
      else if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(code)) {
        ai.available = false;
        ai.state = null;
        renderDetail();
        toast('A revisão com IA não foi permitida ou não está disponível nesta conta.', { error: true });
        return;
      } else {
        const msgs = {
          rate_limited: 'Muitas revisões seguidas. Tente de novo em alguns minutos.',
          refused: 'Não foi possível revisar este texto.',
          session_expired: 'Sua sessão do claude.ai expirou. Entre de novo para usar a revisão.',
          prompt_too_large: 'O texto é grande demais para revisar de uma vez.',
        };
        ai.state = { id: d.id, status: 'error', msg: msgs[code] || 'A revisão falhou. Tente de novo pelo botão Melhorar escrita.' };
      }
    }
    paintAi();
  }

  async function applySuggestion() {
    const st = ai.state;
    const d = byId(state.selectedId);
    if (!st || st.status !== 'done' || !d || st.id !== d.id) return;
    const field = $('#d-notes');
    if (field) field.value = st.text;
    ai.lastRevised[d.id] = st.text.trim();
    ai.state = null;
    paintAi();
    await setField(d.id, { notes: st.text }, 'anotação revisada');
    flashSaved();
  }

  function closeDetail() {
    state.selectedId = null;
    renderDetail();
    for (const el of boardEl.querySelectorAll('[aria-selected="true"]')) el.setAttribute('aria-selected', 'false');
  }

  /* ---------- ações ---------- */

  function replaceLocal(updated) {
    const i = state.demands.findIndex((x) => x.id === updated.id);
    if (i >= 0) state.demands[i] = updated; else state.demands.push(updated);
  }

  function pushUndo(label, fn) {
    state.undo.push({ label, fn });
    if (state.undo.length > 30) state.undo.shift();
  }

  async function setField(id, patch, message) {
    const before = byId(id);
    if (!before) return;
    const snapshot = { ...before };
    try {
      const updated = await call(api.demands.update(id, patch));
      replaceLocal(updated);
      renderSidebar();
      renderBoard();
      if (message) {
        pushUndo(message, () => call(api.demands.update(id, snapshot)).then(replaceLocal));
        toast(`<span class="num">${seqLabel(updated.seq)}</span> ${esc(message)}`, { undo: true, html: true });
      }
      return updated;
    } catch (err) {
      toast(err.message, { error: true });
    }
  }

  function tearOff(id) {
    const els = boardEl.querySelectorAll(`[data-id="${id}"]`);
    if (!els.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve();
    els.forEach((el) => el.classList.add('tearing'));
    return new Promise((r) => setTimeout(r, 260));
  }

  async function toggleDone(id, forceDone) {
    const d = byId(id);
    if (!d) return;
    const finishing = forceDone || d.status !== 'done';
    if (finishing && d.status === 'done') return;
    const snapshot = { ...d };
    if (finishing && state.view !== 'feitas') await tearOff(id);
    try {
      const updated = await call(api.demands.update(id, { status: finishing ? 'done' : 'todo' }));
      replaceLocal(updated);
      if (finishing && state.selectedId === id && state.view !== 'feitas') {
        const i = state.order.indexOf(id);
        state.selectedId = state.order[i + 1] || state.order[i - 1] || null;
        if (!detailEl.hidden && state.selectedId === null) detailEl.hidden = true;
      }
      renderSidebar();
      renderBoard();
      renderDetail();
      const label = finishing ? 'concluída' : 'reaberta';
      pushUndo(label, () => call(api.demands.update(id, snapshot)).then(replaceLocal));
      toast(`<span class="num">${seqLabel(updated.seq)}</span> ${label}`, { undo: true, html: true });
    } catch (err) {
      toast(err.message, { error: true });
      renderBoard();
    }
  }

  async function removeDemand(id) {
    const d = byId(id);
    if (!d) return;
    await tearOff(id);
    try {
      const removed = await call(api.demands.remove(id));
      state.demands = state.demands.filter((x) => x.id !== id);
      const i = state.order.indexOf(id);
      state.selectedId = !detailEl.hidden ? (state.order[i + 1] || state.order[i - 1] || null) : null;
      renderAll();
      pushUndo('excluída', () => call(api.demands.restore(removed)).then(replaceLocal));
      toast(`<span class="num">${seqLabel(removed.seq)}</span> excluída`, { undo: true, html: true });
    } catch (err) {
      toast(err.message, { error: true });
    }
  }

  async function undoLast() {
    const last = state.undo.pop();
    if (!last) { toast('Nada para desfazer.'); return; }
    try {
      await last.fn();
      renderAll();
      toast('Desfeito');
    } catch (err) {
      toast(err.message, { error: true });
    }
  }

  /* ---------- captura rápida ---------- */

  const TOKEN_LABEL = {
    priority: (v) => `${icon('flag', 12)}${PRIORITY_LABEL[v]}`,
    requester: (v) => `${icon('user', 12)}${esc(v)}`,
    project: (v) => `${icon('hash', 12)}${esc(v)}`,
    due: (v) => `${icon('calendar', 12)}${esc(dueInfo({ due: v, status: 'todo' }).label)} <span class="num">${v.split('-').reverse().slice(0, 2).join('/')}</span>`,
    status: (v) => `${icon(v === 'waiting' ? 'hourglass' : 'play', 12)}${STATUS_LABEL[v]}`,
  };

  function renderPreview() {
    const text = captureInput.value;
    const focused = document.activeElement === captureInput;
    if (!text.trim()) {
      previewEl.classList.toggle('active', focused);
      previewEl.innerHTML = focused
        ? '<span class="help">Opcional na mesma linha: <code>!urgente</code> <code>!alta</code> <code>!baixa</code> · <code>@pessoa</code> · <code>#projeto</code> · <code>hoje</code> <code>amanhã</code> <code>sex</code> <code>15/11</code> · <code>~aguardando</code></span>'
        : '';
      return;
    }
    const p = parseCapture(text);
    previewEl.classList.add('active');
    previewEl.innerHTML = p.tokens.length
      ? p.tokens.map((t) => `<span class="tag ${t.kind === 'priority' && t.value === 'urgente' ? 'fire' : t.kind === 'priority' && t.value === 'alta' ? 'heat' : t.kind === 'status' && t.value === 'waiting' ? 'wait' : ''}">${TOKEN_LABEL[t.kind](t.value)}</span>`).join('')
      : '<span class="help">Enter para anotar. <code>Esc</code> limpa.</span>';
  }

  captureInput.addEventListener('input', renderPreview);
  captureInput.addEventListener('focus', renderPreview);
  captureInput.addEventListener('blur', () => setTimeout(renderPreview, 0));
  captureInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (captureInput.value) { captureInput.value = ''; renderPreview(); } else captureInput.blur();
      e.stopPropagation();
    }
  });

  captureForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = captureInput.value;
    if (!text.trim()) return;
    const p = parseCapture(text);
    if (!p.title) { toast('Falta o título: escreva o que precisa ser feito além dos marcadores.', { error: true }); return; }
    const input = { title: p.title, priority: p.priority || 'normal', requester: p.requester, project: p.project, due: p.due, status: p.status || 'todo', ws: state.ws };
    captureInput.value = '';
    renderPreview();
    try {
      const created = await call(api.demands.create(input));
      replaceLocal(created); // pode já ter chegado pelo aviso de mudança ao vivo
      state.justCreated = created.id;
      if (state.search) { state.search = ''; searchInput.value = ''; }
      renderSidebar();
      renderBoard();
      const visible = state.order.includes(created.id);
      const where = created.status === 'waiting' ? 'aguardando' : created.status === 'doing' || bucketToday(created) ? 'hoje' : 'fila';
      pushUndo('anotada', async () => { await call(api.demands.remove(created.id)); state.demands = state.demands.filter((x) => x.id !== created.id); });
      if (visible) {
        const el = boardEl.querySelector(`[data-id="${created.id}"]`);
        if (el) el.scrollIntoView({ block: 'nearest' });
        toast(`<span class="num">${seqLabel(created.seq)}</span> anotada`, { undo: true, html: true });
      } else {
        const names = { hoje: 'Hoje', fila: 'Fila', aguardando: 'Aguardando' };
        toast(`<span class="num">${seqLabel(created.seq)}</span> anotada em ${names[where]}`, { undo: true, html: true, action: { label: 'Ver', fn: () => { setView(where); select(created.id, { scroll: true }); } } });
      }
    } catch (err) {
      captureInput.value = text;
      renderPreview();
      toast(err.message, { error: true });
    }
  });

  searchInput.addEventListener('input', () => {
    state.search = searchInput.value.trim();
    renderSidebar();
    renderBoard();
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { searchInput.value = ''; state.search = ''; renderSidebar(); renderBoard(); searchInput.blur(); e.stopPropagation(); }
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); searchInput.blur(); moveSelection(1); }
  });

  /* ---------- avisos ---------- */

  const toastsEl = $('#toasts');
  function toast(message, opts = {}) {
    const el = document.createElement('div');
    el.className = `toast ${opts.error ? 'error' : ''}`;
    el.innerHTML = `<span>${opts.html ? message : esc(message)}</span>`;
    if (opts.action) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = opts.action.label;
      b.addEventListener('click', () => { opts.action.fn(); dismiss(); });
      el.appendChild(b);
    }
    if (opts.undo) {
      const b = document.createElement('button');
      b.type = 'button'; b.innerHTML = 'Desfazer <span class="num">Ctrl Z</span>';
      b.addEventListener('click', () => { undoLast(); dismiss(); });
      el.appendChild(b);
    }
    while (toastsEl.children.length >= 3) toastsEl.firstChild.remove();
    toastsEl.appendChild(el);
    const timer = setTimeout(dismiss, opts.error ? 6000 : 4500);
    function dismiss() {
      clearTimeout(timer);
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 160);
    }
  }

  /* ---------- conta ---------- */

  function closeMenu() { accountMenu.hidden = true; accountBtn.setAttribute('aria-expanded', 'false'); }
  accountBtn.addEventListener('click', async () => {
    if (!accountMenu.hidden) { closeMenu(); return; }
    let info = {};
    try { info = await call(api.app.info()); } catch { /* ignora */ }
    accountMenu.innerHTML = `
      <button type="button" role="menuitem" data-m="password">${icon('key-round')}Trocar senha</button>
      <button type="button" role="menuitem" data-m="recovery">${icon('life-buoy')}Novo código de recuperação</button>
      <button type="button" role="menuitem" data-m="export">${icon('download')}Exportar demandas (JSON)</button>
      ${IS_WEB ? '' : `<button type="button" role="menuitem" data-m="folder">${icon('folder-open')}Abrir pasta dos dados</button>`}
      <button type="button" role="menuitem" data-m="shortcuts">${icon('keyboard')}Atalhos de teclado</button>
      <hr>
      <button type="button" role="menuitem" data-m="lock">${icon('lock')}Bloquear${IS_WEB ? '' : ' <kbd class="menu-kbd">Ctrl L</kbd>'}</button>
      <button type="button" role="menuitem" data-m="logout">${icon('log-out')}Sair da conta</button>
      <div class="menu-meta num">Lumo ${esc(info.version || '')}${info.shortcutActive === false ? ' · atalho global indisponível' : ''}</div>`;
    accountMenu.hidden = false;
    accountBtn.setAttribute('aria-expanded', 'true');
    accountMenu.querySelector('button').focus();
  });
  document.addEventListener('click', (e) => {
    if (!accountMenu.hidden && !e.target.closest('#account-menu') && !e.target.closest('#account-btn')) closeMenu();
  });
  accountMenu.addEventListener('keydown', (e) => {
    const items = [...accountMenu.querySelectorAll('button')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    if (e.key === 'Escape') { closeMenu(); accountBtn.focus(); e.stopPropagation(); }
  });
  accountMenu.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-m]');
    if (!b) return;
    closeMenu();
    const m = b.dataset.m;
    if (m === 'password') openPasswordSheet();
    if (m === 'recovery') openRecoverySheet();
    if (m === 'shortcuts') openShortcuts();
    if (m === 'lock') lockApp();
    if (m === 'logout') logout();
    if (m === 'folder') api.app.openDataDir();
    if (m === 'export') {
      try {
        const out = await call(api.data.export());
        if (out.saved) toast('Exportado. O arquivo JSON não é cifrado; guarde com cuidado.');
      } catch (err) { toast(err.message, { error: true }); }
    }
  });

  const sheet = $('#sheet');
  bindReveal(sheet);
  function openSheet(html, focusSel) {
    sheet.innerHTML = `<div class="sheet-body">${html}</div>`;
    sheet.showModal();
    const f = focusSel && $(focusSel, sheet);
    if (f) f.focus();
  }
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet || e.target.closest('[data-close]')) sheet.close();
  });

  function openPasswordSheet(error) {
    openSheet(`
      <h2>Trocar senha</h2>
      <p class="lede">Suas demandas continuam as mesmas; só a chave de acesso muda.</p>
      ${error ? errorBox(error) : ''}
      <form id="pw-form" novalidate>
        ${passwordField('p-cur', 'Senha atual')}
        ${passwordField('p-new', 'Nova senha', { autocomplete: 'new-password', strength: true })}
        ${passwordField('p-new2', 'Confirme a nova senha', { autocomplete: 'new-password' })}
        <div class="actions"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="submit" class="btn btn-primary">Salvar nova senha</button></div>
      </form>`, '#p-cur');
    wireStrength('p-new');
    $('#pw-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const cur = $('#p-cur').value; const next = $('#p-new').value;
      if (next !== $('#p-new2').value) return openPasswordSheet('As novas senhas não conferem.');
      const btn = $('#pw-form button[type=submit]');
      busy(btn, true, 'Salvando…');
      try {
        await call(api.auth.changePassword(cur, next));
        sheet.close();
        toast('Senha alterada.');
      } catch (err) { openPasswordSheet(err.message); }
    });
  }

  function openRecoverySheet(error) {
    openSheet(`
      <h2>Novo código de recuperação</h2>
      <p class="lede">O código antigo deixa de funcionar. Confirme sua senha para gerar outro.</p>
      ${error ? errorBox(error) : ''}
      <form id="rc-form" novalidate>
        ${passwordField('rc-cur', 'Senha atual')}
        <div class="actions"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="submit" class="btn btn-primary">Gerar código</button></div>
      </form>`, '#rc-cur');
    $('#rc-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#rc-form button[type=submit]');
      busy(btn, true, 'Gerando…');
      try {
        const out = await call(api.auth.regenerateRecovery($('#rc-cur').value));
        openSheet(`
          <h2>Guarde o novo código</h2>
          <p class="lede">Ele não aparece de novo.</p>
          <div class="recovery-code">${esc(out.recoveryCode)}</div>
          <div class="actions"><button type="button" class="btn btn-ghost" id="rc-copy">${icon('copy')}Copiar</button><button type="button" class="btn btn-primary" data-close>Pronto</button></div>`, '#rc-copy');
        $('#rc-copy').addEventListener('click', async () => { if ((await api.app.copy(out.recoveryCode)) === false) { selectText($('.sheet .recovery-code')); return; } $('#rc-copy').innerHTML = `${icon('circle-check')}Copiado`; });
      } catch (err) { openRecoverySheet(err.message); }
    });
  }

  function openShortcuts() {
    const rows = [
      ['Anotar', null],
      ...(IS_WEB ? [] : [['Nova demanda (de qualquer lugar do Windows)', 'Ctrl Shift Espaço']]),
      ['Ir para o campo de captura', 'N ou Ctrl N'],
      ['Buscar', 'Ctrl F'],
      ['Navegar', null],
      ['Hoje · Fila · Aguardando · Feitas', 'Ctrl 1 – 4'],
      ['Próxima / anterior', '↓ ↑ ou J K'],
      ['Abrir detalhes', 'Enter'],
      ['Fechar painel / limpar', 'Esc'],
      ['Na demanda selecionada', null],
      ['Concluir ou reabrir', 'Espaço ou X'],
      ['Começar a fazer (em andamento)', 'F'],
      ['Aguardando alguém', 'W'],
      ['Prioridade urgente · alta · normal · baixa', '1 – 4'],
      ['Excluir', 'Delete'],
      ['Desfazer', 'Ctrl Z'],
      ...(IS_WEB ? [] : [['Bloquear o app', 'Ctrl L']]),
    ];
    openSheet(`
      <h2>Atalhos de teclado</h2>
      <div class="shortcuts">${rows.map(([a, k]) => (k ? `<span>${a}</span><kbd>${k}</kbd>` : `<h3>${a}</h3>`)).join('')}</div>
      <div class="actions"><button type="button" class="btn btn-primary" data-close>Fechar</button></div>`);
  }

  async function lockApp(notice) {
    await api.auth.logout();
    state.demands = [];
    state.undo = [];
    renderLogin(state.username, null, notice || 'Bloqueado. Entre com sua senha para continuar.');
  }
  async function logout() {
    await api.auth.logout();
    state.demands = [];
    state.undo = [];
    renderLogin(state.username, null, 'Você saiu da conta.');
  }

  api.on('app:locked', () => {
    state.demands = [];
    state.undo = [];
    if (sheet.open) sheet.close();
    renderLogin(state.username, null, IS_WEB ? 'Bloqueado depois de 20 minutos sem uso. Entre de novo para continuar.' : 'Bloqueado junto com o Windows. Entre de novo para continuar.');
  });
  // Versão web: mudanças vindas de outra aba ou outro computador.
  api.on('app:data', async () => {
    if (workspaceEl.hidden) return;
    try { state.demands = await call(api.demands.list()); } catch { return; }
    if (state.noteId) { renderSidebar(); return; }
    if (document.activeElement && detailEl.contains(document.activeElement)) { renderSidebar(); renderBoard(); return; }
    renderAll();
  });

  function selectText(el) {
    if (!el) return;
    const r = document.createRange();
    r.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    toast('Código selecionado. Copie com Ctrl C.');
  }

  api.on('app:focus-capture', () => {
    if (!workspaceEl.hidden) { if (sheet.open) sheet.close(); captureInput.focus(); captureInput.select(); }
  });

  /* ---------- teclado ---------- */

  document.addEventListener('keydown', (e) => {
    if (workspaceEl.hidden || sheet.open) return;
    const t = e.target;
    const typing = t.matches('input, textarea, select, [contenteditable]');
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && !e.shiftKey && ['1', '2', '3', '4'].includes(e.key)) { e.preventDefault(); setView(VIEWS[Number(e.key) - 1].id); return; }
    if (ctrl && e.key.toLowerCase() === 'f') { e.preventDefault(); searchInput.focus(); searchInput.select(); return; }
    if (ctrl && e.key.toLowerCase() === 'n') { e.preventDefault(); captureInput.focus(); return; }
    if (!IS_WEB && ctrl && e.key.toLowerCase() === 'l') { e.preventDefault(); lockApp(); return; }
    if (ctrl && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); undoLast(); return; }

    if (e.key === 'Escape') {
      if (!accountMenu.hidden) { closeMenu(); return; }
      if (typing) { t.blur(); return; }
      if (!detailEl.hidden) { closeDetail(); return; }
      if (state.project || state.requester) { state.project = state.requester = null; renderSidebar(); renderBoard(); }
      return;
    }
    if (typing || ctrl || e.altKey) return;

    const id = state.selectedId;
    switch (e.key) {
      case 'n': case 'N': case '/': e.preventDefault(); captureInput.focus(); break;
      case 'ArrowDown': case 'j': case 'J': e.preventDefault(); moveSelection(1); break;
      case 'ArrowUp': case 'k': case 'K': e.preventDefault(); moveSelection(-1); break;
      case 'ArrowRight': if (state.view === 'hoje') { e.preventDefault(); moveSelection(1); } break;
      case 'ArrowLeft': if (state.view === 'hoje') { e.preventDefault(); moveSelection(-1); } break;
      case 'Enter': if (id) { e.preventDefault(); renderDetail(); const ti = $('#d-title'); if (ti) ti.focus(); } break;
      case ' ': case 'x': case 'X': if (id) { e.preventDefault(); toggleDone(id); } break;
      case 'f': case 'F': if (id) { const d = byId(id); setField(id, { status: d.status === 'doing' ? 'todo' : 'doing' }, d.status === 'doing' ? 'voltou para a fila' : 'em andamento'); } break;
      case 'w': case 'W': if (id) { const d = byId(id); setField(id, { status: d.status === 'waiting' ? 'todo' : 'waiting' }, d.status === 'waiting' ? 'voltou para a fila' : 'aguardando'); } break;
      case '1': case '2': case '3': case '4':
        if (id) { const p = ['urgente', 'alta', 'normal', 'baixa'][Number(e.key) - 1]; setField(id, { priority: p }).then(() => { if (!detailEl.hidden) renderDetail(); }); }
        break;
      case 'Delete': if (id) { e.preventDefault(); removeDemand(id); } break;
      case '?': openShortcuts(); break;
      default: break;
    }
  });

  // Atualiza idades e "Hoje" a cada minuto sem atrapalhar a digitação.
  setInterval(() => {
    if (workspaceEl.hidden) return;
    if (document.activeElement && detailEl.contains(document.activeElement)) return;
    if (state.noteId) { renderSidebar(); return; } // não atrapalha quem está escrevendo no bloco
    renderSidebar();
    renderBoard();
  }, 60000);

  /* ---------- tema ---------- */

  const THEME_KEY = 'lumo-theme';
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  function savedTheme() { try { return localStorage.getItem(THEME_KEY); } catch { return null; } }
  function effectiveTheme() {
    const t = document.documentElement.dataset.theme;
    return t === 'dark' || t === 'light' ? t : (systemDark.matches ? 'dark' : 'light');
  }
  function paintThemeButtons() {
    const dark = effectiveTheme() === 'dark';
    document.documentElement.dataset.dark = dark ? '1' : '0';
    for (const b of document.querySelectorAll('[data-theme-toggle]')) {
      b.innerHTML = icon(dark ? 'sun' : 'moon', 18);
      const label = dark ? 'Usar tema claro' : 'Usar tema escuro';
      b.setAttribute('aria-label', label);
      b.title = label;
    }
  }
  function applyTheme(theme) {
    if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
    if (api.app.setTheme) api.app.setTheme(theme || 'system');
    paintThemeButtons();
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-theme-toggle]')) return;
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, next); } catch { /* sem armazenamento: vale só nesta visita */ }
    applyTheme(next);
  });
  systemDark.addEventListener('change', paintThemeButtons);
  // O claude.ai também pode trocar o tema da página; os botões acompanham.
  new MutationObserver(paintThemeButtons).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  applyTheme(savedTheme());

  /* ---------- início ---------- */

  (async function boot() {
    try {
      const s = await call(api.auth.state());
      if (s.signedIn) { state.username = s.username; enterWorkspace(); }
      else if (s.hasAccount) renderLogin(s.lastUsername);
      else renderRegister();
    } catch (err) {
      if (err.code === 'unavailable') {
        showAuth(`<h1 id="auth-title">Não deu para abrir seus dados</h1><p class="lede">${esc(err.message)}</p>`);
      } else renderLogin('', err.message);
    }
  })();
})();
