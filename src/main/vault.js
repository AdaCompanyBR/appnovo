'use strict';

/*
 * Cofre local de contas e demandas.
 *
 * - Cada conta tem uma chave de dados aleatória (DEK, AES-256-GCM) que cifra
 *   o arquivo de demandas.
 * - A DEK é guardada "embrulhada" duas vezes: pela chave derivada da senha
 *   (scrypt) e pela chave derivada do código de recuperação.
 * - A senha nunca é gravada. Gravamos apenas sal + verificador scrypt.
 * - Trocar a senha só reembrulha a DEK; os dados não precisam ser recifrados.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 96 * 1024 * 1024 };
const MAX_ATTEMPTS = 5;
const BASE_LOCK_MS = 30 * 1000;
const MAX_LOCK_MS = 15 * 60 * 1000;
const USERNAME_RE = /^[\p{L}\p{N}._-]{3,32}$/u;
const MIN_PASSWORD = 8;
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

class VaultError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.code = code;
    Object.assign(this, extra);
  }
}

function scrypt(secret, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(secret.normalize('NFC'), salt, 64, SCRYPT, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

function seal(key, plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ct: ct.toString('base64') };
}

function open(key, box) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(box.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(box.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(box.ct, 'base64')), decipher.final()]);
}

function normalizeUsername(u) {
  return String(u || '').trim();
}

function sameUser(a, b) {
  return a.toLocaleLowerCase('pt-BR') === b.toLocaleLowerCase('pt-BR');
}

function generateRecoveryCode() {
  const bytes = crypto.randomBytes(20);
  let out = '';
  for (let i = 0; i < 20; i++) {
    out += RECOVERY_ALPHABET[bytes[i] % RECOVERY_ALPHABET.length];
    if (i % 4 === 3 && i < 19) out += '-';
  }
  return out;
}

function normalizeRecoveryCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function validatePassword(password) {
  if (typeof password !== 'string' || [...password].length < MIN_PASSWORD) {
    throw new VaultError('weak_password', `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
  }
  if (/^\s|\s$/.test(password)) {
    throw new VaultError('weak_password', 'A senha não pode começar nem terminar com espaço.');
  }
}

function writeAtomic(file, data) {
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  const fd = fs.openSync(tmp, 'w', 0o600);
  try {
    fs.writeSync(fd, data);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, file);
}

function emptyData() {
  return { version: 1, seq: 0, demands: [], settings: {} };
}

class Vault {
  constructor(dir) {
    this.dir = dir;
    fs.mkdirSync(dir, { recursive: true });
    this.accountsFile = path.join(dir, 'accounts.json');
    this.session = null; // { accountId, dek, data }
  }

  /* ---------- contas ---------- */

  _readAccounts() {
    if (!fs.existsSync(this.accountsFile)) return { version: 1, accounts: [] };
    return JSON.parse(fs.readFileSync(this.accountsFile, 'utf8'));
  }

  _writeAccounts(doc) {
    writeAtomic(this.accountsFile, JSON.stringify(doc, null, 2));
  }

  _dataFile(accountId) {
    return path.join(this.dir, `dados-${accountId}.enc`);
  }

  _find(doc, username) {
    const name = normalizeUsername(username);
    return doc.accounts.find((a) => sameUser(a.username, name));
  }

  state() {
    const doc = this._readAccounts();
    return {
      hasAccount: doc.accounts.length > 0,
      lastUsername: doc.lastUsername || (doc.accounts[0] && doc.accounts[0].username) || '',
      signedIn: Boolean(this.session),
      username: this.session ? this.session.username : null,
    };
  }

  async register(username, password) {
    const name = normalizeUsername(username);
    if (!USERNAME_RE.test(name)) {
      throw new VaultError('bad_username', 'Use de 3 a 32 caracteres: letras, números, ponto, hífen ou sublinhado.');
    }
    validatePassword(password);
    const doc = this._readAccounts();
    if (this._find(doc, name)) throw new VaultError('username_taken', 'Já existe uma conta com esse usuário.');

    const id = crypto.randomUUID();
    const dek = crypto.randomBytes(32);
    const recoveryCode = generateRecoveryCode();

    const account = {
      id,
      username: name,
      createdAt: new Date().toISOString(),
      failedAttempts: 0,
      lockedUntil: 0,
      ...(await this._passwordFields(password, dek)),
      recovery: await this._recoveryFields(recoveryCode, dek),
    };

    // Grava os dados vazios antes da conta, para nunca existir conta sem arquivo.
    writeAtomic(this._dataFile(id), JSON.stringify(seal(dek, Buffer.from(JSON.stringify(emptyData())))));
    doc.accounts.push(account);
    doc.lastUsername = name;
    this._writeAccounts(doc);

    this.session = { accountId: id, username: name, dek, data: emptyData() };
    return { username: name, recoveryCode };
  }

  async _passwordFields(password, dek) {
    const salt = crypto.randomBytes(16);
    const derived = await scrypt(password, salt);
    return {
      kdf: { alg: 'scrypt', N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, salt: salt.toString('base64') },
      verifier: crypto.createHash('sha256').update(derived.subarray(32)).digest('base64'),
      wrappedKey: seal(derived.subarray(0, 32), dek),
    };
  }

  async _recoveryFields(code, dek) {
    const salt = crypto.randomBytes(16);
    const derived = await scrypt(normalizeRecoveryCode(code), salt);
    return {
      salt: salt.toString('base64'),
      verifier: crypto.createHash('sha256').update(derived.subarray(32)).digest('base64'),
      wrappedKey: seal(derived.subarray(0, 32), dek),
    };
  }

  _checkLock(account) {
    const now = Date.now();
    if (account.lockedUntil && account.lockedUntil > now) {
      const seconds = Math.ceil((account.lockedUntil - now) / 1000);
      throw new VaultError('locked', `Muitas tentativas. Tente de novo em ${seconds} s.`, { retryInSeconds: seconds });
    }
  }

  _registerFailure(doc, account) {
    account.failedAttempts = (account.failedAttempts || 0) + 1;
    if (account.failedAttempts >= MAX_ATTEMPTS) {
      const over = account.failedAttempts - MAX_ATTEMPTS;
      account.lockedUntil = Date.now() + Math.min(BASE_LOCK_MS * 2 ** over, MAX_LOCK_MS);
    }
    this._writeAccounts(doc);
  }

  async _unlockWith(secret, salt, verifier, wrappedKey) {
    const derived = await scrypt(secret, Buffer.from(salt, 'base64'));
    const check = crypto.createHash('sha256').update(derived.subarray(32)).digest();
    const expected = Buffer.from(verifier, 'base64');
    if (check.length !== expected.length || !crypto.timingSafeEqual(check, expected)) return null;
    return open(derived.subarray(0, 32), wrappedKey);
  }

  async login(username, password) {
    const doc = this._readAccounts();
    const account = this._find(doc, username);
    if (!account) {
      // Gasta o mesmo tempo de uma tentativa real, para não revelar quais usuários existem.
      await scrypt(String(password || ''), crypto.randomBytes(16));
      throw new VaultError('bad_credentials', 'Usuário ou senha incorretos.');
    }
    this._checkLock(account);
    const dek = await this._unlockWith(String(password || ''), account.kdf.salt, account.verifier, account.wrappedKey);
    if (!dek) {
      this._registerFailure(doc, account);
      const left = MAX_ATTEMPTS - account.failedAttempts;
      throw new VaultError(
        'bad_credentials',
        left > 0 ? 'Usuário ou senha incorretos.' : 'Usuário ou senha incorretos. Acesso pausado por alguns segundos.',
        { attemptsLeft: Math.max(left, 0) }
      );
    }
    account.failedAttempts = 0;
    account.lockedUntil = 0;
    doc.lastUsername = account.username;
    this._writeAccounts(doc);
    this.session = { accountId: account.id, username: account.username, dek, data: this._loadData(account.id, dek) };
    return { username: account.username };
  }

  async recover(username, recoveryCode, newPassword) {
    validatePassword(newPassword);
    const doc = this._readAccounts();
    const account = this._find(doc, username);
    if (!account) {
      await scrypt('x', crypto.randomBytes(16));
      throw new VaultError('bad_recovery', 'Usuário ou código de recuperação incorretos.');
    }
    this._checkLock(account);
    const r = account.recovery;
    const dek = await this._unlockWith(normalizeRecoveryCode(recoveryCode), r.salt, r.verifier, r.wrappedKey);
    if (!dek) {
      this._registerFailure(doc, account);
      throw new VaultError('bad_recovery', 'Usuário ou código de recuperação incorretos.');
    }
    const newCode = generateRecoveryCode();
    Object.assign(account, await this._passwordFields(newPassword, dek));
    account.recovery = await this._recoveryFields(newCode, dek);
    account.failedAttempts = 0;
    account.lockedUntil = 0;
    doc.lastUsername = account.username;
    this._writeAccounts(doc);
    this.session = { accountId: account.id, username: account.username, dek, data: this._loadData(account.id, dek) };
    return { username: account.username, recoveryCode: newCode };
  }

  async changePassword(currentPassword, newPassword) {
    this._requireSession();
    validatePassword(newPassword);
    const doc = this._readAccounts();
    const account = doc.accounts.find((a) => a.id === this.session.accountId);
    this._checkLock(account);
    const dek = await this._unlockWith(String(currentPassword || ''), account.kdf.salt, account.verifier, account.wrappedKey);
    if (!dek) {
      this._registerFailure(doc, account);
      throw new VaultError('bad_credentials', 'A senha atual está incorreta.');
    }
    if (currentPassword === newPassword) {
      throw new VaultError('same_password', 'A nova senha precisa ser diferente da atual.');
    }
    Object.assign(account, await this._passwordFields(newPassword, dek));
    account.failedAttempts = 0;
    account.lockedUntil = 0;
    this._writeAccounts(doc);
    return { ok: true };
  }

  async regenerateRecoveryCode(currentPassword) {
    this._requireSession();
    const doc = this._readAccounts();
    const account = doc.accounts.find((a) => a.id === this.session.accountId);
    this._checkLock(account);
    const dek = await this._unlockWith(String(currentPassword || ''), account.kdf.salt, account.verifier, account.wrappedKey);
    if (!dek) {
      this._registerFailure(doc, account);
      throw new VaultError('bad_credentials', 'A senha atual está incorreta.');
    }
    const code = generateRecoveryCode();
    account.recovery = await this._recoveryFields(code, dek);
    this._writeAccounts(doc);
    return { recoveryCode: code };
  }

  logout() {
    if (this.session) this.session.dek.fill(0);
    this.session = null;
  }

  /* ---------- dados ---------- */

  _requireSession() {
    if (!this.session) throw new VaultError('signed_out', 'Sessão encerrada. Entre novamente.');
  }

  _loadData(accountId, dek) {
    const file = this._dataFile(accountId);
    if (!fs.existsSync(file)) return emptyData();
    const box = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { ...emptyData(), ...JSON.parse(open(dek, box).toString('utf8')) };
  }

  _save() {
    const { accountId, dek, data } = this.session;
    const file = this._dataFile(accountId);
    // Mantém uma cópia do último estado bom antes de sobrescrever.
    if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.bak`);
    writeAtomic(file, JSON.stringify(seal(dek, Buffer.from(JSON.stringify(data)))));
  }

  listDemands() {
    this._requireSession();
    return this.session.data.demands;
  }

  createDemand(input) {
    this._requireSession();
    const data = this.session.data;
    const now = new Date().toISOString();
    data.seq += 1;
    const demand = sanitizeDemand({
      ...input,
      id: crypto.randomUUID(),
      seq: data.seq,
      createdAt: now,
      updatedAt: now,
    });
    if (!demand.title) throw new VaultError('empty_title', 'Escreva pelo menos o título da demanda.');
    if (demand.status === 'done') demand.doneAt = now;
    data.demands.push(demand);
    this._save();
    return demand;
  }

  updateDemand(id, patch) {
    this._requireSession();
    const data = this.session.data;
    const i = data.demands.findIndex((d) => d.id === id);
    if (i < 0) throw new VaultError('not_found', 'Demanda não encontrada.');
    const before = data.demands[i];
    const next = sanitizeDemand({ ...before, ...patch, id: before.id, seq: before.seq, createdAt: before.createdAt });
    if (!next.title) throw new VaultError('empty_title', 'O título não pode ficar vazio.');
    next.updatedAt = new Date().toISOString();
    if (next.status === 'done' && before.status !== 'done') next.doneAt = next.updatedAt;
    if (next.status !== 'done') next.doneAt = null;
    data.demands[i] = next;
    this._save();
    return next;
  }

  deleteDemand(id) {
    this._requireSession();
    const data = this.session.data;
    const i = data.demands.findIndex((d) => d.id === id);
    if (i < 0) throw new VaultError('not_found', 'Demanda não encontrada.');
    const [removed] = data.demands.splice(i, 1);
    this._save();
    return removed;
  }

  restoreDemand(demand) {
    this._requireSession();
    const data = this.session.data;
    if (data.demands.some((d) => d.id === demand.id)) return demand;
    const restored = sanitizeDemand(demand);
    data.demands.push(restored);
    data.seq = Math.max(data.seq, restored.seq);
    this._save();
    return restored;
  }

  /* ---------- blocos de notas ---------- */

  _notes() {
    this._requireSession();
    if (!Array.isArray(this.session.data.notes)) this.session.data.notes = [];
    return this.session.data.notes;
  }

  listNotes() {
    return this._notes();
  }

  createNote(input) {
    const notes = this._notes();
    const now = new Date().toISOString();
    const note = sanitizeNote({ ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
    notes.push(note);
    this._save();
    return note;
  }

  updateNote(id, patch) {
    const notes = this._notes();
    const i = notes.findIndex((n) => n.id === id);
    if (i < 0) throw new VaultError('not_found', 'Bloco de notas não encontrado.');
    const next = sanitizeNote({ ...notes[i], ...patch, id: notes[i].id, createdAt: notes[i].createdAt, updatedAt: new Date().toISOString() });
    notes[i] = next;
    this._save();
    return next;
  }

  deleteNote(id) {
    const notes = this._notes();
    const i = notes.findIndex((n) => n.id === id);
    if (i < 0) throw new VaultError('not_found', 'Bloco de notas não encontrado.');
    const [removed] = notes.splice(i, 1);
    this._save();
    return removed;
  }

  /* ---------- imagens dos blocos de notas ---------- */

  _imageDir() {
    this._requireSession();
    const dir = path.join(this.dir, 'imagens', this.session.accountId);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  putImage(dataUrl) {
    const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
    if (!m) throw new VaultError('bad_image', 'Formato de imagem não suportado. Use PNG, JPG, WebP ou GIF.');
    const bytes = Buffer.from(m[2], 'base64');
    if (bytes.length > MAX_IMAGE_BYTES) throw new VaultError('too_large', 'A imagem é grande demais (máximo 6 MB).');
    const id = crypto.randomUUID();
    const box = seal(this.session.dek, bytes);
    writeAtomic(path.join(this._imageDir(), `${id}.enc`), JSON.stringify({ mime: m[1], createdAt: new Date().toISOString(), box }));
    return { id };
  }

  getImage(id) {
    if (!IMAGE_ID_RE.test(String(id))) throw new VaultError('not_found', 'Imagem não encontrada.');
    const file = path.join(this._imageDir(), `${id}.enc`);
    if (!fs.existsSync(file)) throw new VaultError('not_found', 'Imagem não encontrada.');
    const rec = JSON.parse(fs.readFileSync(file, 'utf8'));
    return `data:${rec.mime};base64,${open(this.session.dek, rec.box).toString('base64')}`;
  }

  deleteImage(id) {
    if (!IMAGE_ID_RE.test(String(id))) return false;
    const file = path.join(this._imageDir(), `${id}.enc`);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return true;
  }

  // Apaga imagens que nenhum bloco usa mais (com mais de um dia, para não apagar algo recém-colado).
  collectImages(keepIds) {
    const keep = new Set((keepIds || []).map(String));
    const dir = this._imageDir();
    let removed = 0;
    for (const f of fs.readdirSync(dir)) {
      const id = f.replace(/\.enc$/, '');
      if (keep.has(id)) continue;
      const age = Date.now() - fs.statSync(path.join(dir, f)).mtimeMs;
      if (age > 24 * 3600 * 1000) { fs.unlinkSync(path.join(dir, f)); removed++; }
    }
    return { removed };
  }

  getSettings() {
    this._requireSession();
    return this.session.data.settings || {};
  }

  setSettings(settings) {
    this._requireSession();
    const clean = JSON.parse(JSON.stringify(settings || {}));
    if (JSON.stringify(clean).length > 50000) throw new VaultError('too_large', 'Configurações grandes demais.');
    this.session.data.settings = clean;
    this._save();
    return clean;
  }

  exportData() {
    this._requireSession();
    return {
      app: 'Lumo',
      exportedAt: new Date().toISOString(),
      username: this.session.username,
      demands: this.session.data.demands,
      notes: this.session.data.notes || [],
    };
  }
}

const NOTE_MAX = 100000;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const IMAGE_ID_RE = /^[a-f0-9-]{36}$/;
function imageValue(v) {
  // id da imagem e, se a pessoa redimensionou, a largura em pixels.
  const out = { id: String(v.id) };
  const w = Math.round(Number(v.w));
  if (Number.isFinite(w) && w >= 40 && w <= 4000) out.w = w;
  return out;
}

function isImageEmbed(v) {
  return Boolean(v && typeof v === 'object' && v.lumoimg && typeof v.lumoimg.id === 'string' && IMAGE_ID_RE.test(v.lumoimg.id));
}

function sanitizeDoc(doc) {
  // Conteúdo formatado do editor (Delta do Quill): só texto e atributos simples.
  if (!Array.isArray(doc)) return null;
  const ops = doc.filter((op) => op && (typeof op.insert === 'string' || isImageEmbed(op.insert))).map((op) => {
    const out = { insert: typeof op.insert === 'string' ? op.insert : { lumoimg: imageValue(op.insert.lumoimg) } };
    if (op.attributes && typeof op.attributes === 'object') {
      const attrs = {};
      for (const [k, v] of Object.entries(op.attributes)) {
        if (/^[a-z-]{1,20}$/.test(k) && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) attrs[k] = typeof v === 'string' ? v.slice(0, 200) : v;
      }
      if (Object.keys(attrs).length) out.attributes = attrs;
    }
    return out;
  });
  if (JSON.stringify(ops).length > 150000) {
    throw new VaultError('too_large', 'Este bloco ficou grande demais para salvar. Divida o conteúdo em dois blocos.');
  }
  return ops;
}

function sanitizeNote(n) {
  return {
    id: String(n.id),
    title: (typeof n.title === 'string' ? n.title.replace(/\u0000/g, '').slice(0, 200) : '').trim(),
    body: typeof n.body === 'string' ? n.body.slice(0, NOTE_MAX) : '',
    ws: typeof n.ws === 'string' && n.ws ? n.ws.slice(0, 64) : null,
    doc: sanitizeDoc(n.doc),
    createdAt: n.createdAt || new Date().toISOString(),
    updatedAt: n.updatedAt || n.createdAt || new Date().toISOString(),
  };
}

const PRIORITIES = ['urgente', 'alta', 'normal', 'baixa'];
const STATUSES = ['todo', 'doing', 'waiting', 'done'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function cleanText(v, max) {
  return typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '';
}

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

module.exports = { Vault, VaultError, generateRecoveryCode, normalizeRecoveryCode, MAX_ATTEMPTS };
