'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Vault, MAX_ATTEMPTS } = require('../src/main/vault');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'demandas-test-'));
}

test('cadastro, login e dados persistidos de forma cifrada', async () => {
  const dir = tmpDir();
  const v = new Vault(dir);
  assert.equal(v.state().hasAccount, false);
  const { recoveryCode } = await v.register('guilherme', 'senha-forte-1');
  assert.match(recoveryCode, /^[A-Z0-9]{4}(-[A-Z0-9]{4}){4}$/);
  v.createDemand({ title: 'Revisar PR do pagamento', priority: 'urgente', requester: 'Carla' });
  v.logout();

  const raw = fs.readdirSync(dir).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  assert.ok(!raw.includes('Revisar PR'), 'título não pode aparecer em texto puro');
  assert.ok(!raw.includes('senha-forte-1'), 'senha não pode aparecer em texto puro');

  const v2 = new Vault(dir);
  await v2.login('GUILHERME', 'senha-forte-1');
  const list = v2.listDemands();
  assert.equal(list.length, 1);
  assert.equal(list[0].title, 'Revisar PR do pagamento');
  assert.equal(list[0].seq, 1);
});

test('senha errada é recusada e bloqueia após várias tentativas', async () => {
  const v = new Vault(tmpDir());
  await v.register('ana', 'correta-123');
  v.logout();
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await assert.rejects(v.login('ana', 'errada-123'), { code: 'bad_credentials' });
  }
  await assert.rejects(v.login('ana', 'correta-123'), { code: 'locked' });
});

test('usuário inexistente tem a mesma mensagem de erro', async () => {
  const v = new Vault(tmpDir());
  await v.register('ana', 'correta-123');
  v.logout();
  await assert.rejects(v.login('bruno', 'qualquer-123'), { code: 'bad_credentials', message: 'Usuário ou senha incorretos.' });
});

test('validações de cadastro', async () => {
  const v = new Vault(tmpDir());
  await assert.rejects(v.register('a', 'senha-boa-1'), { code: 'bad_username' });
  await assert.rejects(v.register('ana', 'curta'), { code: 'weak_password' });
  await v.register('ana', 'senha-boa-1');
  await assert.rejects(v.register('ANA', 'senha-boa-2'), { code: 'username_taken' });
});

test('troca de senha mantém os dados', async () => {
  const dir = tmpDir();
  const v = new Vault(dir);
  await v.register('ana', 'antiga-123');
  v.createDemand({ title: 'Atualizar certificado' });
  await assert.rejects(v.changePassword('errada-000', 'nova-12345'), { code: 'bad_credentials' });
  await v.changePassword('antiga-123', 'nova-12345');
  v.logout();
  await assert.rejects(v.login('ana', 'antiga-123'), { code: 'bad_credentials' });
  await v.login('ana', 'nova-12345');
  assert.equal(v.listDemands()[0].title, 'Atualizar certificado');
});

test('recuperação por código define nova senha e gera novo código', async () => {
  const v = new Vault(tmpDir());
  const { recoveryCode } = await v.register('ana', 'esquecida-1');
  v.createDemand({ title: 'Migrar banco' });
  v.logout();
  await assert.rejects(v.recover('ana', 'AAAA-AAAA-AAAA-AAAA-AAAA', 'nova-senha-1'), { code: 'bad_recovery' });
  const out = await v.recover('ana', recoveryCode.toLowerCase().replace(/-/g, ' '), 'nova-senha-1');
  assert.notEqual(out.recoveryCode, recoveryCode);
  assert.equal(v.listDemands()[0].title, 'Migrar banco');
  v.logout();
  await v.login('ana', 'nova-senha-1');
  await assert.rejects(v.recover('ana', recoveryCode, 'outra-senha-1'), { code: 'bad_recovery' });
});

test('atualizar, concluir, excluir e restaurar demandas', async () => {
  const v = new Vault(tmpDir());
  await v.register('ana', 'senha-boa-1');
  const d = v.createDemand({ title: '  Liberar acesso VPN  ', priority: 'invalida', due: '2026-11-10' });
  assert.equal(d.title, 'Liberar acesso VPN');
  assert.equal(d.priority, 'normal');
  const done = v.updateDemand(d.id, { status: 'done' });
  assert.ok(done.doneAt);
  const back = v.updateDemand(d.id, { status: 'todo' });
  assert.equal(back.doneAt, null);
  assert.throws(() => v.updateDemand(d.id, { title: '   ' }), { code: 'empty_title' });
  const removed = v.deleteDemand(d.id);
  assert.equal(v.listDemands().length, 0);
  v.restoreDemand(removed);
  assert.equal(v.listDemands().length, 1);
});

test('sem sessão, nada é lido', async () => {
  const v = new Vault(tmpDir());
  assert.throws(() => v.listDemands(), { code: 'signed_out' });
});

test('configurações cifradas e campo de empresa nas demandas', async () => {
  const dir = tmpDir();
  const v = new Vault(dir);
  await v.register('ana', 'senha-boa-1');
  v.setSettings({ workspaces: [{ id: 'comexport', name: 'Comexport' }, { id: 'ws-x', name: 'Cliente X' }], current: 'ws-x' });
  const d = v.createDemand({ title: 'Demanda do cliente', ws: 'ws-x' });
  assert.equal(d.ws, 'ws-x');
  v.logout();
  const raw = fs.readdirSync(dir).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  assert.ok(!raw.includes('Cliente X'), 'nome da empresa não pode aparecer em texto puro');
  await v.login('ana', 'senha-boa-1');
  assert.equal(v.getSettings().current, 'ws-x');
  assert.equal(v.listDemands()[0].ws, 'ws-x');
});

test('blocos de notas: criar, editar, excluir e persistir cifrado', async () => {
  const dir = tmpDir();
  const v = new Vault(dir);
  await v.register('ana', 'senha-boa-1');
  const n = v.createNote({ title: 'Reunião com despachante', body: 'Pontos: container ABC123', ws: 'comexport' });
  v.updateNote(n.id, { body: 'Pontos: container ABC123\nRetorno até sexta' });
  const extra = v.createNote({ title: 'Rascunho' });
  v.deleteNote(extra.id);
  v.logout();
  const raw = fs.readdirSync(dir).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  assert.ok(!raw.includes('despachante'), 'nota não pode aparecer em texto puro');
  await v.login('ana', 'senha-boa-1');
  const notes = v.listNotes();
  assert.equal(notes.length, 1);
  assert.match(notes[0].body, /Retorno até sexta/);
  assert.equal(notes[0].ws, 'comexport');
});
