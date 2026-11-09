// 찬양팀 연습 참여 조사 API
// 구글 시트 > 확장 프로그램 > Apps Script 에 붙여넣고, 프로젝트 설정 > 스크립트 속성에 ADMIN_PW 를 추가한다.
// 시트 탭은 처음 호출될 때 자동으로 만들어진다. 탭을 손으로 만들지 말 것(텍스트 서식이 빠진다).
//
// 흐름: 관리자가 월 일정을 만들고 조사를 연다 → 멤버가 직접 응답한다
//       → 관리자가 마감한다 → 이후 멤버의 변경은 Requests 에 쌓이고, 관리자가 승인하면 Responses 에 반영된다.

const HEAD = {
  Positions: ['name', 'kind'],
  Members: ['name', 'positions', 'active'],
  Months: ['month', 'open'],
  Events: ['id', 'date', 'kind', 'label', 'time', 'off'],
  Responses: ['eventId', 'name', 'attend', 'reason', 'sundayOk', 'updatedAt'],
  Requests: ['id', 'eventId', 'name', 'attend', 'reason', 'sundayOk', 'note', 'status', 'createdAt'],
};

const SHEET_ID = '1oG1DYLqrUcUE8iKm4xuEINE91TxRow7gL_qPYituZxA'; // 구글 시트 URL의 /d/ 와 /edit 사이 값

let ss_;
function sheet_(n) {
  const ss = ss_ || (ss_ = SpreadsheetApp.openById(SHEET_ID));
  let s = ss.getSheetByName(n);
  if (!s) {
    s = ss.insertSheet(n);
    s.getRange('A:Z').setNumberFormat('@'); // 날짜·TRUE 같은 값이 자동 변환되지 않도록 전부 텍스트로
    s.appendRow(HEAD[n]);
  }
  return s;
}

