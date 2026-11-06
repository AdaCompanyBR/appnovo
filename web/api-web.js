/*
 * Lumo — camada de dados da versão web (claude.ai).
 *
 * Expõe o mesmo `window.api` da versão desktop, mas:
 * - guarda tudo na área privada do usuário no claude.ai (data/users/<id>/…),
 *   que nem o dono da página consegue ler;
 * - cifra cada demanda no navegador com AES-256-GCM antes de enviar;
 * - a chave dos dados é protegida pela senha (PBKDF2-SHA256, 600 mil
 *   iterações) e, separadamente, pelo código de recuperação.
 */
(function () {
  'use strict';

  const ITERATIONS = 600000;
  const MAX_ATTEMPTS = 5;
  const BASE_LOCK_MS = 30 * 1000;
  const MAX_LOCK_MS = 15 * 60 * 1000;
  const IDLE_LOCK_MS = 20 * 60 * 1000;
  const USERNAME_RE = /^[\p{L}\p{N}._-]{3,32}$/u;
  const MIN_PASSWORD = 8;
  const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const PRIORITIES = ['urgente', 'alta', 'normal', 'baixa'];
  const STATUSES = ['todo', 'doing', 'waiting', 'done'];
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const subtle = crypto.subtle;

  class VaultError extends Error {
    constructor(code, message, extra = {}) { super(message); this.code = code; Object.assign(this, extra); }
  }

  /* ---------- base64 e cripto ---------- */

  const b64 = (buf) => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  async function derive(secret, salt, iterations = ITERATIONS) {
    const base = await subtle.importKey('raw', enc.encode(secret.normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, base, 512));
    const kek = await subtle.importKey('raw', bits.slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt']);
    const verifier = b64(await subtle.digest('SHA-256', bits.slice(32)));
    bits.fill(0);
    return { kek, verifier };
  }

  async function seal(key, bytes) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes);
    return { iv: b64(iv), ct: b64(ct) };
  }

  async function open(key, box) {
    return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.ct)));
  }

  function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let r = 0;
    for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return r === 0;
  }

  function generateRecoveryCode() {
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    let out = '';
    for (let i = 0; i < 20; i++) {
      out += RECOVERY_ALPHABET[bytes[i] % RECOVERY_ALPHABET.length];
      if (i % 4 === 3 && i < 19) out += '-';
    }
    return out;
  }
  const normalizeRecoveryCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  function validatePassword(p) {
    if (typeof p !== 'string' || [...p].length < MIN_PASSWORD) throw new VaultError('weak_password', `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
    if (/^\s|\s$/.test(p)) throw new VaultError('weak_password', 'A senha não pode começar nem terminar com espaço.');
  }

  async function wrapWith(secret, dekRaw) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const { kek, verifier } = await derive(secret, salt);
    return { salt: b64(salt), iterations: ITERATIONS, verifier, wrappedKey: await seal(kek, dekRaw) };
  }

  async function unwrapWith(secret, box) {
    const { kek, verifier } = await derive(secret, unb64(box.salt), box.iterations || ITERATIONS);
    if (!timingSafeEqual(verifier, box.verifier)) return null;
    return open(kek, box.wrappedKey);
  }

  const importDek = (raw) => subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);

  function sanitizeNote(n) {
    return {
      id: String(n.id),
      title: (typeof n.title === 'string' ? n.title.replace(/\u0000/g, '').slice(0, 200) : '').trim(),
      body: typeof n.body === 'string' ? n.body.slice(0, 100000) : '',
      ws: typeof n.ws === 'string' && n.ws ? n.ws.slice(0, 64) : null,
      createdAt: n.createdAt || new Date().toISOString(),
      updatedAt: n.updatedAt || n.createdAt || new Date().toISOString(),
    };
  }

  async function writeNote(n) {
    const { notesCol } = await backend();
    const box = await seal(session.dek, enc.encode(JSON.stringify(n)));
    await dbCall(() => notesCol.doc(n.id).set({ box, v: 1 }));
    session.notes.set(n.id, n);
    return n;
  }

  function cleanText(v, max) { return typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : ''; }
  function sanitizeDemand(d) {
    return {
      id: String(d.id),
      seq: Number(d.seq) || 0,
      title: cleanText(d.title, 500),
      notes: typeof d.notes === 'string' ? d.notes.slice(0, 20000) : '',
      priority: PRIORITIES.includes(d.priority) ? d.priority : 'normal',
      status: STATUSES.includes(d.status) ? d.status : 'todo',
      due: typeof d.due === 'string' && DATE_RE.test(d.due) ? d.due : null,
      requester: cleanText(d.requester, 80),
      project: cleanText(d.project, 80),
      ws: cleanText(d.ws, 64) || null,
      createdAt: d.createdAt || new Date().toISOString(),
      updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
      doneAt: d.doneAt || null,
    };
  }

  /* ---------- armazenamento ---------- */

  let ready = null;
  function backend() {
    if (!ready) {
      ready = (async () => {
        const host = window.claude;
        if (!host || typeof host.use !== 'function') throw new VaultError('unavailable', 'Abra o Lumo pelo claude.ai, com sua conta conectada.');
        const [db, user, downloads] = await Promise.all([host.use('db'), host.use('user'), host.use('downloads')]);
        const uid = user ? await user.id() : null;
        if (!db || !uid) throw new VaultError('unavailable', 'Não foi possível acessar o armazenamento. Entre na sua conta do claude.ai e abra a página de novo.');
        const accountRef = db.doc(`data/users/${uid}/account`);
        return { db, downloads, accountRef, demandsCol: accountRef.collection('demands'), settingsRef: db.doc(`data/users/${uid}/settings`), notesCol: accountRef.collection('notes') };
      })();
      ready.catch(() => { ready = null; });
    }
    return ready;
  }

  async function dbCall(fn) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof VaultError) throw err;
      if (err && err.code === 'unavailable') {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
        try { return await fn(); } catch (e2) { err = e2; }
      }
      if (err && err.code === 'quota_exceeded') throw new VaultError('quota', 'O armazenamento está cheio. Exclua demandas antigas concluídas para liberar espaço.');
      if (err && (err.code === 'revoked' || err.code === 'not_granted')) throw new VaultError('unavailable', 'O acesso ao armazenamento foi interrompido. Recarregue a página.');
      console.error(err);
      throw new VaultError('internal', 'Não foi possível salvar agora. Verifique a conexão e tente de novo.');
    }
  }

  /* ---------- sessão ---------- */

  const session = { username: null, dek: null, cache: new Map(), notes: new Map(), unsub: null, lastUsername: '' };
  const listeners = { 'app:locked': new Set(), 'app:focus-capture': new Set(), 'app:data': new Set() };
  const emit = (ev) => listeners[ev].forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });

  let idleTimer = null;
  function touch() {
    if (!session.dek) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (session.dek) { endSession(); emit('app:locked'); } }, IDLE_LOCK_MS);
  }
  ['keydown', 'pointerdown', 'wheel'].forEach((ev) => window.addEventListener(ev, touch, { passive: true, capture: true }));

  function endSession() {
    if (session.unsub) session.unsub();
    session.unsub = null;
    session.dek = null;
    session.cache = new Map();
    session.notes = new Map();
    session.username = null;
    clearTimeout(idleTimer);
  }

  async function decryptDoc(snap) {
    const body = snap.data();
    if (!body || !body.box) return null;
    try {
      return sanitizeDemand(JSON.parse(dec.decode(await open(session.dek, body.box))));
    } catch {
      return null;
    }
  }

  async function startSession(username, dekRaw) {
    const { demandsCol } = await backend();
    session.username = username;
    session.dek = await importDek(dekRaw);
    dekRaw.fill(0);
    session.cache = new Map();
    const { notesCol } = await backend();
    session.notes = new Map();
    const nsnap = await dbCall(() => notesCol.get());
    for (const doc of nsnap.docs) {
      const body = doc.data();
      try { const n = sanitizeNote(JSON.parse(dec.decode(await open(session.dek, body.box)))); session.notes.set(n.id, n); } catch { /* ignora registro ilegível */ }
    }
    const snap = await dbCall(() => demandsCol.get());
    for (const doc of snap.docs) {
      const d = await decryptDoc(doc);
      if (d) session.cache.set(d.id, d);
    }
    // Mudanças feitas em outra aba ou outro computador chegam ao vivo.
    const dek = session.dek;
    session.unsub = demandsCol.onSnapshot(async (qs) => {
      if (session.dek !== dek) return;
      let changed = false;
      for (const ch of qs.docChanges()) {
        if (ch.type === 'removed') { if (session.cache.delete(ch.doc.id)) changed = true; continue; }
        const d = await decryptDoc(ch.doc);
        if (!d || session.dek !== dek) continue;
        const cur = session.cache.get(d.id);
        if (!cur || JSON.stringify(cur) !== JSON.stringify(d)) { session.cache.set(d.id, d); changed = true; }
      }
      if (changed) emit('app:data');
    }, () => {});
    touch();
  }

  function requireSession() {
    if (!session.dek) throw new VaultError('signed_out', 'Sessão encerrada. Entre novamente.');
  }

  async function writeDemand(d) {
    const { demandsCol } = await backend();
    const box = await seal(session.dek, enc.encode(JSON.stringify(d)));
    await dbCall(() => demandsCol.doc(d.id).set({ box, v: 1 }));
    session.cache.set(d.id, d);
    return d;
  }

  /* ---------- operações ---------- */

  async function readAccount() {
    const { accountRef } = await backend();
    const snap = await dbCall(() => accountRef.get());
    return snap.exists ? snap.data() : null;
  }

  function checkLock(acc) {
    if (acc.lockedUntil && acc.lockedUntil > Date.now()) {
      const s = Math.ceil((acc.lockedUntil - Date.now()) / 1000);
      throw new VaultError('locked', `Muitas tentativas. Tente de novo em ${s} s.`, { retryInSeconds: s });
    }
  }

  async function registerFailure(acc) {
    const { accountRef } = await backend();
    const failedAttempts = (acc.failedAttempts || 0) + 1;
    let lockedUntil = acc.lockedUntil || 0;
    if (failedAttempts >= MAX_ATTEMPTS) lockedUntil = Date.now() + Math.min(BASE_LOCK_MS * 2 ** (failedAttempts - MAX_ATTEMPTS), MAX_LOCK_MS);
    await dbCall(() => accountRef.update({ failedAttempts, lockedUntil }));
    return failedAttempts;
  }

  async function clearFailures(acc, extra = {}) {
    const { accountRef } = await backend();
    if (acc.failedAttempts || acc.lockedUntil || Object.keys(extra).length) {
      await dbCall(() => accountRef.update({ failedAttempts: 0, lockedUntil: 0, ...extra }));
    }
  }

  const sameUser = (a, b) => String(a).trim().toLocaleLowerCase('pt-BR') === String(b).trim().toLocaleLowerCase('pt-BR');

  const ops = {
    async 'auth:state'() {
      const acc = await readAccount();
      session.lastUsername = acc ? acc.username : '';
      return { hasAccount: Boolean(acc), lastUsername: session.lastUsername, signedIn: Boolean(session.dek), username: session.username };
    },

    async 'auth:register'(username, password) {
      const name = String(username || '').trim();
      if (!USERNAME_RE.test(name)) throw new VaultError('bad_username', 'Use de 3 a 32 caracteres: letras, números, ponto, hífen ou sublinhado.');
      validatePassword(password);
      if (await readAccount()) throw new VaultError('username_taken', 'Esta conta do claude.ai já tem um acesso ao Lumo. Entre com ele ou recupere a senha.');
      const dekRaw = crypto.getRandomValues(new Uint8Array(32));
      const recoveryCode = generateRecoveryCode();
      const account = {
        v: 1,
        username: name,
        createdAt: new Date().toISOString(),
        failedAttempts: 0,
        lockedUntil: 0,
        password: await wrapWith(password, dekRaw),
        recovery: await wrapWith(normalizeRecoveryCode(recoveryCode), dekRaw),
      };
      const { accountRef } = await backend();
      await dbCall(() => accountRef.set(account));
      await startSession(name, dekRaw);
      return { username: name, recoveryCode };
    },

    async 'auth:login'(username, password) {
      const acc = await readAccount();
      if (!acc) throw new VaultError('bad_credentials', 'Usuário ou senha incorretos.');
      checkLock(acc);
      const dekRaw = await unwrapWith(String(password || ''), acc.password);
      if (!dekRaw || !sameUser(acc.username, username)) {
        const n = await registerFailure(acc);
        const left = MAX_ATTEMPTS - n;
        throw new VaultError('bad_credentials', left > 0 ? 'Usuário ou senha incorretos.' : 'Usuário ou senha incorretos. Acesso pausado por alguns segundos.', { attemptsLeft: Math.max(left, 0) });
      }
      await clearFailures(acc);
      await startSession(acc.username, dekRaw);
      return { username: acc.username };
    },

    async 'auth:recover'(username, code, newPassword) {
      validatePassword(newPassword);
      const acc = await readAccount();
      if (!acc) throw new VaultError('bad_recovery', 'Usuário ou código de recuperação incorretos.');
      checkLock(acc);
      const dekRaw = await unwrapWith(normalizeRecoveryCode(code), acc.recovery);
      if (!dekRaw || !sameUser(acc.username, username)) {
        await registerFailure(acc);
        throw new VaultError('bad_recovery', 'Usuário ou código de recuperação incorretos.');
      }
      const newCode = generateRecoveryCode();
      const password = await wrapWith(newPassword, dekRaw);
      const recovery = await wrapWith(normalizeRecoveryCode(newCode), dekRaw);
      await clearFailures(acc, { password, recovery });
      await startSession(acc.username, dekRaw);
      return { username: acc.username, recoveryCode: newCode };
    },

    async 'auth:change-password'(current, next) {
      requireSession();
      validatePassword(next);
      const acc = await readAccount();
      checkLock(acc);
      const dekRaw = await unwrapWith(String(current || ''), acc.password);
      if (!dekRaw) { await registerFailure(acc); throw new VaultError('bad_credentials', 'A senha atual está incorreta.'); }
      if (current === next) throw new VaultError('same_password', 'A nova senha precisa ser diferente da atual.');
      const password = await wrapWith(next, dekRaw);
      dekRaw.fill(0);
      await clearFailures(acc, { password });
      return { ok: true };
    },

    async 'auth:regenerate-recovery'(current) {
      requireSession();
      const acc = await readAccount();
      checkLock(acc);
      const dekRaw = await unwrapWith(String(current || ''), acc.password);
      if (!dekRaw) { await registerFailure(acc); throw new VaultError('bad_credentials', 'A senha atual está incorreta.'); }
      const code = generateRecoveryCode();
      const recovery = await wrapWith(normalizeRecoveryCode(code), dekRaw);
      dekRaw.fill(0);
      await clearFailures(acc, { recovery });
      return { recoveryCode: code };
    },

    async 'auth:logout'() { endSession(); return true; },

    async 'demands:list'() { requireSession(); return [...session.cache.values()]; },

    async 'demands:create'(input) {
      requireSession();
      const now = new Date().toISOString();
      let seq = 0;
      for (const d of session.cache.values()) seq = Math.max(seq, d.seq);
      const demand = sanitizeDemand({ ...input, id: crypto.randomUUID(), seq: seq + 1, createdAt: now, updatedAt: now });
      if (!demand.title) throw new VaultError('empty_title', 'Escreva pelo menos o título da demanda.');
      if (demand.status === 'done') demand.doneAt = now;
      return writeDemand(demand);
    },

    async 'demands:update'(id, patch) {
      requireSession();
      const before = session.cache.get(String(id));
      if (!before) throw new VaultError('not_found', 'Demanda não encontrada.');
      const next = sanitizeDemand({ ...before, ...patch, id: before.id, seq: before.seq, createdAt: before.createdAt });
      if (!next.title) throw new VaultError('empty_title', 'O título não pode ficar vazio.');
      next.updatedAt = new Date().toISOString();
      if (next.status === 'done' && before.status !== 'done') next.doneAt = next.updatedAt;
      if (next.status !== 'done') next.doneAt = null;
      return writeDemand(next);
    },

    async 'demands:delete'(id) {
      requireSession();
      const before = session.cache.get(String(id));
      if (!before) throw new VaultError('not_found', 'Demanda não encontrada.');
      const { demandsCol } = await backend();
      await dbCall(() => demandsCol.doc(before.id).delete());
      session.cache.delete(before.id);
      return before;
    },

    async 'demands:restore'(demand) {
      requireSession();
      if (session.cache.has(demand.id)) return demand;
      return writeDemand(sanitizeDemand(demand));
    },

    async 'notes:list'() { requireSession(); return [...session.notes.values()]; },

    async 'notes:create'(input) {
      requireSession();
      const now = new Date().toISOString();
      return writeNote(sanitizeNote({ ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now }));
    },

    async 'notes:update'(id, patch) {
      requireSession();
      const before = session.notes.get(String(id));
      if (!before) throw new VaultError('not_found', 'Bloco de notas não encontrado.');
      return writeNote(sanitizeNote({ ...before, ...patch, id: before.id, createdAt: before.createdAt, updatedAt: new Date().toISOString() }));
    },

    async 'notes:delete'(id) {
      requireSession();
      const before = session.notes.get(String(id));
      if (!before) throw new VaultError('not_found', 'Bloco de notas não encontrado.');
      const { notesCol } = await backend();
      await dbCall(() => notesCol.doc(before.id).delete());
      session.notes.delete(before.id);
      return before;
    },

    async 'settings:get'() {
      requireSession();
      const { settingsRef } = await backend();
      const snap = await dbCall(() => settingsRef.get());
      const body = snap.exists ? snap.data() : null;
      if (!body || !body.box) return {};
      try { return JSON.parse(dec.decode(await open(session.dek, body.box))); } catch { return {}; }
    },

    async 'settings:set'(settings) {
      requireSession();
      const { settingsRef } = await backend();
      const clean = JSON.parse(JSON.stringify(settings || {}));
      const box = await seal(session.dek, enc.encode(JSON.stringify(clean)));
      await dbCall(() => settingsRef.set({ box, v: 1 }));
      return clean;
    },

    async 'data:export'() {
      requireSession();
      const { downloads } = await backend();
      if (!downloads) throw new VaultError('unavailable', 'Este navegador não permite baixar arquivos pela página.');
      const payload = { app: 'Lumo', exportedAt: new Date().toISOString(), username: session.username, demands: [...session.cache.values()], notes: [...session.notes.values()] };
      try {
        await downloads.save({ filename: `demandas-${payload.exportedAt.slice(0, 10)}.json`, data: JSON.stringify(payload, null, 2) });
        return { saved: true };
      } catch (err) {
        if (err && err.code === 'declined') return { saved: false };
        throw new VaultError('internal', 'Não foi possível exportar agora.');
      }
    },

    async 'app:info'() { return { version: '1.0.0-web', platform: 'web' }; },
  };

  async function invoke(channel, ...args) {
    try {
      return { ok: true, value: await ops[channel](...args) };
    } catch (err) {
      if (err instanceof VaultError) return { ok: false, error: { code: err.code, message: err.message, retryInSeconds: err.retryInSeconds, attemptsLeft: err.attemptsLeft } };
      console.error(err);
      return { ok: false, error: { code: 'internal', message: 'Algo deu errado. Seus dados anteriores foram mantidos.' } };
    }
  }
  const call = (ch) => (...args) => invoke(ch, ...args);

  window.api = {
    platform: 'web',
    auth: {
      state: call('auth:state'), register: call('auth:register'), login: call('auth:login'), recover: call('auth:recover'),
      changePassword: call('auth:change-password'), regenerateRecovery: call('auth:regenerate-recovery'), logout: call('auth:logout'),
    },
    demands: {
      list: call('demands:list'), create: call('demands:create'), update: call('demands:update'),
      remove: call('demands:delete'), restore: call('demands:restore'),
    },
    notes: { list: call('notes:list'), create: call('notes:create'), update: call('notes:update'), remove: call('notes:delete') },
    settings: { get: call('settings:get'), set: call('settings:set') },
    data: { export: call('data:export') },
    app: {
      info: call('app:info'),
      openDataDir: async () => ({ ok: true, value: false }),
      // Chamado direto do clique, para o navegador permitir a cópia.
      copy: (text) => {
        try {
          return navigator.clipboard.writeText(String(text)).then(() => true, () => false);
        } catch { return Promise.resolve(false); }
      },
    },
    on(event, fn) {
      if (!listeners[event]) return () => {};
      listeners[event].add(fn);
      return () => listeners[event].delete(fn);
    },
  };
})();
