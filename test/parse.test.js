'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseCapture } = require('../src/renderer/parse');

// Sexta-feira, 6 de novembro de 2026.
const TODAY = new Date(2026, 10, 6);

test('linha completa com todos os tokens', () => {
  const r = parseCapture('Ajustar deploy da API !urgente @carla #infra amanhã', TODAY);
  assert.equal(r.title, 'Ajustar deploy da API');
  assert.equal(r.priority, 'urgente');
  assert.equal(r.requester, 'carla');
  assert.equal(r.project, 'infra');
  assert.equal(r.due, '2026-11-07');
});

test('só o título já é uma demanda', () => {
  const r = parseCapture('Responder e-mail do jurídico', TODAY);
  assert.equal(r.title, 'Responder e-mail do jurídico');
  assert.equal(r.priority, null);
  assert.equal(r.due, null);
});

test('datas', () => {
  assert.equal(parseCapture('x hoje', TODAY).due, '2026-11-06');
  assert.equal(parseCapture('x sex', TODAY).due, '2026-11-06');
  assert.equal(parseCapture('x segunda', TODAY).due, '2026-11-09');
  assert.equal(parseCapture('x 15/11', TODAY).due, '2026-11-15');
  assert.equal(parseCapture('x 02/01', TODAY).due, '2027-01-02');
  assert.equal(parseCapture('x 31/02', TODAY).due, null);
  assert.equal(parseCapture('x 10/12/27', TODAY).due, '2027-12-10');
});

test('atalhos de prioridade e status', () => {
  assert.equal(parseCapture('x !!', TODAY).priority, 'alta');
  assert.equal(parseCapture('x !b', TODAY).priority, 'baixa');
  assert.equal(parseCapture('x ~aguardando', TODAY).status, 'waiting');
});

test('#123 continua no título (número de chamado)', () => {
  const r = parseCapture('Ver chamado #4821', TODAY);
  assert.equal(r.title, 'Ver chamado #4821');
  assert.equal(r.project, '');
});