function read_(n) {
  const v = sheet_(n).getDataRange().getDisplayValues();
  const h = v.shift();
  return v.filter(r => r[0] !== '').map(r => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}

// ponytail: 탭 전체를 다시 쓴다. 팀 규모(수십 명 × 월 5~6회)에서는 충분하고, 수천 행을 넘으면 행 단위 수정으로 바꾼다.
function write_(n, objs) {
  const s = sheet_(n);
  if (s.getLastRow() > 1) s.getRange(2, 1, s.getLastRow() - 1, HEAD[n].length).clearContent();
  if (!objs.length) return;
  const cell = v => String(v ?? '').replace(/^=/, "'="); // 수식 주입 방지
  s.getRange(2, 1, objs.length, HEAD[n].length).setValues(objs.map(o => HEAD[n].map(k => cell(o[k]))));
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function month_(m) {
  if (!/^\d{4}-\d{2}$/.test(m || '')) throw new Error('월 형식이 잘못되었습니다.');
  return m;
}

function admin_(b) {
  const pw = PropertiesService.getScriptProperties().getProperty('ADMIN_PW');
  if (!pw || b.pw !== pw) throw new Error('관리자 비밀번호가 틀렸습니다.');
}

function isOpen_(month) {
  return read_('Months').some(m => m.month === month && m.open === 'TRUE');
}

// 응답 한 건을 검증해서 저장용 행으로 만든다.
function answer_(a, name) {
  if (a.attend !== 'Y' && a.attend !== 'N') throw new Error('참석 여부를 선택하세요.');
  const no = a.attend === 'N';
  return {
    eventId: String(a.eventId),
    name,
    attend: a.attend,
    reason: no ? String(a.reason || '').slice(0, 200) : '',
    sundayOk: no ? (a.sundayOk === 'Y' ? 'Y' : 'N') : '',
  };
}

function upsert_(all, row) {
  const i = all.findIndex(r => r.eventId === row.eventId && r.name === row.name);
  if (i >= 0) all[i] = row;
  else all.push(row);
}

// 화면에 필요한 한 달 치 데이터. 저장 요청의 응답에도 실어 보내서 왕복을 한 번으로 줄인다.
function load_(month) {
    const events = read_('Events')
      .filter(ev => ev.date.startsWith(month))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const ids = new Set(events.map(ev => ev.id));
    return {
      open: isOpen_(month),
      positions: read_('Positions'),
      members: read_('Members'),
      events,
      responses: read_('Responses').filter(r => ids.has(r.eventId)),
      requests: read_('Requests').filter(r => ids.has(r.eventId)),
    };
}

function doGet(e) {
  try {
    return json_(load_(month_(e.parameter.month)));
  } catch (err) {
    return json_({ error: err.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const b = JSON.parse(e.postData.contents);
    const fn = ACTIONS[b.action];
    if (!fn) throw new Error('알 수 없는 요청입니다.');
    const out = fn(b) || { ok: true };
    if (/^\d{4}-\d{2}$/.test(b.month || '')) out.data = load_(b.month);
    return json_(out);
  } catch (err) {
    return json_({ error: err.message });
  } finally {
    lock.releaseLock();
  }
}

const ACTIONS = {
  auth(b) {
    admin_(b);
  },

  // 조사가 열려 있으면 바로 반영하고, 마감됐으면 변경된 항목만 수정 요청으로 쌓는다.
  respond(b) {
    const month = month_(b.month);
    if (!read_('Members').some(m => m.name === b.name && m.active === 'TRUE')) throw new Error('등록되지 않은 이름입니다.');
    const open = new Set(read_('Events').filter(ev => ev.date.startsWith(month) && ev.off !== 'TRUE').map(ev => ev.id));
    const rows = (b.answers || []).map(a => {
      if (!open.has(a.eventId)) throw new Error('없는 일정입니다. 새로고침 후 다시 시도하세요.');
      return answer_(a, b.name);
    });
    const now = new Date().toISOString();

    if (isOpen_(month)) {
      const all = read_('Responses');
      rows.forEach(r => upsert_(all, { ...r, updatedAt: now }));
      write_('Responses', all);
      return { ok: true, mode: 'saved' };
    }

    const cur = read_('Responses');
    const same = (r, c) => c && c.attend === r.attend && c.reason === r.reason && c.sundayOk === r.sundayOk;
    const changed = rows.filter(r => !same(r, cur.find(c => c.eventId === r.eventId && c.name === r.name)));
    if (!changed.length) throw new Error('변경된 내용이 없습니다.');
    // 같은 일정에 대기 중인 이전 요청은 새 요청으로 대체한다.
    const reqs = read_('Requests').filter(q => !(q.status === 'pending' && q.name === b.name && changed.some(r => r.eventId === q.eventId)));
    changed.forEach(r => reqs.push({
      ...r,
      id: Utilities.getUuid().slice(0, 8),
      note: String(b.note || '').slice(0, 200),
      status: 'pending',
      createdAt: now,
    }));
    write_('Requests', reqs);
    return { ok: true, mode: 'requested', count: changed.length };
  },

  // 수정 요청 승인/반려. ids 에 담긴 요청을 한 번에 처리한다.
  decide(b) {
    admin_(b);
    const ids = new Set(b.ids || []);
    const reqs = read_('Requests');
    const all = read_('Responses');
    const now = new Date().toISOString();
    reqs.forEach(q => {
      if (!ids.has(q.id) || q.status !== 'pending') return;
      q.status = b.approve ? 'approved' : 'rejected';
      if (b.approve) upsert_(all, { eventId: q.eventId, name: q.name, attend: q.attend, reason: q.reason, sundayOk: q.sundayOk, updatedAt: now });
    });
    write_('Requests', reqs);
    if (b.approve) write_('Responses', all);
  },

  setOpen(b) {
    admin_(b);
    const month = month_(b.month);
    const months = read_('Months').filter(m => m.month !== month);
    months.push({ month, open: b.open ? 'TRUE' : 'FALSE' });
    write_('Months', months);
  },

  saveEvents(b) {
    admin_(b);
    const month = month_(b.month);
    const keep = read_('Events').filter(ev => !ev.date.startsWith(month));
    const mine = (b.events || [])
      .filter(ev => /^\d{4}-\d{2}-\d{2}$/.test(ev.date) && ev.date.startsWith(month))
      .map(ev => ({
        id: ev.id || Utilities.getUuid().slice(0, 8),
        date: ev.date,
        kind: ev.kind || '추가',
        label: ev.label || '',
        time: ev.time || '',
        off: ev.off ? 'TRUE' : 'FALSE',
      }));
    write_('Events', keep.concat(mine));
  },

  savePositions(b) {
    admin_(b);
    const seen = new Set();
    const positions = (b.positions || [])
      .map(p => ({ name: String(p.name || '').trim(), kind: String(p.kind || '').trim() }))
      .filter(p => p.name && !seen.has(p.name) && seen.add(p.name));
    write_('Positions', positions);
  },

  saveMembers(b) {
    admin_(b);
    const valid = new Set(read_('Positions').map(p => p.name));
    const members = (b.members || [])
      .map(m => ({
        name: String(m.name || '').trim(),
        positions: [].concat(m.positions || []).filter(p => valid.has(p)).join(','),
        active: m.active ? 'TRUE' : 'FALSE',
      }))
      .filter(m => m.name);
    write_('Members', members);
  },
};
