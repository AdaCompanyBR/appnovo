/*
 * Captura rápida: transforma uma linha em demanda.
 *   "Ajustar deploy da API !urgente @carla #infra amanhã"
 * Tokens reconhecidos (em qualquer posição):
 *   !u !urgente !!!   !a !alta !!   !n !normal   !b !baixa
 *   @pessoa           quem pediu
 *   #projeto          projeto ou cliente
 *   hoje, amanhã, ontem, seg…dom, 15/11, 15/11/2026   prazo
 *   ~fazendo ~aguardando                      status
 */
(function (root) {
  'use strict';

  const PRIORITY = {
    '!!!': 'urgente', '!u': 'urgente', '!urg': 'urgente', '!urgente': 'urgente',
    '!!': 'alta', '!a': 'alta', '!alta': 'alta',
    '!n': 'normal', '!normal': 'normal',
    '!b': 'baixa', '!baixa': 'baixa',
  };
  const STATUS = {
    '~fazendo': 'doing', '~f': 'doing', '~doing': 'doing',
    '~aguardando': 'waiting', '~ag': 'waiting', '~w': 'waiting', '~esperando': 'waiting',
    '~afazer': 'todo', '~todo': 'todo',
  };
  const WEEKDAYS = {
    dom: 0, domingo: 0,
    seg: 1, segunda: 1, 'segunda-feira': 1,
    ter: 2, terca: 2, 'terca-feira': 2,
    qua: 3, quarta: 3, 'quarta-feira': 3,
    qui: 4, quinta: 4, 'quinta-feira': 4,
    sex: 5, sexta: 5, 'sexta-feira': 5,
    sab: 6, sabado: 6,
  };

  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function strip(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function addDays(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }

  function parseDateToken(word, today) {
    const w = strip(word);
    if (w === 'hoje') return iso(today);
    if (w === 'amanha') return iso(addDays(today, 1));
    if (w === 'ontem') return iso(addDays(today, -1));
    if (w in WEEKDAYS) {
      const diff = (WEEKDAYS[w] - today.getDay() + 7) % 7;
      return iso(addDays(today, diff));
    }
    const m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/.exec(w);
    if (m) {
      const day = Number(m[1]);
      const month = Number(m[2]);
      let year = m[3] ? Number(m[3]) : today.getFullYear();
      if (year < 100) year += 2000;
      if (month < 1 || month > 12 || day < 1 || day > 31) return null;
      let d = new Date(year, month - 1, day);
      if (d.getMonth() !== month - 1) return null;
      // Sem ano e já passou: entende como o próximo ano.
      if (!m[3] && d < addDays(today, -1)) d = new Date(year + 1, month - 1, day);
      return iso(d);
    }
    return null;
  }

  function parseCapture(text, today = new Date()) {
    const out = { title: '', priority: null, requester: '', project: '', due: null, status: null, tokens: [] };
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const rest = [];
    for (const word of words) {
      const lower = word.toLowerCase();
      if (lower in PRIORITY) {
        out.priority = PRIORITY[lower];
        out.tokens.push({ kind: 'priority', value: out.priority, raw: word });
        continue;
      }
      if (strip(word) in STATUS) {
        out.status = STATUS[strip(word)];
        out.tokens.push({ kind: 'status', value: out.status, raw: word });
        continue;
      }
      let m = /^@([\p{L}\p{N}._-]+)$/u.exec(word);
      if (m) {
        out.requester = m[1];
        out.tokens.push({ kind: 'requester', value: m[1], raw: word });
        continue;
      }
      m = /^#([\p{L}\p{N}._/-]+)$/u.exec(word);
      if (m && !/^\d+$/.test(m[1])) {
        out.project = m[1];
        out.tokens.push({ kind: 'project', value: m[1], raw: word });
        continue;
      }
      const due = parseDateToken(word, today);
      if (due) {
        out.due = due;
        out.tokens.push({ kind: 'due', value: due, raw: word });
        continue;
      }
      rest.push(word);
    }
    out.title = rest.join(' ').trim();
    return out;
  }

  const api = { parseCapture, parseDateToken, iso, addDays };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DemandParse = api;
})(typeof self !== 'undefined' ? self : this);
